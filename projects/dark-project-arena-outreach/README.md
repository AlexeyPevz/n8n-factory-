# Dark Project Arena — B2B Outreach Automation (n8n)

## Overview
- Goal: Автоматизировать сбор контактов компьютерных клубов (Яндекс Карты, 2ГИС), обогащение, внесение в Bitrix24, прогрев и сделки, плюс постпродажа.
- Scope (входит): сбор, нормализация, дедупликация, обогащение (site/email/Telegram/владелец), апсерт в CRM, мультиканальные касания (Telegram/email), RAG-бот-РОП, логистика, постпродажа.
- Out of scope (пока): несанкционированный скрапинг в обход ToS, MTProto без отдельного сервиса и оповещенных рисков, полноценная CDP/BI.
- Owner: <заполнить>

## Topology (Workflows)
Храним JSON workflow в `./workflows` по шаблону `YYYYMMDD_<slug>_vNNN.json`.

- wf-01-orchestrator — оркестратор расписаний/запусков
- wf-02-seed-regions — регионы и поисковые запросы
- wf-03-fetch-yandex-maps — сбор из Яндекс Карт (официальные API)
- wf-04-fetch-2gis — сбор из 2ГИС (официальные API)
- wf-05-normalize-dedupe — нормализация и дедупликация
- wf-06-enrich-contacts — обогащение: сайт, email, Telegram, владелец/управляющий
- wf-07-crm-upsert-bitrix24 — апсерт в Bitrix24 (Company/Contact/Lead/Deal)
- wf-08-outreach-orchestrator — сценарии касаний (LLM, A/B)
- wf-09-outreach-delivery — доставка сообщений (Telegram бот или userbot; Email)
- wf-10-conversation-loop — ответы/возражения, обновление CRM, эскалация
- wf-11-logistics-quote — расчёт сроков/логистики (таблица/API)
- wf-12-handoff-to-supplier — передача горячих лидов поставщику
- wf-13-post-sale-followups — D0/7/30/90/180 касания
- wf-14-analytics-reporting — отчётность и оповещения

## How to build it in n8n (пошагово)
1) Создай проектные креды: Yandex Maps, 2ГИС, Bitrix24, Email, Telegram Bot (и/или URL userbot-сервиса), LLM провайдер.
2) Сконфигурируй wf-02: массив регионов и поисковых запросов.
3) Реализуй wf-03 и wf-04: запросы к API, извлечение полей (id, name, address, phones, site), пагинация, лимиты.
4) Собери wf-05: объединение потоков, нормализация, дедупликация.
5) В wf-06 добавь обогащение: парсинг сайта (email/телефон/telegram), поиск в tg-чатах (через userbot API), владельца/управляющего.
6) Подключи wf-07: апсерт в Bitrix24 (Company/Contact → Lead/Deal) с проверкой дублей.
7) Настрой wf-08/09: генерация персонализированных сообщений (LLM+KB) и их отправка через Telegram (бот или userbot) и/или Email.
8) Включи wf-10: входящие ответы (webhook), классификация (вопрос/возражение/КП), автоответы/эскалация, обновление стадий в CRM.
9) Добавь wf-11: расчёт логистики и сроков (из таблицы/JSON или API), запись в CRM и отправка клиенту.
10) Настрой wf-12: критерий «горячий» → уведомления и передача поставщику.
11) Реализуй wf-13: постпродажные касания (0/7/30/90/180), NPS/отзывы/ролики, upsell.
12) Подними wf-14: отчётность, дашборд/шиты, еженедельные рассылки.

## Data Contracts
CompanyRecord (единый агрегат для CRM):
```json
{
  "$id": "company-record.v1",
  "type": "object",
  "required": [
    "sourceIds",
    "clubName",
    "address",
    "city",
    "region",
    "isNetwork",
    "phones"
  ],
  "properties": {
    "sourceIds": {
      "type": "object",
      "properties": {
        "yandex": {"type": ["string", "null"]},
        "twoGis": {"type": ["string", "null"]}
      }
    },
    "clubName": {"type": "string"},
    "address": {"type": "string"},
    "city": {"type": "string"},
    "region": {"type": "string"},
    "isNetwork": {"type": "boolean"},
    "website": {"type": ["string", "null"]},
    "phones": {"type": "array", "items": {"type": "string"}},
    "emails": {"type": "array", "items": {"type": "string"}},
    "telegramHandles": {"type": "array", "items": {"type": "string"}},
    "ownerOrManager": {
      "type": "object",
      "properties": {
        "fullName": {"type": ["string", "null"]},
        "role": {"type": ["string", "null"]},
        "phone": {"type": ["string", "null"]},
        "email": {"type": ["string", "null"]},
        "telegram": {"type": ["string", "null"]}
      }
    },
    "tags": {"type": "array", "items": {"type": "string"}},
    "notes": {"type": ["string", "null"]}
  }
}
```

OutreachMessage (единица касания):
```json
{
  "$id": "outreach-message.v1",
  "type": "object",
  "required": ["channel", "text"],
  "properties": {
    "channel": {"type": "string", "enum": ["telegram", "email"]},
    "text": {"type": "string"},
    "attachments": {"type": "array", "items": {"type": "string"}},
    "threadKey": {"type": ["string", "null"]}
  }
}
```

FollowupPlan (постпродажные касания):
```json
{
  "$id": "followup-plan.v1",
  "type": "object",
  "properties": {
    "touches": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["offsetDays", "purpose"],
        "properties": {
          "offsetDays": {"type": "integer"},
          "purpose": {"type": "string"},
          "template": {"type": ["string", "null"]}
        }
      }
    }
  }
}
```

