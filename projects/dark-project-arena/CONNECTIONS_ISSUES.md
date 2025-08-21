# Проблемы со связями в workflow

## Обнаруженные проблемы:

### WF-00-Orchestrator v007
❌ **Ноды без исходящих связей:**
- Notify Complete
- Notify Error  
- Save CSV Error

### WF-01-Fetch-Gaming-Clubs v005
❌ **Ноды без исходящих связей:**
- Complete Workflow
- Error Notification

### WF-02-Enrich-Contact-Info v004
❌ **Ноды без исходящих связей:**
- Done
- Save Error to Redis

### WF-03-Upsert-CRM v002
❌ **Ноды без исходящих связей:**
- Handle Error
- Respond Invalid Webhook
- Respond to Webhook
- Return Data

### WF-04-Sales-Nurture v005
❌ **Ноды без исходящих связей:**
- Complete
- OpenAI Embeddings
- Save Error

❌ **Ноды без входящих связей:**
- Generate Message (Retry IF)

### WF-05-Hot-Lead-Handoff v001
❌ **Ноды без исходящих связей:**
- Complete
- Notify Error

### WF-06-Post-Sale-Followup v002
❌ **Ноды без исходящих связей:**
- Complete
- Save Error

## Типы проблемных нод:

1. **Финальные ноды** (Complete, Done, Return Data) - это нормально, они завершают workflow
2. **Respond to Webhook** - это нормально, они отвечают на webhook
3. **Ноды уведомлений** (Notify Error, Error Notification) - должны быть финальными после отправки
4. **Save Error** ноды - обычно должны вести к уведомлению или логированию

## Требуют исправления:

1. **WF-04**: Generate Message (Retry IF) - нода висит без входящих связей
2. **WF-02**: Save Error to Redis - возможно должна вести к уведомлению
3. Некоторые Error ноды могут требовать дополнительных действий после сохранения