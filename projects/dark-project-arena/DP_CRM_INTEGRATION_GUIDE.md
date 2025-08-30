# Руководство по интеграции Dark Project Arena с DP_CRM

## 🎯 Обзор

Это руководство поможет вам интегрировать Dark Project Arena с вашей DP_CRM системой вместо Битрикс24.

## 🚀 Быстрый старт

### 1. Клонируйте и настройте DP_CRM

```bash
# Клонируйте вашу CRM (если еще не сделано)
git clone https://github.com/AlexeyPevz/DP_CRM.git
cd DP_CRM

# Установите зависимости и запустите
# (следуйте инструкциям в README вашей CRM)
```

### 2. Настройте CRM адаптер

```bash
cd /workspace/projects/dark-project-arena/crm-adapter

# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env
```

### 3. Отредактируйте .env файл

```env
# Тип CRM (важно!)
CRM_TYPE=DP_CRM

# URL вашей DP_CRM
CUSTOM_CRM_URL=http://localhost:8000

# API ключ или токен доступа к DP_CRM
CUSTOM_CRM_API_KEY=your-dp-crm-api-key

# Настройки прокси
PORT=3000
NODE_ENV=development
DEBUG=true
```

### 4. Запустите прокси-сервер

```bash
npm start
```

### 5. Обновите настройки n8n

В n8n измените переменную окружения:

```env
# Было:
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_webhook_key/

# Стало (указывает на ваш прокси):
BITRIX24_WEBHOOK_URL=http://localhost:3000/rest/1/dp_crm_proxy/
```

## 📋 Маппинг полей между Битрикс24 и DP_CRM

### Основные поля лидов

| Битрикс24 | DP_CRM | Описание |
|-----------|---------|----------|
| `ID` | `id` | Уникальный идентификатор |
| `TITLE` | `name` или `company_name` | Название клуба |
| `STATUS_ID` | `status` | Статус лида |
| `PHONE` | `phones` или `phone` | Телефоны |
| `EMAIL` | `emails` или `email` | Email адреса |
| `COMMENTS` | `notes` или `description` | Комментарии |
| `ADDRESS_CITY` | `city` | Город |

### Кастомные поля (UF_CRM_*)

| Битрикс24 | DP_CRM | Описание |
|-----------|---------|----------|
| `UF_CRM_TELEGRAM` | `custom_fields.telegram` | Telegram контакт |
| `UF_CRM_WHATSAPP` | `custom_fields.whatsapp` | WhatsApp номер |
| `UF_CRM_ESTIMATED_PCS` | `custom_fields.estimated_pcs` | Количество ПК |
| `UF_CRM_IS_CHAIN` | `custom_fields.is_chain` | Сеть (да/нет) |
| `UF_CRM_PRIORITY` | `custom_fields.priority` | Приоритет |
| `UF_CRM_DIALOG_HISTORY` | `custom_fields.dialog_history` | История диалога |

### Маппинг статусов

| Битрикс24 | DP_CRM |
|-----------|---------|
| `NEW` | `new` или `open` |
| `IN_PROGRESS` | `in_progress` или `working` |
| `PROCESSED` | `processed` или `qualified` |
| `CONVERTED` | `converted` или `won` |
| `JUNK` | `lost` или `junk` |

## 🔧 Настройка DP_CRM

### 1. Создайте необходимые кастомные поля

В админ-панели DP_CRM создайте следующие кастомные поля для лидов:

```json
{
  "custom_fields": [
    {
      "key": "telegram",
      "name": "Telegram",
      "type": "string"
    },
    {
      "key": "whatsapp",
      "name": "WhatsApp",
      "type": "string"
    },
    {
      "key": "estimated_pcs",
      "name": "Количество компьютеров",
      "type": "number"
    },
    {
      "key": "is_chain",
      "name": "Является сетью",
      "type": "boolean"
    },
    {
      "key": "priority",
      "name": "Приоритет",
      "type": "number",
      "min": 1,
      "max": 10
    },
    {
      "key": "dialog_history",
      "name": "История диалога",
      "type": "json"
    },
    {
      "key": "preferred_channel",
      "name": "Предпочитаемый канал связи",
      "type": "select",
      "options": ["telegram", "whatsapp", "email", "phone"]
    }
  ]
}
```

