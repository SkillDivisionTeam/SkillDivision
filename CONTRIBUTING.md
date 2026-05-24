# Вклад в проект Skill Division

## Как устроен репозиторий

- **Командный репо:** [SkillDivisionTeam/SkillDivision](https://github.com/SkillDivisionTeam/SkillDivision) — сюда мерджим PR
- **Форк:** личный форк → оттуда открываем PR в `develop` командного репо
- В форке **`develop` не коммитим** — только синхронизируем с upstream

## Git flow

- `main` — стабильная версия
- `develop` — основная ветка разработки
- `feature/*` — новые задачи
- `bugfix/*` — исправления

## Цикл работы

```bash
git checkout develop
git fetch upstream
git reset --hard upstream/develop
git push origin develop --force-with-lease

git checkout -b feature/имя-задачи
# работа, коммиты
git push -u origin feature/имя-задачи
```

Открыть PR: `ваш-форк:feature/...` → `SkillDivisionTeam:develop` (base — **develop**, не main).

После merge (squash):

```bash
git checkout develop
git fetch upstream
git reset --hard upstream/develop
git push origin develop --force-with-lease

git branch -d feature/имя-задачи
git push origin --delete feature/имя-задачи   # если GitHub не удалил сам
```

## Перед коммитом

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files   # или pre-commit сам при git commit
```

Локально поднять стек: `docker compose up -d --build` (см. [README.md](README.md)).

CI прогоняет lint и тесты по зонам (backend, frontend, bot) — статус смотри в PR.

## Issues и PR

- Задачи — через GitHub Issues (шаблоны в `.github/ISSUE_TEMPLATE/`)
- PR заполняй по шаблону из `.github/pull_request_template.md`
- Ревью по [CODEOWNERS](.github/CODEOWNERS)

## Версии стека

См. [VERSIONS.md](VERSIONS.md) — сверяй с `requirements.txt`, `package.json` и Docker-образами.
