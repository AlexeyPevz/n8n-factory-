# Исправление узла Conversational Agent

## Проблема
Узел агента может не отображаться корректно из-за версии или типа узла.

## Решение 1: Пересоздать узел вручную

1. **Удалите** текущий узел "Sales Agent РОП 20Y"

2. **Создайте новый узел**:
   - Нажмите "+" для добавления узла
   - В поиске введите одно из:
     - "Agent" 
     - "AI Agent"
     - "Conversational Agent"
     - "Chat"
     - "LangChain"

3. **Возможные типы узлов** (в зависимости от версии):
   - `@n8n/n8n-nodes-langchain.agent`
   - `@n8n/n8n-nodes-langchain.conversationalAgent` 
   - `n8n-nodes-base.aiAgent`
   - `@n8n/n8n-nodes-langchain.chainLlm`

## Решение 2: Использовать Basic LLM Chain

Если Conversational Agent не работает, создайте цепочку вручную:

1. **Добавьте узел "Basic LLM Chain"**
2. **Настройте**:
   ```
   Model: OpenAI Chat Model
   Prompt: [вставьте промпт из TEST_VIEW_PROMPT.md]
   ```

## Решение 3: Проверить установку пакетов

```bash
# Проверьте установленные узлы
ls ~/.n8n/nodes/

# Проверьте community nodes
cd ~/.n8n
npm list | grep langchain

# Переустановите если нужно
npm uninstall @n8n/n8n-nodes-langchain
npm install @n8n/n8n-nodes-langchain@latest

# Перезапустите n8n
```

## Решение 4: Альтернативная структура через HTTP Request

Если ничего не работает, можно использовать OpenAI напрямую:

```json
{
  "id": "openai-chat-direct",
  "name": "OpenAI Direct Chat",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "Bearer {{ $env.OPENAI_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "model",
          "value": "gpt-4"
        },
        {
          "name": "messages",
          "value": "={{ JSON.stringify([\n  {\n    role: 'system',\n    content: `[ВСТАВЬТЕ ПРОМПТ СЮДА]`\n  },\n  {\n    role: 'user',\n    content: $json.currentMessage\n  }\n]) }}"
        }
      ]
    }
  }
}
```

## Решение 5: Проверить в браузере

1. Откройте консоль браузера (F12)
2. Перейдите на вкладку Console
3. Кликните на узел агента
4. Выполните в консоли:
   ```javascript
   // Получить данные узла
   console.log($app.__vue__.workflow.nodes.find(n => n.name === 'Sales Agent РОП 20Y'))
   ```

## Что должно быть видно в правильно настроенном узле:

### Основная вкладка:
- **Prompt/System Message** - поле для промпта
- **Chat Model** - подключение к модели
- **Memory** - подключение к памяти
- **Tools** - подключенные инструменты

### Вкладка Options:
- **Max Iterations** - максимум итераций
- **Output Parser** - парсер вывода

## Если видите только пустой узел:

1. **Проверьте вкладки** - может быть несколько вкладок в панели узла
2. **Нажмите "Add Option"** - может открыть дополнительные поля
3. **Проверьте JSON вид** - там точно должны быть параметры
4. **Попробуйте другой браузер** - иногда помогает

## Крайний вариант - Function узел с вызовом OpenAI:

```javascript
// В Function узле
const messages = [
  {
    role: 'system',
    content: `[ПОЛНЫЙ ПРОМПТ АГЕНТА]`
  },
  {
    role: 'user', 
    content: $json.currentMessage
  }
];

// Здесь код для вызова OpenAI API
// ...

return items;
```