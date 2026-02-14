#!/bin/bash

# Скрипт для первоначальной настройки Let's Encrypt сертификата

DOMAIN="docs.ad-quest.ru"
EMAIL="admin@ad-quest.ru" # Замените на ваш email
STAGING=0 # Установите 1 для тестирования (staging сервер Let's Encrypt)

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Инициализация Let's Encrypt для $DOMAIN ===${NC}\n"

# Проверка, что домен указывает на этот сервер
echo -e "${YELLOW}Проверка DNS записи для $DOMAIN...${NC}"
CURRENT_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$CURRENT_IP" != "$DOMAIN_IP" ]; then
    echo -e "${RED}ВНИМАНИЕ: DNS запись для $DOMAIN ($DOMAIN_IP) не указывает на этот сервер ($CURRENT_IP)${NC}"
    echo -e "${YELLOW}Убедитесь, что A-запись домена указывает на IP этого сервера перед продолжением.${NC}"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Создание необходимых директорий
echo -e "\n${YELLOW}Создание директорий...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www

# Загрузка рекомендованных параметров TLS
if [ ! -e "certbot/conf/options-ssl-nginx.conf" ] || [ ! -e "certbot/conf/ssl-dhparams.pem" ]; then
    echo -e "${YELLOW}Загрузка рекомендованных параметров TLS...${NC}"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "certbot/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "certbot/conf/ssl-dhparams.pem"
    echo -e "${GREEN}✓ Параметры TLS загружены${NC}"
fi

# Создание временного самоподписанного сертификата
echo -e "\n${YELLOW}Создание временного самоподписанного сертификата...${NC}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
mkdir -p "certbot/conf/live/$DOMAIN"

if [ ! -e "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    docker compose run --rm --entrypoint "\
        openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout '$CERT_PATH/privkey.pem' \
        -out '$CERT_PATH/fullchain.pem' \
        -subj '/CN=localhost'" certbot
    echo -e "${GREEN}✓ Временный сертификат создан${NC}"
else
    echo -e "${GREEN}✓ Сертификат уже существует${NC}"
fi

# Запуск nginx
echo -e "\n${YELLOW}Запуск Nginx...${NC}"
docker compose up -d nginx
echo -e "${GREEN}✓ Nginx запущен${NC}"

# Удаление временного сертификата
echo -e "\n${YELLOW}Удаление временного сертификата...${NC}"
docker compose run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$DOMAIN && \
    rm -rf /etc/letsencrypt/archive/$DOMAIN && \
    rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
echo -e "${GREEN}✓ Временный сертификат удален${NC}"

# Получение настоящего сертификата
echo -e "\n${YELLOW}Запрос сертификата Let's Encrypt...${NC}"

if [ $STAGING != "0" ]; then
    STAGING_ARG="--staging"
    echo -e "${YELLOW}Используется staging сервер (тестовый режим)${NC}"
else
    STAGING_ARG=""
fi

docker compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Сертификат успешно получен!${NC}"
else
    echo -e "\n${RED}✗ Ошибка при получении сертификата${NC}"
    exit 1
fi

# Перезагрузка nginx
echo -e "\n${YELLOW}Перезагрузка Nginx...${NC}"
docker compose exec nginx nginx -s reload
echo -e "${GREEN}✓ Nginx перезагружен${NC}"

echo -e "\n${GREEN}=== Настройка завершена! ===${NC}"
echo -e "${GREEN}Ваш сайт доступен по адресу: https://$DOMAIN${NC}"
echo -e "${YELLOW}Сертификат будет автоматически обновляться каждые 12 часов${NC}"
