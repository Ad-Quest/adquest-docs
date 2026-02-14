# Используем Node.js 22 Alpine для минимального размера образа
FROM node:22-alpine AS base

# Устанавливаем необходимые системные зависимости для sharp и других native модулей
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY .npmrc ./

# Stage для установки зависимостей
FROM base AS deps
RUN npm ci

# Stage для сборки
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules

# Копируем все файлы проекта
COPY . .

# Собираем проект (используем увеличенный лимит памяти)
ENV NODE_OPTIONS=--max-old-space-size=6192
RUN npm run build

# Production stage для запуска
FROM base AS runner
ENV NODE_ENV=production

# Копируем только необходимое для production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Открываем порт для Astro preview
EXPOSE 4321

# Запускаем preview сервер с разрешением всех хостов
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--allowed-hosts", "docs.ad-quest.ru"]
