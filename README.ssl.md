# Настройка SSL сертификата Let's Encrypt

## Предварительные требования

1. Домен `docs.ad-quest.ru` должен указывать на IP-адрес этого сервера (A-запись в DNS)
2. Порты 80 и 443 должны быть открыты в firewall
3. Docker и Docker Compose установлены

## Быстрая настройка

### 1. Проверьте DNS

Убедитесь, что домен указывает на ваш сервер:

```bash
dig +short docs.ad-quest.ru
# Должен вернуть IP-адрес вашего сервера
```

### 2. Отредактируйте email в скрипте

Откройте `init-letsencrypt.sh` и измените email:

```bash
EMAIL="admin@ad-quest.ru"  # Замените на ваш реальный email
```

### 3. Запустите скрипт инициализации

```bash
./init-letsencrypt.sh
```

Скрипт автоматически:
- Создаст необходимые директории
- Загрузит рекомендованные параметры TLS
- Создаст временный самоподписанный сертификат
- Запустит Nginx
- Получит настоящий сертификат от Let's Encrypt
- Перезагрузит Nginx с новым сертификатом

### 4. Проверьте работу

Откройте в браузере: `https://docs.ad-quest.ru`

## Тестовый режим (staging)

Для тестирования без лимитов Let's Encrypt, измените в `init-letsencrypt.sh`:

```bash
STAGING=1  # Тестовый режим
```

После успешного теста верните:

```bash
STAGING=0  # Продакшн режим
```

И запустите скрипт снова.

## Автоматическое обновление

Сертификат будет автоматически обновляться каждые 12 часов через контейнер `certbot`.

Проверить статус:

```bash
docker compose logs certbot
```

## Ручное обновление

Если нужно обновить сертификат вручную:

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

## Управление контейнерами

```bash
# Запустить все сервисы
docker compose up -d

# Остановить все сервисы
docker compose down

# Посмотреть логи Nginx
docker compose logs -f nginx

# Посмотреть логи Certbot
docker compose logs -f certbot

# Перезагрузить Nginx
docker compose exec nginx nginx -s reload
```

## Структура файлов

```
.
├── docker-compose.yml          # Конфигурация Docker Compose
├── nginx/
│   └── nginx.conf             # Конфигурация Nginx
├── certbot/
│   ├── conf/                  # Сертификаты Let's Encrypt
│   └── www/                   # Для проверки домена
└── init-letsencrypt.sh        # Скрипт инициализации
```

## Troubleshooting

### Ошибка: "DNS не указывает на сервер"

Проверьте A-запись домена:

```bash
dig +short docs.ad-quest.ru
curl ifconfig.me
```

IP-адреса должны совпадать.

### Ошибка: "Connection refused"

Проверьте, что порты 80 и 443 открыты:

```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

### Ошибка: "Rate limit exceeded"

Let's Encrypt имеет лимиты (5 сертификатов в неделю на домен). Используйте staging режим для тестирования.

### Проверка сертификата

```bash
# Проверить срок действия
docker compose run --rm certbot certificates

# Проверить SSL конфигурацию
curl -vI https://docs.ad-quest.ru
```

## Смена домена

Если нужно изменить домен:

1. Измените `DOMAIN` в `init-letsencrypt.sh`
2. Измените `server_name` в `nginx/nginx.conf`
3. Удалите старые сертификаты: `rm -rf certbot/conf/*`
4. Запустите `./init-letsencrypt.sh`

## Безопасность

- Сертификаты хранятся в `certbot/conf/` - не удаляйте эту директорию
- Используется TLS 1.2 и 1.3
- Включен HSTS (HTTP Strict Transport Security)
- Рекомендованные cipher suites от Mozilla
