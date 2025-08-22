# Настройка переменных через Static Data

## Что такое Static Data в n8n?

Static Data - это встроенное хранилище переменных в каждом workflow. Позволяет хранить конфигурацию прямо в workflow без использования переменных окружения.

## Преимущества:

1. **Портативность** - переменные переносятся вместе с workflow
2. **Удобство** - можно менять прямо в UI n8n
3. **Изоляция** - каждый workflow имеет свои переменные

## Как использовать:

### 1. В коде workflow (уже добавлено в WF-00):

```javascript
// Вместо:
$env.WF_01_WORKFLOW_ID

// Используем:
$workflow.staticData.WORKFLOW_IDS.WF_01_WORKFLOW_ID
```

### 2. После импорта в n8n:

1. Откройте workflow в редакторе
2. Нажмите на меню workflow (три точки)
3. Выберите "Settings"
4. Перейдите на вкладку "Static Data"
5. Отредактируйте значения PLACEHOLDER на реальные

### 3. Переменные в Static Data:

```json
{
  "WORKFLOW_IDS": {
    "WF_01_WORKFLOW_ID": "PLACEHOLDER_WF01_ID",  // Заменить на реальный ID
    "WF_02_WORKFLOW_ID": "PLACEHOLDER_WF02_ID",  // после импорта
    "WF_03_WORKFLOW_ID": "PLACEHOLDER_WF03_ID",
    "WF_04_WORKFLOW_ID": "PLACEHOLDER_WF04_ID",
    "WF_05_WORKFLOW_ID": "PLACEHOLDER_WF05_ID",
    "WF_06_WORKFLOW_ID": "PLACEHOLDER_WF06_ID"
  },
  "TELEGRAM_ADMIN_CHAT_ID": "-1001234567890",  // Заменить на ваш chat ID
  "GEO_TARGETS_CSV_PATH": "./data/geo_targets.csv",
  "RATE_LIMITS": {
    "MESSAGES_PER_MINUTE": 30,
    "DELAY_BETWEEN_MESSAGES": 2,
    "MAX_RETRIES": 3
  },
  "BUSINESS_HOURS": {
    "START_HOUR": 9,
    "END_HOUR": 18,
    "TIMEZONE": "Europe/Moscow",
    "WORKING_DAYS": [1, 2, 3, 4, 5]
  }
}
```

## Что все еще нужно в переменных окружения:

Секреты и API ключи НЕ должны храниться в staticData:

```bash
# API Keys (через env или credentials)
YANDEX_MAPS_API_KEY=xxx
TWOGIS_API_KEY=xxx
OPENAI_API_KEY=xxx
BITRIX24_WEBHOOK_URL=xxx

# MTProto settings
MTPROTO_API_URL=http://localhost:5000
MTPROTO_API_TOKEN=xxx
MTPROTO_WEBHOOK_SECRET=xxx
```

## Приоритет использования:

1. **Credentials** - для секретов и паролей
2. **Static Data** - для конфигурации workflow
3. **Environment Variables** - для системных настроек

## Пример обновления после импорта:

1. Импортируйте все workflow в n8n
2. Запишите их ID (видны в URL при редактировании)
3. Откройте WF-00
4. Settings → Static Data
5. Замените все PLACEHOLDER_WF0X_ID на реальные ID
6. Сохраните

Теперь все workflow будут использовать правильные ID без необходимости настройки переменных окружения!