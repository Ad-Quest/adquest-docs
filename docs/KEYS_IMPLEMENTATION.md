# ADQuest Keys Implementation Guide

## Обзор системы ключей

ADQuest использует двухключевую систему для безопасной интеграции:

- **Public Key (pk_*)** - публичный ключ для фронтенда
- **Secret Key (sk_secret_*)** - секретный ключ для бэкенда

## Архитектура

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   ADQuest API    │         │   Backend       │
│   (Browser)     │         │                  │         │   (Node.js)     │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│                 │         │                  │         │                 │
│ 1. Init widget  │         │                  │         │                 │
│    with pk_*    │────────>│ 2. Generate      │         │                 │
│                 │         │    challenge     │         │                 │
│                 │         │    (validate     │         │                 │
│                 │         │     domain)      │         │                 │
│                 │         │                  │         │                 │
│ 3. User solves  │         │                  │         │                 │
│    CAPTCHA      │         │                  │         │                 │
│                 │         │                  │         │                 │
│ 4. Get token    │<────────│ 5. Return token  │         │                 │
│                 │         │                  │         │                 │
│ 6. Send token   │─────────────────────────────────────>│ 7. Verify token │
│    to backend   │         │                  │         │    with sk_*    │
│                 │         │                  │<────────│                 │
│                 │         │ 8. Validate      │         │                 │
│                 │         │    token         │         │                 │
│                 │         │                  │────────>│ 9. Get result   │
│                 │<─────────────────────────────────────│                 │
│ 10. Process     │         │                  │         │                 │
│     result      │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Типы ключей

### Public Key (pk_*)

**Формат:** `pk_` + 32 символа hex (MD5)

**Пример:** `pk_b7d2f850b11c72cbe090f2d96ea809ad`

**Назначение:**
- Используется на фронтенде для инициализации виджета
- Привязан к домену сайта
- Проверяется при каждом запросе challenge
- Безопасно хранить в публичном коде

### Secret Key (sk_secret_*)

**Формат:** `sk_secret_` + 32-40 символов hex

**Пример:** `sk_secret_07e9e5c3b657d72777a963665de40a20`

**Назначение:**
- Используется на бэкенде для верификации токенов
- Никогда не передается на фронтенд
- Хранится в переменных окружения
- Используется для серверной валидации

### Legacy Site Key (sk_*)

**Формат:** `sk_` + 32 символа hex

**Пример:** `sk_55496040623c8ccfba92c2b80a9a2499`

**Назначение:**
- Старый формат ключа (deprecated)
- Может использоваться как на фронтенде, так и на бэкенде
- Поддерживается для обратной совместимости

## Реализация на фронтенде

### HTML + JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.ad-quest.ru/widget/v1/adquest-widget.min.css">
</head>
<body>
    <div id="adquest-widget"></div>
    
    <script src="https://cdn.ad-quest.ru/widget/v1/adquest-widget.min.js"></script>
    <script>
        // Инициализация виджета с PUBLIC KEY
        AdQuest.init({
            siteKey: 'pk_b7d2f850b11c72cbe090f2d96ea809ad', // PUBLIC KEY
            container: document.getElementById('adquest-widget'),
            apiBaseURL: 'https://api.ad-quest.ru',
            theme: 'light',
            language: 'ru',
            onSuccess: (token) => {
                console.log('CAPTCHA solved, token:', token);
                
                // Отправить токен на ваш бэкенд для верификации
                fetch('/api/verify-captcha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Verification successful');
                        // Продолжить обработку формы
                    } else {
                        console.error('Verification failed');
                    }
                });
            },
            onError: (error) => {
                console.error('CAPTCHA error:', error);
            }
        });
    </script>
</body>
</html>
```

### React

```jsx
import { useEffect, useRef } from 'react';

function CaptchaWidget({ onSuccess, onError }) {
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (window.AdQuest && containerRef.current) {
            window.AdQuest.init({
                siteKey: 'pk_b7d2f850b11c72cbe090f2d96ea809ad', // PUBLIC KEY
                container: containerRef.current,
                apiBaseURL: 'https://api.ad-quest.ru',
                theme: 'light',
                language: 'ru',
                onSuccess: async (token) => {
                    // Отправить токен на бэкенд
                    const response = await fetch('/api/verify-captcha', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });
                    
                    const data = await response.json();
                    onSuccess(data);
                },
                onError
            });
        }
    }, [onSuccess, onError]);
    
    return <div ref={containerRef} />;
}

