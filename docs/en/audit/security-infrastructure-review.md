# Skill Division - Security & Infrastructure Review

**Date:** 2026-04-03  
**Reviewer:** Senior Security Engineer / DevOps Specialist  
**Scope:** Full stack security audit (Docker, Django, API, Bot, Frontend, Infrastructure)  
**Risk Rating Scale:** CRITICAL / HIGH / MEDIUM / LOW / INFO

---

## Executive Summary

The Skill Division project has **17+ security vulnerabilities** across all layers of the stack. The application is currently configured for **development only** and is **NOT production-ready**. The most severe issues are:

1. **Gemini API key exposed in client-side code** - allows unauthorized usage and billing abuse
2. **Correct answers exposed via API** - enables cheating
3. **Auto-creates admin profiles on login** - privilege escalation
4. **Database port 5432 exposed to the internet** - direct database access
5. **No authentication required on ANY endpoint** - complete data exposure

**Estimated remediation effort:** 3-5 days for a single developer

---

## 1. Docker Compose Security Review

### 1.1 Network Isolation - HIGH

**Finding:** All services share the default Docker bridge network with no segmentation.

**Current State:**

```yaml
# No custom networks defined
services:
  backend:
    ports:
      - "8000:8000"  # Directly exposed
  frontend:
    ports:
      - "3000:3000"  # Directly exposed
  db:
    ports:
      - "5432:5432"  # CRITICAL: Database exposed to host
  pgadmin:
    ports:
      - "5050:80"    # Admin interface exposed
```

**Risk:** Any container can communicate with any other container. The database and pgAdmin are accessible from the host network and potentially the internet.

**Remediation:**

```yaml
networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true  # No external access

services:
  backend:
    networks:
      - frontend_net
      - backend_net
    # Remove ports - only accessible via Nginx
    expose:
      - "8000"
  
  db:
    networks:
      - backend_net  # Internal only
    # REMOVE: ports: - "5432:5432"
  
  pgadmin:
    networks:
      - backend_net  # Internal only, or restrict via firewall
    # REMOVE: ports: - "5050:80" or restrict to localhost
    ports:
      - "127.0.0.1:5050:80"  # Only accessible from host localhost
  
  frontend:
    networks:
      - frontend_net
    # Remove direct port exposure in production
    expose:
      - "3000"
```

### 1.2 Port Exposure - CRITICAL

**Finding:** Database port 5432 and pgAdmin port 5050 are exposed to all interfaces.

**Current State ([`docker-compose.yml`](docker-compose.yml:55-56)):**

```yaml
db:
  ports:
    - "5432:5432"  # Exposed to 0.0.0.0

pgadmin:
  ports:
    - "5050:80"    # Exposed to 0.0.0.0
```

**Risk:**

- PostgreSQL is accessible from any IP that can reach the host
- pgAdmin admin interface is publicly accessible with default credentials (`admin@admin.com` / `admin`)
- Combined with hardcoded credentials, this is trivial to exploit

**Remediation:**

```yaml
db:
  # Remove ports entirely for production - only backend needs access
  # Docker internal DNS handles connectivity
  
pgadmin:
  # Bind to localhost only
  ports:
    - "127.0.0.1:5050:80"
  # Or remove entirely from production compose file
```

### 1.3 Volume Mounts - MEDIUM

**Finding:** Development volume mounts expose source code and allow container escape.

**Current State ([`docker-compose.yml`](docker-compose.yml:9-10)):**

```yaml
backend:
  volumes:
    - ./backend:/app  # Source code mounted

frontend:
  volumes:
    - ./frontend:/app
    - /app/node_modules
```

**Risk:**

- Source code modifications on host immediately affect container
- Potential for container escape via mounted volumes
- `/app/node_modules` volume mount is a workaround that indicates misconfiguration

**Remediation:** Remove volume mounts in production. Use multi-stage builds instead.

### 1.4 Resource Limits - MEDIUM

**Finding:** No resource limits on any container.

**Risk:** A single compromised or misbehaving container can exhaust host resources (CPU, memory, disk).

**Remediation:**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
  
  db:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
  
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

### 1.5 Hardcoded Database Credentials - CRITICAL

**Finding:** PostgreSQL credentials are hardcoded in docker-compose.yml.

**Current State ([`docker-compose.yml`](docker-compose.yml:50-52)):**

```yaml
db:
  environment:
    POSTGRES_DB: skilldivision
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres  # Default password!
```

