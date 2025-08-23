# 📋 Пошаговая инструкция по настройке переменных окружения Dark Project Arena
## Для начинающих - как для пятиклассника

---

## 🎯 Что такое переменные окружения и зачем они нужны?

Представьте, что вы играете в компьютерную игру, где нужно ввести своё имя, выбрать сервер и настроить управление. Переменные окружения - это как раз такие настройки, только для нашей программы Dark Project Arena.

Они нужны чтобы:
- Программа знала, куда отправлять сообщения в Telegram
- Могла подключиться к вашему Bitrix24
- Использовала правильные API ключи для карт и AI
- Знала ID ваших workflow в n8n

---

## 📁 Шаг 1: Создание файла .env

### Что такое файл .env?
Это специальный файл, где хранятся все ваши секретные настройки. Он называется ".env" (с точкой в начале).

### Как создать:

1. **Откройте папку проекта** `/workspace/projects/dark-project-arena/`

2. **Найдите файл** `.env.example` - это шаблон с примерами

3. **Скопируйте его:**
   - В Windows: правый клик → Копировать → правый клик → Вставить
   - В терминале: `cp .env.example .env`

4. **Переименуйте копию** из `.env.example` в `.env`
   - Внимание: файл должен называться именно `.env` (с точкой, без .example)

5. **Откройте файл .env** в любом текстовом редакторе (Блокнот, VS Code, nano)

---

## 📝 Шаг 2: Заполнение переменных - ПО ПОРЯДКУ

### 🔧 Блок 1: ID ваших Workflow в n8n

После импорта workflow в n8n, вам нужно скопировать их ID:

