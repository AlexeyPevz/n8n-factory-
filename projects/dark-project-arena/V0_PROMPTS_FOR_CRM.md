# 🎯 Промпты для v0 - CRM Dark Project Arena

## 📝 Основной промпт для генерации CRM

Скопируйте этот промпт в v0.dev:

```
Create a comprehensive CRM dashboard for Dark Project Arena - a gaming peripherals sales automation system. The interface should be in Russian language with dark mode support.

## Data Model:
Lead object should have these fields:
- id (UUID)
- company_name (название компании) 
- city (город)
- address (адрес)
- phone (телефон)
- email
- telegram_id
- telegram_username
- whatsapp
- preferred_channel (предпочитаемый канал: telegram/whatsapp/email)
- estimated_pcs (примерное количество ПК)
- is_chain (сеть клубов: да/нет)
- branch_count (количество филиалов)
- status (NEW/IN_PROGRESS/HOT/CONVERTED/JUNK)
- priority (P0/P1/P2/P3)
- contact_count (количество контактов)
- last_contact_at (последний контакт)
- next_contact_at (следующий контакт)
- dialog_history (JSON array)
- source (источник: yandex_maps/2gis/manual)
- created_at
- updated_at

## Main Dashboard Components:

1. **Header with Stats Cards:**
   - Новые лиды сегодня (new leads today)
   - Горячие лиды (hot leads) 
   - В работе (in progress)
   - Конверсия % (conversion rate)
   - Контактов сегодня (contacts today)

2. **Filters Panel:**
   - По статусу (status filter with color badges)
   - По городу (city dropdown)
   - По приоритету (priority: P0-P3)
   - По дате (date range picker)
   - Поиск по названию (search by company name)

3. **Leads Table with columns:**
   - Компания (with city below)
   - Контакты (показывать иконки: 📱 Telegram, 📞 Phone, ✉️ Email)
   - ПК (количество компьютеров)
   - Статус (colored badge: 🆕 NEW, 🔄 IN_PROGRESS, 🔥 HOT, ✅ CONVERTED, ❌ JUNK)
   - Приоритет (P0-P3 with colors)
   - Последний контакт (relative time: "2 часа назад")
   - Действия (buttons: Написать, Детали, Изменить статус)

4. **Lead Detail Modal/Sidebar:**
   - Full company information section
   - Contact information with preferred channel highlighted
   - Communication timeline (dialog_history visualization)
   - Quick actions: 
     - Отправить сообщение (send message)
     - Изменить статус (change status)
     - Запланировать контакт (schedule contact)
     - Добавить в горячие (mark as hot)
   - AI insights panel showing:
     - Определенный intent (detected intent)
     - Рекомендуемое действие (recommended action)
     - История изменения статусов (status history)

5. **Communication Panel:**
   - Message composer with templates
   - Channel selector (Telegram/WhatsApp/Email)
   - Previous messages history
   - Quick replies based on intent

6. **Analytics Section (separate tab):**
   - Воронка продаж (sales funnel)
   - График новых лидов по дням (new leads chart)
   - Конверсия по источникам (conversion by source)
   - Активность по времени (activity heatmap)

## Design Requirements:
- Use shadcn/ui components
- Dark mode by default with light mode toggle
- Tailwind CSS for styling
- Mobile responsive
- Use Lucide React icons
- Smooth animations and transitions
- Loading states for all data fetches
- Empty states with helpful messages

## Color Scheme for Statuses:
- NEW: blue/sky
- IN_PROGRESS: yellow/amber  
- HOT: red/orange with fire emoji
- CONVERTED: green/emerald
- JUNK: gray/neutral

## Priority Colors:
- P0: red (критический)
- P1: orange (высокий)
- P2: yellow (средний)
- P3: gray (низкий)

## Include Sample Data:
Generate 15 sample gaming clubs with realistic Russian names and data:
- Mix of different statuses
- Various cities (Moscow, St. Petersburg, Kazan, etc.)
- Different PC counts (10-150)
- Some as chains with multiple branches
- Realistic dialog history entries

## Additional Features:
- Export to CSV button
- Bulk status update
- Keyboard shortcuts (n - new lead, / - search, etc.)
- Real-time updates indicator
- Quick stats tooltips on hover
- Drag and drop to change status

Make the interface professional but modern, suitable for a B2B sales team selling gaming peripherals to computer clubs.
```

## 🎨 Дополнительные промпты для отдельных компонентов

### Промпт для Lead Detail View:
```
Create a detailed lead view component for the CRM with:
- Tabbed interface (Информация, Коммуникации, История, Аналитика)
- Timeline of all interactions
- Edit mode for all fields
- Activity feed with filters
- Next action suggestions based on AI analysis
- Integration hints for n8n webhooks
```

### Промпт для Communication Widget:
```
Create a communication widget that:
- Shows WhatsApp/Telegram/Email templates
- Has quick reply suggestions based on intent
- Shows typing indicator when AI is processing
- Displays delivery status
- Allows switching between channels
```

### Промпт для Analytics Dashboard:
```
Create an analytics dashboard with:
- Sales funnel visualization
- Lead velocity chart
- Conversion metrics by source
- Agent performance stats
- ROI calculator
- Predictive analytics placeholders
```

## 🔧 После генерации в v0

### 1. Добавьте интеграцию с Supabase:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 2. Создайте API endpoints для n8n:

```typescript
// app/api/webhook/n8n/route.ts
export async function POST(request: Request) {
  const data = await request.json()
  
  // Обновление лида из n8n
  if (data.action === 'updateLead') {
    await supabase
      .from('leads')
      .update({
        status: data.status,
        dialog_history: data.dialog_history,
        last_contact_at: new Date()
      })
      .eq('id', data.leadId)
  }
  
  return Response.json({ success: true })
}
```

### 3. Настройте webhook в n8n:

```json
{
  "method": "POST",
  "url": "https://your-crm.vercel.app/api/webhook/n8n",
  "body": {
    "action": "updateLead",
    "leadId": "={{$json.leadId}}",
    "status": "={{$json.newStatus}}",
    "dialog_history": "={{$json.dialogHistory}}"
  }
}
```

## 💡 Советы по работе с v0

1. **Итеративный подход**: Сначала сгенерируйте основу, потом дорабатывайте отдельные компоненты

2. **Сохраняйте версии**: v0 позволяет форкать и модифицировать

3. **Комбинируйте промпты**: Можно генерировать отдельные части и объединять

4. **Используйте примеры**: Показывайте v0 скриншоты похожих CRM для лучшего результата

## 🚀 Результат

После использования этих промптов вы получите:
- Полноценный интерфейс CRM
- Все необходимые поля из n8n проекта
- Русский интерфейс
- Готовую структуру для интеграции
- Современный дизайн с dark mode

Просто скопируйте основной промпт в v0.dev и через минуту получите готовую CRM!