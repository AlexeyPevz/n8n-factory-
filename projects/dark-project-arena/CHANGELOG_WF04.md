# Changelog for WF-04 Sales Nurture Agent

## Version 2.1.0 (v010) - Fixed "prompt parameter required" error

### Problem
- The agent node was throwing error: "Parameter 'prompt (user message)' is required"
- Initial contacts were bypassing the agent and going directly to send channels
- The agent configuration had `chatMessages` parameter instead of required `prompt` parameter

### Changes Made

1. **Fixed Agent Configuration**
   - Added `prompt` parameter to the Sales Agent node
   - Set it to use `$json.currentMessage` with fallback to 'Привет'
   - Removed the incorrect `chatMessages` parameter

2. **Redirected Initial Contact Flow**
   - Changed "Generate Initial KP" node to "Prepare Initial Contact Context"
   - Now prepares agent context instead of generating message directly
   - Sets `currentMessage` with instruction for agent to start dialog
   - Routes through agent instead of bypassing to channels

3. **Connection Updates**
   - Updated connection from "Generate Initial KP" to go to "Sales Agent РОП 20Y" instead of "Route by Channel"
   - This ensures all messages (both initial and replies) go through the agent

### Result
- Agent now properly receives the prompt parameter
- Initial contacts are handled by the agent with proper context
- Consistent message flow for both initial contacts and replies

### How to Test
1. Use Manual Trigger with test lead data
2. Agent should generate initial contact message without errors
3. Check that `currentMessage` is properly set in agent context