**Risk:** Anyone with access to the repository or docker-compose file knows the database password.

**Remediation:**

```yaml
db:
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

### 1.6 pgAdmin Default Credentials - HIGH

**Finding:** pgAdmin uses default credentials.

**Current State ([`docker-compose.yml`](docker-compose.yml:69-70)):**

```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@admin.com
    PGADMIN_DEFAULT_PASSWORD: admin
```

**Remediation:**

```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
    PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
```

---

## 2. Django Settings Security Audit

### 2.1 DEBUG = True - HIGH

**Finding:** Debug mode is hardcoded to True.

**Current State ([`settings.py`](backend/skill_division/settings.py:12)):**

```python
DEBUG = True
```

**Risk:**

- Exposes stack traces, SQL queries, and file paths to attackers
- Reveals sensitive configuration in error pages
- Performance degradation

**Remediation:**

```python
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() in ("true", "1", "yes")
```

### 2.2 ALLOWED_HOSTS = ["*"] - HIGH

**Finding:** All host headers are accepted.

**Current State ([`settings.py`](backend/skill_division/settings.py:14)):**

```python
ALLOWED_HOSTS = ["*"]
```

**Risk:** DNS rebinding attacks, host header injection for password reset links.

**Remediation:**

```python
ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS", 
    "localhost,127.0.0.1"
).split(",")
```

### 2.3 SECRET_KEY Handling - HIGH

**Finding:** Falls back to a predictable default.

**Current State ([`settings.py`](backend/skill_division/settings.py:8-9)):**

```python
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY", "django-insecure-change-me-please")
```

**Risk:** Session forgery, CSRF token prediction, cryptographic attacks.

**Remediation:**

```python
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]  # Fail if not set
```

Generate a secure key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.4 CORS Configuration - MEDIUM

**Finding:** CORS is configured for localhost only, but `CORS_ALLOW_ALL_ORIGINS` is not explicitly set.

**Current State ([`settings.py`](backend/skill_division/settings.py:43-46)):**

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

**Risk:** In production, the frontend domain must be added. If `CORS_ALLOW_ALL_ORIGINS = True` is set anywhere, all origins are allowed.

**Remediation:**

```python
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
```

### 2.5 Missing Security Middleware - MEDIUM

**Finding:** Several security middleware classes are missing.

**Current State ([`settings.py`](backend/skill_division/settings.py:31-40)):**

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # ... missing SECURE_* settings
]
```

**Remediation - Add to settings.py:**

```python
# Production Security Settings
SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "False").lower() == "true"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### 2.6 REST Framework Permissions - CRITICAL

**Finding:** All endpoints allow anonymous access.

**Current State ([`settings.py`](backend/skill_division/settings.py:103-108)):**

```python
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ]
}
```

**Risk:** Any unauthenticated user can read, create, modify, and delete all data.

**Remediation:**

```python
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}
```

### 2.7 Password Hashing - INFO

**Finding:** Using Django defaults, which is acceptable, but should be verified.

**Remediation:** Explicitly configure strong password hashing:

```python
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]
```

---

## 3. API Security Analysis

### 3.1 Authentication Bypass - CRITICAL

**Finding:** No authentication required on any endpoint.

**Affected Endpoints:**

- `GET /api/events/` - Full event data exposure
- `POST /api/events/` - Anyone can create events
- `GET /api/events/{id}/questions/` - Questions exposed (including correct answers)
- `POST /api/submit-score/` - Anyone can submit scores
- `GET /api/events/{id}/stats/` - Analytics exposed
- `GET /api/events/{id}/leaderboard/` - Leaderboard exposed

**Remediation:** Apply `IsAuthenticated` or `IsAuthenticatedOrReadOnly` permissions per-view:

```python
class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=["get"])
    def questions(self, request, pk=None):
        # Only return questions without correct_index for participants
        serializer = QuestionSerializer(selected, many=True)
        if request.user.profile.role != "admin":
            # Remove correct_index from response
            for q in serializer.data:
                q.pop("correct_index", None)
        return Response(serializer.data)
```

### 3.2 Input Validation - HIGH

**Finding:** No validation on score submission.

**Current State ([`views.py`](backend/api/views.py:173-210)):**

```python
class ResultView(views.APIView):
    def post(self, request):
        score = request.data.get("score")  # No validation!
        max_score = request.data.get("max_score", 25)
        
        QuizResult.objects.create(
            user=user, event=event, score=score, max_score=max_score
        )