export default CaptchaWidget;
```

## Реализация на бэкенде (Node.js)

### Express.js

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// SECRET KEY хранится в переменных окружения
const ADQUEST_SECRET_KEY = process.env.ADQUEST_SECRET_KEY; // sk_secret_...
const ADQUEST_API_URL = 'https://api.ad-quest.ru';

/**
 * Эндпоинт для верификации токена CAPTCHA
 */
app.post('/api/verify-captcha', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'Token is required'
        });
    }
    
    try {
        // Отправить запрос на верификацию токена
        const response = await axios.post(
            `${ADQUEST_API_URL}/api/v1/verify`,
            {
                token,
                secret_key: ADQUEST_SECRET_KEY,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const { success, score, metadata } = response.data;
        
        if (success) {
            // Токен валиден
            console.log('CAPTCHA verified successfully', {
                score,
                metadata
            });
            
            return res.json({
                success: true,
                score,
                metadata
            });
        } else {
            // Токен невалиден
            return res.status(400).json({
                success: false,
                error: 'Invalid token'
            });
        }
        
    } catch (error) {
        console.error('CAPTCHA verification error:', error.message);
        
        return res.status(500).json({
            success: false,
            error: 'Verification failed'
        });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

### Next.js API Route

```javascript
// pages/api/verify-captcha.js
import axios from 'axios';

const ADQUEST_SECRET_KEY = process.env.ADQUEST_SECRET_KEY;
const ADQUEST_API_URL = 'https://api.ad-quest.ru';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'Token is required'
        });
    }
    
    try {
        const response = await axios.post(
            `${ADQUEST_API_URL}/api/v1/verify`,
            {
                token,
                secret_key: ADQUEST_SECRET_KEY,
                ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                user_agent: req.headers['user-agent']
            }
        );
        
        return res.json(response.data);
        
    } catch (error) {
        console.error('Verification error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Verification failed'
        });
    }
}
```

### TypeScript + Express

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const ADQUEST_SECRET_KEY = process.env.ADQUEST_SECRET_KEY!;
const ADQUEST_API_URL = 'https://api.ad-quest.ru';

interface VerifyRequest {
    token: string;
}

interface VerifyResponse {
    success: boolean;
    score?: number;
    metadata?: {
        timestamp: string;
        ip_address: string;
        user_agent: string;
    };
    error?: string;
}

app.post('/api/verify-captcha', async (req: Request<{}, {}, VerifyRequest>, res: Response<VerifyResponse>) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'Token is required'
        });
    }
    
    try {
        const response = await axios.post<VerifyResponse>(
            `${ADQUEST_API_URL}/api/v1/verify`,
            {
                token,
                secret_key: ADQUEST_SECRET_KEY,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            }
        );
        
        return res.json(response.data);
        
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Verification failed'
        });
    }
});

app.listen(3000);
```

## Переменные окружения

### .env файл

```bash
# ADQuest Configuration
ADQUEST_SECRET_KEY=sk_secret_07e9e5c3b657d72777a963665de40a20
ADQUEST_API_URL=https://api.ad-quest.ru
```

### .env.example (для репозитория)

```bash
# ADQuest Configuration
ADQUEST_SECRET_KEY=your_secret_key_here
ADQUEST_API_URL=https://api.ad-quest.ru
```

## Безопасность

### ✅ Правильно

1. **Public Key на фронтенде:**
   ```javascript
   AdQuest.init({
       siteKey: 'pk_b7d2f850b11c72cbe090f2d96ea809ad' // ✅ Безопасно
   });
   ```

2. **Secret Key в переменных окружения:**
   ```javascript
   const SECRET_KEY = process.env.ADQUEST_SECRET_KEY; // ✅ Безопасно
   ```

3. **Верификация на бэкенде:**
   ```javascript
   // ✅ Токен проверяется на сервере
   const response = await axios.post('/api/verify', {
       token,
       secret_key: SECRET_KEY
   });
   ```

### ❌ Неправильно

1. **Secret Key на фронтенде:**
   ```javascript
   // ❌ НИКОГДА не делайте так!
   AdQuest.init({
       secretKey: 'sk_secret_...' // ❌ Опасно!
   });
   ```

