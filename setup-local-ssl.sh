#!/bin/bash

# Скрипт для настройки SSL через локальный Nginx

DOMAIN="docs.ad-quest.ru"
EMAIL="admin@ad-quest.ru" # Замените на ваш email

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Настройка SSL для локального Nginx ===${NC}\n"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Этот скрипт нужно запускать с правами root (sudo)${NC}"
    exit 1
fi

# Создание директории для certbot
echo -e "${YELLOW}Создание директорий для certbot...${NC}"
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot
echo -e "${GREEN}✓ Директории созданы${NC}"

# Копирование конфигурации Nginx
echo -e "\n${YELLOW}Установка конфигурации Nginx...${NC}"
cp nginx-local-config.conf /etc/nginx/sites-available/docs.ad-quest.ru

# Создание временной конфигурации без SSL для получения сертификата
cat > /etc/nginx/sites-available/docs.ad-quest.ru.temp << 'EOF'
server {
    listen 80;
    server_name docs.ad-quest.ru;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Включение временной конфигурации
ln -sf /etc/nginx/sites-available/docs.ad-quest.ru.temp /etc/nginx/sites-enabled/docs.ad-quest.ru
echo -e "${GREEN}✓ Временная конфигурация установлена${NC}"

# Проверка конфигурации Nginx
echo -e "\n${YELLOW}Проверка конфигурации Nginx...${NC}"
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Ошибка в конфигурации Nginx${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Конфигурация корректна${NC}"

# Перезагрузка Nginx
echo -e "\n${YELLOW}Перезагрузка Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx перезагружен${NC}"

# Установка certbot если не установлен
if ! command -v certbot &> /dev/null; then
    echo -e "\n${YELLOW}Установка certbot...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot установлен${NC}"
fi

# Получение сертификата
echo -e "\n${YELLOW}Запрос сертификата Let's Encrypt...${NC}"
certbot certonly --webroot \
    -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    --agree-tos \
    --non-interactive

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Сертификат успешно получен!${NC}"
else
    echo -e "\n${RED}✗ Ошибка при получении сертификата${NC}"
    exit 1
fi

# Включение полной конфигурации с SSL
echo -e "\n${YELLOW}Активация SSL конфигурации...${NC}"
ln -sf /etc/nginx/sites-available/docs.ad-quest.ru /etc/nginx/sites-enabled/docs.ad-quest.ru
rm -f /etc/nginx/sites-available/docs.ad-quest.ru.temp

# Проверка конфигурации
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Ошибка в SSL конфигурации${NC}"
    exit 1
fi

# Перезагрузка Nginx
systemctl reload nginx
echo -e "${GREEN}✓ Nginx перезагружен с SSL${NC}"

# Настройка автоматического обновления
echo -e "\n${YELLOW}Настройка автоматического обновления сертификата...${NC}"
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    echo -e "${GREEN}✓ Автообновление настроено (каждые 12 часов)${NC}"
else
    echo -e "${GREEN}✓ Автообновление уже настроено${NC}"
fi

echo -e "\n${GREEN}=== Настройка завершена! ===${NC}"
echo -e "${GREEN}Ваш сайт доступен по адресу: https://$DOMAIN${NC}"
echo -e "${YELLOW}Сертификат будет автоматически обновляться${NC}"
