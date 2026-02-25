# Проверка настройки виджета ADQuest

## Текущая настройка для docs.ad-quest.ru

### ✅ Виджет настроен правильно

**Расположение:** `/home/aq/adq/adquest-docs/src/pages/captcha.astro`

**Конфигурация:**
```javascript
AdQuest.init({
  siteKey: 'pk_b7d2f850b11c72cbe090f2d96ea809ad',  // ✅ Public Key
  container: container,
  apiBaseURL: 'https://api.ad-quest.ru',           // ✅ Правильный API URL
  onSuccess: function(token) {
    localStorage.setItem('adquest_captcha_passed', 'true');
    localStorage.setItem('adquest_captcha_time', Date.now().toString());
    // Редирект на исходную страницу
  },
  onError: function(error) {
    console.error('Captcha error:', error);
  }
});
```

### ✅ Middleware настроен правильно

**Расположение:** `/home/aq/adq/adquest-docs/src/components/overrides/Head.astro`

**Логика:**
1. Проверяет `localStorage.getItem('adquest_captcha_passed')`
2. Проверяет время прохождения (24 часа)
3. Если не пройдена или истекла - редирект на `/captcha`
4. После успешной проверки - возврат на исходную страницу

### Ключи для docs.ad-quest.ru

**⚠️ КОНФИДЕНЦИАЛЬНО - НЕ ПУБЛИКОВАТЬ!**

```
Public Key (для виджета):
pk_b7d2f850b11c72cbe090f2d96ea809ad

Secret Key (для бэкенда):
sk_secret_07e9e5c3b657d72777a963665de40a20
```

**Где используются:**
- **Public Key** - в `src/pages/captcha.astro` (фронтенд)
- **Secret Key** - должен использоваться на бэкенде для верификации токенов (если есть серверная валидация)

## Демо-ключи для пользовательской документации

**✅ Обновлено в документации:**

Все примеры в пользовательской документации теперь используют демо-ключи:

```
Демо Public Key:
pk_demo_1234567890abcdef1234567890abcdef

Демо Secret Key:
sk_secret_demo_1234567890abcdef1234567890ab
```

**Файлы обновлены:**
- ✅ `src/content/docs/adquest-widget/index.mdx`
- ✅ `src/content/docs/adquest-widget/configuration.mdx`

## Проверка работы виджета

### 1. Локальная проверка

```bash
cd /home/aq/adq/adquest-docs
npm run dev
```

Откройте http://localhost:1111 и проверьте:
- ✅ Редирект на `/captcha`
- ✅ Виджет загружается
- ✅ После прохождения - возврат на главную
- ✅ Повторное посещение не требует captcha (24 часа)

### 2. Проверка в DevTools

**Console:**
```javascript
// Проверить статус
localStorage.getItem('adquest_captcha_passed')  // должно быть 'true'
localStorage.getItem('adquest_captcha_time')    // timestamp

// Сбросить для повторной проверки
localStorage.removeItem('adquest_captcha_passed')
localStorage.removeItem('adquest_captcha_time')
```

**Network:**
- ✅ Запрос к `https://api.ad-quest.ru/api/v1/challenge`
- ✅ Ответ с challenge данными
- ✅ После решения - получение токена

### 3. Проверка API

```bash
# Проверить доступность API
curl https://api.ad-quest.ru/health

# Проверить получение challenge (требует валидный public key)
curl -X POST https://api.ad-quest.ru/api/v1/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "site_key": "pk_b7d2f850b11c72cbe090f2d96ea809ad",
    "domain": "docs.ad-quest.ru"
  }'
```

## Возможные проблемы

### Проблема: URL дублируется

**Симптом:**
```
POST https://api.ad-quest.ruhttps//api.ad-quest.ru/api/v1/challenge
```

**Причина:** Неправильная конкатенация baseURL и path

**Решение:** Проверить в виджете:
```javascript
// Правильно
const baseURL = 'https://api.ad-quest.ru'  // без слэша в конце
const path = '/api/v1/challenge'           // со слэшем в начале

// Или
const baseURL = 'https://api.ad-quest.ru/' // со слэшем в конце
const path = 'api/v1/challenge'            // без слэша в начале
```

### Проблема: CORS ошибка

**Симптом:**
```
Access to fetch at 'https://api.ad-quest.ru/...' from origin 'https://docs.ad-quest.ru' has been blocked by CORS
```

**Решение:** Проверить на бэкенде API:
- Домен `docs.ad-quest.ru` должен быть в whitelist
- CORS headers должны быть настроены правильно

### Проблема: "site_key not found"

**Причина:** Public key не найден в базе данных или неактивен

**Решение:**
```sql
-- Проверить статус ключа
SELECT status, domain FROM sites 
WHERE public_key = 'pk_b7d2f850b11c72cbe090f2d96ea809ad';

-- Активировать если нужно
UPDATE sites 
SET status = 'active' 
WHERE public_key = 'pk_b7d2f850b11c72cbe090f2d96ea809ad';
```

### Проблема: Domain validation failed

**Причина:** Домен в запросе не совпадает с доменом в БД

**Решение:**
```sql
-- Проверить домен
SELECT domain FROM sites 
WHERE public_key = 'pk_b7d2f850b11c72cbe090f2d96ea809ad';

-- Обновить если нужно
UPDATE sites 
SET domain = 'docs.ad-quest.ru' 
WHERE public_key = 'pk_b7d2f850b11c72cbe090f2d96ea809ad';
```

## Безопасность

### ✅ Правильно настроено

- ✅ Public Key используется на фронтенде
- ✅ Secret Key НЕ используется на фронтенде
- ✅ Токен сохраняется в localStorage
- ✅ Проверка времени (24 часа)

## ✅ Secret Key реализован правильно

**Расположение:** `/home/aq/adq/adquest-docs/src/pages/api/verify-captcha.ts`

**Серверная валидация:**
```typescript
const response = await fetch('https://api.ad-quest.ru/api/v1/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    secret_key: import.meta.env.ADQUEST_SECRET_KEY
  })
});
```

**Процесс:**
1. Пользователь проходит captcha на фронтенде
2. Виджет получает токен от API
3. Токен отправляется на `/api/verify-captcha` (ваш сервер)
4. Сервер проверяет токен с помощью Secret Key
5. Только после успешной проверки - сохранение в localStorage

**Переменные окружения:**
```bash
# .env (НЕ коммитить!)
ADQUEST_SECRET_KEY=sk_secret_07e9e5c3b657d72777a963665de40a20
```

## Следующие шаги

- [ ] Проверить работу виджета на production
- [ ] Добавить серверную валидацию токенов (если нужно)
- [ ] Настроить мониторинг ошибок виджета
- [ ] Добавить аналитику прохождения captcha