1. **Откройте n8n** (обычно http://localhost:5678)
2. **Импортируйте workflow** из папки `/workflows/`
3. **После импорта посмотрите на адресную строку:**
   ```
   http://localhost:5678/workflow/abc123def456
                                   ↑ вот этот ID
   ```
4. **Вставьте ID в файл .env:**
   ```bash
   WF_01_WORKFLOW_ID=abc123def456
   WF_02_WORKFLOW_ID=ghi789jkl012
   # и так далее для всех 6 workflow
   ```

### 📊 Блок 2: Google Sheets

1. **Создайте Google таблицу:**
   - Откройте https://sheets.new
   - Назовите "Dark Project Arena - Управление"

2. **Скопируйте ID таблицы из адресной строки:**
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                          ↑ вот этот длинный ID
   ```

3. **Вставьте в .env:**
   ```bash
   GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```

### 💬 Блок 3: Telegram чаты

Вам нужно создать 3 группы в Telegram и получить их ID:

1. **Создайте группы в Telegram:**
   - "Dark Project - Админы" (для системных уведомлений)
   - "Dark Project - Продажи" (для уведомлений менеджерам)
   - "Dark Project - Поставщики" (для горячих лидов)

2. **Добавьте бота @RawDataBot в каждую группу**

3. **Бот покажет информацию о группе:**
   ```json
   "chat": {
     "id": -1001234567890,  ← вот этот ID нужен
     "title": "Dark Project - Админы",
     "type": "supergroup"
   }
   ```

4. **Вставьте ID в .env:**
   ```bash
   TELEGRAM_ADMIN_CHAT_ID=-1001234567890
   TELEGRAM_SALES_CHAT_ID=-1001234567891
   TELEGRAM_SUPPLIER_CHAT_ID=-1001234567892
   ```

⚠️ **ВАЖНО**: ID групп всегда начинаются с минуса! Не забудьте его скопировать!

### 🏢 Блок 4: Bitrix24

1. **Войдите в ваш Bitrix24**

2. **Получите webhook:**
   - Перейдите: Разработчикам → Другое → Входящий вебхук
   - Нажмите "Добавить вебхук"
   - Выберите права: CRM (полный доступ)
   - Сохраните

3. **Скопируйте URL вебхука:**
   ```
   https://your-company.bitrix24.ru/rest/1/abc123xyz789/
   ```

4. **Вставьте в .env:**
   ```bash
   BITRIX24_WEBHOOK_URL=https://your-company.bitrix24.ru/rest/1/abc123xyz789/
   ```
   ⚠️ **ВАЖНО**: URL должен заканчиваться на `/` (слэш)!

5. **Найдите ID пользователей:**
   - Откройте профиль менеджера по продажам
   - В адресной строке будет: `/company/personal/user/5/`
   - Число 5 - это ID пользователя
   
   ```bash
   SALES_MANAGER_ID=5
   ACCOUNT_MANAGER_ID=7
   ```

### 🗺️ Блок 5: API ключи для карт

#### Yandex Maps:
1. Перейдите на https://developer.tech.yandex.ru/
2. Войдите через Яндекс аккаунт
3. Создайте новый ключ для "JavaScript API и HTTP Геокодер"
4. Скопируйте ключ:
   ```bash
   YANDEX_MAPS_API_KEY=12345678-1234-1234-1234-123456789012
   ```

#### 2GIS:
1. Перейдите на https://dev.2gis.ru/
2. Зарегистрируйтесь
3. Создайте новый проект
4. Получите ключ API:
   ```bash
   TWOGIS_API_KEY=rujrdp1234
   ```

### 🤖 Блок 6: OpenAI (для AI агента)

1. Перейдите на https://platform.openai.com/
2. Войдите или зарегистрируйтесь
3. Перейдите в API keys
4. Create new secret key
5. Скопируйте ключ (он показывается только один раз!):
   ```bash
   OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456789
   ```

### 📧 Блок 7: Email поставщика

Укажите email для отправки горячих лидов:
```bash
SUPPLIER_EMAIL=sales@your-supplier.com
```

### 🔐 Блок 8: Telegram MTProto (для отправки сообщений)

Это самая сложная часть, но я объясню пошагово:

1. **Получите API credentials:**
   - Откройте https://my.telegram.org
   - Войдите через ваш номер телефона
   - Выберите "API development tools"
   - Создайте новое приложение:
     - App title: Dark Project Bot
     - Short name: darkprojectbot
     - Platform: Other
   - Скопируйте:
     ```bash
     TELEGRAM_API_ID=12345678
     TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
     ```

2. **Настройте MTProto сервер:**
   ```bash
   MTPROTO_API_URL=http://localhost:5000
   MTPROTO_API_TOKEN=my-secret-token-12345
   ```

### 📮 Блок 9: Email настройки (опционально)

Если хотите отправлять email:

Для Gmail:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # НЕ обычный пароль! См. ниже
```

**Как получить App Password для Gmail:**
1. Включите двухфакторную аутентификацию
2. Перейдите в https://myaccount.google.com/apppasswords
3. Создайте новый пароль для "Mail"
4. Используйте его вместо обычного пароля

---

## ✅ Шаг 3: Проверка файла .env

Ваш готовый файл должен выглядеть примерно так:

```bash
# ===== WORKFLOW IDs =====
WF_01_WORKFLOW_ID=abc123def456
WF_02_WORKFLOW_ID=ghi789jkl012
WF_03_WORKFLOW_ID=mno345pqr678
WF_04_WORKFLOW_ID=stu901vwx234
WF_05_WORKFLOW_ID=yza567bcd890
WF_06_WORKFLOW_ID=efg123hij456

# ===== GOOGLE SHEETS =====
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# ===== TELEGRAM =====
TELEGRAM_ADMIN_CHAT_ID=-1001234567890
TELEGRAM_SALES_CHAT_ID=-1001234567891
TELEGRAM_SUPPLIER_CHAT_ID=-1001234567892

# ===== BITRIX24 =====
BITRIX24_WEBHOOK_URL=https://your-company.bitrix24.ru/rest/1/abc123xyz789/
SALES_MANAGER_ID=5
ACCOUNT_MANAGER_ID=7

# ===== API KEYS =====
YANDEX_MAPS_API_KEY=12345678-1234-1234-1234-123456789012
TWOGIS_API_KEY=rujrdp1234
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456789

# ===== EMAIL =====
SUPPLIER_EMAIL=sales@your-supplier.com

# ===== TELEGRAM MTPROTO =====
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
MTPROTO_API_URL=http://localhost:5000
MTPROTO_API_TOKEN=my-secret-token-12345
```

---

## 📍 Шаг 4: Где сохранить файл .env?

### Вариант 1: Для Docker установки n8n
Сохраните в папке где запускаете docker-compose:
```
/home/user/n8n/
├── docker-compose.yml
├── .env              ← здесь
└── data/
```

### Вариант 2: Для обычной установки n8n
Сохраните в домашней папке n8n:
```
~/.n8n/
├── .env              ← здесь
├── nodes/
└── credentials/
```

### Вариант 3: Через интерфейс n8n (рекомендуется)
1. Откройте n8n
2. Settings → Environment Variables
3. Добавьте каждую переменную через интерфейс
4. Сохраните

---

## 🔒 Шаг 5: Безопасность

### ⚠️ ОЧЕНЬ ВАЖНО:

1. **НИКОГДА не загружайте .env файл в Git/GitHub!**
2. **Добавьте .env в .gitignore:**
   ```bash
   echo ".env" >> .gitignore
   ```

3. **Храните резервную копию в безопасном месте** (зашифрованный архив)

4. **Не отправляйте .env файл по email или мессенджерам**

5. **Используйте разные ключи для тестов и продакшена**

---

## 🚨 Частые ошибки и их решение

### Ошибка: "Environment variable X not found"
**Причина**: Переменная не задана или n8n её не видит
**Решение**: 
- Проверьте написание переменной (регистр важен!)
- Перезапустите n8n после изменения .env

### Ошибка: "Invalid API key"
**Причина**: Неправильный ключ или истёк срок
**Решение**: 
- Проверьте, полностью ли скопирован ключ
- Проверьте, активен ли ключ в личном кабинете сервиса

### Ошибка: "Chat not found" в Telegram
**Причина**: Неправильный ID чата или бот не добавлен в группу
**Решение**: 
- Проверьте минус в начале ID группы
- Убедитесь, что бот добавлен в группу и имеет права отправлять сообщения

### Ошибка: "Bitrix24 webhook error"
**Причина**: Неправильный URL или нет прав
**Решение**: 
- Проверьте слэш в конце URL
- Проверьте права вебхука в Bitrix24

---

## 📞 Нужна помощь?

Если что-то не получается:

1. **Проверьте каждую переменную** - часто проблема в опечатке
2. **Посмотрите логи n8n** - там обычно понятная ошибка
3. **Используйте тестовые значения** для проверки
4. **Начните с минимума** - сначала настройте только обязательные переменные

---

## ✅ Чек-лист: Всё ли готово?

- [ ] Файл .env создан и находится в правильной папке
- [ ] Все ID workflow заполнены
- [ ] Google Sheets ID указан
- [ ] Все 3 Telegram chat ID заполнены (с минусами!)
- [ ] Bitrix24 webhook URL заканчивается на /
- [ ] API ключи Yandex и 2GIS получены и вставлены
- [ ] OpenAI ключ начинается с sk-
- [ ] Email поставщика указан
- [ ] Telegram API credentials получены
- [ ] Файл .env добавлен в .gitignore
- [ ] n8n перезапущен после создания .env

Если все галочки стоят - поздравляю! Ваша система готова к запуску! 🎉