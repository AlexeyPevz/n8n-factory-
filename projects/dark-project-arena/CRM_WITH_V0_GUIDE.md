# 🚀 Создание CRM для Dark Project Arena с v0

## 🎯 Почему v0 идеально подходит

- **Скорость**: Полный интерфейс за 30 минут
- **Качество**: Современный UI/UX из коробки
- **Интеграция**: Легко подключается к вашему API
- **Стоимость**: Бесплатно для старта

## 📝 Пошаговый план

### Шаг 1: Промпт для v0

Вот готовый промпт для генерации CRM:

```
Create a modern CRM dashboard for a gaming peripherals sales company with the following features:

1. Main dashboard with key metrics cards:
   - New leads today
   - Hot leads count  
   - Conversion rate
   - Revenue this month

2. Leads table with columns:
   - Company name
   - City
   - Estimated PCs count
   - Status (NEW, IN_PROGRESS, HOT, CLOSED, JUNK)
   - Last contact date
   - Actions (Send message, Update status, View details)

3. Lead detail view with:
   - Full company information
   - Contact details (phone, email, telegram)
   - Communication history timeline
   - Quick actions panel
   - AI-generated insights

4. Filters and search:
   - By status
   - By city
   - By date range
   - By priority

5. Use modern design with:
   - Dark mode support
   - Tailwind CSS
   - Shadcn/ui components
   - Responsive layout
   - Russian language interface

Include sample data for 10 gaming clubs.
```

### Шаг 2: Backend API (Supabase)

```sql
-- Создайте проект на supabase.com и выполните:

-- Таблица лидов
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Информация о компании
  company_name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  
  -- Контакты
  phone TEXT UNIQUE,
  email TEXT,
  telegram_id TEXT UNIQUE,
  telegram_username TEXT,
  preferred_channel TEXT DEFAULT 'telegram',
  
  -- Бизнес данные
  estimated_pcs INTEGER DEFAULT 20,
  is_chain BOOLEAN DEFAULT FALSE,
  
  -- Статусы
  status TEXT DEFAULT 'NEW',
  priority TEXT DEFAULT 'medium',
  
  -- Коммуникация
  contact_count INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  dialog_history JSONB DEFAULT '[]'::jsonb
);

-- Включаем Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Политика доступа (для начала - полный доступ)
CREATE POLICY "Enable all access for authenticated users" ON leads
  FOR ALL USING (true);

-- Таблица коммуникаций
CREATE TABLE communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  direction TEXT CHECK (direction IN ('in', 'out')),
  channel TEXT,
  message TEXT,
  intent TEXT,
  metadata JSONB
);

-- Представление для дашборда
CREATE VIEW dashboard_stats AS
SELECT 
  COUNT(*) FILTER (WHERE created_at > CURRENT_DATE) as new_leads_today,
  COUNT(*) FILTER (WHERE status = 'HOT') as hot_leads,
  COUNT(*) FILTER (WHERE status = 'CLOSED') as closed_deals,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'CLOSED')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate
FROM leads;

-- Функция для обновления лида из n8n
CREATE OR REPLACE FUNCTION update_lead_from_n8n(
  p_lead_id UUID,
  p_message TEXT,
  p_direction TEXT,
  p_intent TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Добавляем коммуникацию
  INSERT INTO communications (lead_id, direction, message, intent, channel)
  VALUES (p_lead_id, p_direction, p_message, p_intent, 'telegram');
  
  -- Обновляем лид
  UPDATE leads 
  SET 
    contact_count = contact_count + 1,
    last_contact_at = NOW(),
    dialog_history = dialog_history || jsonb_build_object(
      'date', NOW(),
      'direction', p_direction,
      'message', p_message,
      'intent', p_intent
    ),
    updated_at = NOW()
  WHERE id = p_lead_id;
  
  -- Меняем статус если нужно
  IF p_intent = 'готов_встретиться' THEN
    UPDATE leads SET status = 'HOT' WHERE id = p_lead_id;
  ELSIF p_intent = 'отказ' THEN
    UPDATE leads SET status = 'JUNK' WHERE id = p_lead_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Шаг 3: Интеграция v0 компонента с Supabase

```typescript
// app/providers.tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

```typescript
// app/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/providers'

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.city) {
        query = query.eq('city', filters.city)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async ({ leadId, message }: { leadId: string; message: string }) => {
      // Вызываем n8n webhook для отправки
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, message })
      })
      
      if (!response.ok) throw new Error('Failed to send message')
    }
  })
}
```

### Шаг 4: API Routes для n8n

```typescript
// app/api/webhook/n8n/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, message, direction, intent } = body
    
    // Вызываем функцию Supabase
    const { error } = await supabase.rpc('update_lead_from_n8n', {
      p_lead_id: leadId,
      p_message: message,
      p_direction: direction,
      p_intent: intent
    })
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Шаг 5: Деплой на Vercel

```bash
# 1. Создайте репозиторий
git init
git add .
git commit -m "Initial CRM"

# 2. Подключите к Vercel
vercel

# 3. Добавьте переменные окружения
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## 🎨 Примеры компонентов из v0

### Dashboard Component
```tsx
// Сгенерированный v0 компонент
export function CRMDashboard() {
  const { data: leads, isLoading } = useLeads()
  const { data: stats } = useDashboardStats()
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-6">
        {/* Метрики */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Новые лиды"
            value={stats?.new_leads_today || 0}
            icon={<Users />}
            trend="+12%"
          />
          {/* ... другие метрики */}
        </div>
        
        {/* Таблица лидов */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Все лиды</CardTitle>
            <LeadFilters />
          </CardHeader>
          <CardContent>
            <LeadsTable leads={leads} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
```

## 🔗 Интеграция с n8n

В n8n просто замените Bitrix24 nodes на HTTP Request:

```yaml
# Webhook для обновления CRM
POST https://your-crm.vercel.app/api/webhook/n8n
{
  "leadId": "{{$node['Parse Lead'].json.id}}",
  "message": "{{$node['AI Agent'].json.response}}",
  "direction": "out",
  "intent": "{{$node['AI Agent'].json.intent}}"
}
```

## 💰 Стоимость

- **v0**: Бесплатно для генерации
- **Vercel**: Бесплатно для личного использования
- **Supabase**: Бесплатно до 500MB и 50k запросов
- **Итого**: $0/мес для старта!

## 🚀 Результат за 1 день

1. **Утро**: Генерация UI в v0 (30 мин)
2. **День**: Настройка Supabase (2 часа)
3. **Вечер**: Интеграция с n8n (1 час)
4. **Готово**: Полноценная CRM!

## 📱 Бонус: Мобильная версия

v0 генерирует адаптивный дизайн из коробки. Можно сразу сделать PWA:

```json
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
}
```

---

**Готовы начать?** Просто скопируйте промпт в v0.dev и через 5 минут получите готовый интерфейс!