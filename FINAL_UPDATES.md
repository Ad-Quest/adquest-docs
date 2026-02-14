# Финальные обновления документации

## Выполненные изменения

### 1. Исправлены ссылки на вход и регистрацию

**Старые ссылки:**
- `https://ad-quest.ru` (главная)

**Новые ссылки:**
- Вход: `https://ad-quest.ru/auth/login`
- Регистрация: `https://ad-quest.ru/auth/register`

**Обновленные файлы:**
- `src/content/docs/crm/index.mdx`
- `src/content/docs/crm/auth.mdx`
- `src/content/docs/index.mdx`

### 2. Удалены упоминания поддержки

Удалены все упоминания:
- Email: info@ad-quest.ru
- Раздел "Поддержка" в панели управления
- Документация: docs.ad-quest.ru

**Обновленные файлы:**
- `src/content/docs/crm/publisher/index.mdx`
- `src/content/docs/crm/publisher/faq.mdx`
- `src/content/docs/crm/publisher/settings.mdx`
- `src/content/docs/crm/auth.mdx`
- `src/content/docs/crm/index.mdx`
- `src/content/docs/crm/advertiser.mdx`
- `src/content/docs/crm/agency.mdx`

### 3. Отключена кнопка "Редактировать страницу"

В файле `astro.config.ts`:
```typescript
editLink: undefined, // Отключаем кнопку "Редактировать страницу"
```

### 4. Добавлены якоря для всех заголовков

Формат: `## Заголовок {#anchor-id}`

**Примеры:**
- `## Профиль {#profile}`
- `## Добавление сайта {#add-site}`
- `## Баланс {#balance}`
- `## Общая статистика {#overview}`
- `## Базовая интеграция {#basic-integration}`

**Обновленные файлы:**
- `src/content/docs/crm/publisher/settings.mdx`
- `src/content/docs/crm/publisher/sites.mdx`
- `src/content/docs/crm/publisher/finances.mdx`
- `src/content/docs/crm/publisher/statistics.mdx`
- `src/content/docs/crm/publisher/integration.mdx`
- `src/content/docs/crm/publisher/faq.mdx`

### 5. Добавлены внутренние ссылки между страницами

**Примеры ссылок:**

#### Из FAQ на другие разделы:
- `[Финансы → Запрос на вывод средств](/crm/publisher/finances/#withdrawal)`
- `[Статусы сайта](/crm/publisher/sites/#site-statuses)`
- `[Интеграция виджета](/crm/publisher/integration/)`
- `[Статистика и аналитика](/crm/publisher/statistics/)`

#### Из Sites на Integration:
- `[Интеграция виджета](/crm/publisher/integration/)`
- `[Получение Site Key](#site-key)`

#### Из Settings на другие разделы:
- `[Настройки → Организация](/crm/publisher/settings/#organization)`

#### Из Statistics на Integration:
- `[Интеграция виджета](/crm/publisher/integration/)`

#### Из Integration на Sites:
- `[Управление сайтами](/crm/publisher/sites/#add-site)`

#### Из Finances на Settings:
- `[Настройки → Организация](/crm/publisher/settings/#organization)`

### 6. Структура якорей по разделам

#### Settings (Настройки)
- `#profile` - Профиль
- `#organization` - Организация
- `#security` - Безопасность
- `#notifications` - Уведомления

#### Sites (Управление сайтами)
- `#add-site` - Добавление сайта
- `#site-key` - Получение Site Key
- `#site-statuses` - Статусы сайта
- `#edit-site` - Редактирование сайта
- `#delete-site` - Удаление сайта

#### Finances (Финансы)
- `#balance` - Баланс
- `#withdrawal` - Запрос на вывод средств
- `#transaction-history` - История транзакций

#### Statistics (Статистика)
- `#overview` - Общая статистика
- `#filters` - Фильтры
- `#site-statistics` - Статистика по сайтам
- `#increase-revenue` - Как увеличить доход

#### Integration (Интеграция)
- `#get-site-key` - Получение Site Key
- `#basic-integration` - Базовая интеграция
- `#verify-token` - Проверка токена на сервере
- `#faq` - Частые вопросы

#### FAQ (Частые вопросы)
- `#moderation` - Модерация
- `#integration` - Интеграция
- `#finances` - Финансы
- `#statistics` - Статистика

## Преимущества изменений

### 1. Правильные ссылки
- Пользователи попадают сразу на страницу входа/регистрации
- Не нужно искать кнопки на главной странице

### 2. Чистая документация
- Нет упоминаний несуществующей поддержки
- Нет email адресов, которые могут не работать
- Фокус на самообслуживании через документацию

### 3. Удобная навигация
- Якоря позволяют ссылаться на конкретные разделы
- Внутренние ссылки связывают связанные темы
- Пользователи быстро находят нужную информацию

### 4. Профессиональный вид
- Нет кнопки "Редактировать страницу" для публичной документации
- Чистый интерфейс без лишних элементов

## Примеры использования якорей

### Прямая ссылка на раздел:
```
https://docs.ad-quest.ru/crm/publisher/finances/#withdrawal
```

### Ссылка из другой страницы:
```markdown
См. [Запрос на вывод средств](/crm/publisher/finances/#withdrawal)
```

### Ссылка внутри той же страницы:
```markdown
См. [Получение Site Key](#site-key)
```

## Проверка работы

После деплоя проверьте:

1. Ссылки на вход и регистрацию работают
2. Нет упоминаний поддержки и email
3. Кнопка "Редактировать страницу" не отображается
4. Якоря работают (клик по ссылке с # переходит к нужному разделу)
5. Внутренние ссылки между страницами работают
6. Table of Contents (оглавление) показывает все заголовки с якорями

## Следующие шаги

1. Заменить placeholder скриншоты на реальные
2. Добавить больше примеров кода
3. Дополнить FAQ на основе вопросов пользователей
4. Добавить видео-инструкции (опционально)
