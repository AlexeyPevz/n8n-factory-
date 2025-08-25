# 🏗️ Архитектура кастомной CRM для Dark Project Arena

## 🎯 Почему кастомная CRM лучше Bitrix24?

### Проблемы с Bitrix24:
- Сложная настройка кастомных полей
- Ограничения API (лимиты запросов)
- Платные функции для автоматизации
- Избыточность для простых задач

### Преимущества кастомной CRM:
- Полный контроль над данными
- Нет лимитов API
- Оптимизирована под ваш процесс
- Дешевле в обслуживании
- Проще интеграция с n8n

## 📊 Архитектура системы

### 1. База данных (PostgreSQL/SQLite)

```sql
-- Таблица лидов
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Основная информация
    company_name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    
    -- Контакты
    phone VARCHAR(20),
    email VARCHAR(100),
    telegram_id VARCHAR(50),
    telegram_username VARCHAR(50),
    whatsapp VARCHAR(20),
    preferred_channel VARCHAR(20) DEFAULT 'telegram',
    
    -- Бизнес-данные
    estimated_pcs INTEGER DEFAULT 20,
    is_chain BOOLEAN DEFAULT FALSE,
    branch_count INTEGER DEFAULT 1,
    
    -- Статусы
    status VARCHAR(50) DEFAULT 'NEW',
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Коммуникация
    contact_count INTEGER DEFAULT 0,
    last_contact_at TIMESTAMP,
    next_contact_at TIMESTAMP,
    
    -- AI Agent данные
    dialog_history JSONB DEFAULT '[]'::jsonb,
    intent_history JSONB DEFAULT '[]'::jsonb,
    
    -- Источник
    source VARCHAR(50),
    source_data JSONB,
    
    -- Дедупликация
    UNIQUE(phone),
    UNIQUE(telegram_id)
);

-- Таблица коммуникаций
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    channel VARCHAR(20), -- telegram, whatsapp, email
    direction VARCHAR(10), -- in, out
    message TEXT,
    
    -- AI анализ
    intent VARCHAR(50),
    sentiment FLOAT,
    
    -- Метаданные
    metadata JSONB
);

-- Таблица задач
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    created_at TIMESTAMP DEFAULT NOW(),
    due_at TIMESTAMP,
    
    type VARCHAR(50), -- follow_up, send_kp, schedule_meeting
    status VARCHAR(20) DEFAULT 'pending',
    
    data JSONB
);

-- Аналитика
CREATE TABLE analytics (
    date DATE PRIMARY KEY,
    new_leads INTEGER DEFAULT 0,
    contacted_leads INTEGER DEFAULT 0,
    hot_leads INTEGER DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0
);

-- Индексы для производительности
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_next_contact ON leads(next_contact_at);
CREATE INDEX idx_communications_lead ON communications(lead_id);
CREATE INDEX idx_tasks_due ON tasks(due_at) WHERE status = 'pending';
```

### 2. Backend API (Node.js/FastAPI)

