# Development Guide

This guide covers development setup, contributing, and extending @kooix/carta-mcp.

## Development Setup

### Prerequisites

- Node.js 18+ (with ES modules support)
- npm 8+
- Git

### Repository Structure

```
kooix-carta/
├── packages/
│   └── kooix-carta-mcp/          # Main MCP server package
│       ├── src/
│       │   ├── server.ts         # MCP server implementation
│       │   ├── tools/           # Tool implementations
│       │   │   ├── scan.ts      # cards.scan tool
│       │   │   ├── get.ts       # cards.get tool
│       │   │   ├── apply.ts     # edits.apply tool
│       │   │   └── readlog.ts   # io.readlog.append tool
│       │   ├── types.ts         # TypeScript type definitions
│       │   ├── generator.ts     # Auto-generation engine
│       │   └── utils/           # Utility functions
│       ├── tests/               # Test files
│       ├── package.json
│       └── tsconfig.json
├── docs/                        # Documentation
├── .github/                     # GitHub Actions
└── README.md
```

### Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/telagod/kooix-carta.git
cd kooix-carta
```

2. **Install dependencies**:
```bash
cd packages/kooix-carta-mcp
npm ci
```

3. **Build the project**:
```bash
npm run build
```

4. **Run tests**:
```bash
npm test
```

5. **Start development server**:
```bash
npm run dev
```

### Development Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "node --test",
    "test:watch": "node --test --watch",
    "lint": "eslint src/ --ext .ts",
    "lint:fix": "eslint src/ --ext .ts --fix",
    "clean": "rm -rf dist/"
  }
}
```

## Architecture Overview

### MCP Server Core

The server implements the Model Context Protocol specification:

```typescript
// server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
  { name: 'kooix-carta-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
);
```

### Tool System

Each tool is implemented as a separate module:

```typescript
// tools/scan.ts
export async function handleScan(request: ScanRequest): Promise<ScanResponse> {
  // Implementation
}

// tools/get.ts
export async function handleGet(request: GetRequest): Promise<GetResponse> {
  // Implementation
}

// tools/apply.ts
export async function handleApply(request: ApplyRequest): Promise<ApplyResponse> {
  // Implementation
}

// tools/readlog.ts
export async function handleReadlog(request: ReadlogRequest): Promise<void> {
  // Implementation
}
```

### Type System

All types are defined in `types.ts`:

```typescript
export interface ScanRequest {
  root?: string;
  include?: string[];
  exclude?: string[];
  autoGenerate?: boolean;
  generateOptions?: GenerateOptions;
}

export interface GenerateOptions {
  template?: 'minimal' | 'detailed';
  inferFromPath?: boolean;
  inferFromContent?: boolean;
  dryRun?: boolean;
}
```

### Auto-Generation Engine

The generator uses a plugin-based inference system:

```typescript
// generator.ts
export function generateSFC(
  filePath: string,
  content: string,
  options: GenerateOptions = {}
): GeneratedCard {
  const pathInfo = inferFromPath(filePath);
  const contentInfo = inferFromContent(content);

  return {
    name: pathInfo.name,
    description: generateDescription(pathInfo, contentInfo),
    version: '1.0.0',
    tags: [...pathInfo.tags, ...contentInfo.tags]
  };
}
```

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── scan.test.js
│   ├── generator.test.js
│   └── utils.test.js
├── integration/
│   ├── mcp-client.test.js
│   └── full-workflow.test.js
├── fixtures/
│   ├── sample-project/
│   └── test-files/
└── helpers/
    └── test-utils.js
```

### Writing Tests

```javascript
// tests/unit/scan.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { handleScan } from '../../src/tools/scan.js';

