
# Проект: Dark Project Arena – Автоматизация продаж периферии для компьютерных клубов

## 1. Бизнес-цель
Создать полностью автоматизированную воронку продаж периферии Dark Project (серия «Арена») для компьютерных клубов РФ/СНГ. Воронка включает:
1. Поиск и сбор контактов клубов из открытых источников.
2. Занесение и обогащение данных в CRM (Bitrix24).
3. Автоматическое тёплое касание умным ботом-РОПом (Head of Sales) до момента «горячего» лида.
4. Передачу горячих лидов поставщику (агентская модель).
5. Пост-продажное сопровождение клиента с циклом follow-up 1 неделя → 1/3/6 месяцев.

## 2. Архитектура решения
| Слой | Компонент | Технология |
|------|-----------|------------|
| Источники данных | Яндекс.Карты • 2ГИС • Telegram-чаты (LANgame, клубные форумы/каналы) | HTTP / парсинг API / Web-scraping |
| ETL | n8n workflow «Parser» | HTTP Request • HTML Extract • SplitInBatches • Set |
| Обогащение | n8n workflow «Enrich & Deduplicate» | Merge • IF • Function |
| CRM | Bitrix24 (лиды + сделки + контакты) | Официальная нода Bitrix24 API |
| Коммуникации | Telegram (личный аккаунт РОПа или Bot API) | Telegram Trigger / Sender |
| Логика продаж | LLM (OpenAI/GPT-4o) + KB в векторном хранилище (Qdrant) | n8n-nodes-base.ollama / Custom Function |
| Мониторинг | n8n Error Trigger + Telegram Alerts | IF • Error Branch |

### 2.1. Оркестратор волн (WF-00 Orchestrator)
- Роль: центральный хаб планирования и запуска «волн» городов
- Источник таргетов: `projects/dark-project-arena/data/geo_targets.csv` (city, region, federal_district, population, lat, lon, country, club_presence_score, city_id_2gis/bbox, priority_wave)
- Логика:
  - Cron → выбор волны → постановка задач в Redis (List/Stream) с приоритетами
  - Запуск `WF-01` пакетами (1 город = 1 итерация), контроль rate-limit и ретраев
  - Телеметрия: корреляционный `runId`, прогресс, алерты через Telegram

### 2.2. Геоволны (приоритезация городов)
- Волна 1: миллионники РФ/СНГ; Волна 2: ЦФО ≥ 500k; Волна 3: СЗФО ≥ 500k; Волна 4: ПФО ≥ 500k; далее ЮФО/УФО/СФО/ДФО/СКФО ≥ 300k, затем по убыванию населения и club_presence_score

## 3. Схема данных (CRM «Лид»)
| Поле | Источник | Обязательное |
|------|----------|--------------|
| Название клуба | Я.Карты/2ГИС | ✔ |
| Адрес (строка) | Я.Карты/2ГИС | ✔ |
| Город | Парсинг адреса | ✔ |
| Регион | Парсинг адреса | ✔ |
| Сеть (bool) | 2ГИС (field `brand`) |  |
| Телефон | Я.Карты/2ГИС | ✔ |
| Email | Сайт клуба (scraping) |  |
| Telegram | Сайт/2ГИС/чаты |  |
| Контакт владельца | Telegram-чаты / OSINT |  |
| Источник лида | static="YandexMaps, 2GIS, TG" | ✔ |
| Статус лида | default="Новый" | ✔ |

## 4. n8n-workflows
0. **WF-00-Orchestrator**
   • Trigger: Cron (расписание волн)  
   • Read `geo_targets.csv` → Queue в Redis (Stream/List)  
   • Batch‑запуск `WF-01` по одному городу, контроль ретраев/лимитов  
   • Метрики/алерты/ручное управление
1. **WF-01-Fetch-GamingClubs**  
   • Manual Trigger / Schedule `0 3 * * *` (раз в сутки)  
   • For-each service (Я.Карты, 2ГИС) → HTTP Request → HTML/JSON Parse  
   • Normalize to common JSON schema  
   • Write to **Redis Set** `raw_clubs` (dedup by address+name).
2. **WF-02-Enrich-ContactInfo**  
   • Trigger: Redis Key Event → Get items batch  
   • Scrape club site & search TG username  
   • Call **WF-03-Upsert-CRM**.
3. **WF-03-Upsert-CRM**  
   • Bitrix24 → search duplicate → create/обновить Lead  
   • Attach custom fields.
4. **WF-04-Sales-Nurture**  
   • Trigger: Bitrix24 Lead status IN («Новый», «В работе»)  
   • RAG (Qdrant) → LLM node → персонализированное сообщение (prompt «РОП 20Y»)  
   • Telegram отправка через внешний MTProto‑бридж (от лица пользователя) или Bot API; fallback Email/CRM‑таск  
   • Wait / Collect replies → classify intent → update Lead.
