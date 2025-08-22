# ✅ Чек-лист настройки Dark Project Arena

Пошаговая инструкция с конкретными примерами для быстрого запуска системы.

## 📋 Предварительные требования

- [ ] n8n версия 1.x или выше установлен
- [ ] Docker и Docker Compose установлены
- [ ] Есть аккаунт Google для Google Sheets
- [ ] Есть аккаунт Bitrix24 с API доступом
- [ ] Есть Telegram аккаунт для MTProto

## 🚀 Шаг 1: Инфраструктура

### 1.1 Запустите базовые сервисы

```bash
# Создайте файл docker-compose.yml
cat > docker-compose.yml << 'EOF'
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

# Запустите
docker-compose up -d
```

✅ **Проверка**: 
- Redis: `redis-cli ping` должен вернуть `PONG`
- Qdrant: откройте http://localhost:6333/dashboard

## 🗂️ Шаг 2: Google Sheets

### 2.1 Создайте таблицу

1. Откройте https://sheets.new
2. Назовите: "Dark Project Arena - Управление"
3. Скопируйте ID из URL: `https://docs.google.com/spreadsheets/d/[ВОТ_ЭТОТ_ID]/edit`

**Пример ID**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2.2 Создайте листы и заголовки

**Лист "Города"** - скопируйте эти заголовки в первую строку:
```
Город | Регион | Приоритет | Население | ID 2GIS | Широта | Долгота | Последний поиск | Активен
```

**Лист "Исключения"**:
```
Название клуба | Тип | Город | Тип исключения | Причина | Действует до | Каналы | Добавил | Дата добавления | Статус | Примечания
```

**Лист "Конфигурация"**:
```
Параметр | Значение | Описание
```

**Лист "Журнал"**:
```
Дата/Время | Действие | Объект | Детали | Пользователь | Workflow
```

### 2.3 Заполните тестовые данные

**В лист "Города" добавьте:**
```
Москва | Московская область | Высокий | 12000000 | 4504222397706808 | 55.7558 | 37.6173 | | ДА
Санкт-Петербург | Ленинградская область | Высокий | 5300000 | | 59.9311 | 30.3609 | | ДА
```

**В лист "Конфигурация":**
```
RATE_LIMIT_SECONDS | 2 | Задержка между сообщениями
WORK_HOURS_START | 9 | Начало рабочего дня
WORK_HOURS_END | 18 | Конец рабочего дня
```

## 🔐 Шаг 3: Service Account для Google

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. APIs & Services → Enable APIs → включите Google Sheets API
4. Credentials → Create Credentials → Service Account:
   - Имя: `n8n-darkproject`
   - Роль: Editor
5. Создайте ключ (JSON) и скачайте файл
6. В Google Sheets: Поделиться → добавьте email service account (из JSON файла)

## 🔧 Шаг 4: n8n настройка

### 4.1 Credentials в n8n

1. **Google Sheets (Service Account)**:
   - Type: Google Sheets API
   - Service Account Email: из JSON файла
   - Private Key: из JSON файла

2. **Redis**:
   - Host: `localhost` (или `redis` если n8n в Docker)
   - Port: `6379`

3. **Telegram Bot** (для уведомлений):
   - Создайте бота через @BotFather
   - Получите token
   - Узнайте ваш chat ID через @userinfobot

### 4.2 Импорт workflow

Импортируйте в следующем порядке:
1. `20250109_wf-00-orchestrator_v008.json` (новая версия!)
2. `20250109_wf-01-fetch-gaming-clubs_v005.json`
3. `20250109_wf-02-enrich-contact-info_v004.json`
4. `20250109_wf-03-upsert-crm_v002.json`
5. `20250109_wf-04-sales-nurture-agent_v006.json`
6. `20250109_wf-05-hot-lead-handoff_v001.json`
7. `20250109_wf-06-post-sale-followup_v002.json`
8. `google-sheets-sync.json` (синхронизация с Google Sheets)

### 4.3 Запишите ID workflow

После импорта каждого workflow:
1. Откройте workflow
2. Скопируйте ID из URL: `http://localhost:5678/workflow/[ВОТ_ЭТОТ_ID]`
3. Запишите в таблицу:

