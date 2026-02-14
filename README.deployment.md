# Развертывание AdQuest Docs с SSL

## Текущая конфигурация

Проект развернут с использованием:
- Docker контейнер с Astro (порт 127.0.0.1:8765)
- Локальный Nginx как reverse proxy (порты 80, 443)
- SSL сертификат Let's Encrypt для домена docs.ad-quest.ru
- Автоматическое обновление сертификата 1-го числа каждого месяца в 3:00

## Структура

```
.
├── Dockerfile                  # Multi-stage сборка Astro приложения
├── docker-compose.yml          # Docker Compose конфигурация
├── .dockerignore              # Исключения для Docker build
├── astro.config.ts            # Конфигурация Astro (allowedHosts)
├── nginx-local-config.conf    # Конфигурация Nginx для SSL
├── setup-local-ssl.sh         # Скрипт настройки SSL (уже выполнен)
└── README.deployment.md       # Эта документация
```

## Управление

### Запуск/остановка контейнера

```bash
# Запустить контейнер
docker compose up -d

# Остановить контейнер
docker compose down

# Пересобрать и запустить
docker compose up --build -d

# Посмотреть логи
docker logs adquest-docs -f

# Перезапустить
docker compose restart
```

### Проверка работы

```bash
# Проверить статус контейнера
docker ps | grep adquest-docs

# Проверить доступность локально
curl http://127.0.0.1:8765

# Проверить доступность через HTTPS
curl https://docs.ad-quest.ru

# Проверить SSL сертификат
curl -vI https://docs.ad-quest.ru 2>&1 | grep -E "SSL|expire"
```

### Управление Nginx

```bash
# Проверить конфигурацию
sudo nginx -t

# Перезагрузить Nginx
sudo systemctl reload nginx

# Перезапустить Nginx
sudo systemctl restart nginx

# Посмотреть логи
sudo tail -f /var/log/nginx/docs.ad-quest.ru.access.log
sudo tail -f /var/log/nginx/docs.ad-quest.ru.error.log
```

### Управление SSL сертификатом

```bash
# Проверить статус сертификата
sudo certbot certificates

# Проверить срок действия
sudo certbot certificates | grep -A 2 "docs.ad-quest.ru"

# Обновить сертификат вручную
sudo certbot renew --force-renewal
sudo systemctl reload nginx

# Проверить cron задачу
sudo crontab -l
```

## Автообновление сертификата

Настроено автоматическое обновление сертификата:
- Расписание: 1-го числа каждого месяца в 3:00
- Команда: `certbot renew --quiet --post-hook 'systemctl reload nginx'`
- Cron: `0 3 1 * * certbot renew --quiet --post-hook 'systemctl reload nginx'`

Сертификат Let's Encrypt действителен 90 дней, обновление раз в месяц обеспечивает достаточный запас.

## Обновление кода

```bash
# 1. Получить изменения из git
git pull origin production

# 2. Пересобрать и перезапустить контейнер
docker compose down
docker compose up --build -d

# 3. Проверить работу
curl -I https://docs.ad-quest.ru
```

## Порты

- 80 (HTTP) - Nginx, редирект на HTTPS
- 443 (HTTPS) - Nginx, проксирование на контейнер
- 127.0.0.1:8765 - Docker контейнер с Astro (только localhost)

## Конфигурация Nginx

Файл: `/etc/nginx/sites-enabled/docs.ad-quest.ru`

Основные настройки:
- HTTP → HTTPS редирект
- SSL сертификаты из `/etc/letsencrypt/live/docs.ad-quest.ru/`
- Проксирование на `http://127.0.0.1:8765`
- HSTS включен
- TLS 1.2 и 1.3

## Конфигурация Astro

В `astro.config.ts` добавлено:

```typescript
preview: {
    host: true,
    allowedHosts: ["docs.ad-quest.ru"],
},
```

Это разрешает запросы с домена docs.ad-quest.ru к preview серверу.

## Troubleshooting

### Ошибка 403 Forbidden

Проверьте, что:
1. Контейнер запущен: `docker ps | grep adquest-docs`
2. Контейнер доступен локально: `curl http://127.0.0.1:8765`
3. В astro.config.ts есть allowedHosts
4. Контейнер пересобран после изменений

### Ошибка 502 Bad Gateway

Проверьте:
1. Контейнер работает: `docker logs adquest-docs`
2. Порт 8765 слушает: `netstat -tlnp | grep 8765`
3. Nginx может подключиться: `curl http://127.0.0.1:8765`

### Сертификат не обновляется

Проверьте:
1. Cron задача существует: `sudo crontab -l`
2. Certbot работает: `sudo certbot renew --dry-run`
3. Логи certbot: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### Контейнер не запускается

Проверьте:
1. Логи: `docker logs adquest-docs`
2. Образ собран: `docker images | grep adquest-docs`
3. Порт свободен: `netstat -tlnp | grep 8765`

## Мониторинг

Рекомендуется настроить мониторинг:
- Доступность сайта (uptime monitoring)
- Срок действия SSL сертификата
- Использование ресурсов контейнера
- Логи ошибок Nginx

## Бэкапы

Рекомендуется делать бэкапы:
- Исходный код (git repository)
- Конфигурация Nginx (`/etc/nginx/sites-available/docs.ad-quest.ru`)
- SSL сертификаты (`/etc/letsencrypt/`)
- Docker образ (опционально)

## Безопасность

Текущие меры безопасности:
- HTTPS обязателен (HTTP редирект)
- HSTS включен (max-age=31536000)
- TLS 1.2 и 1.3
- Контейнер доступен только с localhost
- Регулярное обновление сертификата

## Производительность

Для улучшения производительности можно:
- Настроить кеширование в Nginx
- Включить gzip сжатие
- Настроить CDN (опционально)
- Увеличить ресурсы контейнера при необходимости
