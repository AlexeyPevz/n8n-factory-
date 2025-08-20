# Dark Project Arena — спецификация для агента n8n (B2B Outreach)

Этот документ — бриф для следующего агента, который должен сгенерировать готовые к импорту workflow n8n для автоматизации сбора и прогрева компьютерных клубов (Dark Project, серия Arena).

## Инструкции для агента n8n
- Вывод: строго один валидный JSON на workflow, без текста до/после.
- Путь/имя файла: `./projects/dark-project-arena-outreach/workflows/YYYYMMDD_<workflow-slug>_vNNN.json`.
- Версия: `version: 2` (если в `/docs` не указано иное).
- Ноды: использовать только документированные в `/docs`. Указывать корректные `typeVersion`.
- Именование нод: кратко по-английски (например: `Fetch Yandex`, `Fetch 2GIS`, `Normalize`, `Upsert Company`), соответствовать назначению.
- Активность: `active: false` по умолчанию. `settings/meta` — заполнить по необходимости.
- Проверка: сверить с `/examples`, пройти чек-лист ниже.

## Что нужно сгенерировать (deliverables)
- wf-01-orchestrator — оркестратор запусков и расписаний
- wf-02-seed-regions — генерация регионов и поисковых запросов
- wf-03-fetch-yandex-maps — сбор из Яндекс.Карт (официальные API)
- wf-04-fetch-2gis — сбор из 2ГИС (официальные API)
- wf-05-normalize-dedupe — нормализация/сшивка/дедупликация
- wf-06-enrich-contacts — парсинг сайта/почты/Telegram, поиск владельца/управляющего
- wf-07-crm-upsert-bitrix24 — апсерт Company/Contact + Lead/Deal
- wf-08-outreach-orchestrator — сценарии касаний (LLM + KB)
- wf-09-outreach-delivery — отправка (Telegram бот или userbot; Email)
- wf-10-conversation-loop — обработка входящих, ответы, возражения, обновление CRM
- wf-11-logistics-quote — оценка логистики/сроков
- wf-12-handoff-to-supplier — передача «горячих» лидов поставщику
- wf-13-post-sale-followups — касания 0/7/30/90/180
- wf-14-analytics-reporting — отчётность/оповещения

## Credentials и плейсхолдеры (используй в credentials)
- Yandex Maps API: `<YANDEX_API_KEY>`
- 2GIS API: `<TWO_GIS_API_KEY>`
- Bitrix24: `<BITRIX24_BASE_URL>`, `<BITRIX24_WEBHOOK>` ИЛИ OAuth2 cred по `/docs`
- Telegram Bot: `<TELEGRAM_BOT_TOKEN>`
- Userbot-сервис (если используется): `<USERBOT_BASE_URL>` (эндпоинты ниже)
- Email (SMTP/ESP): `<SMTP_HOST>`, `<SMTP_USER>`, `<SMTP_PASS>` …
- LLM провайдер: `<LLM_API_KEY>`

## Контракты данных (используй как ориентир входов/выходов)
CompanyRecord:
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

OutreachMessage:
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

FollowupPlan:
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

## Bitrix24 — маппинг полей (минимум)
- Company: TITLE, ADDRESS, ADDRESS_CITY, ADDRESS_REGION, WEB, PHONE[], EMAIL[]
- Contact: NAME, LAST_NAME, POST, PHONE[], EMAIL[], IM (TELEGRAM)
- Lead/Deal: TITLE, COMPANY_ID, CONTACT_ID, COMMENTS, CATEGORY/STAGE
- Поиск дублей: `crm.duplicate.findbycomm` (PHONE/EMAIL/WEB) → `update` вместо `add`.

## Telegram — варианты доставки
- Бот: ноды Telegram в n8n (sendMessage/sendDocument) — просто, но ограничения инициирования диалога.
- Userbot: внешний сервис (MTProto). HTTP:
  - POST `<USERBOT_BASE_URL>/sendMessage` {username|chatId, text, threadKey?}
  - POST `<USERBOT_BASE_URL>/sendDocument` {username|chatId, fileUrl}
  - Webhook входящих: `<N8N_BASE_URL>/webhook/telegram/inbox` → wf-10

