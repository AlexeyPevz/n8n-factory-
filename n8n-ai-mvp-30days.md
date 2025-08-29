# 30-дневный план создания MVP n8n AI

## Цель MVP
Работающий прототип, который из текста "Каждый день в 9 утра проверяй погоду и отправь в Slack если > 25°C" создает валидный n8n workflow.

## Week 1: Базовая инфраструктура

### День 1-2: Окружение
```bash
# Простой подход - не форкаем, работаем рядом
mkdir n8n-ai-mvp
cd n8n-ai-mvp
npm init -y

# Минимальный стек
npm install express openai zod
npm install -D typescript @types/node nodemon

# Запускаем n8n локально
npx n8n
```

### День 3-4: Извлекаем схемы нод
```typescript
// scripts/extract-schemas.ts
// Парсим исходники n8n и создаем JSON схемы
// Фокус на 10 самых популярных нодах:
// - Manual Trigger
// - HTTP Request  
// - Set
// - IF
// - Slack
// - Google Sheets
// - Webhook
// - Schedule Trigger
// - Postgres
// - Code

// Сохраняем в schemas/nodes/
```

### День 5-7: Простейший генератор
```typescript
// src/generator/simple.ts
export async function generateWorkflow(description: string) {
  // 1. GPT-4 разбивает на шаги
  // 2. Мапим шаги на ноды
  // 3. Создаем connections
  // 4. Возвращаем JSON
}
```

## Week 2: Core AI логика

### День 8-10: Schema-Guided Generation
```typescript
// src/agents/builder.ts
const SYSTEM_PROMPT = `
You generate n8n workflows. Output ONLY valid JSON.
Available nodes: ${JSON.stringify(nodeSchemas)}
Output format: ${workflowSchema}
`;

// Жесткая валидация output
// Retry при невалидном JSON
```

### День 11-12: Тестовые сценарии
```typescript
// tests/scenarios.ts
const testCases = [
  "Send daily weather to Slack",
  "Sync Google Sheets to Postgres hourly",
  "When webhook received, update Notion",
  "Every Monday email report from database"
];
```

### День 13-14: UI прототип
```html
<!-- Простейший веб-интерфейс -->
<!DOCTYPE html>
<html>
<head>
  <title>n8n AI Generator</title>
  <script src="https://unpkg.com/vue@3"></script>
</head>
<body>
  <div id="app">
    <textarea v-model="description" 
      placeholder="Describe your workflow...">
    </textarea>
    <button @click="generate">Generate</button>
    <pre>{{ workflow }}</pre>
    <button @click="copyToClipboard">Copy JSON</button>
  </div>
</body>
</html>
```

## Week 3: Интеграция и полировка

### День 15-17: Прямая интеграция
```typescript
// src/n8n-integration/importer.ts
export async function importToN8n(workflow: any) {
  // POST to n8n API
  // или генерим ссылку для импорта
  const importUrl = `http://localhost:5678/workflows/import?data=${
    encodeURIComponent(JSON.stringify(workflow))
  }`;
}
```

### День 18-20: Обработка ошибок
- Валидация connections
- Проверка required полей
- Человекочитаемые ошибки

### День 21-22: 5 killer demos
1. **CRM Integration**: "Sync new Typeform leads to Pipedrive"
2. **DevOps Alert**: "Monitor API, alert Slack if down"  
3. **Data Pipeline**: "Daily CSV from FTP to PostgreSQL"
4. **Marketing Auto**: "Tweet new blog posts with AI summary"
5. **HR Workflow**: "Parse resumes and update Notion database"

## Week 4: Подготовка к презентации

### День 23-25: Метрики и данные
```typescript
// Собираем статистику
{
  "success_rate": "85%", 
  "avg_generation_time": "3.2s",
  "nodes_supported": 15,
  "test_workflows": 50,
  "complex_workflows": 10
}
```

### День 26-27: Видео и материалы
- 3-минутное демо видео
- 10 слайдов презентации
- Живая демо среда

### День 28-30: Обратная связь
- Показать 10 людям из n8n community
- Зафиксировать feedback
- Quick fixes критичных багов

## Структура MVP проекта
```
n8n-ai-mvp/
├── src/
│   ├── agents/
│   │   ├── planner.ts      # Разбивает задачу
│   │   └── builder.ts      # Создает JSON
│   ├── schemas/
│   │   ├── nodes/          # Схемы нод
│   │   └── workflow.ts     # Схема workflow
│   ├── validator/
│   │   └── index.ts        # Zod валидация
│   └── api/
│       └── server.ts       # Express API
├── web/
│   └── index.html          # Simple UI
├── demos/
│   └── [5 example workflows]
└── README.md
```

## Критерии успеха MVP

✅ Генерирует простые 3-5 нодовые workflows
✅ 80%+ валидных с первой попытки  
✅ Поддерживает 15 популярных нод
✅ Работает за <5 секунд
✅ Импортируется в n8n одним кликом

## Что НЕ делаем в MVP

❌ Сложный UI
❌ Аутентификацию  
❌ Обработку credentials
❌ Workflow map
❌ Multi-agent оркестрацию

## Бюджет: ~$1000

- OpenAI API: $200
- Хостинг demo: $50  
- Domain: $20
- Время: 120 часов
- Фрилансер помощь: $700

## После MVP

1. Показываем n8n team
2. Получаем feedback
3. Решаем: develop или sell
4. Ищем инвестиции/партнера

---

*Помните: Лучше работающий простой MVP, чем идеальный план!*