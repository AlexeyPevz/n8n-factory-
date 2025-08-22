# Настройка MTProto для WF-04 Sales Bot

## Что такое MTProto?

MTProto - это протокол Telegram для работы от имени обычного пользователя (не бота). Это позволяет:
- Писать первыми в личные сообщения
- Видеть онлайн-статус
- Получать уведомления о прочтении
- Работать как обычный пользователь

## Варианты реализации:

### 1. Telethon + Webhook сервер (Python)

```python
# mtproto_server.py
from telethon import TelegramClient, events
from flask import Flask, request, jsonify
import asyncio
import os

api_id = os.getenv('TELEGRAM_API_ID')
api_hash = os.getenv('TELEGRAM_API_HASH')
phone = os.getenv('TELEGRAM_PHONE')

app = Flask(__name__)
client = TelegramClient('session', api_id, api_hash)

@client.on(events.NewMessage(incoming=True))
async def handle_new_message(event):
    # Отправляем в n8n webhook
    webhook_url = os.getenv('N8N_WEBHOOK_URL')
    data = {
        'message': {
            'text': event.message.text,
            'from': {
                'id': event.sender_id,
                'first_name': event.sender.first_name
            },
            'chat': {
                'id': event.chat_id
            }
        }
    }
    requests.post(webhook_url, json=data)

@app.route('/send', methods=['POST'])
async def send_message():
    data = request.json
    chat_id = data['chat_id']
    message = data['message']
    
    await client.send_message(chat_id, message, parse_mode='md')
    return jsonify({'success': True})

if __name__ == '__main__':
    client.start(phone)
    app.run(port=5000)
```

### 2. Готовое решение - MadelineProto (PHP)

```bash
# Установка
composer require danog/madelineproto

# Запуск webhook сервера
php mtproto_webhook.php
```

### 3. Docker контейнер

```yaml
# docker-compose.yml
version: '3.8'

services:
  mtproto:
    image: ghcr.io/nitrogram/mtproto-bridge:latest
    environment:
      - TELEGRAM_API_ID=${TELEGRAM_API_ID}
      - TELEGRAM_API_HASH=${TELEGRAM_API_HASH}
      - TELEGRAM_PHONE=${TELEGRAM_PHONE}
      - WEBHOOK_URL=http://n8n:5678/webhook/mtproto-incoming
      - API_TOKEN=${MTPROTO_API_TOKEN}
    ports:
      - "5000:5000"
    volumes:
      - ./sessions:/app/sessions
```

## Настройка в n8n:

### 1. Переменные окружения:
```bash
# MTProto API
MTPROTO_API_URL=http://localhost:5000
MTPROTO_API_TOKEN=your-secret-token
MTPROTO_WEBHOOK_SECRET=webhook-secret

# Telegram App (получить на https://my.telegram.org)
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your-api-hash
TELEGRAM_PHONE=+79991234567
```

### 2. Credentials в n8n:

**MTProto API Auth:**
- Type: Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer ${MTPROTO_API_TOKEN}`

**MTProto Webhook Secret:**
- Type: Header Auth  
- Header Name: `X-Webhook-Secret`
- Header Value: `${MTPROTO_WEBHOOK_SECRET}`

## Важные моменты:

1. **Безопасность:**
   - Используйте отдельный номер для бизнеса
   - Храните сессии в защищенном месте
   - Используйте strong authentication

2. **Лимиты Telegram:**
   - Не более 30 сообщений в минуту новым контактам
   - Не более 1 сообщения в секунду одному пользователю
   - Соблюдайте правила Telegram

3. **Рекомендации:**
   - Добавьте задержки между сообщениями
   - Используйте человекоподобные паттерны
   - Не спамьте

## Альтернатива - WhatsApp Business API

Если MTProto слишком сложен, рассмотрите WhatsApp Business API:
- Официальная поддержка
- Простая интеграция
- Шаблоны сообщений
- Массовые рассылки

## Поддержка

При проблемах с настройкой:
1. Проверьте логи MTProto сервера
2. Убедитесь в правильности credentials
3. Проверьте webhook connectivity
4. Обратитесь к документации выбранной библиотеки