```

**Risk:**

- Negative scores accepted
- Arbitrarily large scores accepted
- Type confusion (strings, null)
- Score manipulation

**Remediation:**

```python
class ResultView(views.APIView):
    def post(self, request):
        score = request.data.get("score")
        max_score = request.data.get("max_score", 25)
        
        # Validation
        if score is None or max_score is None:
            return Response({"error": "score and max_score required"}, status=400)
        
        try:
            score = int(score)
            max_score = int(max_score)
        except (ValueError, TypeError):
            return Response({"error": "Invalid score format"}, status=400)
        
        if score < 0:
            return Response({"error": "Score cannot be negative"}, status=400)
        
        if score > max_score:
            return Response({"error": "Score cannot exceed max_score"}, status=400)
        
        if max_score > 1000:  # Reasonable upper bound
            return Response({"error": "max_score too large"}, status=400)
```

### 3.3 Privilege Escalation - CRITICAL

**Finding:** Auto-creates admin profile for any user that logs in.

**Current State ([`views.py`](backend/api/views.py:226-229)):**

```python
profile, _ = Profile.objects.get_or_create(
    user=user, defaults={"role": "admin"}
)
```

**Risk:** Any user who logs in via the web interface becomes an admin.

**Remediation:**

```python
profile, created = Profile.objects.get_or_create(
    user=user, defaults={"role": "participant"}  # Default to participant
)
```

### 3.4 Information Disclosure - HIGH

**Finding:** `correct_index` is included in QuestionSerializer responses.

**Current State ([`serializers.py`](backend/api/serializers.py:26-29)):**

```python
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "text", "options", "correct_index", "topic"]
```

**Risk:** Any API caller can see correct answers before taking the quiz.

**Remediation:** Create two serializers:

```python
class QuestionSerializer(serializers.ModelSerializer):
    """For admin use - includes correct answer"""
    class Meta:
        model = Question
        fields = ["id", "text", "options", "correct_index", "topic"]


class QuestionPublicSerializer(serializers.ModelSerializer):
    """For participants - excludes correct answer"""
    class Meta:
        model = Question
        fields = ["id", "text", "options", "topic"]
```

### 3.5 Rate Limiting - HIGH

**Finding:** No rate limiting on any endpoint.

**Risk:**

- Brute force attacks on login endpoint
- API abuse and scraping
- Denial of service

**Remediation:** Add to REST_FRAMEWORK settings (see 2.6) and implement per-view:

```python
from rest_framework.throttling import AnonRateThrottle

class CustomAuthToken(ObtainAuthToken):
    throttle_classes = [AnonRateThrottle]
```

### 3.6 SQL Injection - LOW

**Finding:** Using Django ORM which provides SQL injection protection by default.

**Status:** No direct SQL queries found. ORM usage is safe.

### 3.7 XSS via API - MEDIUM

**Finding:** API responses are not sanitized. Frontend may render unsanitized content.

**Risk:** If event titles, descriptions, or question text contain HTML/JS, they could execute in the frontend.

**Remediation:**

- Backend: Use Django's `escape` filter or `mark_safe` carefully
- Frontend: React auto-escapes by default, but `dangerouslySetInnerHTML` must be audited

---

## 4. Bot Security Analysis

### 4.1 SSL Verification Disabled - HIGH

**Finding:** GigaChat API calls disable SSL certificate verification.

**Current State ([`bot.py`](bot/bot.py:129)):**

```python
with GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=False) as giga:
```

**Risk:** Man-in-the-middle attacks, credential interception.

**Remediation:**

```python
with GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=True) as giga:
```

If there are certificate issues, fix the CA bundle instead of disabling verification:

```python
import certifi
with GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=certifi.where()) as giga:
```

### 4.2 Token Handling - MEDIUM

**Finding:** Bot token loaded from environment variable without validation.

**Current State ([`bot.py`](bot/bot.py:22)):**

```python
TOKEN = os.getenv("TG_TOKEN")
bot = telebot.TeleBot(TOKEN)
```

**Risk:** If `TG_TOKEN` is not set, the bot will crash or behave unexpectedly.

**Remediation:**

```python
TOKEN = os.getenv("TG_TOKEN")
if not TOKEN:
    raise ValueError("TG_TOKEN environment variable is required")
