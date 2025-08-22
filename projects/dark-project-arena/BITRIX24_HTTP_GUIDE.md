# Bitrix24 HTTP Request Guide

## 🔧 Переход с Bitrix24 нод на HTTP Request

Из-за проблем совместимости Bitrix24 нод с новыми версиями Node.js, все workflow переделаны на использование стандартных HTTP Request нод.

## 📋 Настройка

### 1. Получите Webhook URL в Bitrix24

1. Зайдите в ваш Bitrix24
2. Перейдите в **Разработчикам → Другое → Входящий вебхук**
3. Создайте новый вебхук с правами:
   - CRM (crm)
   - Лиды (crm.lead.*)
4. Скопируйте URL вида:
   ```
   https://your-domain.bitrix24.ru/rest/1/your_webhook_key/
   ```

### 2. Добавьте в переменные окружения

```bash
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_webhook_key/
```

## 📚 API Методы

### Поиск лидов (crm.lead.list)

```json
{
  "method": "POST",
  "url": "{{ $env.BITRIX24_WEBHOOK_URL }}crm.lead.list",
  "bodyParameters": {
    "parameters": [
      {
        "name": "filter[PHONE]",
        "value": "+79991234567"
      },
      {
        "name": "select[]",
        "value": "ID"
      },
      {
        "name": "select[]",
        "value": "TITLE"
      },
      {
        "name": "select[]",
        "value": "STATUS_ID"
      }
    ]
  }
}
```

**Response:**
```json
{
  "result": [
    {
      "ID": "123",
      "TITLE": "Gaming Club Moscow",
      "STATUS_ID": "NEW"
    }
  ],
  "total": 1
}
```

### Создание лида (crm.lead.add)

```json
{
  "method": "POST",
  "url": "{{ $env.BITRIX24_WEBHOOK_URL }}crm.lead.add",
  "bodyParameters": {
    "parameters": [
      {
        "name": "fields",
        "value": "{{ JSON.stringify({
          TITLE: 'Gaming Club Name',
          STATUS_ID: 'NEW',
          PHONE: [{VALUE: '+79991234567', VALUE_TYPE: 'WORK'}],
          EMAIL: [{VALUE: 'club@example.com', VALUE_TYPE: 'WORK'}],
          COMMENTS: 'Club details...'
        }) }}"
      }
    ]
  }
}
```

**Response:**
```json
{
  "result": 124,  // ID нового лида
  "time": {...}
}
```

### Обновление лида (crm.lead.update)

```json
{
  "method": "POST",
  "url": "{{ $env.BITRIX24_WEBHOOK_URL }}crm.lead.update",
  "bodyParameters": {
    "parameters": [
      {
        "name": "id",
        "value": "124"
      },
      {
        "name": "fields",
        "value": "{{ JSON.stringify({
          STATUS_ID: 'IN_PROGRESS',
          COMMENTS: 'Updated comments...'
        }) }}"
      }
    ]
  }
}
```

### Получение лида (crm.lead.get)

```json
{
  "method": "POST",
  "url": "{{ $env.BITRIX24_WEBHOOK_URL }}crm.lead.get",
  "bodyParameters": {
    "parameters": [
      {
        "name": "id",
        "value": "124"
      }
    ]
  }
}
```

## 🔄 Обработка ответов

### Парсинг результатов поиска

```javascript
// В Function node после HTTP Request
const response = $json;

// Проверяем успешный ответ
if (response && response.result) {
  // Преобразуем массив для n8n
  return response.result.map(lead => ({ json: lead }));
} else if (response && response.error) {
  console.error('Bitrix24 error:', response.error);
  return [];
} else {
  console.error('Invalid response');
  return [];
}
```

### Получение ID после создания

```javascript
const response = $json;
let leadId;

if (response.result) {
  leadId = response.result; // При создании возвращается просто ID
} else if (response.error) {
  throw new Error(`Bitrix24 error: ${response.error}`);
}
```

## 📝 Кастомные поля

### Стандартные поля лидов
- `TITLE` - Название
- `STATUS_ID` - Статус (NEW, IN_PROGRESS, PROCESSED, CONVERTED, JUNK)
- `PHONE` - Телефон (массив)
- `EMAIL` - Email (массив)
- `COMMENTS` - Комментарии
- `ADDRESS_CITY` - Город
- `SOURCE_ID` - Источник
- `SOURCE_DESCRIPTION` - Описание источника

### Кастомные поля (UF_CRM_*)
- `UF_CRM_TELEGRAM` - Telegram
- `UF_CRM_VK` - VKontakte
- `UF_CRM_INSTAGRAM` - Instagram
- `UF_CRM_WEBSITE` - Сайт
- `UF_CRM_IS_CHAIN` - Сеть (Y/N)
- `UF_CRM_BRAND` - Бренд
- `UF_CRM_BRANCH_COUNT` - Количество филиалов
- `UF_CRM_PRIORITY` - Приоритет
- `UF_CRM_LEAD_SCORE` - Lead Score
- `UF_CRM_DIALOG_HISTORY` - История диалога

## ⚠️ Важные моменты

1. **Формат телефонов и email** - всегда массив объектов:
   ```javascript
   PHONE: [
     {VALUE: '+79991234567', VALUE_TYPE: 'WORK'},
     {VALUE: '+79997654321', VALUE_TYPE: 'MOBILE'}
   ]
   ```

2. **Лимиты API**:
   - По умолчанию возвращается 50 записей
   - Максимум 500 за один запрос
   - Используйте параметр `start` для пагинации

3. **Фильтры**:
   - Поддерживаются операторы: `=`, `>`, `<`, `>=`, `<=`, `!=`
   - Пример: `filter[>ID]=100`

4. **Обработка ошибок**:
   ```javascript
   if (response.error) {
     console.error(`Error ${response.error}: ${response.error_description}`);
     // Обработка специфичных ошибок
     if (response.error === 'ERROR_CORE') {
       // Неверные параметры
     }
   }
   ```

## 🚀 Миграция workflow

При переходе с Bitrix24 нод на HTTP Request:

1. Замените тип ноды на `n8n-nodes-base.httpRequest`
2. Добавьте URL: `{{ $env.BITRIX24_WEBHOOK_URL }}метод`
3. Настройте bodyParameters вместо прямых параметров
4. Добавьте Function node для парсинга ответа
5. Обновите connections чтобы включить парсер

## 📖 Полезные ссылки

- [Документация Bitrix24 REST API](https://dev.1c-bitrix.ru/rest_help/)
- [Методы для работы с лидами](https://dev.1c-bitrix.ru/rest_help/crm/leads/index.php)