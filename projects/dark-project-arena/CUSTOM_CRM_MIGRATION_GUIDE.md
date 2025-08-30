# Руководство по миграции Dark Project Arena с Битрикс24 на кастомную CRM

## 📋 Обзор

Проект Dark Project Arena использует Битрикс24 в качестве CRM для управления лидами, контактами и задачами. Это руководство поможет вам адаптировать систему для работы с вашей кастомной CRM.

## 🔍 Анализ текущей интеграции с Битрикс24

### Используемые API endpoints

На основе анализа workflow файлов, проект использует следующие методы Битрикс24 API:

1. **Управление лидами (Leads)**:
   - `crm.lead.list` - поиск и получение списка лидов
   - `crm.lead.add` - создание новых лидов
   - `crm.lead.update` - обновление существующих лидов
   - `crm.lead.get` - получение информации о конкретном лиде

2. **Управление контактами**:
   - `crm.contact.get` - получение информации о контакте

3. **Управление сделками**:
   - `crm.deal.get` - получение информации о сделке

4. **Управление задачами**:
   - `tasks.task.add` - создание задач для менеджеров

5. **Управление активностями**:
   - `crm.activity.add` - создание активностей (звонки, встречи)

### Структура данных лидов

Проект использует следующие поля для лидов:

**Стандартные поля**:
- `ID` - уникальный идентификатор
- `TITLE` - название клуба
- `STATUS_ID` - статус лида (NEW, IN_PROGRESS, PROCESSED, CONVERTED, JUNK)
- `PHONE` - массив телефонов
- `EMAIL` - массив email адресов
- `COMMENTS` - комментарии
- `ADDRESS_CITY` - город
- `SOURCE_ID` - источник лида
- `SOURCE_DESCRIPTION` - описание источника

**Кастомные поля (UF_CRM_*)**:
- `UF_CRM_TELEGRAM` - Telegram ID/username
- `UF_CRM_WHATSAPP` - WhatsApp номер
- `UF_CRM_VK` - VKontakte ссылка
- `UF_CRM_INSTAGRAM` - Instagram username
- `UF_CRM_WEBSITE` - сайт клуба
- `UF_CRM_IS_CHAIN` - является ли сетью (Y/N)
- `UF_CRM_BRAND` - бренд сети
- `UF_CRM_BRANCH_COUNT` - количество филиалов
- `UF_CRM_ESTIMATED_PCS` - примерное количество компьютеров
- `UF_CRM_PRIORITY` - приоритет (1-10)
- `UF_CRM_LEAD_SCORE` - оценка лида
- `UF_CRM_DIALOG_HISTORY` - история диалога (JSON)
- `UF_CRM_LAST_CONTACT` - дата последнего контакта
- `UF_CRM_CONTACT_COUNT` - количество контактов
- `UF_CRM_PREFERRED_CHANNEL` - предпочтительный канал связи
- `UF_CRM_ENRICHED_AT` - дата обогащения данных

## 🚀 План миграции

### Шаг 1: Проектирование API вашей CRM

Для минимальных изменений в workflow, ваша CRM должна предоставить следующие endpoints:

#### 1.1 Управление лидами

```http
POST /api/leads/search
```
Поиск лидов по параметрам (телефон, название, город)

Request:
```json
{
  "filter": {
    "phone": "+79991234567",
    "title": "Gaming Club",
    "city": "Moscow"
  },
  "select": ["id", "title", "status", "phone", "email", "custom_fields"],
  "limit": 50
}
```

Response:
```json
{
  "result": [
    {
      "id": "123",
      "title": "Gaming Club Moscow",
      "status": "new",
      "phone": [{"value": "+79991234567", "type": "work"}],
      "email": [{"value": "club@example.com", "type": "work"}],
      "custom_fields": {
        "telegram": "@club_moscow",
        "estimated_pcs": 50
      }
    }
  ],
  "total": 1
}
```

```http
POST /api/leads/create
```
Создание нового лида

