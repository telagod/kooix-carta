# @kooix/carta-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node->=18.18-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

**@kooix/carta-mcp** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that enables intelligent file discovery and controlled editing within projects. It provides standardized access to project metadata through "cards" and supports safe, bounded edits in annotated code regions.

## ✨ Features

- 🔍 **Smart Discovery** - Automatically scan for `@SFC` (single file) and `@DFC` (directory) metadata cards
- ✏️ **Safe Editing** - Apply controlled edits within `LLM-EDIT` blocks with hash verification
- 🤖 **Auto-Generation** - Intelligently generate missing cards during development workflow
- 📊 **Audit Logging** - Track file access with JSONL or SQLite audit trails
- 🔒 **Read-Only Mode** - Protect production environments with write-disabled mode
- 🎯 **TypeScript Native** - Fully typed with comprehensive SDK integration
- ⚡ **Zero Install** - Run directly from GitHub releases with npx

## 🚀 Quick Start

### Install from GitHub Packages (Recommended)

Install directly from GitHub's npm registry:

```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
npx carta-mcp serve --root . --audit jsonl
```

Or configure npm to use GitHub Packages for this scope:

```bash
npm config set @kooix:registry https://npm.pkg.github.com
npm install @kooix/carta-mcp@latest
npx carta-mcp serve --root . --audit jsonl
```

### One-Time Run (Alternative)

No installation - run directly from GitHub releases:

```bash
npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root . --audit jsonl
```

### SQLite Audit (Optional)

Enable advanced audit logging with SQLite:

```bash
npm install better-sqlite3 --save-optional
npx carta-mcp serve --root . --audit sqlite
```

## 📖 Usage

### CLI Options

```bash
carta-mcp serve [options]
```

| Option | Default | Description |
| --- | --- | --- |
| `--root <dir>` | `.` | Workspace root directory to expose |
| `--audit <mode>` | `jsonl` | Audit mode: `jsonl`, `sqlite`, or `none` |
| `--read-only` | `false` | Disable write operations (rejects `edits.apply`) |
| `--help` | - | Show help message |

### Integration with MCP Clients

#### Claude Desktop

Add to your MCP configuration after installing from GitHub Packages:

```bash
# First install the package
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com

# Then add to Claude
claude mcp add kooix-carta -- npx carta-mcp serve --root .
```

Or use the one-time run method:

```bash
claude mcp add kooix-carta -- npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .
```

#### Other MCP Clients

Configure stdio transport with the carta-mcp CLI:

```json
{
  "mcpServers": {
    "kooix-carta": {
      "command": "npx",
      "args": [
        "--yes",
        "https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz",
        "serve",
        "--root",
        "."
      ]
    }
  }
}
```

## 🛠️ MCP Tools

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

**Auto-Generation Examples**:

```bash
# Preview what would be generated (dry run)
{
  "autoGenerate": true,
  "generateOptions": {
    "template": "minimal",
    "dryRun": true
  }
}

# Actually generate missing cards
{
  "root": "src",
  "autoGenerate": true,
  "generateOptions": {
    "template": "detailed",
    "inferFromPath": true,
    "inferFromContent": true
  }
}
```

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

## 📝 File Format Specifications

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

## 🤖 Auto-Generation Features

The MCP server can intelligently generate missing `@SFC` cards during the scan process, perfect for gradual project improvement.

### Smart Inference

**Path-Based Inference**:
- File type detection from extensions (`.tsx` → React TypeScript)
- Component categorization from directory structure
- Automatic tag generation based on project patterns

**Content-Based Inference**:
- Function vs class detection
- Export pattern analysis
- Framework identification (React, Vue, etc.)
- Test file recognition

### Templates

#### Minimal Template
```yaml
@SFC
name: component-name
description: Auto-generated description
version: 1.0.0
tags: [typescript, component]
```

#### Detailed Template
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

### Usage Examples

**Development Workflow**:
```typescript
// 1. Scan and preview generation
await mcpClient.callTool('cards.scan', {
  root: 'src',
  autoGenerate: true,
  generateOptions: { dryRun: true }
});

// 2. Actually generate cards
await mcpClient.callTool('cards.scan', {
  root: 'src/components',
  autoGenerate: true,
  generateOptions: {
    template: 'detailed',
    inferFromContent: true
  }
});
```

**Supported File Types**:
- **TypeScript/JavaScript**: `.ts`, `.tsx`, `.js`, `.jsx`
- **Vue Components**: `.vue`
- **Python**: `.py`
- **Markdown**: `.md`

## 📊 Audit Logging

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

## 🔧 Development

### Local Development

```bash
cd packages/kooix-carta-mcp
npm ci
npm run build
npm test
```

### Project Structure

```
packages/kooix-carta-mcp/
├── src/
│   ├── server.ts       # MCP server implementation
│   ├── scan.ts         # Card discovery logic
│   ├── patch.ts        # Edit block handling
│   ├── readlog.ts      # Audit logging
│   └── ...
├── bin/
│   └── cli.ts          # CLI entry point
└── dist/               # Compiled output
```

### Requirements

- **Node.js**: 18.18 or higher
- **TypeScript**: 5.4+ (for development)
- **Module System**: ES modules with NodeNext resolution

## 📦 Release Process

### Automated Releases

The project uses GitHub Actions for automated releases:

1. **Update Version**: Bump version in `packages/kooix-carta-mcp/package.json`
2. **Create Tag**: `git tag vX.Y.Z && git push origin vX.Y.Z`
3. **GitHub Release**: Automatically builds and attaches `.tgz` assets

### CI/CD Workflows

- **`.github/workflows/ci.yml`**: Continuous integration (install, build, test)
- **`.github/workflows/release.yml`**: Release automation (triggered by tags or GitHub Releases)

### Manual Release

```bash
# Build and package
npm run build
npm pack

# Upload to your preferred registry or host
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm run build && npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for the Model Context Protocol ecosystem**

[Documentation](https://modelcontextprotocol.io) • [Specification](https://github.com/modelcontextprotocol/specification) • [Community](https://github.com/modelcontextprotocol)

</div>
