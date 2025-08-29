# 🏠 Локальный n8n + Облачные сервисы

## 🎯 Ваша ситуация
- n8n нужно оставить локально
- Проблемы с Traefik/SSL/портами на Beget
- Нужны Redis и Qdrant без лишней головной боли

## ✅ Оптимальное решение

### 1. База данных → в облако

#### Redis → Upstash (БЕСПЛАТНО)
```bash
# Регистрация на https://console.upstash.com
# Создайте базу данных и получите:
REDIS_HOST=eu1-example-12345.upstash.io
REDIS_PORT=12345
REDIS_PASSWORD=ваш_пароль
REDIS_TLS=true
```

#### Qdrant → Qdrant Cloud (БЕСПЛАТНО до 1GB)
```bash
# Регистрация на https://cloud.qdrant.io
# Создайте кластер и получите:
QDRANT_URL=https://xxxxx.eu-central.aws.cloud.qdrant.io
QDRANT_API_KEY=ваш_api_key
```

### 2. Доступ к локальному n8n → 3 варианта

#### Вариант A: Cloudflare Tunnel (РЕКОМЕНДУЮ)
**Бесплатно, надежно, с автоматическим SSL**

```bash
# 1. Установка cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# 2. Авторизация (откроет браузер)
cloudflared tunnel login

# 3. Создание туннеля
cloudflared tunnel create n8n-local

# 4. Привязка к домену (если есть в Cloudflare)
cloudflared tunnel route dns n8n-local n8n.your-domain.com

# 5. Запуск туннеля
cloudflared tunnel run --url http://localhost:5678 n8n-local
```

**Результат**: 
- n8n доступен по https://n8n.your-domain.com
- Webhooks работают по https://n8n.your-domain.com/webhook/xxx
- Никаких открытых портов на сервере

#### Вариант B: Ngrok (для тестирования)
**Быстро, но URL меняется при перезапуске**

```bash
# Установка
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Запуск
ngrok http 5678

# Получите URL вида: https://abc123.ngrok.io
```

#### Вариант C: Tailscale VPN (для команды)
**Безопасный доступ без публичного URL**

```bash
# Установка
curl -fsSL https://tailscale.com/install.sh | sh

# Авторизация
sudo tailscale up

# Доступ к n8n через VPN
# http://your-machine-name:5678
```

### 3. MTProto → минимальный VPS

Поскольку MTProto должен работать постоянно, варианты:

#### Самый дешевый VPS:
- **FirstVDS** - от 99₽/мес
- **VDSina** - от 79₽/мес  
- **Hostinger** - $3.99/мес

#### Или используйте Oracle Cloud Free Tier:
```bash
# Бесплатный VPS навсегда
# 1 CPU, 1GB RAM - хватит для MTProto
# Регистрация на cloud.oracle.com
```

## 📝 Финальная конфигурация

### .env для локального n8n:
```bash
# ===== ОБЛАЧНЫЕ СЕРВИСЫ =====
# Redis (Upstash)
REDIS_HOST=eu1-example-12345.upstash.io
REDIS_PORT=12345
REDIS_PASSWORD=ваш_пароль_upstash
REDIS_TLS=true

# Qdrant Cloud
QDRANT_URL=https://xxxxx.eu-central.aws.cloud.qdrant.io
QDRANT_API_KEY=ваш_qdrant_api_key

# ===== WEBHOOKS (через Cloudflare Tunnel) =====
WEBHOOK_URL=https://n8n.your-domain.com/

# ===== ОСТАЛЬНОЕ БЕЗ ИЗМЕНЕНИЙ =====
BITRIX24_WEBHOOK_URL=https://your.bitrix24.ru/rest/1/xxx/
OPENROUTER_API_KEY=sk-or-v1-xxx
# и т.д.
```

### docker-compose.yml (упрощенный):
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"  # Только локально!
    environment:
      - N8N_HOST=n8n.your-domain.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.your-domain.com/
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./.env:/home/node/.env

  # Redis и Qdrant НЕ НУЖНЫ - используем облачные!
```

### systemd сервис для Cloudflare Tunnel:
```ini
# /etc/systemd/system/cloudflared.service
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run n8n-local
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 🔧 Настройка credentials в n8n

### 1. Redis (Upstash)
- Type: Redis
- Host: из REDIS_HOST
- Port: из REDIS_PORT
- Password: из REDIS_PASSWORD
- SSL/TLS: ✓ включить

### 2. Qdrant
В Qdrant Vector Store ноде:
- URL: из QDRANT_URL
- Credentials: HTTP Header Auth
  - Name: api-key
  - Value: из QDRANT_API_KEY

## ✅ Проверка работы

1. **Тест туннеля**:
   ```bash
   curl https://n8n.your-domain.com
   # Должен показать страницу входа n8n
   ```

2. **Тест Redis**:
   - Создайте простой workflow: Manual → Redis SET → Redis GET
   
3. **Тест Webhooks**:
   - Создайте Webhook node
   - URL будет: https://n8n.your-domain.com/webhook/xxx
   - Проверьте POST запросом

## 💰 Итоговые расходы

- **n8n**: локально (бесплатно)
- **Redis**: Upstash free tier (бесплатно)  
- **Qdrant**: free tier 1GB (бесплатно)
- **Cloudflare**: tunnel (бесплатно)
- **MTProto VPS**: 99-199₽/мес

**Итого**: 99-199₽/мес вместо полноценного сервера!

## 🚀 Команды для быстрого старта

```bash
# 1. Настройка Cloudflare Tunnel (5 минут)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
cloudflared tunnel login
cloudflared tunnel create n8n-local

# 2. Запуск n8n локально
docker-compose up -d n8n

# 3. Запуск туннеля
cloudflared tunnel run --url http://localhost:5678 n8n-local

# 4. Готово! n8n доступен по HTTPS
```

---

Это решение избавит вас от всех проблем с Traefik/SSL/портами, при этом n8n остается под вашим полным контролем!