| Workflow | ID (пример) |
|----------|-------------|
| WF-00 | w8K3Rf2N |
| WF-01 | x9L4Sg3P |
| WF-02 | y0M5Th4Q |
| WF-03 | z1N6Ui5R |
| WF-04 | a2O7Vj6S |
| WF-05 | b3P8Wk7T |
| WF-06 | c4Q9Xl8U |

## 📝 Шаг 5: Настройка переменных окружения

### Создайте файл .env в папке n8n:
```bash
# Workflow IDs (берутся из URL после импорта)
WF_01_WORKFLOW_ID=x9L4Sg3P
WF_02_WORKFLOW_ID=y0M5Th4Q
WF_03_WORKFLOW_ID=z1N6Ui5R
WF_04_WORKFLOW_ID=a2O7Vj6S
WF_05_WORKFLOW_ID=b3P8Wk7T
WF_06_WORKFLOW_ID=c4Q9Xl8U

# Google Sheets
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Telegram
TELEGRAM_ADMIN_CHAT_ID=-1001234567890

# API Keys (добавьте свои)
YANDEX_MAPS_API_KEY=your_key_here
TWOGIS_API_KEY=your_key_here
# ... остальные ключи из ENVIRONMENT_VARIABLES.md
```

### Перезапустите n8n:
```bash
# Если используете Docker
docker-compose restart n8n

# Если используете npm
# Ctrl+C для остановки, затем снова запустите
n8n start
```

## 🏢 Шаг 6: Bitrix24 настройка

### 6.1 Создайте поля в Bitrix24

CRM → Настройки → Пользовательские поля → Лиды:

| Код поля | Название | Тип |
|----------|----------|-----|
| UF_CRM_TELEGRAM_ID | Telegram ID | Строка |
| UF_CRM_WHATSAPP | WhatsApp | Строка |
| UF_CRM_PREFERRED_CHANNEL | Предпочитаемый канал | Список |
| UF_CRM_DIALOG_HISTORY | История диалога | Текст |
| UF_CRM_LAST_CONTACT | Последний контакт | Дата/время |
| UF_CRM_CONTACT_COUNT | Количество контактов | Число |
| UF_CRM_IS_CHAIN | Сеть клубов | Да/Нет |
| UF_CRM_ESTIMATED_PCS | Примерное кол-во ПК | Число |
| UF_CRM_PRIORITY | Приоритет | Список (P0,P1,P2,P3) |

### 6.2 Webhook для входящих

1. Приложения → Вебхуки → Добавить вебхук входящий
2. Права: CRM (crm)
3. Скопируйте URL вида: `https://ваш-домен.bitrix24.ru/rest/1/ключ/`

## 🧪 Шаг 7: Тестирование

### 7.1 Тест Google Sheets синхронизации

1. Запустите "Google Sheets Sync" вручную
2. Проверьте Redis: должен появиться ключ `darkproject:sheets:data`
3. В логах должно быть: "Синхронизация данных завершена"

### 7.2 Тест оркестратора

1. Запустите WF-00 вручную
2. Должен прочитать города из Google Sheets
3. Запустить WF-01 для первого города
4. Отправить уведомление в Telegram

### 7.3 Тест поиска клубов

1. Запустите WF-01 вручную с параметром:
```json
{
  "city": "Москва",
  "region": "Московская область"
}
```
2. Должен найти клубы через Yandex/2GIS

## ✅ Финальная проверка

- [ ] Redis работает и доступен
- [ ] Google Sheets содержит все листы с данными
- [ ] Service Account имеет доступ к таблице
- [ ] Все workflow импортированы
- [ ] Static Data заполнена реальными ID
- [ ] Credentials настроены и проверены
- [ ] Тестовый запуск прошел успешно

## 🚨 Частые проблемы

### "Cannot read Google Sheet"
- Проверьте, что добавили service account email в доступы к таблице
- Проверьте ID таблицы в Static Data

### "Workflow not found"
- Проверьте ID workflow в Static Data
- Убедитесь, что workflow сохранен и активен

### "Redis connection failed"
- Проверьте, что Redis запущен: `docker ps`
- Если n8n в Docker, используйте host: `redis` вместо `localhost`

### "Telegram notification failed"
- Проверьте token бота
- Проверьте chat ID (должен начинаться с `-` для групп)

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи n8n
2. Проверьте этот чек-лист еще раз
3. Посмотрите в `AUDIT_REPORT.md` известные проблемы

Успешной настройки! 🚀