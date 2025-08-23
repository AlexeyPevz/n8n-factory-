# Настройка OpenRouter для Dark Project Arena

## 🎯 Зачем использовать OpenRouter?

OpenRouter предоставляет единый API для доступа к различным языковым моделям:
- **Экономия**: Выбор оптимальной модели по соотношению цена/качество
- **Гибкость**: Доступ к моделям от OpenAI, Anthropic, DeepSeek, Mistral и др.
- **Надежность**: Автоматическое переключение между провайдерами
- **Совместимость**: Полная совместимость с OpenAI API

## 📋 Текущее использование в проекте

В Dark Project Arena используется:
- **Основная модель**: GPT-4 для AI агента "РОП 20Y"
- **Fallback модель**: GPT-3.5-turbo для экономии при ошибках
- **Интеграция**: через n8n LangChain nodes (`@n8n/n8n-nodes-langchain.lmChatOpenAi`)

## 🔧 Настройка OpenRouter

### Шаг 1: Получение API ключа OpenRouter

1. Зарегистрируйтесь на https://openrouter.ai/
2. Перейдите в раздел API Keys
3. Создайте новый ключ и скопируйте его

### Шаг 2: Настройка credentials в n8n

Поскольку OpenRouter совместим с OpenAI API, мы можем использовать существующие OpenAI credentials с модификацией:

1. В n8n перейдите в Credentials
2. Создайте новые credentials типа "OpenAI API"
3. Настройте следующим образом:

```
Name: OpenRouter API
API Key: <ваш OpenRouter API ключ>
Base URL: https://openrouter.ai/api/v1
```

### Шаг 3: Конфигурация моделей

#### Основная модель (через OpenRouter):
```json
{
  "model": "openai/gpt-4",  // или "anthropic/claude-3-opus" для Claude
  "temperature": 0.7,
  "maxTokens": 500
}
```

#### Доступные модели в OpenRouter:
- `openai/gpt-4` - оригинальный GPT-4
- `openai/gpt-4-turbo` - быстрая версия GPT-4
- `anthropic/claude-3-opus` - самая мощная модель Claude
- `anthropic/claude-3-sonnet` - баланс скорости и качества
- `deepseek/deepseek-chat` - экономичная альтернатива
- `mistralai/mistral-large` - мощная open-source модель

### Шаг 4: Настройка Fallback на прямой OpenAI API

Для максимальной надежности оставляем возможность использовать OpenAI напрямую:

1. Создайте отдельные credentials "OpenAI Direct":
```
Name: OpenAI Direct
API Key: <ваш OpenAI API ключ>
Base URL: https://api.openai.com/v1 (по умолчанию)
```

## 📝 Обновление workflow

### Вариант 1: Полный переход на OpenRouter

1. Откройте workflow `20250109_wf-04-sales-nurture-agent_v011.json`
2. Найдите ноды "GPT-4 Chat Model" и "GPT-3.5 Fallback Model"
3. Измените credentials на "OpenRouter API"
4. Обновите модели:
   - `gpt-4` → `openai/gpt-4` или `anthropic/claude-3-opus`
   - `gpt-3.5-turbo` → `openai/gpt-3.5-turbo` или `deepseek/deepseek-chat`

### Вариант 2: Гибридная схема (рекомендуется)

1. **Основной агент**: OpenRouter с выбором оптимальной модели
2. **Fallback**: прямой OpenAI API для критических случаев

Пример конфигурации:
```json
// Основная нода
{
  "id": "openai-chat-model-001",
  "name": "GPT-4 Chat Model (OpenRouter)",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "parameters": {
    "model": "anthropic/claude-3-sonnet",  // или любая другая
    "temperature": 0.7,
    "maxTokens": 500
  },
  "credentials": {
    "openAiApi": {
      "id": "OPENROUTER_API",
      "name": "OpenRouter API"
    }
  }
}

// Fallback нода
{
  "id": "fallback-chat-model-001",
  "name": "GPT-3.5 Direct Fallback",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "parameters": {
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "maxTokens": 500
  },
  "credentials": {
    "openAiApi": {
      "id": "OPENAI_DIRECT",
      "name": "OpenAI Direct"
    }
  }
}
```

## 🔍 Мониторинг и оптимизация

### Отслеживание расходов

OpenRouter предоставляет детальную статистику:
- Расход по каждой модели
- Количество токенов
- Стоимость запросов

### Рекомендации по выбору моделей

1. **Для первого контакта**: Claude-3-Sonnet (баланс качества и цены)
2. **Для сложных диалогов**: GPT-4 или Claude-3-Opus
3. **Для простых ответов**: DeepSeek или GPT-3.5-turbo
4. **Для технических вопросов**: GPT-4 или специализированные модели

## ⚠️ Важные моменты

1. **HTTP заголовки**: OpenRouter требует указания вашего приложения:
   ```
   HTTP-Referer: https://your-app.com
   X-Title: Dark Project Arena
   ```
   
2. **Rate limits**: У каждой модели свои лимиты, учитывайте это

3. **Стоимость**: Проверяйте актуальные цены на https://openrouter.ai/models

4. **Fallback стратегия**: Всегда имейте резервный вариант для критических операций

## 🚀 Переход на OpenRouter

1. Создайте аккаунт и получите API ключ
2. Настройте credentials в n8n
3. Обновите одну ноду для тестирования
4. Проверьте работу на тестовых лидах
5. При успехе - обновите остальные ноды
6. Настройте мониторинг расходов

## 📊 Ожидаемые результаты

- **Снижение затрат**: до 50% при правильном выборе моделей
- **Повышение скорости**: некоторые модели быстрее GPT-4
- **Гибкость**: возможность экспериментировать с разными моделями
- **Надежность**: автоматическое переключение между провайдерами

---

**Dark Project Arena** © 2025 | Умная оптимизация AI-расходов