# n8n AI-First Implementation Specification

## Executive Summary
Transform n8n into an AI-first automation platform where users describe workflows in natural language, and the system generates, validates, and applies changes directly in the editor with full governance and observability.

## Core Innovation: Schema-Guided Reasoning (SGR)
Unlike traditional LLM approaches that hope for valid output, SGR enforces strict schema compliance:
- Every LLM response is validated against predefined schemas
- Invalid outputs trigger automatic repair cycles
- 100% guarantee of applicable diffs

## Technical Architecture

### 1. Minimal Fork Strategy
```typescript
// Extension points in n8n core
interface N8nAIHooks {
  introspect: IntrospectAPI;      // Runtime node descriptions
  graph: GraphMutationAPI;         // Typed batch operations
  validate: ValidateSimulateAPI;   // Static checks + dry-run
  events: ExecutionEventStream;    // SSE/WebSocket feed
}
```

### 2. AI Sidecar Service
```typescript
// Multi-agent orchestration
interface AIOrchestrator {
  agents: {
    planner: PlannerAgent;       // Decomposes user intent
    builder: BuilderAgent;       // Creates valid operations
    validator: ValidatorAgent;   // Ensures schema compliance
    critic: CriticAgent;        // Suggests improvements
  };
  
  rag: {
    docs: DocumentIndex;        // Official documentation
    examples: WorkflowIndex;    // 2000+ examples
    nodes: NodeSourceIndex;     // Node implementations
  };
}
```

### 3. Operation Batch Format
```json
{
  "ops": [
    {
      "op": "add_node",
      "node": {
        "id": "http-1",
        "name": "Fetch API",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4,
        "position": [600, 300],
        "parameters": {
          "method": "GET",
          "url": "https://api.example.com/data"
        }
      }
    },
    {
      "op": "connect",
      "from": "Manual Trigger",
      "to": "Fetch API",
      "index": 0
    }
  ]
}
```

## Implementation Phases

### Phase 0: Foundation (Weeks 1-2)
- [ ] Fork n8n, create `feature/ai-hooks` branch
- [ ] Define JSON schemas (Node/Graph/Operations)
- [ ] Build diff preview renderer
- [ ] Setup sidecar boilerplate

### Phase 1: Backend Hooks (Weeks 3-5)
- [ ] Implement Introspect API with sandbox
- [ ] Build Graph Mutation API with undo
- [ ] Create Execution Event stream
- [ ] Basic Validate/Simulate API

### Phase 2: AI Orchestrator (Weeks 6-7)
- [ ] Planner → Builder → Validator pipeline
- [ ] RAG system for docs/examples
- [ ] SGR validation loop
- [ ] API integration tests

### Phase 3: Editor UI (Weeks 8-9)
- [ ] AI Panel component (Vue 3)
- [ ] Describe → Plan → Preview → Apply flow
- [ ] Error display with auto-repair
- [ ] Inline parameter assistance

### Phase 4: Workflow Map (Weeks 10-12)
- [ ] Dependency indexer
- [ ] Live telemetry aggregator
- [ ] Interactive map visualization
- [ ] Click-through navigation

## Key Technical Decisions

### 1. LoadOptions Handling
```typescript
// Sandbox execution with caching
async function getLoadOptions(
  nodeType: string,
  method: string,
  currentParams: any
): Promise<INodePropertyOptions[]> {
  const cacheKey = hash({ nodeType, method, currentParams });
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const sandbox = new NodeSandbox(nodeType);
  const options = await sandbox.execute(method, currentParams, {
    timeout: 5000,
    memory: 128
  });
  
  cache.set(cacheKey, options, { ttl: 3600 });
  return options;
}
```

### 2. Workflow Map Relations
```typescript
// Intelligent edge detection
interface EdgeDetector {
  // Direct: Execute Workflow nodes
  findDirectEdges(workflows: Workflow[]): Edge[];
  
  // Inferred: HTTP Request → Webhook matching
  findHttpWebhookEdges(workflows: Workflow[]): Edge[];
  
  // Manual: meta.dependencies annotations
  findAnnotatedEdges(workflows: Workflow[]): Edge[];
}
```