bot = telebot.TeleBot(TOKEN)
```

### 4.3 Input Sanitization - MEDIUM

**Finding:** User input is not sanitized before use.

**Current State ([`bot.py`](bot/bot.py:384)):**

```python
def join_room(m):
    code = m.text.strip()
    if code in rooms and rooms[code]["waiting"]:
```

**Risk:** While the room code lookup is safe, other user inputs (username, messages) could contain malicious content.

**Remediation:**

```python
import html

def sanitize_input(text: str, max_length: int = 1000) -> str:
    return html.escape(text.strip()[:max_length])
```

### 4.4 API Error Handling - MEDIUM

**Finding:** API failures are silently logged but not handled.

**Current State ([`bot.py`](bot/bot.py:69-74)):**

```python
def api_send_score(tg_id, score, event_id=None):
    try:
        payload = {"tg_id": tg_id, "score": score, "event_id": event_id}
        requests.post(f"{API_URL}/submit-score/", json=payload)
    except Exception as e:
        logger.error(f"Score Error: {e}")
```

**Risk:**

- Score submissions fail silently
- Users think their score was saved when it wasn't
- No retry mechanism

**Remediation:**

```python
def api_send_score(tg_id, score, event_id=None):
    try:
        payload = {"tg_id": tg_id, "score": score, "event_id": event_id}
        response = requests.post(
            f"{API_URL}/submit-score/", 
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        return True
    except requests.exceptions.Timeout:
        logger.error(f"Score submission timed out for user {tg_id}")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Score Error: {e}")
        return False
```

### 4.5 No Timeout on HTTP Requests - MEDIUM

**Finding:** All `requests` calls have no timeout.

**Risk:** Bot hangs indefinitely if backend is unresponsive.

**Remediation:** Add `timeout=10` to all requests calls.

### 4.6 In-Memory State - LOW

**Finding:** Game state stored in memory (`user_data = {}`, `rooms = {}`).

**Risk:**

- State lost on restart
- No horizontal scaling possible
- Memory leaks over time

**Remediation:** Use Redis or database for state management.

---

## 5. Frontend Security Analysis

### 5.1 Gemini API Key Exposure - CRITICAL

**Finding:** API key is bundled into client-side JavaScript.

**Current State ([`geminiService.ts`](frontend/services/geminiService.ts:5)):**

```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

**Risk:**

- API key is visible in browser DevTools
- Anyone can steal and abuse the key
- Unlimited billing charges possible

**Remediation:** Move AI calls to backend:

```python
# backend/api/views.py
class GenerateQuizView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        event_title = request.data.get("event_title", "")
        # Call Gemini server-side
        topics = call_gemini_server_side(event_title)
        return Response({"topics": topics})
```

### 5.2 Token Storage in localStorage - MEDIUM

**Finding:** Auth token stored in localStorage.

**Current State ([`api.ts`](frontend/services/api.ts:9)):**

```typescript
const token = localStorage.getItem('auth_token');
```

**Risk:** localStorage is accessible to any JavaScript running on the page (XSS can steal tokens).

**Remediation:** Use httpOnly cookies for token storage:

```python
# Django settings
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
```

### 5.3 No CSRF Protection - MEDIUM

**Finding:** No CSRF tokens are used with TokenAuthentication.

**Risk:** If session authentication is also used, CSRF attacks are possible.

**Remediation:** When using TokenAuthentication, CSRF is not required. But if SessionAuthentication is enabled, add CSRF protection:

```typescript
// Get CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrftoken='))
  ?.split('=')[1];

headers['X-CSRFToken'] = csrfToken;
```

### 5.4 XSS Vectors - MEDIUM

**Finding:** User-generated content rendered without sanitization.

**Risk Areas:**

- Event titles and descriptions
- Question text
- Usernames
- Bot messages using `parse_mode="Markdown"`

**Remediation:**

- React auto-escapes by default (good)
- Audit any `dangerouslySetInnerHTML` usage
- Sanitize content on backend before storage

### 5.5 No Content Security Policy - LOW

**Finding:** No CSP headers configured.

**Remediation:** Add via Nginx (see Section 7).

---

## 6. Secrets Management Assessment

### 6.1 Current State

**Method:** `.env` file with no rotation policy.

**Current Secrets:**

| Secret                     | Location | Rotation Policy |
| -------------------------- | -------- | --------------- |
| `POSTGRES_PASSWORD`        | .env     | None            |
| `DJANGO_SECRET_KEY`        | .env     | None            |
| `TG_TOKEN`                 | .env     | None            |
| `GIGACHAT_TOKEN`           | .env     | None            |
| `PGADMIN_DEFAULT_PASSWORD` | .env     | None            |

### 6.2 Risks

1. **No rotation:** Secrets never rotated, even after potential exposure
2. **Shared file:** `.env` shared among all environments
3. **No access control:** Anyone with file access can read all secrets
4. **No audit trail:** No logging of secret access
5. **Version control risk:** `.env` could accidentally be committed

### 6.3 Proposed Solution

**Short-term (Immediate):**

1. Ensure `.env` is in `.gitignore`
2. Use `.env.example` as template (already exists)
3. Generate unique secrets per environment
4. Document secret rotation procedure

**Medium-term (1-2 weeks):**

1. Use Docker secrets or environment-specific `.env` files
2. Implement secret rotation schedule (90 days)
3. Use a secrets generator script:

```bash
#!/bin/bash
# generate-secrets.sh
cat > .env << EOF
POSTGRES_DB=skilldivision
POSTGRES_USER=$(openssl rand -hex 8)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
DJANGO_SECRET_KEY=$(openssl rand -base64 64)
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com
TG_TOKEN=your-telegram-token
GIGACHAT_TOKEN=your-gigachat-token
PGADMIN_EMAIL=admin@yourdomain.com
PGADMIN_PASSWORD=$(openssl rand -base64 32)
EOF
```

**Long-term (1-3 months):**

1. Migrate to HashiCorp Vault or AWS Secrets Manager
2. Implement automatic secret rotation
3. Add secret access auditing

---

## 7. Nginx Configuration Proposal

### 7.1 Current State

**Finding:** No Nginx service exists despite documentation claiming Nginx reverse proxy on ports 80/443.

### 7.2 Proposed nginx.conf

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.telegram.org;" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting Zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=60r/m;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Upstream Backends
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP -> HTTPS Redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;

        # OCSP Stapling
        ssl_stapling on;
        ssl_stapling_verify on;

        # Client body size limit
        client_max_body_size 10M;

        # Frontend (React SPA)
        location / {
            limit_req zone=general_limit burst=20 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support (for Vite HMR in dev)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Backend API
        location /api/ {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login endpoint - stricter rate limiting
        location /api/login/ {
            limit_req zone=login_limit burst=3 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Block access to sensitive paths
        location ~ /\. {
            deny all;
        }

        location /admin/ {
            # Restrict admin to specific IPs
            # allow 192.168.1.0/24;
            # deny all;
            proxy_pass http://backend;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 7.3 Production docker-compose.yml with Nginx

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: skill_backend
    command: gunicorn skill_division.wsgi:application --bind 0.0.0.0:8000 --workers 3
    volumes:
      - static_volume:/app/staticfiles
    expose:
      - "8000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend_net
      - frontend_net
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: skill_frontend
    expose:
      - "80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - frontend_net
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  bot:
    build: ./bot
    container_name: skill_bot
    env_file:
      - .env
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - backend_net
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  db:
    image: postgres:14.12-alpine
    container_name: skill_db
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    expose:
      - "5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-skilldivision}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - backend_net
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  nginx:
    image: nginx:1.25-alpine
    container_name: skill_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - static_volume:/app/staticfiles:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - frontend_net
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 128M

volumes:
  postgres_data:
  static_volume:

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true
```

---

## 8. Container Security Hardening

### 8.1 Backend Dockerfile (Production)

```dockerfile
# backend/Dockerfile.prod
FROM python:3.11.9-slim AS base

# Security: Run as non-root user
RUN groupadd -r django && useradd -r -g django django

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove \
    && apt-get clean

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY --chown=django:django . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Security: Remove unnecessary files
RUN rm -rf /app/.git /app/.github /app/tests

# Switch to non-root user
USER django

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/events/')" || exit 1

CMD ["gunicorn", "skill_division.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-", "--error-logfile", "-"]
```

### 8.2 Frontend Dockerfile (Production)

```dockerfile
# frontend/Dockerfile.prod
# Stage 1: Build
FROM node:20.11-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine AS production

# Security: Custom nginx config
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 8.3 Bot Dockerfile (Hardened)

```dockerfile
# bot/Dockerfile
FROM python:3.11.9-slim

# Security: Run as non-root user
RUN groupadd -r bot && useradd -r -g bot bot

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY --chown=bot:bot . .

# Security: Remove unnecessary packages
RUN apt-get purge -y --auto-remove gcc python3-dev libpq-dev 2>/dev/null || true

# Switch to non-root user
USER bot

HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
    CMD python -c "print('bot healthy')" || exit 1

CMD ["python", "bot.py"]
```

### 8.4 Container Security Checklist

| Check                | Status            | Priority |
| -------------------- | ----------------- | -------- |
| Non-root user        | NOT IMPLEMENTED   | HIGH     |
| Read-only filesystem | NOT IMPLEMENTED   | MEDIUM   |
| Resource limits      | NOT IMPLEMENTED   | MEDIUM   |
| Health checks        | PARTIAL (db only) | HIGH     |
| Minimal base images  | PARTIAL           | MEDIUM   |
| No secrets in image  | IMPLEMENTED       | INFO     |
| Image scanning       | NOT IMPLEMENTED   | MEDIUM   |
| Multi-stage builds   | NOT IMPLEMENTED   | MEDIUM   |

---

## 9. Production Infrastructure Recommendations

### 9.1 Monitoring

**Recommended Stack:**

- **Metrics:** Prometheus + Grafana
- **APM:** Sentry (error tracking)
- **Uptime:** Uptime Kuma or Pingdom

**Key Metrics to Monitor:**

| Metric               | Alert Threshold |
| -------------------- | --------------- |
| API Response Time    | > 500ms (p95)   |
| Error Rate           | > 1%            |
| Database Connections | > 80% of max    |
| Memory Usage         | > 80%           |
| Disk Usage           | > 85%           |
| Bot Response Time    | > 5s            |

### 9.2 Logging

**Recommended Configuration:**

```python
# Django settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django.security': {
            'level': 'WARNING',
            'handlers': ['console', 'file'],
            'propagate': False,
        },
    },
}
```

**Log Aggregation:** ELK Stack (Elasticsearch, Logstash, Kibana) or Loki + Grafana

### 9.3 Backup Strategy

**PostgreSQL Backup Script:**

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} -F c -f "${BACKUP_DIR}/skilldivision_${DATE}.dump"

# Compress
gzip "${BACKUP_DIR}/skilldivision_${DATE}.dump"

# Delete old backups
find ${BACKUP_DIR} -name "*.dump.gz" -mtime +${RETENTION_DAYS} -delete

# Upload to S3 (optional)
# aws s3 cp "${BACKUP_DIR}/skilldivision_${DATE}.dump.gz" s3://your-backup-bucket/
```

**Cron Job:**

```
0 2 * * * /app/backup.sh >> /var/log/backup.log 2>&1
```

**Backup Schedule:**

| Data         | Frequency | Retention              |
| ------------ | --------- | ---------------------- |
| PostgreSQL   | Daily     | 30 days                |
| Static files | Weekly    | 90 days                |
| Logs         | Daily     | 14 days                |
| .env file    | On change | Indefinite (encrypted) |

### 9.4 CI/CD Pipeline

**Recommended GitHub Actions Workflow:**

```yaml
name: Security & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Run Bandit (Python security linter)
        run: |
          pip install bandit
          bandit -r backend/ -f json -o bandit-results.json
      
      - name: Run npm audit
        working-directory: ./frontend
        run: npm audit --audit-level=high

  deploy:
    needs: security
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d --build
```

### 9.5 Infrastructure Diagram

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    Internet                          │
                    └──────────────────────┬──────────────────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │   Nginx      │
                                    │  :80/:443    │
                                    │  Rate Limit  │
                                    │  SSL/TLS     │
                                    └──────┬───────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
             ┌──────▼──────┐                              ┌──────▼──────┐
             │   Frontend   │                              │   Backend    │
             │   React SPA  │                              │   Django     │
             │   :80        │                              │   :8000      │
             └──────────────┘                              └──────┬───────┘
                                                                  │
                                                           ┌──────▼──────┐
                                                           │  PostgreSQL  │
                                                           │  :5432       │
                                                           │  (internal)  │
                                                           └─────────────┘
                                                                
                    ┌─────────────────────────────────────────────────────┐
                    │                 Internal Network                     │
                    └──────────────────────┬──────────────────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │     Bot      │
                                    │   Telegram   │
                                    │  (outbound)  │
                                    └─────────────┘
```

---

## 10. Priority Remediation Roadmap

### Phase 1: Critical (Day 1-2)

- [ ] Remove `correct_index` from public API responses
- [ ] Fix privilege escalation in `CustomAuthToken`
- [ ] Remove Gemini API key from frontend (move to backend)
- [ ] Remove database port 5432 from docker-compose.yml
- [ ] Change hardcoded database credentials
- [ ] Set `DEBUG = False` via environment variable
- [ ] Restrict `ALLOWED_HOSTS`

### Phase 2: High (Day 2-3)

- [ ] Add authentication to API endpoints
- [ ] Add input validation to score submission
- [ ] Enable SSL verification for GigaChat
- [ ] Add rate limiting to Django REST Framework
- [ ] Add Nginx reverse proxy with SSL
- [ ] Add security headers via Nginx
- [ ] Run containers as non-root users

### Phase 3: Medium (Day 3-5)

- [ ] Implement network segmentation
- [ ] Add resource limits to containers
- [ ] Add health checks to all services
- [ ] Implement backup strategy for PostgreSQL
- [ ] Add logging and monitoring
- [ ] Create production Dockerfiles with multi-stage builds
- [ ] Document secret rotation procedure

### Phase 4: Ongoing

- [ ] Implement CI/CD pipeline with security scanning
- [ ] Set up automated dependency updates
- [ ] Conduct regular penetration testing
- [ ] Implement secret management solution (Vault)
- [ ] Add comprehensive error handling to bot

---

## Appendix A: Vulnerability Summary Table

| #   | Vulnerability                  | Severity | Location                | CVSS Est. |
| --- | ------------------------------ | -------- | ----------------------- | --------- |
| 1   | Gemini API key in client code  | CRITICAL | `geminiService.ts:5`    | 9.1       |
| 2   | Correct answers exposed in API | CRITICAL | `serializers.py:29`     | 8.6       |
| 3   | Auto-creates admin profile     | CRITICAL | `views.py:227-229`      | 9.8       |
| 4   | Database port exposed          | CRITICAL | `docker-compose.yml:56` | 9.0       |
| 5   | Hardcoded DB credentials       | HIGH     | `docker-compose.yml:52` | 8.1       |
| 6   | DEBUG = True                   | HIGH     | `settings.py:12`        | 7.5       |
| 7   | ALLOWED_HOSTS = ["*"]          | HIGH     | `settings.py:14`        | 7.5       |
| 8   | AllowAny permissions           | CRITICAL | `settings.py:106`       | 9.8       |
| 9   | No rate limiting               | HIGH     | Global                  | 7.0       |
| 10  | No input validation on scores  | HIGH     | `views.py:174`          | 7.5       |
| 11  | SSL verification disabled      | HIGH     | `bot.py:129`            | 7.4       |
| 12  | pgAdmin default credentials    | HIGH     | `docker-compose.yml:70` | 8.1       |
| 13  | No HTTPS/TLS                   | MEDIUM   | Infrastructure          | 6.5       |
| 14  | No resource limits             | MEDIUM   | `docker-compose.yml`    | 5.0       |
| 15  | No health checks               | MEDIUM   | All services            | 4.0       |
| 16  | Token in localStorage          | MEDIUM   | `api.ts:9`              | 6.1       |
| 17  | No backup strategy             | MEDIUM   | Infrastructure          | 5.5       |

---

## Appendix B: Quick Security Fixes (Copy-Paste)

### B.1 Django settings.py security additions

```python
# Add to the end of settings.py

# Production Security
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() in ("true", "1", "yes")
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Fail if no secret key
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY environment variable is required")

# Secure Cookies
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Security Headers
SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "False").lower() == "true"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Rate Limiting
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "login": "10/hour",
    },
}
```

### B.2 .env.example (Updated)

```bash
# Database
POSTGRES_DB=skilldivision
POSTGRES_USER=skilldivision_user
POSTGRES_PASSWORD=<generate-with-openssl-rand-base64-32>

# Django
DJANGO_SECRET_KEY=<generate-with-django-get-random-secret-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Telegram Bot
TG_TOKEN=<your-telegram-bot-token>

# GigaChat
GIGACHAT_TOKEN=<your-gigachat-credentials>

# pgAdmin (remove from production)
PGADMIN_EMAIL=admin@yourdomain.com
PGADMIN_PASSWORD=<generate-with-openssl-rand-base64-32>
```

---

*End of Security Review Report*
