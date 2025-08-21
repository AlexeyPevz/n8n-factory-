# Переменные окружения для Dark Project Arena

## Обязательные переменные

### Workflow IDs
- `WF_01_WORKFLOW_ID` - ID workflow для WF-01-Fetch-Gaming-Clubs
- `WF_02_WORKFLOW_ID` - ID workflow для WF-02-Enrich-Contact-Info  
- `WF_03_WORKFLOW_ID` - ID workflow для WF-03-Upsert-CRM

### API Credentials
- `YANDEX_MAPS_API` - API ключ для Yandex Maps
- `TWOGIS_API` - API ключ для 2GIS
- `BITRIX24_CRM` - OAuth2 токен для Bitrix24
- `BITRIX24_WEBHOOK_SECRET` - Секретный ключ для webhook Bitrix24
- `LLM_KEY` - API ключ для OpenAI/Ollama
- `TG_ROP_BOT` - Токен Telegram бота
- `TELEGRAM_ADMIN_CHAT_ID` - ID чата админа в Telegram

### Redis
- `REDIS_INTERNAL` - Строка подключения к Redis (по умолчанию: redis://localhost:6379)

### Опциональные переменные
- `GEO_TARGETS_CSV_PATH` - Путь к файлу с городами (по умолчанию: /workspace/projects/dark-project-arena/data/geo_targets.csv)
- `N8N_WEBHOOK_SECRET` - Секретный заголовок для webhook авторизации

## Пример .env файла

```bash
# Workflow IDs (получить после импорта workflow в n8n)
WF_01_WORKFLOW_ID=1
WF_02_WORKFLOW_ID=2
WF_03_WORKFLOW_ID=3

# API Keys
YANDEX_MAPS_API=your_yandex_api_key
TWOGIS_API=your_2gis_api_key
BITRIX24_WEBHOOK_SECRET=your_secret_key
LLM_KEY=your_openai_key

# Telegram
TG_ROP_BOT=your_telegram_bot_token
TELEGRAM_ADMIN_CHAT_ID=-1001234567890

# Redis
REDIS_INTERNAL=redis://localhost:6379

# Paths
GEO_TARGETS_CSV_PATH=/workspace/projects/dark-project-arena/data/geo_targets.csv

# Security
N8N_WEBHOOK_SECRET=your_webhook_secret
```

## Настройка Bitrix24 Custom Fields

Перед запуском проекта необходимо создать следующие пользовательские поля в Bitrix24:

1. `UF_CRM_TELEGRAM` - строка, Telegram контакт
2. `UF_CRM_VK` - строка, VK страница
3. `UF_CRM_INSTAGRAM` - строка, Instagram профиль
4. `UF_CRM_WEBSITE` - строка, сайт компании
5. `UF_CRM_IS_CHAIN` - да/нет, является ли сетью
6. `UF_CRM_BRAND` - строка, название бренда
7. `UF_CRM_BRANCH_COUNT` - число, количество филиалов
8. `UF_CRM_COORDINATES` - строка, координаты (lat,lon)
9. `UF_CRM_PRIORITY` - список (high, medium, low)
10. `UF_CRM_RELEVANCE_SCORE` - число (1-10)
11. `UF_CRM_ESTIMATED_PCS` - число, примерное количество ПК
12. `UF_CRM_WORKING_HOURS` - строка, рабочие часы
13. `UF_CRM_ENRICHED_AT` - дата/время, когда обогащены данные
14. `UF_CRM_LEAD_SCORE` - число, скоринг лида