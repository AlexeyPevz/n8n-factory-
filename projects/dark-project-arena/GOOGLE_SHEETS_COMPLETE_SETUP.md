{
  "name": "Google Sheets Sync",
  "nodes": [
    {
      "id": "cron-sync",
      "name": "Sync Every 30 min",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [{
            "mode": "custom",
            "cronExpression": "*/30 * * * *"
          }]
        }
      }
    },
    {
      "id": "read-cities",
      "name": "Read Cities",
      "type": "n8n-nodes-base.googleSheets",
      "position": [450, 200],
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "read",
        "sheetId": "={{ $staticData.GOOGLE_SHEET_ID }}",
        "range": "Города!A2:I",
        "options": {
          "returnAllMatches": true,
          "dataStartRow": 2
        }
      }
    },
    {
      "id": "read-exclusions",
      "name": "Read Exclusions",
      "type": "n8n-nodes-base.googleSheets",
      "position": [450, 300],
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "read",
        "sheetId": "={{ $staticData.GOOGLE_SHEET_ID }}",
        "range": "Исключения!A2:K",
        "options": {
          "returnAllMatches": true,
          "dataStartRow": 2
        }
      }
    },
    {
      "id": "read-patterns",
      "name": "Read Patterns",
      "type": "n8n-nodes-base.googleSheets",
      "position": [450, 400],
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "read",
        "sheetId": "={{ $staticData.GOOGLE_SHEET_ID }}",
        "range": "Шаблоны исключений!A2:E",
        "options": {
          "returnAllMatches": true,
          "dataStartRow": 2
        }
      }
    },
    {
      "id": "read-config",
      "name": "Read Config",
      "type": "n8n-nodes-base.googleSheets",
      "position": [450, 500],
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "read",
        "sheetId": "={{ $staticData.GOOGLE_SHEET_ID }}",
        "range": "Конфигурация!A2:C",
        "options": {
          "returnAllMatches": true,
          "dataStartRow": 2
        }
      }
    },
    {
      "id": "transform-data",
      "name": "Transform Data",
      "type": "n8n-nodes-base.function",
      "position": [650, 350],
      "parameters": {
        "functionCode": "// Преобразуем данные из таблиц в удобный формат\nconst cities = $node['Read Cities'].json.map(row => ({\n  city: row['Город'],\n  region: row['Регион'],\n  priority: row['Приоритет'],\n  population: parseInt(row['Население']),\n  cityId2gis: row['ID 2GIS'],\n  lat: parseFloat(row['Широта']),\n  lon: parseFloat(row['Долгота']),\n  active: row['Активен'] === 'ДА'\n})).filter(c => c.active);\n\nconst exclusions = $node['Read Exclusions'].json.map(row => ({\n  clubName: row['Название клуба'],\n  type: row['Тип'],\n  city: row['Город'],\n  exclusionType: row['Тип исключения'],\n  reason: row['Причина'],\n  validUntil: row['Действует до'],\n  channels: row['Каналы'],\n  addedBy: row['Добавил'],\n  status: row['Статус']\n})).filter(e => e.status === 'Активно');\n\nconst patterns = $node['Read Patterns'].json.map(row => ({\n  pattern: row['Шаблон'],\n  type: row['Тип'],\n  action: row['Действие'],\n  reason: row['Причина'],\n  active: row['Активен'] === 'ДА'\n})).filter(p => p.active);\n\nconst config = {};\n$node['Read Config'].json.forEach(row => {\n  config[row['Параметр']] = row['Значение'];\n});\n\nreturn [{\n  json: {\n    cities,\n    exclusions,\n    patterns,\n    config,\n    lastSync: new Date().toISOString()\n  }\n}];"
      }
    },
    {
      "id": "update-redis",
      "name": "Update Redis Cache",
      "type": "n8n-nodes-base.redis",
      "position": [850, 350],
      "parameters": {
        "operation": "set",
        "key": "darkproject:sheets:data",
        "value": "={{ JSON.stringify($json) }}",
        "expire": true,
        "ttl": 3600
      }
    },
    {
      "id": "log-sync",
      "name": "Log Sync",
      "type": "n8n-nodes-base.googleSheets",
      "position": [1050, 350],
      "parameters": {
        "authentication": "serviceAccount",
        "operation": "append",
        "sheetId": "={{ $staticData.GOOGLE_SHEET_ID }}",
        "range": "Журнал!A:F",
        "options": {
          "valueInputMode": "USER_ENTERED"
        },
        "dataMode": "autoMapInputData",
        "fieldsUi": {
          "values": [
            {
              "column": "Дата/Время",
              "fieldValue": "={{ new Date().toISOString() }}"
            },
            {
              "column": "Действие",
              "fieldValue": "Синхронизация данных"
            },
            {
              "column": "Объект",
              "fieldValue": "Все листы"
            },
            {
              "column": "Детали",
              "fieldValue": "={{ 'Города: ' + $json.cities.length + ', Исключения: ' + $json.exclusions.length }}"
            },
            {
              "column": "Пользователь",
              "fieldValue": "Система"
            },
            {
              "column": "Workflow",
              "fieldValue": "Google Sync"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Sync Every 30 min": {
      "main": [[
        {"node": "Read Cities", "type": "main", "index": 0},
        {"node": "Read Exclusions", "type": "main", "index": 0},
        {"node": "Read Patterns", "type": "main", "index": 0},
        {"node": "Read Config", "type": "main", "index": 0}
      ]]
    },
    "Read Cities": {
      "main": [[{"node": "Transform Data", "type": "main", "index": 0}]]
    },
    "Read Exclusions": {
      "main": [[{"node": "Transform Data", "type": "main", "index": 0}]]
    },
    "Read Patterns": {
      "main": [[{"node": "Transform Data", "type": "main", "index": 0}]]
    },
    "Read Config": {
      "main": [[{"node": "Transform Data", "type": "main", "index": 0}]]
    },
    "Transform Data": {
      "main": [[{"node": "Update Redis Cache", "type": "main", "index": 0}]]
    },
    "Update Redis Cache": {
      "main": [[{"node": "Log Sync", "type": "main", "index": 0}]]
    }
  },
  "staticData": {
    "GOOGLE_SHEET_ID": "YOUR_GOOGLE_SHEET_ID_HERE"
  }
}