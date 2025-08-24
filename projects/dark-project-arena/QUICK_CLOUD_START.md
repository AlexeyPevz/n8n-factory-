# 🚀 Быстрый старт Dark Project Arena в облаке за 30 минут

## ✅ Что мы настроим

1. **Redis в облаке** (Upstash) - для кеширования
2. **Qdrant в облаке** - для базы знаний AI
3. **n8n** - локально или в облаке
4. **MTProto** - на минимальном VPS

## 📝 Шаг 1: Регистрация в сервисах (10 минут)

### 1.1 Upstash Redis
1. Откройте https://console.upstash.com/
2. Нажмите "Sign Up" → войдите через Google/GitHub
3. Создайте базу данных:
   - Name: `darkproject`
   - Region: выберите ближайший (Europe для РФ)
   - Type: Regional
   - Нажмите "Create"
4. Скопируйте данные со страницы "Details":
   ```
   Endpoint: eu1-example-12345.upstash.io:12345
   Password: скопируйте пароль
   ```

### 1.2 Qdrant Cloud
1. Откройте https://cloud.qdrant.io/
2. Зарегистрируйтесь через Google/GitHub
3. Нажмите "Create Cluster":
   - Cluster name: `dark-project`
   - Cloud: AWS
   - Region: eu-central-1
   - Plan: Free (1GB)
4. После создания нажмите на кластер и скопируйте:
   ```
   Cluster URL: https://xxxxx.eu-central.aws.cloud.qdrant.io
   API Key: нажмите "Create API Key" и скопируйте
   ```

### 1.3 VPS для MTProto (Beget)
1. Откройте https://beget.com/ru/vps
2. Выберите тариф "Старт" (199₽/мес)
3. ОС: Ubuntu 22.04
4. После оплаты получите доступы на email

## 🔧 Шаг 2: Настройка окружения (10 минут)

### 2.1 Создайте .env файл
```bash
# В папке проекта
cp .env.cloud.example .env
```

### 2.2 Заполните переменные из шага 1:
```bash
# REDIS (Upstash)
REDIS_HOST=eu1-example-12345.upstash.io
REDIS_PORT=12345
REDIS_PASSWORD=ваш_пароль_из_upstash
REDIS_TLS=true

# QDRANT
QDRANT_URL=https://xxxxx.eu-central.aws.cloud.qdrant.io
QDRANT_API_KEY=ваш_api_key
```

### 2.3 Настройте MTProto на VPS

SSH подключение к VPS:
```bash
ssh root@ваш_ip_адрес
```

Установка Docker одной командой:
```bash
curl -fsSL https://get.docker.com | sh
```

Создайте docker-compose.yml для MTProto:
```yaml
version: '3.8'
services:
  mtproto:
    image: madmaximum/mtproto-api
    ports:
      - "8080:8080"
    environment:
      - API_ID=ваш_api_id
      - API_HASH=ваш_api_hash
    volumes:
      - ./sessions:/sessions
    restart: always
```

Запустите:
```bash
docker-compose up -d
```

## 🎯 Шаг 3: Настройка n8n (10 минут)

### Вариант A: n8n.cloud (проще)
1. Зарегистрируйтесь на https://n8n.cloud
2. Получите инстанс
3. Webhook URL будет: `https://your-instance.app.n8n.cloud/webhook`

### Вариант B: Локально с ngrok
1. Установите ngrok: https://ngrok.com/download
2. Запустите n8n локально
3. В другом терминале:
   ```bash
   ngrok http 5678
   ```
4. Используйте ngrok URL для webhooks

### 3.1 Импорт workflow
1. В n8n нажмите "Import from File"
2. Импортируйте все workflow из папки `/workflows/`
3. Скопируйте ID каждого workflow в .env

### 3.2 Настройка Credentials

**Redis (Upstash):**
- Type: Redis
- Host: из REDIS_HOST
- Port: из REDIS_PORT  
- Password: из REDIS_PASSWORD
- SSL: ✓

**Qdrant:**
- Type: HTTP Header Auth
- Header Name: `api-key`
- Header Value: из QDRANT_API_KEY

## ✅ Проверка работоспособности

### 1. Тест Redis
В n8n создайте простой workflow:
```
Manual Trigger → Redis (SET key=test, value=123) → Redis (GET key=test)
```

### 2. Тест Qdrant
```
Manual Trigger → HTTP Request:
GET {{QDRANT_URL}}/collections
Headers: api-key={{QDRANT_API_KEY}}
```

### 3. Тест полного workflow
1. Запустите "Google Sheets Sync"
2. Проверьте логи выполнения
3. Создайте тестовый лид

## 🚨 Частые проблемы и решения

### "Connection timeout" к Redis
- Проверьте REDIS_TLS=true
- Убедитесь что порт правильный

### "Unauthorized" от Qdrant  
- Проверьте правильность API ключа
- Убедитесь что используете header name: `api-key`

### "Webhook не работает"
- Для локального n8n используйте ngrok
- Проверьте что URL в .env совпадает с реальным

## 💡 Советы по оптимизации

1. **Мониторинг использования:**
   - Upstash: Dashboard → Usage
   - Qdrant: Cluster → Metrics

2. **Бесплатные лимиты:**
   - Upstash: 10k команд/день
   - Qdrant: 1GB хранилище

3. **Когда нужно платить:**
   - При 100+ лидах в день
   - При большой базе знаний (>1GB)

## 📱 Финальный чеклист

- [ ] Redis подключен и работает
- [ ] Qdrant доступен по API
- [ ] MTProto запущен на VPS
- [ ] n8n импортированы все workflow
- [ ] Webhook URL доступны извне
- [ ] .env заполнен всеми переменными
- [ ] Тестовый запуск прошел успешно

---

Готово! Ваш Dark Project Arena работает в облаке 🎉