5. **WF-05-Hot-Lead-Handoff**  
   • Trigger: Lead status «Горячий»  
   • Notify supplier via Telegram/Email, attach КП и ТЗ.
6. **WF-06-Post-Sale-Followup**  
   • Trigger: Deal status «Успешно реализовано»  
   • Delay nodes 7д → 30д → 90д → 180д  
   • Telegram/Email surveys, request feedback & UGC  
   • Store answers, generate case studies.

## 5. Интеграции и учетные данные
| Интеграция | Тип | Секрет/Учётка | Scope |
|------------|-----|---------------|-------|
| Bitrix24 Cloud | OAuth2 + Webhook | `BITRIX24_CRM`, `BITRIX24_WEBHOOK_SECRET` | CRM.leads, deals, contacts |
| Yandex Maps API | HTTP Query Auth | `YANDEX_MAPS_API` | Поиск организаций |
| 2GIS API | HTTP Query Auth | `TWOGIS_API` | Поиск организаций |
| Telegram | Bot Token **или** user-session (MTProto) | `TG_ROP_BOT` | Send/receive messages |
| OpenAI / Ollama | API Key | `LLM_KEY` | GPT-4o, embeddings |
| Qdrant | HTTP | `KB_QDRANT` | Vector storage (RAG для WF-04) |
| Redis | Internal | `REDIS_INTERNAL` | Dedup & queue |

### 5.1. Зависимости от Community Nodes
**Внимание**: Проект использует следующие community nodes, которые необходимо установить:

| Node | Package | Версия | Использование |
|------|---------|--------|---------------|
| Redis | `@n8n_io/n8n-nodes-redis` | latest | WF-00, WF-01, WF-02, WF-04 |
| Qdrant Vector Store | `@n8n/n8n-nodes-langchain` | latest | WF-04 (RAG) |

**Установка**:
```bash
npm install @n8n_io/n8n-nodes-redis @n8n/n8n-nodes-langchain
```

**Настройка Bitrix24 Webhooks**:
1. В Bitrix24 перейти в Приложения → Вебхуки
2. Создать исходящий вебхук для событий CRM
3. URL: `https://your-n8n.domain/webhook/bitrix24-lead-update`
4. Добавить секретный заголовок для безопасности

## 6. База знаний (KB)
1. **Тех. характеристики**: вся линейка Dark Project Arena, спецификации, гарантии.  
2. **FAQ**: 30-50 типовых вопросов (цена, доставка, совместимость, гарантии).  
3. **Коммерческие данные**: прайс-лист, MOQ, скидочные сетки, сроки логистики.  
4. **Best-sellers по продажам**:  
   • «SPIN Selling» – Нил Рэкхам  
   • «The Challenger Sale» – М. Диксон  
   • «Психология влияния» – Р. Чалдини  
   • «Скрипты переговоров» – М. Романов  
5. **Работа с возражениями**: шаблоны «Дорого», «У нас уже есть», «Нужен тест».  
6. **Сравнение с конкурентами** (Razer, HyperX, Logitech G):  
   • Цена ниже на 15-20 %  
   • Гарантия 2 года vs 1 год  
   • Сервис в РФ  
   • Специализация на киберспорт-аренах  
   • Оптовые условия + бренд-материалы.

**Формат хранения**: Markdown-файлы → скрипт загрузки в Qdrant (`projects/dark-project-arena/kb/*.md`).

## 7. Персона «РОП 20Y» (PROMPT-template)
```text
Ты — Руководитель отдела продаж с 20-летним опытом в компьютерной периферии. Сторонник SPIN и Challenger-подходов. Коммуницируешь дружелюбно, по делу, на «ты», быстро приводишь выгоды, отрабатываешь возражения по методике Feel-Felt-Found, владеешь цифрами (ROI, LTV, маржа). Твоя цель — довести клиента до заказа, оставаясь экспертом-консультантом.
```

## 8. Дорожная карта
| Q | Задача | Выход | Ответственный |
|---|--------|-------|--------------|
| Q1 | MVP: WF-01, WF-03, база знаний | Лиды в CRM | DevOps |
| Q2 | Обогащение + LLM Sales Bot + MTProto‑бридж | Коммуникации | ML Engineer |
| Q3 | Post-Sale + аналитика | Case studies | PM |

## 9. Версионирование
Следовать правилам из корневого `README.md`: файлы workflow → `projects/dark-project-arena/workflows/YYYYMMDD_<slug>_v001.json`.

## 10. Безопасность и наблюдаемость (обновлено)
- Все Webhook снабжены секретным заголовком/allowlist IP
- Единая политика timeouts/retries на HTTP узлах; централизованная обработка ошибок
- Логирование с корреляционными `runId`; бэкапы Redis и регулярный экспорт в Postgres/ClickHouse

---
© 2025 Dark Project Factory