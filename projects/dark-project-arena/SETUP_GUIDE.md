# Руководство по развертыванию Dark Project Arena

Пошаговая инструкция по запуску системы автоматизации продаж.

## 📋 Требования

- **n8n** версия 1.x или выше
- **Docker** и Docker Compose
- **Bitrix24** аккаунт с API доступом
- **API ключи**: Yandex Maps, 2GIS, OpenAI
- **Telegram** аккаунт для MTProto

## 🚀 Шаг 1: Подготовка инфраструктуры

### 1.1 Запуск базовых сервисов

```bash
# Создайте docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  redis_data:
  qdrant_data:
EOF

# Запустите сервисы
docker-compose up -d
```

### 1.2 Настройка MTProto (Telegram userbot)

Следуйте инструкции в [MTPROTO_SETUP.md](./MTPROTO_SETUP.md).

Краткая версия:
1. Получите API credentials на https://my.telegram.org
2. Запустите MTProto bridge (выберите один из вариантов в документации)
3. Проверьте доступность на http://localhost:5000

## 🔧 Шаг 2: Настройка n8n

### 2.1 Установка n8n

```bash
# Вариант 1: npm
npm install -g n8n

# Вариант 2: Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2.2 Установка community nodes

```bash
# В директории n8n
cd ~/.n8n
npm install @n8n/n8n-nodes-langchain
```

### 2.3 Настройка переменных окружения

Создайте `.env` файл (см. [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)):

```bash
# API Keys
YANDEX_MAPS_API_KEY=your-key
TWOGIS_API_KEY=your-key
OPENAI_API_KEY=sk-your-key

# MTProto
MTPROTO_API_URL=http://localhost:5000
MTPROTO_API_TOKEN=your-token
```

## 📥 Шаг 3: Импорт workflow

### 3.1 Откройте n8n

Перейдите на http://localhost:5678

### 3.2 Импортируйте workflow в порядке:

1. `20250109_wf-00-orchestrator_v008.json`
2. `20250109_wf-01-fetch-gaming-clubs_v005.json`
3. `20250109_wf-02-enrich-contact-info_v004.json`
4. `20250109_wf-03-upsert-crm_v002.json`
5. `20250109_wf-04-sales-nurture-agent_v006.json`
6. `20250109_wf-05-hot-lead-handoff_v001.json`
7. `20250109_wf-06-post-sale-followup_v002.json`

### 3.3 Запишите ID workflow

После импорта каждого workflow запишите его ID (виден в URL).

## ⚙️ Шаг 4: Настройка Static Data

### 4.1 Откройте WF-00

1. Кликните на workflow WF-00
2. Меню (три точки) → Settings → Static Data

### 4.2 Обновите значения

Замените все значения на реальные ID:

```json
{
  "WORKFLOW_IDS": {
    "WF_01_WORKFLOW_ID": "123",  // <- Ваш реальный ID
    "WF_02_WORKFLOW_ID": "124",  // <- Ваш реальный ID
    "WF_03_WORKFLOW_ID": "125",  // <- И так далее
    "WF_04_WORKFLOW_ID": "126",
    "WF_05_WORKFLOW_ID": "127",
    "WF_06_WORKFLOW_ID": "128"
  },
  "TELEGRAM_ADMIN_CHAT_ID": "-1001234567890",  // <- Ваш chat ID
  "GOOGLE_SHEET_ID": "1234567890abcdef"  // <- ID вашей Google таблицы
}
```

## 🔑 Шаг 5: Настройка Credentials

В n8n UI создайте credentials:

### 5.1 Bitrix24
1. Credentials → New → Bitrix24 OAuth2 API
2. Заполните Client ID, Client Secret
3. Пройдите OAuth авторизацию

### 5.2 Redis
1. Credentials → New → Redis
2. Host: `redis` (или `localhost`)
3. Port: `6379`

### 5.3 OpenAI
1. Credentials → New → OpenAI API
2. API Key: `sk-your-key`

### 5.4 Остальные
- **Yandex Maps**: HTTP Header Auth
- **2GIS**: HTTP Query Auth
- **SMTP**: для email отправки

## 🏢 Шаг 6: Настройка Bitrix24

### 6.1 Создайте пользовательские поля

В Bitrix24 → CRM → Настройки → Пользовательские поля → Лиды:

```
UF_CRM_TELEGRAM_ID        (строка)
UF_CRM_WHATSAPP          (строка)
UF_CRM_PREFERRED_CHANNEL (список: telegram, whatsapp, email)
UF_CRM_DIALOG_HISTORY    (текст)
UF_CRM_LAST_CONTACT      (дата/время)
UF_CRM_CONTACT_COUNT     (число)
UF_CRM_IS_CHAIN          (да/нет)
UF_CRM_ESTIMATED_PCS     (число)
```

### 6.2 Настройте webhooks

1. Приложения → Вебхуки → Добавить исходящий вебхук
2. События: Создание лида, Изменение лида
3. URL: `https://your-n8n.com/webhook/bitrix24-lead-nurture`

## 🧠 Шаг 7: Подготовка базы знаний

### 7.1 Загрузите документы в Qdrant

```bash
# Используйте скрипт загрузки или API Qdrant
# Коллекция: dark_project_kb
# Документы из /knowledge-base/
```

### 7.2 Проверьте подключение

В n8n создайте тестовый workflow с Qdrant node.

## ✅ Шаг 8: Тестирование

### 8.1 Проверка оркестратора

1. Откройте WF-00
2. Нажмите "Execute Workflow"
3. Проверьте логи выполнения

### 8.2 Тест создания лида

1. Запустите WF-01 вручную
2. Укажите тестовый город
3. Проверьте создание лидов в Bitrix24

### 8.3 Тест AI Agent

1. В Bitrix24 создайте тестовый лид
2. Укажите Telegram username
3. Дождитесь первого сообщения (в течение 30 мин)

## 🚦 Шаг 9: Запуск в продакшн

### 9.1 Активируйте workflow

1. WF-00: Activate (будет запускаться в 2:00)
2. WF-04: Activate (будет проверять новые лиды каждые 30 мин)

### 9.2 Настройте мониторинг

1. Telegram уведомления об ошибках
2. Дашборд в Bitrix24
3. Логи в n8n Executions

## 🐛 Устранение неполадок

### Проблема: Не создаются лиды
- Проверьте API ключи Yandex/2GIS
- Проверьте права доступа Bitrix24
- Смотрите логи WF-01

### Проблема: Не отправляются сообщения
- Проверьте MTProto сервер
- Проверьте рабочее время (9:00-18:00)
- Проверьте rate limits

### Проблема: AI не отвечает правильно
- Проверьте подключение к Qdrant
- Проверьте OpenAI API ключ
- Проверьте базу знаний

## 📊 Метрики успеха

После недели работы вы должны видеть:
- 300+ новых лидов в CRM
- 30-40% открытых диалогов
- 5-10 горячих лидов
- 0 жалоб на спам

## 🎉 Готово!

Система настроена и работает. Следите за метриками и оптимизируйте процессы.

Удачных продаж! 🚀