## Knowledge Base (RAG)
Что положить сразу:
- Product Specs: технические характеристики по моделям Arena (JSON/Markdown/PDF-ссылки)
- Commercial: прайсы, скидки/объёмы, MOQ, гарантия, логистика, условия поставки
- FAQ/Q&A: типовые вопросы/ответы, SLA, сервис
- Objections: список возражений → короткие/длинные отработки
- Competitor Matrix: сравнение (цена, сенсор/скорость, ресурс, ПО, вес/эргономика, гарантия, доступность, кастомизация) с выделением преимуществ Dark Project
- Sales Playbook: сценарии, скрипты, A/B шаблоны сообщений
- Persona Prompt (РОП 20+ лет): системный промпт для LLM

Черновик системного промпта РОПа:
```
Ты — РОП с 20+ годами опыта в продажах компьютерной периферии. Тон — экспертный и доброжелательный. Знаешь линейку Dark Project (серия Arena), конкурентов и типовые возражения. Всегда опираешься на факты из базы знаний и цитируешь источники. Ведёшь клиента от первого касания до сделки в соответствии с логикой CRM. Соблюдаешь закон и этику (opt-in; отказ — уважаешь). Если не уверен — задаёшь уточняющие вопросы и эскалируешь менеджеру.
```

Книги для «личности» и техник:
- Neil Rackham — SPIN Selling
- Matthew Dixon, Brent Adamson — The Challenger Sale
- Jeb Blount — Fanatical Prospecting
- Chris Voss — Never Split the Difference
- Daniel Pink — To Sell Is Human
- Robert Cialdini — Influence
- Mike Weinberg — New Sales. Simplified.

## Bitrix24 — интеграция и маппинг
- Аутентификация: OAuth2-приложение или входящий вебхук с правами CRM
- Методы: `crm.company.add/update/get`, `crm.contact.add/update/get`, `crm.lead.add`, `crm.deal.add`, `crm.duplicate.findbycomm`, `tasks.task.add`
- Поля (минимально):
  - Company: TITLE, ADDRESS, ADDRESS_CITY, ADDRESS_REGION, WEB, PHONE[], EMAIL[]
  - Contact: NAME, LAST_NAME, POST, PHONE[], EMAIL[], IM (TELEGRAM)
  - Lead/Deal: TITLE, COMPANY_ID, CONTACT_ID, COMMENTS (источник/заметки), CATEGORY/STAGE
- Дедупликация: поиск по PHONE/EMAIL/WEB; при совпадении — update вместо add

Пример маппинга (CompanyRecord → Bitrix24) — псевдо-шаблон:
```json
{
  "Company": {
    "TITLE": "{{clubName}}",
    "ADDRESS": "{{address}}",
    "ADDRESS_CITY": "{{city}}",
    "ADDRESS_REGION": "{{region}}",
    "WEB": "{{website}}",
    "PHONE": "{{#each phones}}{\"VALUE\": \"{{this}}\", \"VALUE_TYPE\": \"WORK\"}{{/each}}",
    "EMAIL": "{{#each emails}}{\"VALUE\": \"{{this}}\", \"VALUE_TYPE\": \"WORK\"}{{/each}}"
  },
  "Contact": {
    "NAME": "{{ownerOrManager.fullName}}",
    "POST": "{{ownerOrManager.role}}",
    "PHONE": "{{#if ownerOrManager.phone}}[{\"VALUE\": \"{{ownerOrManager.phone}}\", \"VALUE_TYPE\": \"WORK\"}]{{/if}}",
    "EMAIL": "{{#if ownerOrManager.email}}[{\"VALUE\": \"{{ownerOrManager.email}}\", \"VALUE_TYPE\": \"WORK\"}]{{/if}}",
    "IM": "{{#if ownerOrManager.telegram}}[{\"VALUE\": \"telegram:{{ownerOrManager.telegram}}\", \"VALUE_TYPE\": \"WORK\"}]{{/if}}"
  },
  "Lead": {
    "TITLE": "Dark Project Arena — {{clubName}}",
    "COMMENTS": "Источник: {{sourceIds}}\nТеги: {{tags}}"
  }
}
```

## Telegram: бот или «как обычный TG» (userbot)
- Бот: проще интеграция через ноды n8n; ограничения по инициированию диалога
- Userbot: отдельный MTProto-сервис (Telethon/Pyrogram/TDLib) от имени обычного аккаунта. Экспонировать HTTP:
  - POST `/sendMessage` {username|chatId, text, threadKey?}
  - POST `/sendDocument` {username|chatId, fileUrl}
  - Webhook `/inbox` → wf-10 (входящие)
- Безопасность: хранить `api_id/api_hash`/сессию отдельно, rate-limit, токен-доступ, логировать только метаданные

## Data Governance & Compliance
- Официальные API Яндекс/2ГИС, соблюдение ToS и законов (персональные данные, коммерческие рассылки — opt-in/отписка)
- Минимизировать состав данных в CRM, удалять по запросу, вести audit trail

## Testing
- Валидация JSON (`jq .`), тестовый регион (dry-run без записи в CRM), затем включение апсерта
- E2E: симулировать ответ клиента → проверить классификацию/ответ/эскалацию → обновление CRM

## Versioning
- Версии в именах файлов workflow (`_vNNN.json`) и в таблице изменений проекта

## Roadmap
1) Ключи Яндекс/2ГИС, настроить wf-03/04, протестировать один регион
2) Реализовать wf-05 нормализацию/дедупликацию, проверить качество
3) Подключить wf-07 к тестовому Bitrix24 (песочница)
4) Включить wf-08/09 (Telegram бот); при необходимости развернуть userbot-сервис
5) Поднять KB и LLM-ответы (wf-10), настроить возражения и эскалации
6) Настроить wf-13 постпродажные касания и wf-14 отчётность