# Week 1 Sprint Checklist - n8n AI-First

## Day 1 (Monday) - Environment & Team
- [ ] Fork n8n repository
- [ ] Setup development environment
  ```bash
  git clone https://github.com/n8n-io/n8n.git n8n-ai-first
  cd n8n-ai-first
  git checkout -b feature/ai-hooks
  pnpm install
  pnpm build
  pnpm start
  ```
- [ ] Create sidecar project structure
  ```bash
  mkdir n8n-ai-sidecar
  cd n8n-ai-sidecar
  npm init -y
  mkdir src/{agents,api,schemas,services}
  ```
- [ ] Team kickoff meeting (2h)
  - Assign roles
  - Review specification
  - Setup communication channels

## Day 2 (Tuesday) - Schemas & Validation
- [ ] Define core schemas
  ```typescript
  // src/schemas/node.schema.ts
  const NodeOperationSchema = z.object({
    op: z.enum(['add_node', 'update_node', 'delete_node']),
    node: NodeSchema
  });
  ```
- [ ] Build validation service
- [ ] Create diff preview renderer
- [ ] Unit tests for schema validation

## Day 3 (Wednesday) - First n8n Hook
- [ ] Implement basic Introspect API
  ```typescript
  // packages/cli/src/api/ai/introspect.api.ts
  router.get('/api/ai/nodes', async (req, res) => {
    const nodes = NodeHelpers.getLoadedNodes();
    res.json(nodes.map(n => n.description));
  });
  ```
- [ ] Test with Postman/Insomnia
- [ ] Document API endpoints

## Day 4 (Thursday) - Sidecar Foundation
- [ ] Setup FastAPI/Express server
- [ ] Implement basic Planner agent
- [ ] Connect to OpenAI/Local LLM
- [ ] Create simple SGR loop

## Day 5 (Friday) - Integration & Demo
- [ ] Connect sidecar to n8n Introspect API
- [ ] Build minimal UI panel in n8n
- [ ] Create demo workflow:
  ```
  "Every day at 9am, fetch weather data and 
   send to Slack if temperature > 25°C"
  ```
- [ ] Record demo video
- [ ] Team retrospective

## Success Criteria
- ✅ Can generate valid 3-node workflow from text
- ✅ Schema validation prevents invalid operations  
- ✅ Basic UI shows diff preview
- ✅ Demo video ready for stakeholders

## Resources Needed
- OpenAI API key (or local Ollama setup)
- n8n development instance
- Slack/Discord for team communication
- GitHub repository with CI/CD

## Risk Mitigations
- If n8n build fails → Use Docker dev environment
- If OpenAI is slow → Setup Ollama with Mixtral
- If schemas too complex → Start with 5 core nodes only
- If UI blocked → Build standalone preview page first

## Daily Standups (15 min)
- 09:00 - What I did yesterday
- 09:05 - What I'm doing today  
- 09:10 - Blockers
- 09:15 - Quick decisions

## End of Week Deliverables
1. Working development environment
2. Basic schema validation system
3. Minimal Introspect API in n8n
4. Simple agent that generates workflows
5. Demo video (<3 minutes)
6. Technical findings document

---

*Remember: Done is better than perfect for Week 1!*