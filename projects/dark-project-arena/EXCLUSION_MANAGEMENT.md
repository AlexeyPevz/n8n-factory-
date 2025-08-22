# Управление списками исключений Dark Project Arena

## 📋 Обзор

Система исключений предотвращает отправку сообщений клубам, которые:
- Уже являются клиентами
- Работают напрямую с головным офисом
- Принадлежат конкурентам
- Попросили не беспокоить

## 🗂️ Типы исключений

### 1. **full** - Полное исключение
- Никаких контактов
- Не создаем лиды в CRM
- Пропускаем при парсинге

### 2. **temporary** - Временное исключение
- Исключение до определенной даты
- Автоматически снимается по истечении
- Используется при конфликтах или переговорах

### 3. **partial** - Частичное исключение
- Ограничения по каналам связи
- Ограничения по продуктам
- Особые условия коммуникации

### 4. **pattern** - Исключение по шаблону
- Автоматическое исключение по доменам
- Исключение по ключевым словам в названии
- Фильтрация конкурентов

## 🔧 Интеграция в workflow

### WF-01: Проверка при поиске
```javascript
// В ноде обработки результатов поиска
function filterExcludedClubs(clubs) {
  const exclusions = await loadExclusionList();
  
  return clubs.filter(club => {
    // Проверка по точному названию
    const exactMatch = exclusions.find(e => 
      e.club_name.toLowerCase() === club.name.toLowerCase() &&
      (e.city === 'Все города' || e.city === club.city)
    );
    
    if (exactMatch && exactMatch.exclusion_type === 'full') {
      console.log(`Excluded: ${club.name} - ${exactMatch.reason}`);
      return false;
    }
    
    // Проверка по паттернам
    const patternMatch = exclusions
      .filter(e => e.type === 'pattern')
      .find(e => {
        const pattern = e.club_name.replace('*', '.*');
        return new RegExp(pattern, 'i').test(club.name);
      });
    
    if (patternMatch) {
      console.log(`Pattern excluded: ${club.name}`);
      return false;
    }
    
    return true;
  });
}
```

### WF-02: Проверка при обогащении
```javascript
// Проверка email доменов
function isExcludedDomain(email) {
  const excludedDomains = ['bloody.com', 'razer.com'];
  const domain = email.split('@')[1];
  return excludedDomains.includes(domain);
}
```

### WF-03: Проверка перед созданием лида
```javascript
// Финальная проверка перед CRM
function shouldCreateLead(enrichedClub) {
  // Проверяем временные исключения
  const tempExclusion = exclusions.find(e => 
    e.exclusion_type === 'temporary' &&
    new Date(e.valid_until) > new Date()
  );
  
  if (tempExclusion) {
    return false;
  }
  
  // Для частичных исключений создаем лид с пометкой
  const partialExclusion = exclusions.find(e => 
    e.exclusion_type === 'partial'
  );
  
  if (partialExclusion) {
    enrichedClub.allowedChannels = partialExclusion.allowed_channels;
    enrichedClub.restrictions = partialExclusion.notes;
  }
  
  return true;
}
```

### WF-04: AI Agent проверка
```javascript
// Перед отправкой сообщения
function canContactClub(lead) {
  // Проверяем ограничения по каналам
  if (lead.restrictions && lead.allowedChannels !== 'all') {
    const allowedChannels = lead.allowedChannels.split(',');
    if (!allowedChannels.includes(currentChannel)) {
      console.log(`Channel ${currentChannel} not allowed for ${lead.name}`);
      return false;
    }
  }
  
  return true;
}
```

## 📝 Управление списком

### Добавление исключения через UI
1. Откройте `exclusion_list.csv` в Excel/Google Sheets
2. Добавьте новую строку с данными
3. Сохраните файл
4. Коммит в репозиторий

### Автоматическое добавление
- При жалобе на спам → автоматически temporary на 6 месяцев
- При подписании контракта → автоматически full до даты окончания
- При отказе с просьбой не беспокоить → temporary на 1 год

### Форматы данных

**CSV структура:**
```csv
club_name,type,city,exclusion_type,reason,valid_until,allowed_channels,notes
```

**Примеры:**
- Полное исключение: `"Colizeum","chain","Все города","full","Прямой контракт","2099-12-31","none",""`
- Временное: `"Phoenix Club","single","Екатеринбург","temporary","Переговоры","2025-02-01","none",""`
- Частичное: `"Cyber 777","single","Омск","partial","Только email","2099-12-31","email",""`

## 🔄 Регулярное обслуживание

### Ежемесячно:
1. Проверить временные исключения
2. Обновить статусы клиентов
3. Удалить устаревшие записи

### Ежеквартально:
1. Аудит всего списка
2. Проверка актуальности контрактов
3. Обновление паттернов конкурентов

## 📊 Статистика исключений

Текущий статус:
- Активных клиентов: 2
- Прямые контракты: 3  
- Конкуренты: 2
- Временные исключения: 2
- Частичные ограничения: 2

## ⚠️ Важные правила

1. **Всегда указывайте причину** исключения
2. **Ставьте реальные даты** для временных исключений
3. **Не удаляйте записи**, помечайте как неактивные
4. **Документируйте изменения** в notes

## 🚀 Быстрые команды

**Проверить клуб в списке:**
```bash
grep "ClubName" data/exclusion_list.csv
```

**Найти все временные исключения:**
```bash
grep "temporary" data/exclusion_list.csv
```

**Экспорт для CRM:**
```bash
csvtool col 1,4,5 data/exclusion_list.csv > crm_exclusions.csv
```