2. **Secret Key в коде:**
   ```javascript
   // ❌ НИКОГДА не делайте так!
   const SECRET_KEY = 'sk_secret_07e9e5c3b657d72777a963665de40a20';
   ```

3. **Верификация на фронтенде:**
   ```javascript
   // ❌ НИКОГДА не делайте так!
   // Верификация должна быть только на бэкенде
   ```

## Получение ключей

### Продакшн ключи

Для каждого домена создаются уникальные ключи:

```sql
-- Получить ключи для домена
SELECT 
    public_key,
    secret_key,
    domain,
    status
FROM sites
WHERE domain = 'your-domain.com'
AND status = 'active';
```

**Формат ключей:**
- Public Key: `pk_` + 32 hex символа
- Secret Key: `sk_secret_` + 32-40 hex символов

### Ключи для разработки (localhost)

Для локальной разработки используйте специальные тестовые ключи, которые работают на:
- `localhost` (любой порт)
- `127.0.0.1`
- `*.ad-quest.ru`
- `*.vscode-cdn.net`
- `*.github.dev`
- `*.gitpod.io`

Получить localhost ключи:
```sql
SELECT public_key, domain 
FROM sites 
WHERE domain LIKE '%localhost%' 
AND status IN ('active', 'verified');
```

**Важно:** В продакшене всегда используйте ключ, привязанный к вашему домену!

### Через API (будущая функциональность)

```bash
# Создать новый сайт и получить ключи
curl -X POST https://api.ad-quest.ru/api/v1/sites \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "name": "My Website"
  }'

# Ответ:
{
  "site_id": "uuid",
  "public_key": "pk_...",
  "secret_key": "sk_secret_...",
  "domain": "example.com"
}
```

## Проверка работы

### Тест фронтенда

1. Откройте страницу с виджетом
2. Откройте DevTools → Console
3. Решите CAPTCHA
4. Проверьте, что токен получен:
   ```
   CAPTCHA solved, token: eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

### Тест бэкенда

```bash
# Отправить тестовый запрос
curl -X POST http://localhost:3000/api/verify-captcha \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'

# Ожидаемый ответ:
{
  "success": true,
  "score": 0.9,
  "metadata": {
    "timestamp": "2026-02-25T17:30:00Z",
    "ip_address": "95.24.140.148"
  }
}
```

## Миграция со старых ключей

Если вы используете старый формат `sk_*`:

```javascript
// Старый код (работает, но deprecated)
AdQuest.init({
    siteKey: 'sk_55496040623c8ccfba92c2b80a9a2499' // Legacy
});

// Новый код (рекомендуется)
AdQuest.init({
    siteKey: 'pk_b7d2f850b11c72cbe090f2d96ea809ad' // Public Key
});
```

Бэкенд:
```javascript
// Используйте новый Secret Key
const SECRET_KEY = process.env.ADQUEST_SECRET_KEY; // sk_secret_...
```

## Troubleshooting

### Ошибка: "site_key not found or inactive"

**Причина:** Public key не найден или сайт неактивен

**Решение:**
```sql
-- Проверить статус сайта
SELECT status FROM sites WHERE public_key = 'pk_...';

-- Активировать сайт
UPDATE sites SET status = 'active' WHERE public_key = 'pk_...';
```

### Ошибка: "Domain validation failed" (403 Forbidden)

**Причина:** Домен в запросе не совпадает с доменом в БД

**Пример:** Запрос с `localhost:1111`, но ключ привязан к продакшн домену

**Решение для разработки:**
```javascript
// Используйте localhost ключ для разработки
// Получите его из базы данных
AdQuest.init({
    siteKey: 'pk_...', // Localhost key из БД
    // ...
});
```

**Решение для продакшена:**
```sql
-- Проверить домен
SELECT domain FROM sites WHERE public_key = 'pk_...';

-- Обновить домен
UPDATE sites SET domain = 'your-domain.com' WHERE public_key = 'pk_...';
```

### Ошибка: "Invalid token"

**Причина:** Токен истек или невалиден

**Решение:**
- Проверьте, что используете правильный Secret Key
- Проверьте, что токен не истек (срок действия 5 минут)
- Проверьте, что токен не был использован повторно

## Дополнительные ресурсы

- [API Documentation](https://docs.ad-quest.ru/api)
- [Widget Integration Guide](https://docs.ad-quest.ru/widget)
- [Security Best Practices](https://docs.ad-quest.ru/security)