Request:
```json
{
  "title": "Gaming Club Name",
  "status": "new",
  "phone": [{"value": "+79991234567", "type": "work"}],
  "email": [{"value": "club@example.com", "type": "work"}],
  "city": "Moscow",
  "comments": "Найден через Yandex Maps",
  "custom_fields": {
    "telegram": "@gaming_club",
    "is_chain": true,
    "estimated_pcs": 30
  }
}
```

Response:
```json
{
  "result": {
    "id": "124"
  }
}
```

```http
POST /api/leads/{id}/update
```
Обновление существующего лида

```http
GET /api/leads/{id}
```
Получение информации о лиде

#### 1.2 Управление задачами

```http
POST /api/tasks/create
```
Создание задачи для менеджера

Request:
```json
{
  "title": "Связаться с Gaming Club Moscow",
  "description": "Горячий лид, готов к покупке",
  "responsible_id": 1,
  "deadline": "2025-01-20T10:00:00",
  "entity_type": "lead",
  "entity_id": "124"
}
```

### Шаг 2: Создание адаптера для вашей CRM

Создайте промежуточный слой, который будет транслировать запросы из формата Битрикс24 в формат вашей CRM:

```javascript
// crm-adapter.js
class CRMAdapter {
  constructor(crmBaseUrl, apiKey) {
    this.baseUrl = crmBaseUrl;
    this.apiKey = apiKey;
  }

  // Преобразование формата Битрикс24 в формат вашей CRM
  async translateBitrix24Request(method, params) {
    switch(method) {
      case 'crm.lead.list':
        return this.searchLeads(params);
      case 'crm.lead.add':
        return this.createLead(params);
      case 'crm.lead.update':
        return this.updateLead(params);
      case 'crm.lead.get':
        return this.getLead(params);
      case 'tasks.task.add':
        return this.createTask(params);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  async searchLeads(bitrixParams) {
    // Преобразуем параметры Битрикс24 в формат вашей CRM
    const filter = {};
    const select = [];
    
    // Парсим параметры
    bitrixParams.forEach(param => {
      if (param.name.startsWith('filter[')) {
        const field = param.name.match(/filter\[(.*?)\]/)[1];
        filter[this.mapFieldName(field)] = param.value;
      } else if (param.name === 'select[]') {
        select.push(this.mapFieldName(param.value));
      }
    });

    // Делаем запрос к вашей CRM
    const response = await fetch(`${this.baseUrl}/api/leads/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filter, select })
    });

    const data = await response.json();
    
    // Преобразуем ответ обратно в формат Битрикс24
    return {
      result: data.result.map(lead => this.mapLeadToB24Format(lead)),
      total: data.total
    };
  }

  // Маппинг полей между Битрикс24 и вашей CRM
  mapFieldName(b24Field) {
    const fieldMap = {
      'PHONE': 'phone',
      'TITLE': 'title',
      'STATUS_ID': 'status',
      'EMAIL': 'email',
      'ADDRESS_CITY': 'city',
      'UF_CRM_TELEGRAM': 'custom_fields.telegram',
      'UF_CRM_ESTIMATED_PCS': 'custom_fields.estimated_pcs',
      // добавьте остальные поля
    };
    return fieldMap[b24Field] || b24Field.toLowerCase();
  }

  mapLeadToB24Format(lead) {
    return {
      ID: lead.id,
      TITLE: lead.title,
      STATUS_ID: this.mapStatus(lead.status),
      PHONE: lead.phone,
      EMAIL: lead.email,
      ADDRESS_CITY: lead.city,
      UF_CRM_TELEGRAM: lead.custom_fields?.telegram,
      UF_CRM_ESTIMATED_PCS: lead.custom_fields?.estimated_pcs,
      // маппинг остальных полей
    };
  }

  mapStatus(status) {
    const statusMap = {
      'new': 'NEW',
      'in_progress': 'IN_PROGRESS',
      'processed': 'PROCESSED',
      'converted': 'CONVERTED',
      'junk': 'JUNK'
    };
    return statusMap[status] || status.toUpperCase();
  }
}
```

### Шаг 3: Создание прокси-сервера

Создайте простой прокси-сервер, который будет эмулировать Битрикс24 webhook:

```javascript
// proxy-server.js
const express = require('express');
const CRMAdapter = require('./crm-adapter');

