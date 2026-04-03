# Skill Division: Team Organization & CI/CD Assessment

**Date:** 2026-04-03  
**Author:** Senior Engineering Manager  
**Status:** Draft for Review

---

## Table of Contents

1. [Team Organization Analysis](#1-team-organization-analysis)
2. [Integration Points & Communication Risks](#2-integration-points--communication-risks)
3. [CI/CD Pipeline Design](#3-cicd-pipeline-design)
4. [Code Review Process](#4-code-review-process)
5. [Testing Strategy](#5-testing-strategy)
6. [Pre-commit Configuration](#6-pre-commit-configuration)
7. [Branching Strategy & Release Management](#7-branching-strategy--release-management)
8. [Distributed Team Communication](#8-distributed-team-communication)
9. [Documentation Workflow](#9-documentation-workflow)

---

## 1. Team Organization Analysis

### 1.1 Current State

The project has a 4-person team with the following specializations:

| Role               | Specialization                      | Current Responsibilities                                |
| ------------------ | ----------------------------------- | ------------------------------------------------------- |
| Frontend Developer | React, TypeScript, Vite             | UI components, pages, services, routing                 |
| Backend Developer  | Django, DRF, PostgreSQL             | API endpoints, models, serializers, business logic      |
| Bot Developer      | python-telegram-bot, AI integration | Telegram bot handlers, API client, GigaChat integration |
| DevOps Engineer    | Docker, CI/CD, Infrastructure       | Container orchestration, deployment, monitoring         |

### 1.2 Gaps in Current Organization

1. **No CODEOWNERS file** — No automatic assignment of reviewers based on code ownership
2. **No PR/Issue templates** — Inconsistent contribution format
3. **No documented responsibility boundaries** — Overlap and ambiguity in component ownership
4. **No shared ownership model** — Critical integration points lack clear ownership
5. **No onboarding documentation** — New team members lack structured entry path

### 1.3 Proposed Responsibility Matrix

| Component                 | Primary Owner      | Secondary Owner   | Reviewer      |
| ------------------------- | ------------------ | ----------------- | ------------- |
| `backend/api/`            | Backend Developer  | DevOps Engineer   | Bot Developer |
| `backend/skill_division/` | Backend Developer  | DevOps Engineer   | —             |
| `frontend/`               | Frontend Developer | Backend Developer | —             |
| `bot/`                    | Bot Developer      | Backend Developer | —             |
| `docker-compose.yml`      | DevOps Engineer    | Backend Developer | All           |
| `.github/workflows/`      | DevOps Engineer    | Component Owner   | —             |
| `docs/`                   | All (by component) | DevOps Engineer   | —             |
| `CONTRIBUTING.md`         | DevOps Engineer    | All               | —             |

### 1.4 Recommended Organizational Changes

1. **Create `CODEOWNERS` file** — Automate reviewer assignment
2. **Define API contract ownership** — Backend Developer owns the contract; Frontend and Bot Developers are consumers who must approve contract changes
3. **Establish integration point ownership** — Shared ownership between Backend Developer and component consumers
4. **Create rotation for DevOps tasks** — Prevent single point of failure in infrastructure knowledge

---

## 2. Integration Points & Communication Risks

### 2.1 Integration Point Analysis

| Component Pair     | Integration Type        | Data Flow     | Risk Level | Description                                                                  |
| ------------------ | ----------------------- | ------------- | ---------- | ---------------------------------------------------------------------------- |
| Bot ↔ Backend      | REST API                | Bidirectional | **HIGH**   | Bot depends on backend for user registration, questions, scores, leaderboard |
| Frontend ↔ Backend | REST API                | Bidirectional | **HIGH**   | Frontend depends on backend for events, analytics, authentication            |
| Backend ↔ Database | PostgreSQL              | Bidirectional | **MEDIUM** | Schema changes require migration coordination                                |
| Bot ↔ GigaChat     | External API            | Outbound      | **MEDIUM** | AI question generation depends on external service availability              |
| Frontend ↔ Gemini  | External API            | Outbound      | **LOW**    | AI features depend on external service                                       |
| Docker Compose     | Container Orchestration | Internal      | **MEDIUM** | Service dependencies and networking                                          |

### 2.2 Communication Risk Matrix

| Risk                                             | Likelihood | Impact | Mitigation Strategy                                             |
| ------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------- |
| API contract drift between backend and consumers | High       | High   | OpenAPI/Swagger spec as source of truth; contract testing in CI |
| Breaking API changes without notification        | Medium     | High   | API versioning; deprecation policy; automated contract tests    |
| Database migration conflicts                     | Medium     | High   | Migration review process; DevOps approval required              |
| Bot state inconsistency (in-memory rooms/users)  | High       | Medium | Move state to backend; add health checks                        |
| External API (GigaChat) unavailability           | Medium     | Medium | Implement circuit breaker pattern; fallback to static questions |
| Docker Compose environment drift                 | Low        | High   | Pin image versions; automated environment validation            |
| Concurrent development on shared models          | Medium     | Medium | Clear model ownership; migration coordination process           |

### 2.3 Critical Integration Boundaries

**The API contract between Bot/Frontend and Backend is the single most critical integration boundary.** Any breaking change to the API will immediately impact both consumers. This requires:

1. **Contract-first development** — Define API schema before implementation
2. **Automated contract testing** — Validate API responses match expected schema
3. **Backward compatibility enforcement** — No breaking changes without version bump
4. **Consumer-driven contract tests** — Frontend and Bot define expected API behavior

---

## 3. CI/CD Pipeline Design

### 3.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Pull Request                           │
├─────────────┬──────────────┬──────────────┬─────────────────┤
│   Backend   │   Frontend   │     Bot      │   Infrastructure│
│   Workflow  │   Workflow   │   Workflow   │    Workflow     │
├─────────────┼──────────────┼──────────────┼─────────────────┤
│ • Lint      │ • Lint       │ • Lint       │ • Docker build  │
│ • Type check│ • Type check │ • Type check │ • Compose test  │
│ • Test      │ • Test       │ • Test       │ • Security scan │
│ • Build     │ • Build      │ • Build      │ • Deploy staging│
│ • Coverage  │ • Coverage   │ • Coverage   │                 │
└─────────────┴──────────────┴──────────────┴─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Merge to main   │
                    ├───────────────────┤
                    │ • Build & push    │
                    │ • Deploy to prod  │
                    │ • Notify team     │
                    └───────────────────┘
```

### 3.2 Workflow Files

The following GitHub Actions workflow files should be created:

- [`.github/workflows/backend.yml`](#321-backend-workflow)
- [`.github/workflows/frontend.yml`](#322-frontend-workflow)
- [`.github/workflows/bot.yml`](#323-bot-workflow)

#### 3.2.1 Backend Workflow

```yaml
# .github/workflows/backend.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'

env:
  PYTHON_VERSION: '3.11'
  DJANGO_SETTINGS_MODULE: skill_division.settings

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy
          pip install -r backend/requirements.txt

      - name: Run Ruff (linting)
        run: |
          ruff check backend/
          ruff format --check backend/

      - name: Run MyPy (type checking)
        run: mypy backend/ --ignore-missing-imports

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:14.12-alpine
        env:
          POSTGRES_DB: skilldivision
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DJANGO_SECRET_KEY: test-secret-key
      POSTGRES_DB: skilldivision
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_HOST: localhost
      POSTGRES_PORT: 5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r backend/requirements.txt
          pip install pytest pytest-django pytest-cov

      - name: Run migrations
        run: |
          cd backend
          python manage.py migrate

      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=api --cov-report=xml --cov-report=term-missing

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./backend/coverage.xml
          flags: backend
          name: backend-coverage
          fail_ci_if_error: false

  build:
    name: Build & Validate Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t skilldivision-backend:${{ github.sha }} ./backend

      - name: Validate container starts
        run: |
          docker run --rm skilldivision-backend:${{ github.sha }} python manage.py check
```

#### 3.2.2 Frontend Workflow

```yaml
# .github/workflows/frontend.yml
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend.yml'

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run ESLint
        run: |
          cd frontend
          npm run lint

      - name: Run TypeScript type check
        run: |
          cd frontend
          npx tsc --noEmit

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Install test dependencies
        run: |
          cd frontend
          npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

      - name: Run tests
        run: |
          cd frontend
          npx vitest run --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./frontend/coverage/coverage-final.json
          flags: frontend
          name: frontend-coverage
          fail_ci_if_error: false

  build:
    name: Build Production Bundle
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build
        run: |
          cd frontend
          npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/
          retention-days: 7
```

#### 3.2.3 Bot Workflow

```yaml
# .github/workflows/bot.yml
name: Bot CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'bot/**'
      - '.github/workflows/bot.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'bot/**'
      - '.github/workflows/bot.yml'

env:
  PYTHON_VERSION: '3.11'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-bot-pip-${{ hashFiles('bot/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-bot-pip-

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy
          pip install -r bot/requirements.txt

      - name: Run Ruff (linting)
        run: |
          ruff check bot/
          ruff format --check bot/

      - name: Run MyPy (type checking)
        run: mypy bot/ --ignore-missing-imports

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint
    env:
      TG_TOKEN: dummy-token-for-tests
      GIGACHAT_TOKEN: dummy-gigachat-token
      BACKEND_API_URL: http://localhost:8000/api

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r bot/requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests with coverage
        run: |
          cd bot
          pytest --cov=. --cov-report=xml --cov-report=term-missing

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./bot/coverage.xml
          flags: bot
          name: bot-coverage
          fail_ci_if_error: false

  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t skilldivision-bot:${{ github.sha }} ./bot

      - name: Validate container syntax
        run: |
          docker run --rm skilldivision-bot:${{ github.sha }} python -c "import telebot; print('Bot imports OK')"
```

### 3.3 Pipeline Requirements Summary

| Stage           | Backend                   | Frontend                  | Bot                       |
| --------------- | ------------------------- | ------------------------- | ------------------------- |
| Lint            | Ruff + Ruff format        | ESLint                    | Ruff + Ruff format        |
| Type Check      | MyPy                      | TypeScript (tsc --noEmit) | MyPy                      |
| Test            | pytest + pytest-django    | Vitest + Testing Library  | pytest                    |
| Coverage Target | 80%                       | 70%                       | 75%                       |
| Build           | Docker image              | Vite production build     | Docker image              |
| Trigger         | PR + push to main/develop | PR + push to main/develop | PR + push to main/develop |

---

## 4. Code Review Process

### 4.1 Pull Request Template

```markdown
# .github/PULL_REQUEST_TEMPLATE.md

## Description

<!-- Provide a clear, concise description of what this PR does -->

**Type of Change:**
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🔧 Refactor (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition/update

## Related Issues

<!-- Link any related issues using #issue_number -->
Closes #

## Changes Made

<!-- List the specific changes made in this PR -->
- 
- 
- 

## Testing

<!-- Describe how you tested these changes -->

### Manual Testing
- [ ] Tested locally with `docker compose up`
- [ ] Verified no regressions to existing functionality

### Automated Tests
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass

## API Changes (if applicable)

<!-- If this PR changes the API, describe the changes -->
- [ ] API contract updated
- [ ] OpenAPI/Swagger spec updated
- [ ] Consumers notified (Frontend/Bot developers)

## Database Changes (if applicable)

<!-- If this PR includes database changes -->
- [ ] Migration created and tested
- [ ] Rollback plan documented
- [ ] DevOps engineer reviewed

## Screenshots (if applicable)

<!-- Add screenshots or GIFs for UI changes -->

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] No new warnings introduced
- [ ] `.env.example` updated (if new env vars added)
```

### 4.2 Review Checklist

#### General Checklist (All PRs)

- [ ] Code is readable and follows project conventions
- [ ] No hardcoded values (use environment variables or config)
- [ ] Error handling is appropriate
- [ ] No sensitive data in logs
- [ ] Changes are minimal and focused on the stated goal

#### Backend-Specific Checklist

- [ ] Django best practices followed (class-based vs function-based views)
- [ ] Serializers validate input correctly
- [ ] Database queries are efficient (no N+1 queries)
- [ ] Migrations are included and tested
- [ ] API endpoints follow RESTful conventions
- [ ] Authentication/authorization is correct
- [ ] CORS configuration updated if needed

#### Frontend-Specific Checklist

- [ ] Components are functional with hooks
- [ ] TypeScript types are correct and complete
- [ ] No `any` types without justification
- [ ] Responsive design maintained
- [ ] Accessibility considerations (ARIA labels, keyboard navigation)
- [ ] No console.log statements in production code
- [ ] API service layer handles errors gracefully

#### Bot-Specific Checklist

- [ ] Bot handlers are properly structured
- [ ] API client handles network errors gracefully
- [ ] State management is thread-safe
- [ ] No blocking operations in handlers
- [ ] Logging is appropriate (no sensitive data)
- [ ] Fallback behavior for external service failures

#### DevOps-Specific Checklist

- [ ] Docker images are optimized (multi-stage builds where possible)
- [ ] Environment variables are documented in `.env.example`
- [ ] Health checks are configured
- [ ] No secrets in Dockerfiles or compose files
- [ ] Resource limits defined for production

### 4.3 Approval Workflow

```
PR Created
    │
    ▼
┌─────────────────────┐
│  Author self-review  │
│  (complete checklist)│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  CI checks pass     │
│  (lint, test, build)│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Required reviews:  │
│  • Component owner  │
│  • Integration owner│
│    (if API changes) │
└────────┬────────────┘
         │
    ┌────▼────┐
    │ Approved?│
    └────┬────┘
         │
    ┌────▼────────────────┐
    │ Merge to develop    │
    │ Delete feature branch│
    └─────────────────────┘
```

**Approval Requirements:**

- Minimum **2 approvals** for all PRs
- At least **1 approval from component owner**
- **DevOps approval required** for:
  - Changes to `docker-compose.yml`
  - Changes to `.github/workflows/`
  - Database migrations
  - New environment variables
- **API consumer approval required** for:
  - Changes to API endpoints
  - Changes to request/response schemas

---

## 5. Testing Strategy

### 5.1 Testing Pyramid

```
                    ┌─────────────┐
                   │   E2E Tests  │     ← 5-10% of tests
                  │  (Playwright) │
                 └───────┬───────┘
                ┌────────▼────────┐
               │ Integration Tests│    ← 20-30% of tests
              │  (API contracts) │
             └────────┬─────────┘
            ┌─────────▼──────────┐
           │    Unit Tests       │   ← 60-75% of tests
          │  (pytest, Vitest)   │
         └──────────────────────┘
```

### 5.2 Framework Selection

| Component | Unit Testing             | Integration Testing       | E2E Testing | Coverage Tool   |
| --------- | ------------------------ | ------------------------- | ----------- | --------------- |
| Backend   | pytest + pytest-django   | pytest + requests         | Playwright  | pytest-cov      |
| Frontend  | Vitest + Testing Library | MSW (Mock Service Worker) | Playwright  | vitest coverage |
| Bot       | pytest + pytest-asyncio  | pytest + responses        | —           | pytest-cov      |

### 5.3 Coverage Targets

| Component | Minimum Coverage | Critical Modules Target    |
| --------- | ---------------- | -------------------------- |
| Backend   | 80%              | 95% (serializers, views)   |
| Frontend  | 70%              | 90% (services, hooks)      |
| Bot       | 75%              | 90% (handlers, API client) |

### 5.4 Example Test Structure

#### Backend Test Example

```python
# backend/api/tests/test_views.py
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def sample_event(db):
    from api.models import Event
    return Event.objects.create(
        title="Test Event",
        description="Test Description",
        event_code="TEST01",
        is_active=True
    )

@pytest.mark.django_db
class TestEventAPI:
    def test_list_events(self, api_client, sample_event):
        url = reverse('event-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1
        assert response.json()[0]['title'] == "Test Event"
    
    def test_create_event(self, api_client):
        url = reverse('event-list')
        data = {
            'title': 'New Event',
            'description': 'New Description',
            'event_code': 'NEW01'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()['title'] == 'New Event'
    
    def test_get_active_event(self, api_client, sample_event):
        url = reverse('event-active')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['is_active'] is True
```

#### Frontend Test Example

```typescript
// frontend/components/__tests__/Layout.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from '../Layout';

describe('Layout', () => {
  it('renders children correctly', () => {
    render(
      <Layout>
        <div data-testid="child">Test Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(<Layout><div /></Layout>);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```

#### Bot Test Example

```python
# bot/tests/test_api_client.py
import pytest
from unittest.mock import patch, MagicMock
import requests

class TestAPIClient:
    @patch('requests.post')
    def test_api_register_user_success(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_user = MagicMock(id=12345, username='testuser')
        
        from bot import api_register_user
        api_register_user(mock_user)
        
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert 'bot-auth' in call_args[0][0]
        assert call_args[1]['json']['tg_id'] == 12345
    
    @patch('requests.get')
    def test_api_get_active_event_returns_none_on_error(self, mock_get):
        mock_get.side_effect = requests.exceptions.ConnectionError
        
        from bot import api_get_active_event
        result = api_get_active_event()
        
        assert result is None
```

### 5.5 Test Execution Strategy

| Test Type         | When to Run               | Timeout    | Fail Pipeline?   |
| ----------------- | ------------------------- | ---------- | ---------------- |
| Unit tests        | Every PR, every push      | 10 minutes | Yes              |
| Integration tests | Every PR, every push      | 15 minutes | Yes              |
| E2E tests         | On merge to main, nightly | 30 minutes | Yes (main only)  |
| Performance tests | Weekly, before releases   | 20 minutes | No (report only) |

---

## 6. Pre-commit Configuration

### 6.1 Complete `.pre-commit-config.yaml`

```yaml
# .pre-commit-config.yaml
# Pre-commit hooks for Skill Division project
# Install: pre-commit install
# Run manually: pre-commit run --all-files

repos:
  # Universal hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: ['--unsafe']
      - id: check-json
      - id: check-merge-conflict
      - id: detect-private-key
      - id: check-added-large-files
        args: ['--maxkb=1024']

  # Backend hooks (Python)
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
        files: ^backend/|^bot/
      - id: ruff-format
        files: ^backend/|^bot/

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        files: ^backend/|^bot/
        args: [--ignore-missing-imports]
        additional_dependencies:
          - types-requests
          - types-python-dotenv

  # Frontend hooks
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: bash -c 'cd frontend && npx eslint . --ext ts,tsx --fix'
        language: system
        files: ^frontend/.*\.(ts|tsx)$
        pass_filenames: false

      - id: tsc
        name: TypeScript Type Check
        entry: bash -c 'cd frontend && npx tsc --noEmit'
        language: system
        files: ^frontend/.*\.(ts|tsx)$
        pass_filenames: false

  # Security hooks
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.2
    hooks:
      - id: gitleaks
        args: [--verbose]

  # Documentation hooks
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.41.0
    hooks:
      - id: markdownlint
        files: \.md$
        args: [--fix]
```

### 6.2 Ruff Configuration

```toml
# pyproject.toml (create in project root)
[tool.ruff]
target-version = "py311"
line-length = 88
src = ["backend", "bot"]

[tool.ruff.lint]
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # pyflakes
    "I",     # isort
    "N",     # pep8-naming
    "UP",    # pyupgrade
    "B",     # flake8-bugbear
    "SIM",   # flake8-simplify
    "TCH",   # flake8-type-checking
]
ignore = [
    "E501",  # line length (handled by formatter)
]

[tool.ruff.lint.isort]
known-first-party = ["api", "skill_division", "utils"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = false  # Gradual typing
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "api.*"
disallow_untyped_defs = true
```

### 6.3 Installation Instructions

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files (first time)
pre-commit run --all-files

# Install frontend dependencies for hooks
cd frontend && npm install
```

---

## 7. Branching Strategy & Release Management

### 7.1 Branching Model: GitFlow (Modified)

The project currently uses a basic GitFlow model. We recommend a **modified GitFlow** optimized for a 4-person team:

```
main ────────────────────────────────────────────────────► (production)
  │
  ├── release/v1.0.0 ────────────────────────────────────► (release candidate)
  │
develop ─────────────────────────────────────────────────► (integration)
  │
  ├── feature/backend-auth ──────────┐
  ├── feature/frontend-dashboard ────┤──► PR to develop
  ├── feature/bot-ai-quiz ───────────┤
  └── bugfix/bot-connection ─────────┘
```

### 7.2 Branch Naming Conventions

| Type           | Pattern                             | Example                     |
| -------------- | ----------------------------------- | --------------------------- |
| Feature        | `feature/<component>-<description>` | `feature/backend-auth`      |
| Bug Fix        | `bugfix/<component>-<description>`  | `bugfix/bot-connection`     |
| Hotfix         | `hotfix/<description>`              | `hotfix/security-patch`     |
| Release        | `release/v<major>.<minor>.<patch>`  | `release/v1.0.0`            |
| Documentation  | `docs/<description>`                | `docs/api-contract`         |
| Infrastructure | `infra/<description>`               | `infra/docker-optimization` |

### 7.3 Branch Protection Rules

| Branch      | Push             | Force Push | Delete      | PR Required | Approvals | CI Required   |
| ----------- | ---------------- | ---------- | ----------- | ----------- | --------- | ------------- |
| `main`      | Blocked          | Blocked    | Blocked     | Yes         | 2         | All workflows |
| `develop`   | Blocked          | Blocked    | Blocked     | Yes         | 1         | Lint + Test   |
| `release/*` | Maintainers only | Blocked    | After merge | Yes         | 2         | All workflows |
| `feature/*` | Owner            | Allowed    | Allowed     | Recommended | 1         | Lint + Test   |

### 7.4 Versioning Strategy: Semantic Versioning

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Backward-compatible bug fixes
  │     └──────── Backward-compatible new features
  └────────────── Breaking API changes
```

**Version bump triggers:**

- **MAJOR**: Breaking API changes, database schema incompatibility
- **MINOR**: New features, new API endpoints, new bot commands
- **PATCH**: Bug fixes, documentation updates, performance improvements

### 7.5 Release Process

```
1. Create release branch from develop
   git checkout -b release/v1.1.0 develop

2. Update version numbers
   - backend/skill_division/__init__.py
   - frontend/package.json
   - VERSIONS.md

3. Run full test suite
   - All CI workflows must pass
   - Manual E2E testing

4. Create PR: release/v1.1.0 → main
   - 2 approvals required
   - All CI checks pass

5. Merge to main and tag
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0

6. Merge main back to develop
   git checkout develop
   git merge main
   git push origin develop

7. Deploy to production
   - DevOps engineer triggers deployment
   - Monitor for 1 hour post-deploy
```

---

## 8. Distributed Team Communication

### 8.1 Communication Risk Analysis

| Risk                                | Impact | Probability | Mitigation                                     |
| ----------------------------------- | ------ | ----------- | ---------------------------------------------- |
| Timezone misalignment               | High   | Medium      | Core overlap hours (10:00-14:00 MSK)           |
| API changes without notification    | High   | High        | Contract testing + automated notifications     |
| Knowledge silos                     | High   | Medium      | Cross-component code reviews, pair programming |
| Context loss in async communication | Medium | High        | Written decisions in ADRs, documented meetings |
| Blocked dependencies                | High   | Medium      | Clear SLA for PR reviews (24 hours)            |
| Conflicting database changes        | High   | Low         | Migration coordination process                 |

### 8.2 Meeting Cadence

| Meeting         | Frequency | Duration | Attendees          | Purpose                       |
| --------------- | --------- | -------- | ------------------ | ----------------------------- |
| Daily Standup   | Daily     | 15 min   | All                | Progress, blockers, plans     |
| Sprint Planning | Bi-weekly | 1 hour   | All                | Prioritize work, assign tasks |
| Technical Sync  | Weekly    | 30 min   | Component owners   | Integration coordination      |
| Retrospective   | Bi-weekly | 45 min   | All                | Process improvement           |
| Demo            | Bi-weekly | 30 min   | All + stakeholders | Show completed work           |

### 8.3 Communication Channels

| Channel                    | Purpose                        | Response SLA |
| -------------------------- | ------------------------------ | ------------ |
| Slack/Telegram (general)   | Quick questions, announcements | 2 hours      |
| Slack/Telegram (component) | Component-specific discussions | 4 hours      |
| GitHub Issues              | Bug reports, feature requests  | 24 hours     |
| GitHub PRs                 | Code review                    | 24 hours     |
| Email                      | Formal announcements           | 48 hours     |
| Documentation              | Decisions, architecture        | Asynchronous |

### 8.4 Decision Recording: Architecture Decision Records (ADRs)

All significant technical decisions should be recorded as ADRs in `docs/adr/`:

```
docs/adr/
├── 0001-record-architecture-decisions.md
├── 0002-use-gitflow-branching.md
├── 0003-api-contract-first-development.md
└── 0004-postgresql-as-primary-database.md
```

**ADR Template:**

```markdown
# ADR-NNN: <Title>

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Deciders:** <Names>

## Context
<What is the issue that we're seeing that is motivating this decision?>

## Decision
<What is the change that we're proposing and/or doing?>

## Consequences
<What becomes easier or more difficult to do because of this change?>
```

---

## 9. Documentation Workflow

### 9.1 Documentation-as-Code Approach

Treat documentation like code:

- Version controlled alongside source code
- Reviewed in PRs
- Updated with every feature
- Linted and validated

### 9.2 Documentation Structure

```
docs/
├── ru/                          # Russian documentation
│   ├── 1_concept.md             # Project concept
│   ├── 2_structure.md           # Project structure
│   ├── 3_func_specification.md  # Functional specification
│   ├── 4_test_specification.md  # Test specification (EMPTY - needs content)
│   └── images/                  # Documentation images
├── adr/                         # Architecture Decision Records
│   └── 0001-record-architecture-decisions.md
├── api/                         # API documentation
│   └── openapi.yaml             # OpenAPI specification
└── en/                          # English documentation (future)
    └── README.md
```

### 9.3 Documentation Update Triggers

| Change Type           | Documentation to Update                                    | Responsible        |
| --------------------- | ---------------------------------------------------------- | ------------------ |
| New API endpoint      | `docs/api/openapi.yaml`, `docs/ru/3_func_specification.md` | Backend Developer  |
| New bot command       | `docs/ru/3_func_specification.md`                          | Bot Developer      |
| UI change             | `docs/ru/3_func_specification.md`                          | Frontend Developer |
| Infrastructure change | `README.md`, `docs/ru/2_structure.md`                      | DevOps Engineer    |
| New feature           | All relevant docs                                          | Feature Owner      |
| Bug fix               | `docs/ru/4_test_specification.md`                          | Bug Fix Owner      |

### 9.4 Documentation Review Checklist

Add to PR template:

- [ ] Documentation updated for this change
- [ ] API documentation updated (if API changed)
- [ ] README updated (if setup changed)
- [ ] Test specification updated (if new test scenarios)
- [ ] No broken links in documentation
- [ ] Images/diagrams updated (if UI changed)

### 9.5 Documentation CI Workflow

```yaml
# .github/workflows/docs.yml
name: Documentation CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'docs/**'
      - '**.md'
  pull_request:
    branches: [main, develop]
    paths:
      - 'docs/**'
      - '**.md'

jobs:
  lint:
    name: Lint Documentation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run markdownlint
        uses: DavidAnson/markdownlint-cli2-action@v16
        with:
          globs: '**/*.md'

      - name: Check for broken links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          config-file: '.markdown-link-check.json'
```

### 9.6 Immediate Action: Populate Test Specification

The file `docs/ru/4_test_specification.md` is currently empty. It should be populated with:

1. Test scenarios for each feature
2. Expected inputs and outputs
3. Edge cases to consider
4. Integration test scenarios
5. Performance benchmarks

---

## Appendix A: Immediate Action Items

| Priority | Action                                  | Owner            | Effort  |
| -------- | --------------------------------------- | ---------------- | ------- |
| **P0**   | Create GitHub Actions workflow files    | DevOps           | 2 days  |
| **P0**   | Create CODEOWNERS file                  | DevOps           | 1 hour  |
| **P0**   | Create PR template                      | DevOps           | 2 hours |
| **P1**   | Set up pre-commit hooks                 | All              | 1 day   |
| **P1**   | Add Ruff configuration (pyproject.toml) | Backend          | 2 hours |
| **P1**   | Populate test specification document    | All              | 2 days  |
| **P2**   | Set up testing frameworks               | Component Owners | 3 days  |
| **P2**   | Create OpenAPI specification            | Backend          | 2 days  |
| **P2**   | Set up branch protection rules          | DevOps           | 1 hour  |
| **P3**   | Write initial unit tests                | Component Owners | 1 week  |
| **P3**   | Create ADR template                     | DevOps           | 1 hour  |
| **P3**   | Set up Codecov integration              | DevOps           | 2 hours |

## Appendix B: Configuration Files Summary

| File                               | Location     | Purpose                       |
| ---------------------------------- | ------------ | ----------------------------- |
| `.github/workflows/backend.yml`    | Project root | Backend CI pipeline           |
| `.github/workflows/frontend.yml`   | Project root | Frontend CI pipeline          |
| `.github/workflows/bot.yml`        | Project root | Bot CI pipeline               |
| `.github/workflows/docs.yml`       | Project root | Documentation CI pipeline     |
| `.github/CODEOWNERS`               | Project root | Automatic reviewer assignment |
| `.github/PULL_REQUEST_TEMPLATE.md` | Project root | PR description template       |
| `.github/ISSUE_TEMPLATE/`          | Project root | Issue templates               |
| `.pre-commit-config.yaml`          | Project root | Pre-commit hooks              |
| `pyproject.toml`                   | Project root | Python tool configuration     |
| `.markdownlint.json`               | Project root | Markdown linting rules        |

---

*This document is a living artifact. Update it as the team and project evolve.*
