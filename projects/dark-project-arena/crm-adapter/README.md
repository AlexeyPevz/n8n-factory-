# CRM Adapter для Dark Project Arena

Адаптер и прокси-сервер для интеграции Dark Project Arena с кастомной CRM вместо Битрикс24.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd crm-adapter
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env`:

```env
# Настройки вашей CRM
CUSTOM_CRM_URL=https://your-crm.com
CUSTOM_CRM_API_KEY=your-api-key-here

# Настройки прокси-сервера
PORT=3000
NODE_ENV=development
DEBUG=true
```

### 3. Запуск сервера

```bash
# Production режим
npm start

# Development режим с автоперезагрузкой
npm run dev
```

### 4. Обновление n8n

В n8n измените переменную окружения:

```env
# Было:
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_webhook_key/

# Стало:
BITRIX24_WEBHOOK_URL=http://localhost:3000/rest/1/fake_webhook/
```

## 📋 Требования к API вашей CRM

Ваша CRM должна предоставлять следующие endpoints:

### Управление лидами

- `POST /api/leads/search` - поиск лидов
- `POST /api/leads/create` - создание лида
- `POST /api/leads/{id}/update` - обновление лида
- `GET /api/leads/{id}` - получение лида

### Управление задачами

- `POST /api/tasks/create` - создание задачи

## 🔧 Архитектура

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│     n8n     │────▶│ Proxy Server │────▶│ Custom CRM  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ CRM Adapter  │
                    └──────────────┘
```

1. **n8n** отправляет запросы в формате Битрикс24
2. **Proxy Server** принимает запросы и передает их адаптеру
3. **CRM Adapter** транслирует формат Битрикс24 в формат вашей CRM
4. **Custom CRM** обрабатывает запросы и возвращает ответы

## 📝 Примеры запросов

### Поиск лида по телефону

```bash
curl -X POST http://localhost:3000/rest/1/fake_webhook/crm.lead.list \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": [
      {"name": "filter[PHONE]", "value": "+79991234567"},
      {"name": "select[]", "value": "ID"},
      {"name": "select[]", "value": "TITLE"}
    ]
  }'
```

### Создание лида

```bash
curl -X POST http://localhost:3000/rest/1/fake_webhook/crm.lead.add \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": [
      {
        "name": "fields",
        "value": "{\"TITLE\":\"Test Club\",\"PHONE\":[{\"VALUE\":\"+79991234567\",\"VALUE_TYPE\":\"WORK\"}]}"
      }
    ]
  }'
```

## 🛠️ Расширение функционала

### Добавление нового метода

1. Добавьте case в `translateBitrix24Request()` в `crm-adapter.js`:

```javascript
case 'crm.your.method':
  return this.yourMethod(params);
```

2. Реализуйте метод:

```javascript
async yourMethod(bitrixParams) {
  // Парсинг параметров
  // Вызов API вашей CRM
  // Преобразование ответа
}
```

### Добавление нового поля

1. Добавьте маппинг в `mapFieldName()`:

```javascript
'UF_CRM_YOUR_FIELD': 'your_field',
```

2. Обновите методы `mapLeadToB24Format()` и `mapB24LeadToCustomFormat()`

## 🐛 Отладка

Включите режим отладки:

```env
DEBUG=true
```

Логи будут показывать:
- Входящие запросы от n8n
- Параметры после парсинга
- Запросы к вашей CRM
- Ответы и ошибки

## 📊 Мониторинг

Health check endpoint:

```bash
curl http://localhost:3000/health
```

## ⚠️ Важные моменты

1. **Безопасность**: В production используйте HTTPS и добавьте аутентификацию
2. **Производительность**: Добавьте кеширование для частых запросов
3. **Логирование**: Настройте централизованное логирование
4. **Обработка ошибок**: Адаптер возвращает ошибки в формате Битрикс24

## 📚 Дополнительные ресурсы

- [Основное руководство по миграции](../CUSTOM_CRM_MIGRATION_GUIDE.md)
- [Документация проекта](../README.md)
- [Документация Битрикс24 API](https://dev.1c-bitrix.ru/rest_help/)