test('scan should find SFC cards', async () => {
  const result = await handleScan({
    root: './tests/fixtures/sample-project'
  });

  assert.strictEqual(result.files.length, 3);
  assert.strictEqual(result.files[0].sfc.exists, true);
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "scan"

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Fixtures

Create realistic test scenarios:

```
tests/fixtures/sample-project/
├── src/
│   ├── components/
│   │   └── Button.tsx          # Contains @SFC card
│   ├── services/
│   │   └── api.ts              # No card (for generation tests)
│   └── utils/
│       └── helpers.ts          # Contains LLM-EDIT blocks
├── docs/
│   └── README.md               # Contains @DFC card
└── package.json
```

## Contributing

### Code Style

We use ESLint and Prettier for consistent code style:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@typescript-eslint/recommended'],
  rules: {
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
```

### Commit Guidelines

Follow conventional commits:

```bash
# Feature
git commit -m "feat: add automatic card generation"

# Bug fix
git commit -m "fix: handle empty file content in generator"

# Documentation
git commit -m "docs: update API reference"

# Tests
git commit -m "test: add integration tests for auto-generation"

# Refactoring
git commit -m "refactor: simplify inference logic"
```

### Pull Request Process

1. **Create a feature branch**:
```bash
git checkout -b feature/new-functionality
```

2. **Make changes and add tests**:
```bash
# Make your changes
vim src/tools/new-tool.ts

# Add tests
vim tests/unit/new-tool.test.js

# Run tests
npm test
```

3. **Update documentation**:
```bash
# Update relevant docs
vim docs/en/README.md
vim docs/zh-CN/README.md
```

4. **Create pull request**:
```bash
git push origin feature/new-functionality
# Then create PR via GitHub UI
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Type definitions are complete
- [ ] Error handling is proper
- [ ] Performance considerations addressed

## Extending the Server

### Adding New Tools

1. **Create tool module**:
```typescript
// src/tools/my-tool.ts
export async function handleMyTool(request: MyToolRequest): Promise<MyToolResponse> {
  // Implementation
}
```

2. **Define types**:
```typescript
// src/types.ts
export interface MyToolRequest {
  param1: string;
  param2?: number;
}

export interface MyToolResponse {
  result: string;
}
```

3. **Register tool**:
```typescript
// src/server.ts
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools
    {
      name: 'my.tool',
      description: 'My custom tool',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
          param2: { type: 'number' }
        },
        required: ['param1']
      }
    }
  ]
}));
```

4. **Add tool handler**:
```typescript
// src/server.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my.tool') {
    return await handleMyTool(request.params.arguments);
  }
  // ... other tools
});
```

### Extending Auto-Generation

1. **Add new inference patterns**:
```typescript
// src/generator.ts
export function inferFromPath(filePath: string): PathInference {
  // Add new patterns
  if (filePath.includes('/hooks/')) {
    return {
      category: 'hook',
      tags: ['react', 'hook'],
      // ...
    };
  }
}
```

2. **Create custom templates**:
```typescript
// src/generator.ts
const templates = {
  minimal: generateMinimalTemplate,
  detailed: generateDetailedTemplate,
  custom: generateCustomTemplate  // New template
};
```

3. **Add file type support**:
```typescript
// src/generator.ts
const commentStyles = {
  '.ts': '/* %content% */',
  '.tsx': '/* %content% */',
  '.py': '# %content%',
  '.rs': '// %content%',  // New: Rust support
  '.go': '// %content%'   // New: Go support
};
```

## Debugging

### Enable Debug Logging

```bash
DEBUG=mcp:* npm run dev
```

### Debug Specific Components

```bash
DEBUG=mcp:scan,mcp:generator npm run dev
```

### VS Code Configuration

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug MCP Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/server.js",
      "args": ["serve", "--root", "./test-project"],
      "env": {
        "DEBUG": "mcp:*"
      },
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

## Performance Optimization

### Profiling

```bash
# CPU profiling
node --prof dist/server.js serve --root ./large-project

# Memory usage
node --inspect dist/server.js serve --root ./large-project
```

### Optimization Strategies

1. **File System Optimization**:
```typescript
// Use async operations
const files = await Promise.all(
  filePaths.map(path => fs.readFile(path, 'utf-8'))
);

// Batch file operations
const stats = await Promise.all(
  filePaths.map(path => fs.stat(path))
);
```

2. **Memory Management**:
```typescript
// Stream large files
const stream = fs.createReadStream(largePath);
// Process in chunks
```

3. **Caching**:
```typescript
// Cache file hashes
const hashCache = new Map<string, string>();

if (!hashCache.has(filePath)) {
  hashCache.set(filePath, await calculateHash(content));
}
```

## Release Process

### Version Management

```bash
# Update version
npm version patch  # 0.2.0 -> 0.2.1
npm version minor  # 0.2.0 -> 0.3.0
npm version major  # 0.2.0 -> 1.0.0
```

### Publishing

```bash
# Build for production
npm run build

# Run all tests
npm test

# Create GitHub release
git push origin main --tags

# GitHub Actions automatically publishes to GitHub Packages
```

### Documentation Updates

```bash
# Update version in docs
find docs/ -name "*.md" -exec sed -i 's/v0\.2\.0/v0\.2\.1/g' {} \;

# Update CHANGELOG
echo "## v0.2.1\n- Bug fixes\n" >> CHANGELOG.md
```

## Best Practices

### Error Handling

```typescript
// Use specific error types
export class BlockNotFoundError extends Error {
  constructor(blockId: string) {
    super(`Block '${blockId}' not found`);
    this.name = 'BlockNotFoundError';
  }
}

// Handle errors gracefully
try {
  await applyEdit(request);
} catch (error) {
  if (error instanceof BlockNotFoundError) {
    return { error: 'BOUNDARY_NOT_FOUND' };
  }
  throw error;
}
```

### Type Safety

```typescript
// Use strict types
interface StrictRequest {
  readonly param: string;
  readonly options?: Readonly<Options>;
}

// Validate runtime data
function validateRequest(data: unknown): ScanRequest {
  if (typeof data !== 'object' || !data) {
    throw new Error('Invalid request');
  }
  return data as ScanRequest;
}
```

### Documentation

```typescript
/**
 * Generates a Single File Card (SFC) for the given file.
 *
 * @param filePath - Absolute path to the target file
 * @param content - File content for analysis
 * @param options - Generation options
 * @returns Generated card data
 *
 * @example
 * ```typescript
 * const card = generateSFC(
 *   '/src/components/Button.tsx',
 *   fileContent,
 *   { template: 'detailed' }
 * );
 * ```
 */
export function generateSFC(
  filePath: string,
  content: string,
  options: GenerateOptions = {}
): GeneratedCard {
  // Implementation
}
```