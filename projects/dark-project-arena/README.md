
# Dark Project Arena - AI-powered Sales Automation

Полностью автоматизированная система поиска, привлечения и ведения клиентов компьютерных клубов с использованием AI Agent.

### 🆕 Последние обновления (v2.2.0)
- ✅ Исправлен AI Agent - теперь использует Tools Agent (conversationalAgent устарел)
- ✅ Обновлены все параметры согласно документации n8n
- ✅ Проведен полный аудит - система готова к production
- ✅ Удалены промежуточные версии файлов

## 🎯 Бизнес-цель

Автоматизация полного цикла продаж игровой периферии Dark Project для компьютерных клубов:
- **50-100 новых лидов** в день
- **Конверсия 5-10%** в горячие лиды
- **Работа 24/7** без участия человека (отправка в рабочее время)
- **ROI 300-500%** за счет автоматизации

## 🏗️ Архитектура системы

### Workflow структура:

```
WF-00 Orchestrator (запуск в 2:00)
  ├── WF-01 Fetch Gaming Clubs (поиск клубов)
  │     └── WF-02 Enrich Contact Info (обогащение)
  │           └── WF-03 Upsert CRM (создание лидов)
  │
  └── WF-04 Sales Nurture Agent (AI продажи)
        ├── Инициация контакта (каждые 30 мин, 9:00-18:00)
        ├── Ведение диалога (AI Agent с GPT-4)
        └── WF-05 Hot Lead Handoff (передача менеджеру)
              └── WF-06 Post-Sale Followup (отзывы)
```

### Технологический стек:

| Компонент | Технология | Назначение |
|-----------|------------|------------|
| **Оркестрация** | n8n | Workflow automation |
| **Поиск клубов** | Yandex Maps + 2GIS API | Сбор данных о клубах |
| **CRM** | Bitrix24 | Управление лидами |
| **AI Agent** | GPT-4 + Qdrant RAG | Ведение диалогов |
| **Коммуникации** | MTProto (Telegram) + WhatsApp + Email | Мультиканальность |
| **Хранение** | Redis + Qdrant | Состояния и база знаний |

## 🚀 Ключевые возможности

### 1. Автоматический поиск лидов
- Поиск по городам из Google Sheets
- Интеграция с Yandex Maps и 2GIS
- Дедупликация по телефону

### 2. AI Sales Agent "РОП 20Y"
- **Персона**: Александр, 20 лет опыта в продажах
- **Методология**: SPIN-selling
- **3 стратегии** первого контакта (мягкий/проблемный/прямой)
- **9 типов** классификации намерений
- **Fallback** на GPT-3.5 при ошибках

### 3. Мультиканальность
- Приоритет: Telegram → WhatsApp → Email
- Автоматическая смена контакта по запросу
- Userbot для естественного общения

### 4. Соблюдение этики
- Отправка только в рабочее время (9:00-18:00 пн-пт)
- Rate limiting (2 сек между сообщениями)
- Мягкий первый подход

## 📁 Структура проекта

```
/workflows/              # n8n workflow файлы (JSON)
  ├── *_v00X.json       # Версионированные workflow
/knowledge-base/        # База знаний для AI
  └── products.md       # Информация о продукции
Google Sheets            # Внешнее управление данными
  ├── Города            # Список городов для поиска
  ├── Исключения        # Клиенты, партнеры, конкуренты  
  └── Конфигурация      # Настройки системы
```

## 📚 Документация