## Входы/выходы и критерии по workflow (сжато)
- wf-02-seed-regions
  - Input: none. Output: [{region, city, queries[]}]
- wf-03-fetch-yandex-maps / wf-04-fetch-2gis
  - Input: из wf-02. Output: массив сырых объектов источника (id, name, address, phones, site, coords).
  - Ограничения: rate limit, пагинация; `continueOnFail` на единичных сбоях.
- wf-05-normalize-dedupe
  - Input: потоки из 03/04. Output: массив `CompanyRecord` (нормализовано и дедуплицировано).
- wf-06-enrich-contacts
  - Input: CompanyRecord[]. Output: CompanyRecord[] c email/telegram/ownerOrManager при наличии.
- wf-07-crm-upsert-bitrix24
  - Input: CompanyRecord. Output: IDs созданных/обновлённых Company/Contact/Lead|Deal. Учитывать дубликаты.
- wf-08-outreach-orchestrator
  - Input: CompanyRecord + KB. Output: `OutreachMessage[]` по каналам, расписание.
- wf-09-outreach-delivery
  - Input: OutreachMessage. Output: статус доставки/идентификатор треда.
- wf-10-conversation-loop
  - Input: входящие (Telegram/Email). Output: классификация, ответ/эскалация, обновление CRM.
- wf-11-logistics-quote
  - Input: запрос клиента/карточка. Output: расчёт ETA/стоимости, запись в CRM.
- wf-12-handoff-to-supplier
  - Input: «горячий» лид. Output: уведомление поставщику, задание/сделка.
- wf-13-post-sale-followups
  - Input: событие «сделка успешно». Output: касания D0/7/30/90/180, сбор отзывов/NPS.
- wf-14-analytics-reporting
  - Input: CRM/логи. Output: отчёты (Sheets/Notion/Email/TG).

## Knowledge Base (что подготовить)
- Тех. характеристики (Arena): спецификации, гарантия, совместимость, материалы (PDF/ссылки).
- Коммерция: цены, скидки по объёму, MOQ, логистика/сроки, условия поставки.
- FAQ/Q&A и отработка возражений (краткие/подробные скрипты).
- Сравнение с конкурентами и преимущества Dark Project.
- Sales playbook и A/B шаблоны сообщений.
- Системный промпт «РОП 20+ лет» (см. выше) для LLM.

## Чек-лист готовности (Done)
- JSON валиден (`jq .`) и импортируется в n8n без правок.
- Все `nodes[].type/typeVersion` соответствуют `/docs`.
- `connections` корректны, `id` уникальны, у каждой ноды есть `position`.
- Секреты — только в `credentials`; без утечек в `parameters`.
- Дедупликация в B24 работает (создаёт `update` при повторе).
- Outreach отправляется хотя бы одним каналом; входящие попадают в wf-10.
- Постпродажные касания создаются (задачи/сообщения) по расписанию.

## Testing
- Dry-run на одном регионе, без записи в CRM (mock/флаг).
- Интеграционный тест с тестовым порталом Bitrix24.
- Симуляция входящих сообщений (webhook) и проверка ответов/эскалаций.

## Roadmap (первый прогон)
1) Ключи Яндекс/2ГИС → wf-03/04 (1 регион)
2) wf-05 нормализация/дедупликация
3) wf-07 интеграция Bitrix24 (песочница)
4) wf-08/09 Telegram бот; при необходимости userbot-сервис
5) wf-10 ответы/возражения (LLM+KB)
6) wf-13 постпродажа и wf-14 отчётность

## Примечания
- Соблюдать ToS и закон о персональных данных, соблюдать opt-in/отписку.
- Для userbot — держать сервис отдельным и безопасным; n8n общается по HTTPS.