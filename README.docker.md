# Docker Setup для AdQuest Docs

## Быстрый старт

### Production режим (собранный сайт)

```bash
# Собрать образ и запустить контейнер
docker-compose up -d

# Сайт будет доступен на http://localhost:4321
```

### Development режим (с hot-reload)

```bash
# Запустить dev-сервер с автоперезагрузкой
docker-compose --profile dev up adquest-docs-dev

# Dev-сервер будет доступен на http://localhost:4322
```

## Команды

### Production

```bash
# Собрать образ
docker-compose build

# Запустить контейнер
docker-compose up -d

# Остановить контейнер
docker-compose down

# Посмотреть логи
docker-compose logs -f

# Пересобрать и перезапустить
docker-compose up -d --build
```

### Development

```bash
# Запустить dev-режим
docker-compose --profile dev up adquest-docs-dev

# Остановить dev-режим
docker-compose --profile dev down
```

### Прямые Docker команды

```bash
# Собрать образ
docker build -t adquest-docs .

# Запустить контейнер
docker run -d -p 4321:4321 --name adquest-docs adquest-docs

# Остановить и удалить контейнер
docker stop adquest-docs && docker rm adquest-docs
```

## Требования

- Docker 20.10+
- Docker Compose 2.0+

## Порты

- `4321` - Production сервер (preview)
- `4322` - Development сервер (hot-reload)

## Особенности

- Используется Node.js 22 Alpine для минимального размера образа
- Multi-stage build для оптимизации размера финального образа
- Увеличенный лимит памяти для сборки (6GB)
- `.dockerignore` исключает ненужные файлы из контекста сборки
- Development режим монтирует исходный код для hot-reload

## Troubleshooting

### Ошибка памяти при сборке

Если сборка падает с ошибкой памяти, увеличьте лимит памяти для Docker:
- Docker Desktop: Settings → Resources → Memory (рекомендуется 8GB+)

### Медленная сборка

Первая сборка может занять 10-15 минут из-за установки зависимостей и компиляции. Последующие сборки будут быстрее благодаря кешированию слоев.

### Изменения не применяются

В production режиме нужно пересобрать образ:
```bash
docker-compose up -d --build
```

В dev режиме изменения применяются автоматически.
