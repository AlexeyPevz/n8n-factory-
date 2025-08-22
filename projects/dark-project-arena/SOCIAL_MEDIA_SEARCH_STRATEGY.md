# Стратегия поиска владельцев компьютерных клубов через соцсети

## 🎯 Цель
Найти прямые контакты владельцев и управляющих компьютерных клубов для более эффективных продаж.

## 📊 Новые Workflow

### WF-02A: VK Group Parser
**Задача**: Парсинг групп ВКонтакте компьютерных клубов

**Процесс**:
1. Берем название клуба из WF-01
2. Ищем группу ВК через VK API
3. Получаем список администраторов
4. Парсим их профили (должность, контакты)
5. Ищем посты с упоминанием "директор", "владелец", "управляющий"

**Данные для извлечения**:
- ФИО владельца/директора
- Личный VK профиль
- Telegram (если указан)
- Мобильный телефон

### WF-02B: Telegram Channel Scanner
**Задача**: Поиск и анализ Telegram каналов клубов

**Процесс**:
1. Поиск канала по названию клуба
2. Получение информации об админах
3. Анализ постов на предмет контактов
4. Поиск связанных чатов

**Инструменты**:
- MTProto API для парсинга
- Telegram Bot API для базового поиска

### WF-02C: Thematic Chat Monitor
**Задача**: Мониторинг тематических чатов

**Целевые чаты**:
- LanGame (основной чат владельцев)
- Клубный бизнес России
- Киберспорт для бизнеса
- Региональные чаты владельцев

**Процесс**:
1. Подключение к чату через MTProto
2. Поиск сообщений с упоминанием городов из нашего списка
3. Идентификация владельцев по контексту
4. Сбор username и контактов

### WF-02D: LinkedIn/HH Parser
**Задача**: Поиск владельцев в профессиональных сетях

**LinkedIn**:
- Поиск: "owner computer club" + город
- Фильтр по должностям: CEO, Founder, Director

**HH.ru**:
- Парсинг вакансий от клубов
- Извлечение данных о работодателе
- Поиск контактов HR/владельца

## 🔧 Технические решения

### 1. VK API Integration
```javascript
// Пример поиска группы клуба
const searchGroup = async (clubName) => {
  const groups = await vk.api.groups.search({
    q: clubName + " компьютерный клуб",
    type: "group",
    count: 10
  });
  
  // Получаем админов
  const admins = await vk.api.groups.getMembers({
    group_id: groups.items[0].id,
    filter: "managers"
  });
  
  return admins;
};
```

### 2. Telegram MTProto
```javascript
// Поиск в чате LanGame
const searchInChat = async (chatUsername, city) => {
  const messages = await client.getMessages(chatUsername, {
    search: city,
    limit: 100
  });
  
  // Анализируем сообщения
  const owners = messages.filter(msg => 
    msg.text.includes("владею") || 
    msg.text.includes("мой клуб") ||
    msg.text.includes("наш клуб")
  );
  
  return owners.map(msg => ({
    username: msg.sender.username,
    userId: msg.sender.id,
    message: msg.text
  }));
};
```

### 3. Smart Contact Matching
```javascript
// Сопоставление контактов из разных источников
const matchContacts = (vkData, telegramData, websiteData) => {
  const owner = {
    name: vkData.name || telegramData.firstName,
    vk: vkData.profileUrl,
    telegram: telegramData.username,
    phone: websiteData.phone || vkData.mobile,
    confidence: calculateConfidence(vkData, telegramData, websiteData)
  };
  
  return owner;
};
```

## 📈 Приоритизация источников

1. **Высший приоритет**:
   - Личные Telegram владельцев из чатов
   - VK профили с подтвержденной должностью
   - LinkedIn с верифицированными данными

2. **Средний приоритет**:
   - Админы групп ВК/Telegram
   - Контакты с сайтов
   - HH.ru данные

3. **Низкий приоритет**:
   - Общие email клубов
   - Телефоны ресепшн

## 🎯 KPI новой стратегии

- **Охват**: +300% контактов владельцев
- **Качество**: 80% прямых контактов decision-makers
- **Конверсия**: ожидаемый рост с 15% до 35%

## ⚠️ Этические ограничения

1. **Не парсим**:
   - Закрытые/приватные чаты без разрешения
   - Личную переписку
   - Конфиденциальную информацию

2. **Соблюдаем**:
   - Rate limits всех API
   - Правила платформ
   - GDPR/152-ФЗ требования

## 🚀 План внедрения

### Фаза 1 (Неделя 1-2):
- Настройка VK API
- Базовый парсинг групп
- Тест на 10 клубах

### Фаза 2 (Неделя 3-4):
- Интеграция Telegram MTProto
- Подключение к 2-3 тематическим чатам
- A/B тест эффективности

### Фаза 3 (Неделя 5-6):
- LinkedIn интеграция
- Полный запуск
- Оптимизация алгоритмов

## 📊 Ожидаемые результаты

- **Найдено владельцев**: 500+ в месяц
- **Прямых контактов**: 80%
- **Покрытие городов**: 95%
- **ROI**: +250%