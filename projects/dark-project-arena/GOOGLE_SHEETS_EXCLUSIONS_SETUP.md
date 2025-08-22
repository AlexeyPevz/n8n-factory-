# Настройка Google Sheets для управления исключениями

## 🎯 Преимущества Google Sheets

- **Совместный доступ** - поставщик и менеджеры могут редактировать
- **История изменений** - видно кто и когда добавил исключение
- **Комментарии** - можно обсуждать спорные случаи
- **Уведомления** - оповещения об изменениях
- **API доступ** - легко интегрировать в n8n

## 📋 Структура таблицы

### Лист "Exclusions"

| Название клуба | Тип | Город | Тип исключения | Причина | Действует до | Разрешенные каналы | Добавил | Дата добавления | Примечания |
|----------------|-----|-------|----------------|---------|--------------|-------------------|---------|-----------------|------------|
| Colizeum | Сеть | Все | Полное | Прямой контракт с ГО | 31.12.2099 | - | Иван П. | 01.12.2024 | sales@darkproject.com |
| CyberX | Сеть | Все | Полное | Работают через дистрибьютора | 31.12.2099 | - | Мария К. | 15.11.2024 | ООО "ТехноГейм" |
| Phoenix Club | Один | Екатеринбург | Временное | Идут переговоры | 01.02.2025 | Все | Александр | 09.01.2025 | Проверить статус |

### Лист "Patterns" (шаблоны исключений)

| Шаблон | Тип | Действие | Причина | Добавил |
|--------|-----|----------|---------|---------|
| *@bloody.com | Email | Исключить | Домен конкурента | Система |
| Bloody* | Название | Исключить | Бренд конкурента | Иван П. |
| *тест* | Название | Исключить | Тестовые записи | Система |

### Лист "Log" (журнал изменений)

| Дата | Действие | Клуб | Исполнитель | Причина |
|------|----------|------|-------------|---------|
| 09.01.2025 | Добавлено | Phoenix Club | Александр | Временное исключение |
| 08.01.2025 | Обновлено | GameStation | Мария К. | Продлен контракт |

## 🔧 Настройка в n8n

### 1. Создание Google Sheets

1. Создайте новую таблицу: [Google Sheets](https://sheets.new)
2. Назовите её: "Dark Project - Список исключений"
3. Создайте 3 листа как описано выше
4. Заполните заголовки

### 2. Настройка доступа

1. Нажмите "Поделиться"
2. Добавьте пользователей:
   - Ваш email (редактор)
   - Email поставщика (редактор)
   - Service account n8n (редактор)
3. Получите ID таблицы из URL

### 3. Credentials в n8n

1. В n8n создайте credentials "Google Sheets OAuth2"
2. Или используйте Service Account (рекомендуется)
3. Скопируйте ID таблицы

### 4. Workflow для чтения исключений

```json
{
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [{
            "mode": "everyHour"
          }]
        }
      }
    },
    {
      "name": "Read Exclusions",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Exclusions!A:J",
        "options": {
          "returnAllMatches": true
        }
      }
    },
    {
      "name": "Read Patterns", 
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "read",
        "sheetId": "YOUR_SHEET_ID",
        "range": "Patterns!A:E"
      }
    },
    {
      "name": "Update Redis Cache",
      "type": "n8n-nodes-base.redis",
      "parameters": {
        "operation": "set",
        "key": "exclusions:list",
        "value": "={{ JSON.stringify($json) }}",
        "expire": true,
        "ttl": 3600
      }
    }
  ]
}
```

## 📝 Модификация существующих workflow

### WF-01: Проверка исключений
```javascript
// Получаем актуальный список из Redis (обновляется каждый час)
const getExclusions = async () => {
  const cached = await redis.get('exclusions:list');
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fallback: читаем напрямую из Google Sheets
  const sheet = await googleSheets.read({
    sheetId: 'YOUR_SHEET_ID',
    range: 'Exclusions!A:J'
  });
  
  return sheet;
};

// Проверка клуба
const isExcluded = (clubName, city) => {
  const exclusions = await getExclusions();
  
  return exclusions.some(row => {
    const [name, type, excCity, exclType] = row;
    
    // Точное совпадение
    if (name.toLowerCase() === clubName.toLowerCase()) {
      if (excCity === 'Все' || excCity === city) {
        return exclType === 'Полное' || exclType === 'Временное';
      }
    }
    
    // Проверка по шаблону
    if (name.includes('*')) {
      const pattern = name.replace('*', '.*');
      return new RegExp(pattern, 'i').test(clubName);
    }
    
    return false;
  });
};
```

### WF-04: Логирование исключений
```javascript
// При срабатывании исключения - записываем в лог
const logExclusion = async (club, reason) => {
  await googleSheets.append({
    sheetId: 'YOUR_SHEET_ID',
    range: 'Log!A:E',
    values: [[
      new Date().toISOString(),
      'Автоисключение',
      club.name,
      'Система',
      reason
    ]]
  });
};
```

## 🔔 Уведомления и автоматизация

### Google Apps Script для уведомлений
```javascript
// Добавьте в Tools → Script editor
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  
  if (sheet.getName() === 'Exclusions') {
    // Отправляем уведомление в Telegram
    const newExclusion = sheet.getRange(e.range.getRow(), 1, 1, 10).getValues()[0];
    
    UrlFetchApp.fetch('https://your-n8n.com/webhook/exclusion-added', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      payload: JSON.stringify({
        club: newExclusion[0],
        type: newExclusion[3],
        addedBy: newExclusion[7],
        reason: newExclusion[4]
      })
    });
  }
}

// Проверка истекающих исключений
function checkExpiringExclusions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Exclusions');
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  data.forEach((row, index) => {
    if (index === 0) return; // Skip header
    
    const expiryDate = new Date(row[5]);
    if (expiryDate > today && expiryDate <= weekFromNow) {
      // Отправляем напоминание
      MailApp.sendEmail({
        to: 'manager@darkproject.com',
        subject: `Истекает исключение: ${row[0]}`,
        body: `Исключение для ${row[0]} истекает ${row[5]}. Причина: ${row[4]}`
      });
    }
  });
}
```

## 🎨 Форматирование и валидация

### Условное форматирование
1. Временные исключения - желтый фон
2. Полные исключения - красный фон  
3. Истекающие в течение недели - оранжевый фон
4. Истекшие - серый фон

### Валидация данных
1. Тип исключения - выпадающий список: Полное, Временное, Частичное
2. Дата - календарь
3. Тип клуба - выпадающий список: Один, Сеть

## 📊 Дашборд в Google Sheets

Создайте лист "Статистика" с формулами:
- Всего исключений: `=COUNTA(Exclusions!A:A)-1`
- Активных клиентов: `=COUNTIF(Exclusions!D:D,"Полное")`
- Временных: `=COUNTIF(Exclusions!D:D,"Временное")`
- Добавлено за месяц: `=COUNTIFS(Exclusions!I:I,">="&TODAY()-30)`

## 🚀 Преимущества подхода

1. **Прозрачность** - все видят актуальный список
2. **Контроль** - история всех изменений
3. **Гибкость** - легко добавлять новые поля
4. **Доступность** - работает с любого устройства
5. **Интеграция** - API для автоматизации

## 🔐 Безопасность

1. Используйте Service Account для n8n
2. Ограничьте права только на нужные листы
3. Включите двухфакторную аутентификацию
4. Регулярно проверяйте список пользователей

Теперь поставщик может сам управлять исключениями, а система автоматически их подхватывает!