const app = express();
app.use(express.json());

const adapter = new CRMAdapter(
  process.env.CUSTOM_CRM_URL,
  process.env.CUSTOM_CRM_API_KEY
);

// Эмулируем структуру URL Битрикс24
app.post('/rest/1/:webhook/:method', async (req, res) => {
  try {
    const method = req.params.method;
    const params = req.body.parameters || [];
    
    const result = await adapter.translateBitrix24Request(method, params);
    res.json(result);
  } catch (error) {
    res.json({
      error: error.message,
      error_description: error.stack
    });
  }
});

app.listen(3000, () => {
  console.log('CRM Proxy running on port 3000');
});
```

### Шаг 4: Минимальные изменения в n8n workflows

#### Вариант 1: Замена webhook URL (минимальные изменения)

Просто измените переменную окружения:
```bash
# Было:
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_webhook_key/

# Стало:
BITRIX24_WEBHOOK_URL=http://localhost:3000/rest/1/fake_webhook/
```

#### Вариант 2: Прямая интеграция (больше изменений, но надежнее)

Создайте новые HTTP Request ноды для вашей CRM. Пример изменения для поиска лидов:

```json
{
  "name": "Search Lead in Custom CRM",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "{{ $env.CUSTOM_CRM_URL }}/api/leads/search",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "filter",
          "value": "={{ JSON.stringify({ phone: $json.searchPhone }) }}"
        },
        {
          "name": "select",
          "value": "={{ JSON.stringify(['id', 'title', 'status', 'phone', 'custom_fields']) }}"
        }
      ]
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "CUSTOM_CRM_API_KEY",
      "name": "Custom CRM API Key"
    }
  }
}
```

### Шаг 5: Настройка переменных окружения

Добавьте новые переменные в `.env`:

```bash
# Custom CRM Configuration
CUSTOM_CRM_URL=https://your-crm.com
CUSTOM_CRM_API_KEY=your-api-key-here

# Если используете прокси
CRM_PROXY_URL=http://localhost:3000/rest/1/proxy/
```

## 📝 Чек-лист миграции

- [ ] Спроектировать API endpoints в вашей CRM
- [ ] Создать структуру данных для лидов с необходимыми полями
- [ ] Реализовать API методы в вашей CRM
- [ ] Создать адаптер для трансляции запросов (опционально)
- [ ] Настроить прокси-сервер (опционально)
- [ ] Обновить переменные окружения
- [ ] Протестировать каждый workflow:
  - [ ] WF-01: Поиск игровых клубов
  - [ ] WF-02: Обогащение контактной информации
  - [ ] WF-03: Создание/обновление в CRM
  - [ ] WF-04: AI агент продаж
  - [ ] WF-05: Передача горячих лидов
  - [ ] WF-06: Постпродажное сопровождение
- [ ] Мигрировать существующие данные из Битрикс24
- [ ] Настроить мониторинг и логирование

## 🔧 Рекомендации

1. **Сохраните структуру данных**: Чтобы минимизировать изменения, сохраните похожую структуру полей и статусов.

2. **Используйте адаптер**: Это позволит вносить минимальные изменения в существующие workflow.

3. **Версионирование API**: Добавьте версионирование в ваш API для будущих изменений.

4. **Обработка ошибок**: Убедитесь, что ваша CRM возвращает ошибки в формате, понятном для n8n.

5. **Производительность**: Учитывайте лимиты и оптимизируйте запросы, особенно для массовых операций.

## 🚨 Важные моменты

1. **Уникальность по телефону**: Система использует телефон как основной идентификатор для дедупликации.

2. **Формат телефонов**: Нормализуйте телефоны в формате международного номера.

3. **История диалогов**: Поле `dialog_history` хранит JSON с историей общения AI агента.

4. **Статусы лидов**: Сохраните совместимость со статусами Битрикс24 или адаптируйте логику.

5. **Webhook безопасность**: Добавьте аутентификацию для webhook endpoints.

## 📚 Дополнительные ресурсы

- [Документация n8n HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Оригинальная документация проекта](./README.md)
- [Структура workflow](./DOCUMENTATION_STRUCTURE.md)