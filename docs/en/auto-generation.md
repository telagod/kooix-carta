# Auto-Generation Features

The MCP server can intelligently generate missing `@SFC` cards during the scan process, perfect for gradual project improvement.

## Smart Inference

### Path-Based Inference

**File Type Detection**:
- `.tsx` → React TypeScript
- `.vue` → Vue.js component
- `.py` → Python module
- `.md` → Markdown documentation

**Component Categorization**:
- `components/` → UI components
- `services/` → Business logic
- `utils/` → Utility functions
- `hooks/` → Custom React hooks

**Automatic Tag Generation**:
- Based on file extension and directory structure
- Framework detection (React, Vue, etc.)
- Purpose inference (test, config, etc.)

### Content-Based Inference

**Code Pattern Detection**:
- Function vs class implementations
- Export pattern analysis
- Framework identification
- Test file recognition

## Templates

### Minimal Template
```yaml
@SFC
name: component-name
description: Auto-generated description
version: 1.0.0
tags: [typescript, component]
```

### Detailed Template
```yaml
@SFC
name: component-name
description: Auto-generated description
version: 1.0.0
type: react-typescript
category: component
tags: [typescript, react, component]
created: 2025-09-24
author: auto-generated
```

## Usage Examples

### Development Workflow

```typescript
// 1. Preview what would be generated (dry run)
const preview = await mcpClient.callTool('cards.scan', {
  root: 'src',
  autoGenerate: true,
  generateOptions: {
    dryRun: true,
    template: 'minimal'
  }
});

console.log(`Would generate ${preview.generated.count} cards`);
preview.generated.files.forEach(file => {
  console.log(`- ${file}`);
});

// 2. Actually generate missing cards
const result = await mcpClient.callTool('cards.scan', {
  root: 'src/components',
  autoGenerate: true,
  generateOptions: {
    template: 'detailed',
    inferFromContent: true
  }
});

console.log(`Generated ${result.generated.count} cards`);
```

### Batch Processing

```typescript
// Generate cards for specific file types
await mcpClient.callTool('cards.scan', {
  include: ['**/*.tsx', '**/*.ts'],
  exclude: ['**/*.test.*'],
  autoGenerate: true,
  generateOptions: {
    template: 'detailed',
    inferFromPath: true,
    inferFromContent: true
  }
});
```

### Selective Generation

```typescript
// Only generate for files without existing cards
const files = await mcpClient.callTool('cards.scan', { root: 'src' });
const needsCards = files.files.filter(f => !f.sfc.exists && !f.dfc.exists);

if (needsCards.length > 0) {
  await mcpClient.callTool('cards.scan', {
    root: 'src',
    autoGenerate: true,
    generateOptions: { template: 'minimal' }
  });
}
```

## Supported File Types

| Extension | Type | Generated Tags |
|-----------|------|---------------|
| `.ts` | TypeScript | `[typescript, module]` |
| `.tsx` | React TypeScript | `[typescript, react, component]` |
| `.js` | JavaScript | `[javascript, module]` |
| `.jsx` | React JavaScript | `[javascript, react, component]` |
| `.vue` | Vue Component | `[vue, component]` |
| `.py` | Python | `[python, module]` |
| `.md` | Markdown | `[documentation, markdown]` |

## Configuration Options

### `generateOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `template` | `'minimal' \| 'detailed'` | `'minimal'` | Card template style |
| `inferFromPath` | `boolean` | `true` | Use file path for inference |
| `inferFromContent` | `boolean` | `true` | Analyze file content |
| `dryRun` | `boolean` | `false` | Preview only, no writes |

### Comment Style Selection

The generator automatically selects appropriate comment styles:

| File Type | Comment Style |
|-----------|--------------|
| `.ts`, `.tsx`, `.js`, `.jsx` | `/* ... */` |
| `.py` | `# ...` |
| `.html`, `.md` | `<!-- ... -->` |
| Default | `/* ... */` |

## Best Practices

1. **Start with Dry Run**: Always preview generation before applying
2. **Use Selective Patterns**: Target specific directories or file types
3. **Review Generated Cards**: Customize auto-generated content as needed
4. **Iterative Improvement**: Generate incrementally as project evolves
5. **Combine with Manual Cards**: Mix auto-generation with manual curation