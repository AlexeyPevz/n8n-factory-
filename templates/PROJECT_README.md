# <Project Name>

## Overview
- Goal: <one-line>
- Scope: <in/out>
- Owner: <name/contact>

## Topology
- Workflows:
  - wf-01-orchestrator — роль
  - wf-02-... — роль
- Diagram (optional): <link or embed>

## Contracts
- Define inputs/outputs per workflow (JSON Schema or pseudo-schema)
```json
{
  "$id": "contract-wf-02",
  "type": "object",
  "required": ["id"],
  "properties": {"id": {"type": "string"}}
}
```

## Credentials & Dependencies
- Required credentials (types, names, provisioner)
- External APIs, quotas, regions

## Versioning
- Workflow files: `YYYYMMDD_<workflow-slug>_vNNN.json`
- Changelog table of workflows and changes

## Testing
- Test datasets, commands (e.g. `jq . file.json`)

## Notes
- Constraints, SLA, TODO
