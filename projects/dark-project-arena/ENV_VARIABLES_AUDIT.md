# 📊 Отчет о несоответствиях в документации переменных окружения
## Dark Project Arena

Дата: 10 января 2025 г.

---

## 🔍 Основные выводы

После анализа проекта Dark Project Arena были выявлены следующие проблемы и несоответствия в документации по переменным окружения:

### 1. ❌ Отсутствует файл .env.example

- В документации `ENV_SETUP_GUIDE_FOR_BEGINNERS.md` упоминается файл `.env.example` как шаблон (строки 27-34)
- В `DOCUMENTATION_STRUCTURE.md` указано, что файл актуален (строка 68)
- **Факт**: Файл `.env.example` отсутствует в репозитории

### 2. 📦 Отсутствует документация по настройке Redis и Qdrant

В руководстве для начинающих (`ENV_SETUP_GUIDE_FOR_BEGINNERS.md`) полностью отсутствуют разделы по настройке:

#### Redis:
- Используется во всех workflow для кеширования
- Требуются переменные:
  - `REDIS_HOST` (по умолчанию используется `redis` или `localhost`)
  - `REDIS_PORT` (по умолчанию 6379)
  - `REDIS_CACHE_TTL` (используется в workflow, по умолчанию 86400)
  - Credentials `REDIS_INTERNAL` используются в workflow

#### Qdrant:
- Используется для векторной базы знаний в WF-04 (AI агент)
- Требуются переменные:
  - `QDRANT_HOST` 
  - `QDRANT_PORT` (по умолчанию 6333)
  - `QDRANT_API_KEY` (если настроена аутентификация)
  - Коллекция `dark_project_kb` должна быть создана
  - Credentials `QDRANT_API` используются в workflow

### 3. 🔐 Дополнительные недокументированные переменные

В workflow файлах используются следующие переменные, которые не упомянуты в руководстве:

- `WORK_HOURS_START` (по умолчанию 9)
- `WORK_HOURS_END` (по умолчанию 18)
- `WORK_DAYS_START` (по умолчанию 1 - понедельник)
- `WORK_DAYS_END` (по умолчанию 5 - пятница)
- `REDIS_CACHE_TTL` (время жизни кеша в секундах)
- `N8N_WEBHOOK_URL` (упоминается в `MTPROTO_SETUP.md`)

### 4. 📝 Неполная информация о MTProto

В разделе про MTProto (строки 175-197) упоминается необходимость настройки сервера, но:
- Нет инструкций по запуску MTProto сервера
- Не указано, что нужно также настроить `TELEGRAM_PHONE`
- Отдельный файл `MTPROTO_SETUP.md` содержит больше деталей, но не упомянут в основном руководстве

### 5. 🐳 Docker Compose конфигурация

- Файл `docker-compose.example.yml` содержит настройки для Redis и Qdrant
- Эта информация не отражена в основном руководстве по переменным окружения

---

## 📋 Рекомендации

### 1. Создать файл .env.example

Необходимо создать файл со всеми используемыми переменными:

```bash
# ===== WORKFLOW IDs =====
WF_01_WORKFLOW_ID=
WF_02_WORKFLOW_ID=
WF_03_WORKFLOW_ID=
WF_04_WORKFLOW_ID=
WF_05_WORKFLOW_ID=
WF_06_WORKFLOW_ID=

# ===== GOOGLE SHEETS =====
GOOGLE_SHEET_ID=

# ===== TELEGRAM =====
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_SALES_CHAT_ID=
TELEGRAM_SUPPLIER_CHAT_ID=

# ===== BITRIX24 =====
BITRIX24_WEBHOOK_URL=
SALES_MANAGER_ID=
ACCOUNT_MANAGER_ID=

# ===== API KEYS =====
YANDEX_MAPS_API_KEY=
TWOGIS_API_KEY=
OPENAI_API_KEY=

# ===== EMAIL =====
SUPPLIER_EMAIL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# ===== TELEGRAM MTPROTO =====
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_PHONE=
MTPROTO_API_URL=
MTPROTO_API_TOKEN=

# ===== REDIS =====
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_CACHE_TTL=86400

# ===== QDRANT =====
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_API_KEY=

# ===== BUSINESS HOURS =====
WORK_HOURS_START=9
WORK_HOURS_END=18
WORK_DAYS_START=1
WORK_DAYS_END=5

# ===== OTHER =====
N8N_WEBHOOK_URL=
```

### 2. Добавить раздел в руководство

В файл `ENV_SETUP_GUIDE_FOR_BEGINNERS.md` после блока 9 добавить:

#### Блок 10: Redis (кеширование и очереди)

Для Docker установки:
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_CACHE_TTL=86400  # Время жизни кеша в секундах (24 часа)
```

Для локальной установки:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_CACHE_TTL=86400
```

#### Блок 11: Qdrant (векторная база для AI агента)

Для Docker установки:
```bash
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_API_KEY=  # Оставьте пустым, если не настроена аутентификация
```

Для локальной установки:
```bash
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=
```

**Важно**: После установки Qdrant необходимо создать коллекцию `dark_project_kb` и загрузить базу знаний!

#### Блок 12: Рабочее время (опционально)

Настройте рабочие часы для автоматических обзвонов:
```bash
WORK_HOURS_START=9    # Начало рабочего дня (9:00 МСК)
WORK_HOURS_END=18     # Конец рабочего дня (18:00 МСК)
WORK_DAYS_START=1     # Понедельник
WORK_DAYS_END=5       # Пятница
```

### 3. Обновить чек-лист

В раздел "✅ Чек-лист: Всё ли готово?" добавить:
- [ ] Redis запущен и доступен
- [ ] Qdrant запущен и коллекция создана
- [ ] База знаний загружена в Qdrant
- [ ] Рабочие часы настроены (если нужно)

### 4. Добавить ссылки на дополнительную документацию

В начало руководства добавить:
- Для настройки MTProto см. [MTPROTO_SETUP.md](./MTPROTO_SETUP.md)
- Для Docker установки см. [docker-compose.example.yml](./docker-compose.example.yml)

---

## 🚨 Критические проблемы

1. **Без настройки Redis и Qdrant система не будет работать корректно**
2. **AI агент (WF-04) не сможет функционировать без настроенного Qdrant**
3. **Отсутствие .env.example усложняет начальную настройку**

---

## ✅ Что сделано хорошо

1. Подробное объяснение "для пятиклассника" основных переменных
2. Пошаговые инструкции с примерами
3. Раздел с частыми ошибками
4. Важные предупреждения о безопасности

---

Рекомендуется срочно обновить документацию и создать недостающие файлы для улучшения опыта новых пользователей системы.