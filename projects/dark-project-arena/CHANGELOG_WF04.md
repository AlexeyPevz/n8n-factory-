# Changelog for WF-04 Sales Nurture Agent

## Version 2.2.0 (v011) - Fixed to use Tools Agent per n8n documentation

### Problem
- conversationalAgent was removed from n8n in February 2025
- Agent configuration didn't match n8n documentation
- Parameter names were incorrect (prompt vs text)

### Changes Made
1. **Changed agent type**: 
   - From: `conversationalAgent` (deprecated)
   - To: `toolsAgent` (recommended)

2. **Fixed parameter names**:
   - Changed `prompt` to `text` (correct parameter name)
   - Moved `systemMessage` into `options` object

3. **Maintained all functionality**:
   - Dynamic prompt for initial contacts vs replies
   - Full system prompt with SPIN methodology
   - All tools connections remain the same

### Result
- Agent now uses the correct n8n API
- Compatible with latest n8n version
- Follows documentation standards

## Version 2.1.0 (v010) - Fixed "prompt parameter required" error

### Problem
- The agent node was throwing error: "Parameter 'prompt (user message)' is required"
- Initial contacts were bypassing the agent and going directly to send channels
- The agent configuration had `chatMessages` parameter instead of required `prompt` parameter
- System prompt was in wrong place

### Changes Made

1. **Fixed Agent Configuration**
   - Added `prompt` parameter to the Sales Agent node
   - Made prompt dynamic: for initial contacts it generates instruction, for replies it uses client message
   - Removed the incorrect `chatMessages` parameter
   - Kept `systemMessage` parameter with agent persona and instructions

2. **Fixed Initial Contact Logic**
   - Agent now generates first message itself based on lead data
   - Prompt for initial contact: "Начни диалог с новым клиентом [name] из [city]. У них [PCs] компьютеров. Используй мягкий подход."
   - For replies: uses actual client message
   - No more hardcoded "Привет" fallback

3. **Redirected Initial Contact Flow**
   - Changed "Generate Initial KP" node to "Prepare Initial Contact Context"
   - Now prepares agent context instead of generating message directly
   - Routes through agent instead of bypassing to channels
   - Updated connection from "Generate Initial KP" to go to "Sales Agent РОП 20Y"

### Result
- Agent properly receives the prompt parameter
- Agent generates personalized initial messages based on lead data
- Consistent message flow for both initial contacts and replies
- System prompt properly guides agent behavior

### How to Test
1. Use Manual Trigger with test lead data
2. Agent should generate personalized initial contact message
3. Check that agent uses lead info (club name, city, PC count) in message