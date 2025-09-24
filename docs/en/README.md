# @kooix/carta-mcp - Complete Documentation

This is the complete documentation for @kooix/carta-mcp, a Model Context Protocol server with intelligent auto-generation capabilities.

## Table of Contents

1. [Installation Guide](installation.md)
2. [Auto-Generation Features](auto-generation.md)
3. [Configuration Options](configuration.md)
4. [MCP Client Integration](integration.md)
5. [Development Guide](development.md)
6. [API Reference](#api-reference)

## API Reference

### MCP Tools Overview

This server exposes four MCP tools for intelligent project interaction:

### `cards.scan`

**Purpose**: Recursively scan for project cards and editable blocks with optional auto-generation.

**Parameters**:
```typescript
{
  root?: string;         // Optional subdirectory to scan
  include?: string[];    // Glob patterns to include
  exclude?: string[];    // Glob patterns to exclude
  autoGenerate?: boolean;// Enable automatic card generation
  generateOptions?: {    // Auto-generation configuration
    template?: 'minimal' | 'detailed';     // Template style
    inferFromPath?: boolean;               // Use file path for inference
    inferFromContent?: boolean;            // Use file content for inference
    dryRun?: boolean;                      // Preview only, no file writes
  };
}
```

**Returns**: Array of discovered files with metadata including:
- File paths and SHA-256 hashes
- `@SFC`/`@DFC` card presence indicators
- `LLM-EDIT` block locations and content hashes
- **New**: Generated card information and statistics

### `cards.get`

**Purpose**: Retrieve metadata and content from a specific file.

**Parameters**:
```typescript
{
  path: string; // File path relative to server root
}
```

**Returns**: File metadata including:
- File path and SHA-256 hash
- Raw `@SFC`/`@DFC` YAML content (if present)
- Complete file structure information

### `edits.apply`

**Purpose**: Safely replace content within `LLM-EDIT` blocks using optimistic locking.

**Parameters**:
```typescript
{
  file: string;       // Target file path
  blockId: string;    // LLM-EDIT block identifier
  oldHash: string;    // Current block content hash
  newContent: string; // Replacement content
  reason?: string;    // Optional change description
}
```

**Error Codes**:
- `BOUNDARY_NOT_FOUND`: Block identifier not found
- `STALE_BLOCK`: Hash mismatch (content changed)
- `OUT_OF_BOUND_WRITE`: Write extends beyond block boundaries
- `READ_ONLY_MODE`: Server is in read-only mode

### `io.readlog.append`

**Purpose**: Record file access events for audit trails.

**Parameters**:
```typescript
{
  runId: string;  // Unique run identifier
  path: string;   // File path that was accessed
  sha256: string; // File content hash at time of access
}
```

**Output**: Logged to `.kooix/logs/readlog.jsonl` or `.kooix/logs/readlog.sqlite`

## File Format Specifications

### Project Cards

Define project metadata using YAML front matter:

#### Single File Card (`@SFC`)
```markdown
# My Component

@SFC
name: user-profile
description: User profile component with avatar and details
version: 1.2.0
tags: [component, user, ui]

Component implementation follows...
```

#### Directory File Card (`@DFC`)
```markdown
# Module Documentation

@DFC
name: auth-module
description: Authentication and authorization module
structure:
  - controllers/
  - services/
  - middleware/

Module contents...
```

### Editable Blocks

Mark code sections that can be safely modified by AI tools:

```typescript
function processUser(data: UserData) {
  /* LLM-EDIT:BEGIN validation-logic */
  if (!data.email || !data.name) {
    throw new Error('Missing required fields');
  }
  /* LLM-EDIT:END validation-logic */

  return transformUserData(data);
}
```

**Supported Comment Styles**:
- `/* ... */` (JavaScript, TypeScript, CSS)
- `// ...` (Single line comments)
- `# ...` (Python, Shell, YAML)
- `<!-- ... -->` (HTML, XML, Markdown)

**Block Rules**:
- Identifiers must be unique within each file
- Content is automatically normalized for line endings
- Hash verification prevents concurrent modification conflicts

## Audit Logging

Choose from three audit modes to track file access:

### JSONL Mode (Default)
```bash
carta-mcp serve --audit jsonl
```
- Logs to `.kooix/logs/readlog.jsonl`
- Human-readable structured format
- Easy to parse with standard tools

### SQLite Mode
```bash
npm install better-sqlite3 --save-optional
carta-mcp serve --audit sqlite
```
- Logs to `.kooix/logs/readlog.sqlite`
- Queryable database format
- Better performance for large volumes

### Disabled
```bash
carta-mcp serve --audit none
```
- No audit logging
- Minimal overhead
- Suitable for development environments