### 2. Настройте API endpoints

Убедитесь, что ваша DP_CRM предоставляет следующие endpoints:

#### Поиск лидов
```http
POST /api/v1/leads/search
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "filters": {
    "phone": "+79991234567"
  },
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

#### Создание лида
```http
POST /api/v1/leads
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "name": "Gaming Club Moscow",
  "phones": [
    {"number": "+79991234567", "type": "work"}
  ],
  "custom_fields": {
    "telegram": "@gaming_club",
    "estimated_pcs": 30
  }
}
```

#### Обновление лида
```http
PUT /api/v1/leads/{id}
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "status": "in_progress",
  "custom_fields": {
    "priority": 8
  }
}
```

#### Получение лида
```http
GET /api/v1/leads/{id}
Authorization: Bearer {API_KEY}
```

### 3. Настройте права доступа API

Убедитесь, что API ключ имеет права на:
- Чтение лидов
- Создание лидов
- Обновление лидов
- Создание задач
- Чтение контактов

## 🧪 Тестирование интеграции

### 1. Проверка health endpoint

```bash
curl http://localhost:3000/health
```

### 2. Тест поиска лида

```bash
curl -X POST http://localhost:3000/rest/1/dp_crm_proxy/crm.lead.list \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": [
      {"name": "filter[PHONE]", "value": "+79991234567"},
      {"name": "select[]", "value": "ID"},
      {"name": "select[]", "value": "TITLE"}
    ]
  }'
```

### 3. Тест создания лида

```bash
curl -X POST http://localhost:3000/rest/1/dp_crm_proxy/crm.lead.add \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": [
      {
        "name": "fields",
        "value": "{\"TITLE\":\"Test Gaming Club\",\"PHONE\":[{\"VALUE\":\"+79991234567\",\"VALUE_TYPE\":\"WORK\"}],\"UF_CRM_TELEGRAM\":\"@test_club\"}"
      }
    ]
  }'
```

## 📊 Мониторинг и отладка

### Включение подробного логирования

В `.env` файле:
```env
DEBUG=true
```

### Просмотр логов

Логи покажут:
- Входящие запросы от n8n
- Преобразование формата данных
- Исходящие запросы к DP_CRM
- Ответы и ошибки

Пример лога:
```
[DP_CRM] Making request to http://localhost:8000/api/v1/leads/search
Incoming request: crm.lead.list
Translating crm.lead.list with params: [...]
```

## 🚨 Решение проблем

### Ошибка аутентификации

Если получаете ошибку 401:
1. Проверьте правильность API ключа в `.env`
2. Убедитесь, что ключ активен в DP_CRM
3. Проверьте формат заголовка Authorization

### Ошибка "Field not found"

Если DP_CRM возвращает ошибку о несуществующем поле:
1. Создайте необходимые кастомные поля в DP_CRM
2. Проверьте правильность маппинга в `dp-crm-adapter.js`

### Неправильный формат данных

Если данные не сохраняются корректно:
1. Включите DEBUG режим
2. Проверьте логи преобразования данных
3. Убедитесь, что формат соответствует ожиданиям DP_CRM

## 📈 Оптимизация производительности

### 1. Кеширование

Для production добавьте Redis:
```env
REDIS_URL=redis://localhost:6379
CACHE_TTL=300
```

### 2. Пулы соединений

Настройте connection pooling для больших нагрузок.

### 3. Rate limiting

Добавьте ограничения на количество запросов:
```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔐 Безопасность

### Production checklist

- [ ] Используйте HTTPS для всех соединений
- [ ] Добавьте аутентификацию к прокси-серверу
- [ ] Ограничьте доступ по IP
- [ ] Настройте файрвол
- [ ] Включите логирование всех запросов
- [ ] Регулярно обновляйте зависимости

## 📚 Дополнительные ресурсы

- [Основное руководство по миграции](./CUSTOM_CRM_MIGRATION_GUIDE.md)
- [README CRM адаптера](./crm-adapter/README.md)
- [Документация Dark Project Arena](./README.md)
- [GitHub репозиторий DP_CRM](https://github.com/AlexeyPevz/DP_CRM)