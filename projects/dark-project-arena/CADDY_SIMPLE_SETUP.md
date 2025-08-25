# 🚀 Запуск Dark Project Arena с Caddy за 15 минут

## 🎯 Почему Caddy вместо Traefik?

- **Автоматический HTTPS** - не нужно настраивать Let's Encrypt
- **Простейшая конфигурация** - 5 строк вместо 50
- **Работает из коробки** - меньше шансов что-то сломать
- **Отлично работает на Beget** - проверено!

## 📋 Что нужно подготовить

1. Домен, направленный на ваш сервер
2. Docker и docker-compose установлены
3. Базовые данные для .env файла

## 🔧 Пошаговая настройка

### Шаг 1: Создайте структуру папок
```bash
mkdir -p dark-project-arena
cd dark-project-arena
mkdir -p n8n_data redis_data qdrant_data mtproto_sessions
```

### Шаг 2: Создайте .env файл
```bash
nano .env
```

Содержимое:
```bash
# Ваш домен
DOMAIN=your-domain.com

# n8n настройки
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Bitrix24
BITRIX24_WEBHOOK_URL=https://your.bitrix24.ru/rest/1/webhook/

# API ключи
YANDEX_MAPS_API_KEY=your_key
TWOGIS_API_KEY=your_key
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# MTProto (получите на my.telegram.org)
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_hash

# Workflow IDs (заполните после импорта)
WF_00_WORKFLOW_ID=
WF_01_WORKFLOW_ID=
WF_02_WORKFLOW_ID=
WF_03_WORKFLOW_ID=
WF_04_WORKFLOW_ID=
WF_05_WORKFLOW_ID=
```

### Шаг 3: Создайте docker-compose.yml
```yaml
version: '3.8'

services:
  # Caddy - наш reverse proxy с автоматическим SSL
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - DOMAIN=${DOMAIN}

  # n8n - основное приложение
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=n8n.${DOMAIN}
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://n8n.${DOMAIN}/
      - N8N_BASIC_AUTH_ACTIVE=${N8N_BASIC_AUTH_ACTIVE}
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./.env:/home/node/.env
    depends_on:
      - redis
      - qdrant

  # Redis для кеширования
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: redis-server --save 20 1 --loglevel warning
    volumes:
      - ./redis_data:/data

  # Qdrant для векторной базы знаний
  qdrant:
    image: qdrant/qdrant
    container_name: qdrant
    restart: unless-stopped
    volumes:
      - ./qdrant_data:/qdrant/storage

  # MTProto для отправки сообщений в Telegram
  mtproto:
    image: madmaximum/mtproto-api:latest
    container_name: mtproto
    restart: unless-stopped
    environment:
      - API_ID=${TELEGRAM_API_ID}
      - API_HASH=${TELEGRAM_API_HASH}
    volumes:
      - ./mtproto_sessions:/sessions
    ports:
      - "127.0.0.1:8081:8081"  # Только локально

volumes:
  caddy_data:
  caddy_config:
```

### Шаг 4: Создайте Caddyfile
```bash
nano Caddyfile
```

Содержимое:
```
# n8n
n8n.{$DOMAIN} {
    reverse_proxy n8n:5678
    
    # Увеличиваем таймауты для длительных операций
    reverse_proxy {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}

# Qdrant (опционально, если нужен внешний доступ)
qdrant.{$DOMAIN} {
    reverse_proxy qdrant:6333
    
    # Базовая авторизация для безопасности
    basicauth {
        admin $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx4IjWJPDhjvG  # password: changeme
    }
}

# MTProto API (только для внутреннего использования)
# НЕ выставляйте наружу!
```

### Шаг 5: Запустите всё
```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Шаг 6: Первичная настройка n8n

1. Откройте https://n8n.your-domain.com
2. Введите логин/пароль из .env
3. Создайте аккаунт n8n
4. Импортируйте workflow из папки /workflows/
5. Скопируйте ID каждого workflow в .env

### Шаг 7: Настройка Credentials в n8n

#### Redis:
- Type: Redis
- Host: redis
- Port: 6379
- Database: 0

#### Qdrant:
- Type: HTTP Header Auth
- Header Name: api-key
- Header Value: (оставьте пустым для локального)
- В нодах используйте URL: http://qdrant:6333

#### OpenRouter:
- Type: OpenAI API
- API Key: ваш OpenRouter ключ
- Base URL: https://openrouter.ai/api/v1

## ✅ Проверка работоспособности

### 1. Проверка Caddy и SSL:
```bash
curl -I https://n8n.your-domain.com
# Должен вернуть HTTP/2 200 и показать валидный сертификат
```

### 2. Проверка Redis:
В n8n создайте тестовый workflow:
- Manual Trigger → Redis Set (key: test, value: 123) → Redis Get (key: test)

### 3. Проверка Qdrant:
```bash
curl http://localhost:6333/collections
# Должен вернуть {"result":{"collections":[]},"status":"ok"}
```

### 4. Проверка MTProto:
```bash
curl http://localhost:8081/health
# Должен вернуть {"status":"ok"}
```

## 🚨 Решение частых проблем

### "Connection refused" к Redis/Qdrant
```bash
# Проверьте, что контейнеры в одной сети
docker network ls
docker inspect n8n | grep NetworkMode
```

### "502 Bad Gateway" от Caddy
```bash
# Проверьте логи n8n
docker logs n8n

# Убедитесь, что n8n запустился на порту 5678
docker exec n8n netstat -tlpn
```

### SSL сертификат не получается
```bash
# Проверьте DNS
nslookup n8n.your-domain.com

# Проверьте доступность порта 80
telnet your-domain.com 80

# Посмотрите логи Caddy
docker logs caddy
```

## 🎉 Готово!

Теперь у вас работает:
- ✅ n8n с автоматическим SSL
- ✅ Redis для кеширования
- ✅ Qdrant для AI знаний
- ✅ MTProto для Telegram
- ✅ Всё в Docker контейнерах
- ✅ Автоматические сертификаты от Let's Encrypt

## 💡 Дополнительные советы

1. **Бэкапы**: 
```bash
# Создайте скрипт backup.sh
#!/bin/bash
tar -czf backup-$(date +%Y%m%d).tar.gz n8n_data redis_data qdrant_data
```

2. **Мониторинг**:
```bash
# Добавьте в crontab
*/5 * * * * docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v "Up" && curl -X POST your-webhook-url
```

3. **Обновления**:
```bash
docker-compose pull
docker-compose up -d
```

---

**Вопросы?** Проверьте логи: `docker-compose logs -f [service-name]`