```javascript
// api/leads.js - Пример на Express.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Получить лиды для обработки
router.get('/leads/to-process', async (req, res) => {
    const leads = await db.query(`
        SELECT * FROM leads 
        WHERE status = 'NEW' 
        AND contact_count = 0
        ORDER BY priority DESC, estimated_pcs DESC
        LIMIT 10
    `);
    res.json(leads);
});

// Обновить статус лида
router.patch('/leads/:id/status', async (req, res) => {
    const { status, reason } = req.body;
    
    await db.query(`
        UPDATE leads 
        SET status = $1, 
            updated_at = NOW()
        WHERE id = $2
    `, [status, req.params.id]);
    
    // Логируем изменение
    await db.query(`
        INSERT INTO lead_status_history (lead_id, old_status, new_status, reason)
        VALUES ($1, $2, $3, $4)
    `, [req.params.id, oldStatus, status, reason]);
    
    res.json({ success: true });
});

// Добавить коммуникацию
router.post('/leads/:id/communications', async (req, res) => {
    const { channel, direction, message, intent } = req.body;
    
    const result = await db.query(`
        INSERT INTO communications (lead_id, channel, direction, message, intent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `, [req.params.id, channel, direction, message, intent]);
    
    // Обновляем счетчики
    await db.query(`
        UPDATE leads 
        SET contact_count = contact_count + 1,
            last_contact_at = NOW(),
            dialog_history = dialog_history || $1::jsonb
        WHERE id = $2
    `, [JSON.stringify({
        date: new Date(),
        from: direction === 'out' ? 'agent' : 'client',
        message: message,
        intent: intent
    }), req.params.id]);
    
    res.json(result.rows[0]);
});

// Поиск дубликатов
router.get('/leads/check-duplicate', async (req, res) => {
    const { phone, telegram_id } = req.query;
    
    const existing = await db.query(`
        SELECT id, company_name, status 
        FROM leads 
        WHERE phone = $1 OR telegram_id = $2
    `, [phone, telegram_id]);
    
    res.json({
        isDuplicate: existing.rows.length > 0,
        existing: existing.rows[0]
    });
});
```

### 3. Frontend Dashboard (React/Vue)

```jsx
// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart } from 'recharts';

function Dashboard() {
    const [stats, setStats] = useState({});
    const [leads, setLeads] = useState([]);
    
    return (
        <div className="dashboard">
            {/* Ключевые метрики */}
            <div className="metrics-grid">
                <MetricCard 
                    title="Новые лиды сегодня" 
                    value={stats.newLeadsToday} 
                    change="+12%"
                />
                <MetricCard 
                    title="Горячие лиды" 
                    value={stats.hotLeads} 
                    change="+25%"
                />
                <MetricCard 
                    title="Конверсия" 
                    value={`${stats.conversionRate}%`} 
                />
            </div>
            
            {/* Таблица лидов */}
            <LeadsTable 
                leads={leads}
                onStatusChange={handleStatusChange}
                onSendMessage={handleSendMessage}
            />
            
            {/* График коммуникаций */}
            <CommunicationChart data={stats.communicationsByDay} />
        </div>
    );
}

// Компонент карточки лида
function LeadCard({ lead }) {
    return (
        <div className="lead-card">
            <h3>{lead.company_name}</h3>
            <p>{lead.city} • {lead.estimated_pcs} ПК</p>
            
            <div className="lead-status">
                <StatusBadge status={lead.status} />
                <span>{lead.contact_count} контактов</span>
            </div>
            
            <div className="lead-actions">
                <button onClick={() => sendMessage(lead)}>
                    💬 Написать
                </button>
                <button onClick={() => updateStatus(lead)}>
                    📊 Изменить статус
                </button>
            </div>
            
            {/* История диалога */}
            <DialogHistory history={lead.dialog_history} />
        </div>
    );
}
```

### 4. Интеграция с n8n

```yaml
# n8n workflow для работы с кастомной CRM

# 1. HTTP Request к API вместо Bitrix24
GET http://your-crm-api/leads/to-process

# 2. Обработка через AI Agent

# 3. Обновление через API
POST http://your-crm-api/leads/{{leadId}}/communications
{
  "channel": "telegram",
  "message": "{{agentResponse}}",
  "intent": "{{detectedIntent}}"
}
```

## 🚀 Поэтапное внедрение

### Фаза 1: MVP (1 неделя)
- SQLite база данных
- Простое API (5-6 endpoints)
- Базовый веб-интерфейс
- Интеграция с n8n

### Фаза 2: Расширение (2-3 недели)
- PostgreSQL для продакшена
- Расширенная аналитика
- Автоматические отчеты
- Мобильная версия

### Фаза 3: AI функции (1 месяц)
- Предсказание конверсии
- Автоматическая приоритизация
- Умные напоминания
- A/B тестирование сообщений

## 💰 Оценка стоимости

### Разработка:
- Backend API: 40-60 часов
- Frontend: 30-40 часов
- Интеграция: 20 часов
- **Итого**: ~100 часов работы

### Инфраструктура (в месяц):
- VPS для API: $10-20
- PostgreSQL: $5-15 (или включено в VPS)
- **Итого**: $15-35/мес

### Сравнение с Bitrix24:
- Bitrix24 CRM+: $99/мес
- Кастомная CRM: $35/мес + разовая разработка

## 🛠️ Технологический стек

### Вариант 1: Простой и быстрый
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Tailwind CSS
- **Деплой**: Docker на вашем VPS

### Вариант 2: Масштабируемый
- **Backend**: FastAPI (Python) + PostgreSQL
- **Frontend**: Vue.js + Vuetify
- **Деплой**: Kubernetes

### Вариант 3: No-code решение
- **Supabase**: Backend + БД + Auth
- **Retool/Budibase**: Frontend
- **n8n**: Вся логика

## 📝 Пример конфигурации для n8n

```javascript
// Custom CRM node для n8n
{
  "nodes": [
    {
      "name": "Custom CRM",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.CUSTOM_CRM_API}}/leads",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "options": {
          "headers": {
            "X-API-Key": "={{$env.CUSTOM_CRM_API_KEY}}"
          }
        }
      }
    }
  ]
}
```

## 🎯 Ключевые преимущества

1. **Скорость**: API отвечает за 50ms vs 500ms у Bitrix24
2. **Гибкость**: Любые поля и логика
3. **Интеграция**: Нативная работа с вашими сервисами
4. **Стоимость**: Дешевле в 3 раза на длинной дистанции
5. **Данные**: Полный контроль и владение

## 🚀 С чего начать?

1. **Определите MVP функции**:
   - Создание/редактирование лидов
   - Отслеживание коммуникаций
   - Базовые статусы
   - Простая аналитика

2. **Выберите стек**:
   - Для быстрого старта: Node.js + SQLite
   - Для продакшена: FastAPI + PostgreSQL

3. **Начните с API**:
   ```bash
   npx create-express-api dark-project-crm
   cd dark-project-crm
   npm install sqlite3 cors dotenv
   ```

4. **Подключите к n8n**:
   - Замените Bitrix24 nodes на HTTP Request
   - Настройте эндпоинты
   - Протестируйте

---

**Готовы начать?** Могу помочь с конкретной реализацией любой части!