### 🆕 Начните отсюда:
1. [ENV_SETUP_GUIDE_FOR_BEGINNERS.md](./ENV_SETUP_GUIDE_FOR_BEGINNERS.md) - Подробная инструкция по настройке переменных (для новичков)
2. [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Чек-лист быстрого старта с примерами команд
3. [DOCUMENTATION_STRUCTURE.md](./DOCUMENTATION_STRUCTURE.md) - Карта документации проекта

### 🔧 Настройка интеграций:
- [GOOGLE_SHEETS_SETUP_GUIDE.md](./GOOGLE_SHEETS_SETUP_GUIDE.md) - Централизованное управление через Google Sheets
- [BITRIX24_HTTP_GUIDE.md](./BITRIX24_HTTP_GUIDE.md) - Интеграция с Bitrix24 CRM
- [MTPROTO_SETUP.md](./MTPROTO_SETUP.md) - Настройка Telegram userbot для отправки сообщений

### 📖 Техническая документация:
- [WF-04-AGENT-DOCUMENTATION.md](./WF-04-AGENT-DOCUMENTATION.md) - Архитектура и логика AI агента
- [LEAD_PRIORITIZATION_STRATEGY.md](./LEAD_PRIORITIZATION_STRATEGY.md) - Стратегия приоритизации лидов
- [SOCIAL_MEDIA_SEARCH_STRATEGY.md](./SOCIAL_MEDIA_SEARCH_STRATEGY.md) - Поиск клиентов в соцсетях

## ⚡ Быстрый старт

### 1. Подготовка инфраструктуры

```bash
# Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# Qdrant
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant

# MTProto (см. MTPROTO_SETUP.md)
docker-compose up -d mtproto
```

### 2. Настройка n8n

1. Установите community nodes:
   ```bash
   npm install @n8n/n8n-nodes-langchain
   ```

2. Импортируйте workflow (последние версии):
   - `20250109_wf-00-orchestrator_v009.json`
   - `20250109_wf-01-fetch-gaming-clubs_v005.json`
   - `20250109_wf-02-enrich-contact-info_v004.json`
   - `20250109_wf-03-upsert-crm_v003.json` *(HTTP Request вместо Bitrix24)*
   - `20250109_wf-04-sales-nurture-agent_v007.json` *(HTTP Request вместо Bitrix24)*
   - `20250109_wf-05-hot-lead-handoff_v002.json` *(HTTP Request вместо Bitrix24)*
   - `20250109_wf-06-post-sale-followup_v003.json` *(HTTP Request вместо Bitrix24)*
   - `google-sheets-sync.json`

3. Настройте переменные окружения:
   - Скопируйте ID workflow из URL после импорта
   - Добавьте в `.env` файл все ID (см. ENV_SETUP_GUIDE_FOR_BEGINNERS.md)
   - Перезапустите n8n

4. Настройте credentials:
   - Bitrix24 API
   - Yandex Maps API
   - 2GIS API
   - OpenAI API
   - Redis
   - Qdrant
   - SMTP

### 3. Запуск

1. Активируйте WF-00 (главный оркестратор)
2. Активируйте WF-04 (AI Agent)
3. Проверьте создание лидов в Bitrix24
4. Мониторьте диалоги в Telegram

## 🔍 Мониторинг

- **Ошибки**: сохраняются в Redis с TTL 24ч
- **Уведомления**: в Telegram админу
- **Метрики**: в Bitrix24 отчетах

## ⚠️ Важные моменты

1. **Лимиты API**:
   - Yandex Maps: 25,000 запросов/день
   - 2GIS: зависит от тарифа
   - OpenAI: следите за токенами

2. **Telegram лимиты**:
   - 30 сообщений/мин новым контактам
   - Используйте задержки между отправками

3. **Bitrix24 поля** (создать вручную):
   ```
   UF_CRM_TELEGRAM_ID
   UF_CRM_WHATSAPP
   UF_CRM_PREFERRED_CHANNEL
   UF_CRM_DIALOG_HISTORY
   UF_CRM_LAST_CONTACT
   UF_CRM_CONTACT_COUNT
   UF_CRM_IS_CHAIN
   UF_CRM_ESTIMATED_PCS
   ```

## 📈 Ожидаемые результаты

При правильной настройке:
- **Новые лиды**: 50-100 в день
- **Ответы на КП**: 30-40%
- **Горячие лиды**: 5-10 в день
- **Конверсия в продажи**: 1-3%

## 🤝 Поддержка

При возникновении проблем проверьте:
1. Логи в n8n Executions
2. Ошибки в Redis (`errors:*`)
3. Статусы лидов в Bitrix24
4. Документацию по конкретному workflow

---

**Dark Project Arena** © 2025 | Автоматизация продаж нового уровня