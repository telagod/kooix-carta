# Configuration Options

This guide covers all configuration options for @kooix/carta-mcp.

## Server Options

### `--root <dir>`

Specifies the root directory to serve.

```bash
# Current directory (default)
npx carta-mcp serve

# Specific directory
npx carta-mcp serve --root ./src

# Absolute path
npx carta-mcp serve --root /absolute/path/to/project
```

**Default**: Current working directory

### `--audit <mode>`

Sets the audit logging mode.

```bash
# JSONL format (default)
npx carta-mcp serve --audit jsonl

# SQLite database
npx carta-mcp serve --audit sqlite

# Disable logging
npx carta-mcp serve --audit none
```

**Options**:
- `jsonl` - Human-readable structured logs in `.kooix/logs/readlog.jsonl`
- `sqlite` - Queryable database in `.kooix/logs/readlog.sqlite` (requires `better-sqlite3`)
- `none` - No audit logging

**Default**: `jsonl`

### `--read-only`

Disables `edits.apply` tool writes, making the server read-only.

```bash
npx carta-mcp serve --read-only
```

**Use Cases**:
- Production environments
- Code review sessions
- Documentation generation
- Read-only access control

## Auto-Generation Options

### Template Selection

Choose between minimal and detailed card templates:

```typescript
// Minimal template
{
  autoGenerate: true,
  generateOptions: {
    template: 'minimal'
  }
}

// Detailed template
{
  autoGenerate: true,
  generateOptions: {
    template: 'detailed'
  }
}
```

**Minimal Template Output**:
```yaml
@SFC
name: component-name
description: Auto-generated description
version: 1.0.0
tags: [typescript, component]
```

**Detailed Template Output**:
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

### Inference Options

Control how metadata is inferred:

```typescript
{
  autoGenerate: true,
  generateOptions: {
    inferFromPath: true,    // Use file path for inference
    inferFromContent: true  // Analyze file content
  }
}
```

**Path-Based Inference**:
- File extension detection
- Directory structure analysis
- Naming convention recognition

**Content-Based Inference**:
- Code pattern detection
- Framework identification
- Export pattern analysis

### Dry Run Mode

Preview generation without writing files:

```typescript
{
  autoGenerate: true,
  generateOptions: {
    dryRun: true
  }
}
```

**Returns**:
- List of files that would be modified
- Preview of generated content
- Generation statistics

## Scan Filtering

### Include Patterns

Specify files to include using glob patterns:

```typescript
{
  include: [
    '**/*.ts',
    '**/*.tsx',
    'src/components/**/*'
  ]
}
```

### Exclude Patterns

Specify files to exclude:

```typescript
{
  exclude: [
    '**/*.test.*',
    '**/node_modules/**',
    '**/dist/**',
    '**/*.spec.*'
  ]
}
```

### Combined Filtering

```typescript
{
  root: 'src',
  include: ['**/*.{ts,tsx}'],
  exclude: ['**/*.test.*', '**/__tests__/**']
}
```

## Environment Variables

### Setting Variables

```bash
# Unix/Linux/macOS
export CARTA_MCP_ROOT="./src"
export CARTA_MCP_AUDIT="sqlite"
export CARTA_MCP_READ_ONLY="true"

# Windows (PowerShell)
$env:CARTA_MCP_ROOT="./src"
$env:CARTA_MCP_AUDIT="sqlite"
$env:CARTA_MCP_READ_ONLY="true"

# Windows (CMD)
set CARTA_MCP_ROOT=./src
set CARTA_MCP_AUDIT=sqlite
set CARTA_MCP_READ_ONLY=true
```

### Using in Scripts

```bash
#!/bin/bash
export CARTA_MCP_ROOT="${PROJECT_ROOT}/src"
export CARTA_MCP_AUDIT="jsonl"

npx carta-mcp serve \
  --root "${CARTA_MCP_ROOT}" \
  --audit "${CARTA_MCP_AUDIT}"
```

## Advanced Configuration

### Custom Comment Styles

The server automatically detects appropriate comment styles:

| File Extension | Comment Style |
|---------------|---------------|
| `.ts`, `.tsx`, `.js`, `.jsx` | `/* ... */` |
| `.py` | `# ...` |
| `.html`, `.xml`, `.md` | `<!-- ... -->` |
| `.css`, `.scss` | `/* ... */` |
| `.yaml`, `.yml` | `# ...` |

### Hash Algorithm

Content hashing uses SHA-256:
- Block content verification
- File integrity checks
- Optimistic locking

### Line Ending Normalization

All content is normalized to LF (`\n`):
- Cross-platform consistency
- Git-friendly diffs
- Predictable hashing

## Configuration Examples

### Development Setup

```bash
npx carta-mcp serve \
  --root . \
  --audit jsonl
```

### Production Setup

```bash
npx carta-mcp serve \
  --root /var/www/app \
  --audit sqlite \
  --read-only
```

### Testing Setup

```bash
npx carta-mcp serve \
  --root ./test-fixtures \
  --audit none
```

### CI/CD Setup

```bash
npx carta-mcp serve \
  --root "${CI_PROJECT_DIR}/src" \
  --audit sqlite \
  --read-only
```

## Performance Tuning

### Large Codebases

For projects with thousands of files:

1. Use specific `--root` paths
2. Apply strict `include`/`exclude` patterns
3. Consider SQLite audit mode
4. Enable `--read-only` when writes aren't needed

### Memory Optimization

```typescript
// Scan in batches
const batches = [
  { root: 'src/components', include: ['**/*.tsx'] },
  { root: 'src/services', include: ['**/*.ts'] },
  { root: 'src/utils', include: ['**/*.ts'] }
];

for (const config of batches) {
  await mcpClient.callTool('cards.scan', config);
}
```

### Caching Strategy

The server doesn't cache by default. For frequent scans:

1. Store scan results client-side
2. Compare file hashes to detect changes
3. Only rescan modified files

## Security Considerations

### File Access Control

- Server only accesses files within `--root` directory
- Symlinks are followed with caution
- Hidden files (`.` prefix) are excluded by default

### Read-Only Mode

When `--read-only` is enabled:
- `edits.apply` tool returns error
- No file modifications possible
- Audit logs still function

### Audit Logging

Audit logs contain:
- File access timestamps
- File paths (relative to root)
- Content hashes
- Run identifiers

**Privacy Note**: Logs don't contain file content, only metadata.

## Troubleshooting

### Configuration Issues

**Problem**: Settings not applied
```bash
# Solution: Check environment variable precedence
env | grep CARTA_MCP
```

**Problem**: Audit log not created
```bash
# Solution: Check write permissions
ls -la .kooix/logs/
mkdir -p .kooix/logs
```

**Problem**: SQLite audit fails
```bash
# Solution: Install optional dependency
npm install better-sqlite3 --save-optional
```

### Performance Issues

**Problem**: Slow scanning
```bash
# Solution: Use more specific patterns
{
  root: 'src',
  include: ['components/**/*.tsx'],
  exclude: ['**/*.test.*', '**/node_modules/**']
}
```

## Migration Guide

### Upgrading from v0.1.x

Breaking changes in v0.2.0:
- New auto-generation parameters
- Enhanced scan response format

```typescript
// v0.1.x
const result = await client.callTool('cards.scan', {
  root: 'src'
});

// v0.2.x (backward compatible)
const result = await client.callTool('cards.scan', {
  root: 'src',
  autoGenerate: false  // Explicitly disable new feature
});
```