# Переменные окружения для Dark Project Arena

## ⚠️ Важное изменение!

**Конфигурационные переменные (workflow IDs, пути, лимиты) теперь хранятся в Static Data!**

См. [STATIC_DATA_SETUP.md](./STATIC_DATA_SETUP.md) для настройки workflow IDs и других параметров.

## Что осталось в переменных окружения

Только **секретные данные** и **API ключи**:

### 1. API интеграций

```bash
# Yandex Maps API
YANDEX_MAPS_API_KEY=your-yandex-api-key

# 2GIS API  
TWOGIS_API_KEY=your-2gis-api-key

# OpenAI API
OPENAI_API_KEY=sk-your-openai-key
```

### 2. MTProto для Telegram

```bash
# MTProto сервер (см. MTPROTO_SETUP.md)
MTPROTO_API_URL=http://localhost:5000
MTPROTO_API_TOKEN=your-mtproto-token
MTPROTO_WEBHOOK_SECRET=your-webhook-secret

# Telegram App credentials (получить на https://my.telegram.org)
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your-api-hash
TELEGRAM_PHONE=+79991234567
```

### 3. WhatsApp Business API

```bash
# WhatsApp Business
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

### 4. Сервисы хранения

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password  # если установлен

# Qdrant Vector Store
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-key  # если установлен
```

## Настройка в n8n

### Через UI (рекомендуется):
1. Settings → Environment Variables
2. Добавить каждую переменную
3. Сохранить и перезапустить

### Через .env файл:
```bash
# Создать файл .env в корне n8n
cp .env.example .env
# Отредактировать значения
nano .env
```

### Через Docker Compose:
```yaml
services:
  n8n:
    environment:
      - YANDEX_MAPS_API_KEY=${YANDEX_MAPS_API_KEY}
      - TWOGIS_API_KEY=${TWOGIS_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      # ... остальные переменные
```

## Credentials в n8n

Большинство интеграций настраиваются через Credentials в UI n8n:

1. **Bitrix24** → Credentials → New → Bitrix24 API
2. **Redis** → Credentials → New → Redis
3. **OpenAI** → Credentials → New → OpenAI API
4. **SMTP** → Credentials → New → SMTP

## Проверка переменных

После настройки можно проверить в Function node:
```javascript
console.log('API Key exists:', !!$env.OPENAI_API_KEY);
console.log('Workflow ID:', $workflow.staticData.WORKFLOW_IDS.WF_01_WORKFLOW_ID);
```

## Безопасность

- ❌ НЕ коммитьте .env файлы
- ❌ НЕ храните секреты в staticData
- ✅ Используйте credentials для паролей
- ✅ Ограничьте доступ к переменным окружения