### 3. Security Model
```typescript
// Credential reference only
interface SecureParameters {
  credentials?: {
    [key: string]: {
      id?: string;        // Reference only
      name?: string;      // Reference only
      // No actual secrets
    };
  };
}
```

## Performance Optimizations

### 1. Schema Caching
- Pre-compute and cache all node schemas on startup
- Invalidate only on node package updates
- Serve from memory for <1ms response

### 2. Batch Operations
- Single diff application instead of step-by-step
- Atomic transactions with rollback
- Parallel validation where possible

### 3. LLM Cost Management
- Compressed schemas (remove descriptions for inference)
- Few-shot examples in vector DB
- Local models for simple operations

## Governance & Compliance

### 1. Policy Engine
```yaml
policies:
  allowed_nodes:
    - n8n-nodes-base.*
    - !n8n-nodes-base.executeCommand  # Explicitly denied
  
  allowed_domains:
    - "*.company.com"
    - "api.approved-vendor.com"
  
  rate_limits:
    operations_per_minute: 60
    cost_per_hour: 10.00
```

### 2. Audit Trail
```typescript
interface AuditEntry {
  timestamp: Date;
  user: string;
  action: "describe" | "plan" | "apply" | "undo";
  workflow_id: string;
  diff?: OperationBatch;
  model: string;
  tokens_used: number;
  cost: number;
}
```

## Success Metrics Dashboard

### Real-time Metrics
- **Time to Value**: Avg time from description to working workflow
- **First-try Success**: % of diffs that apply without errors
- **Auto-fix Rate**: % of validation errors fixed automatically
- **Map Accuracy**: % of correctly identified dependencies

### User Satisfaction
- **Feature Usage**: Daily/Weekly active AI panel users
- **NPS Score**: Specifically for AI features
- **Support Tickets**: Reduction in workflow creation issues

## Risk Mitigation Matrix

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Dynamic LoadOptions | High | Sandbox + Cache + Timeout | BE Team |
| HTTP→Webhook Matching | Medium | URL Templates + Whitelist | BE Team |
| Upstream Drift | Medium | Minimal Changes + Extension Points | All |
| LLM Costs | Medium | Caching + Local Models | ML Team |
| Schema Changes | Low | Version Detection + Migration | BE Team |

## Immediate Next Steps (Week 1)

### Day 1-2: Environment Setup
```bash
# Fork and setup
git clone https://github.com/n8n-io/n8n.git
cd n8n
git checkout -b feature/ai-hooks
pnpm install
pnpm build

# Sidecar scaffold
mkdir n8n-ai-sidecar
cd n8n-ai-sidecar
npm init -y
npm install fastify zod openai
```

### Day 3-4: First Integration Point
```typescript
// packages/cli/src/api/ai.api.ts
import { IntrospectService } from './services/introspect.service';

export const aiRoutes = (app: Application) => {
  app.get('/api/ai/introspect/nodes', async (req, res) => {
    const nodes = await IntrospectService.getAllNodeSchemas();
    res.json(nodes);
  });
};
```

### Day 5: Proof of Concept
- Generate simple 3-node workflow from description
- Preview diff in basic UI panel
- Successfully apply and execute

## Team Allocation

| Role | Person | Primary Focus | Hours/Week |
|------|--------|---------------|------------|
| BE Lead | TBD | Graph API, Introspect | 40 |
| BE Dev | TBD | Sidecar, Events | 40 |
| FE Dev | TBD | AI Panel, Map UI | 40 |
| ML Eng | TBD | SGR, Agents, RAG | 40 |
| DevOps | TBD | Deploy, Monitor | 20 |

## Go/No-Go Criteria (Week 2)

✅ **GO if:**
- Basic Introspect API returns valid schemas
- Simple workflow can be generated from text
- Diff preview shows correct operations
- Apply creates executable workflow

❌ **NO-GO if:**
- Core n8n changes too invasive
- Performance impact >10% on normal usage
- Cannot achieve <5s generation time
- LoadOptions sandbox unstable

## Contact & Resources

- **Project Lead**: [Your Name]
- **Slack Channel**: #n8n-ai-first
- **Repository**: github.com/[org]/n8n-ai-first
- **Documentation**: [Internal Wiki]

---

*This specification is a living document. Updates tracked in git.*