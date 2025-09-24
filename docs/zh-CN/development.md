# 开发指南

本指南涵盖了开发设置、贡献和扩展 @kooix/carta-mcp。

## 开发设置

### 前置要求

- Node.js 18+（支持 ES 模块）
- npm 8+
- Git

### 仓库结构

```
kooix-carta/
├── packages/
│   └── kooix-carta-mcp/          # 主 MCP 服务器包
│       ├── src/
│       │   ├── server.ts         # MCP 服务器实现
│       │   ├── tools/           # 工具实现
│       │   │   ├── scan.ts      # cards.scan 工具
│       │   │   ├── get.ts       # cards.get 工具
│       │   │   ├── apply.ts     # edits.apply 工具
│       │   │   └── readlog.ts   # io.readlog.append 工具
│       │   ├── types.ts         # TypeScript 类型定义
│       │   ├── generator.ts     # 自动生成引擎
│       │   └── utils/           # 工具函数
│       ├── tests/               # 测试文件
│       ├── package.json
│       └── tsconfig.json
├── docs/                        # 文档
├── .github/                     # GitHub Actions
└── README.md
```

### 本地开发

1. **克隆仓库**：
```bash
git clone https://github.com/telagod/kooix-carta.git
cd kooix-carta
```

2. **安装依赖**：
```bash
cd packages/kooix-carta-mcp
npm ci
```

3. **构建项目**：
```bash
npm run build
```

4. **运行测试**：
```bash
npm test
```

5. **启动开发服务器**：
```bash
npm run dev
```

### 开发脚本

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

## 架构概览

### MCP 服务器核心

服务器实现了 Model Context Protocol 规范：

```typescript
// server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
  { name: 'kooix-carta-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
);
```

### 工具系统

每个工具作为独立模块实现：

```typescript
// tools/scan.ts
export async function handleScan(request: ScanRequest): Promise<ScanResponse> {
  // 实现
}

// tools/get.ts
export async function handleGet(request: GetRequest): Promise<GetResponse> {
  // 实现
}

// tools/apply.ts
export async function handleApply(request: ApplyRequest): Promise<ApplyResponse> {
  // 实现
}

// tools/readlog.ts
export async function handleReadlog(request: ReadlogRequest): Promise<void> {
  // 实现
}
```

### 类型系统

所有类型定义在 `types.ts` 中：

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

### 自动生成引擎

生成器使用基于插件的推断系统：

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

## 测试

### 测试结构

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

### 编写测试

```javascript
// tests/unit/scan.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { handleScan } from '../../src/tools/scan.js';

test('扫描应该找到 SFC 卡片', async () => {
  const result = await handleScan({
    root: './tests/fixtures/sample-project'
  });

  assert.strictEqual(result.files.length, 3);
  assert.strictEqual(result.files[0].sfc.exists, true);
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- --grep "scan"

# 运行带覆盖率的测试
npm run test:coverage

# 监视模式
npm run test:watch
```

### 测试夹具

创建真实的测试场景：

```
tests/fixtures/sample-project/
├── src/
│   ├── components/
│   │   └── Button.tsx          # 包含 @SFC 卡片
│   ├── services/
│   │   └── api.ts              # 无卡片（用于生成测试）
│   └── utils/
│       └── helpers.ts          # 包含 LLM-EDIT 块
├── docs/
│   └── README.md               # 包含 @DFC 卡片
└── package.json
```

## 贡献

### 代码风格

我们使用 ESLint 和 Prettier 保持一致的代码风格：

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

### 提交指南

遵循约定式提交：

```bash
# 功能
git commit -m "feat: add automatic card generation"

# 错误修复
git commit -m "fix: handle empty file content in generator"

# 文档
git commit -m "docs: update API reference"

# 测试
git commit -m "test: add integration tests for auto-generation"

# 重构
git commit -m "refactor: simplify inference logic"
```

### Pull Request 流程

1. **创建功能分支**：
```bash
git checkout -b feature/new-functionality
```

2. **进行更改并添加测试**：
```bash
# 进行更改
vim src/tools/new-tool.ts

# 添加测试
vim tests/unit/new-tool.test.js

# 运行测试
npm test
```

3. **更新文档**：
```bash
# 更新相关文档
vim docs/en/README.md
vim docs/zh-CN/README.md
```

4. **创建 Pull Request**：
```bash
git push origin feature/new-functionality
# 然后通过 GitHub UI 创建 PR
```

### 代码审查清单

- [ ] 代码遵循风格指南
- [ ] 包含测试并通过
- [ ] 文档已更新
- [ ] 类型定义完整
- [ ] 错误处理得当
- [ ] 性能考虑已解决

## 扩展服务器

### 添加新工具

1. **创建工具模块**：
```typescript
// src/tools/my-tool.ts
export async function handleMyTool(request: MyToolRequest): Promise<MyToolResponse> {
  // 实现
}
```

2. **定义类型**：
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

3. **注册工具**：
```typescript
// src/server.ts
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... 现有工具
    {
      name: 'my.tool',
      description: '我的自定义工具',
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

4. **添加工具处理器**：
```typescript
// src/server.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my.tool') {
    return await handleMyTool(request.params.arguments);
  }
  // ... 其他工具
});
```

### 扩展自动生成

1. **添加新的推断模式**：
```typescript
// src/generator.ts
export function inferFromPath(filePath: string): PathInference {
  // 添加新模式
  if (filePath.includes('/hooks/')) {
    return {
      category: 'hook',
      tags: ['react', 'hook'],
      // ...
    };
  }
}
```

2. **创建自定义模板**：
```typescript
// src/generator.ts
const templates = {
  minimal: generateMinimalTemplate,
  detailed: generateDetailedTemplate,
  custom: generateCustomTemplate  // 新模板
};
```

3. **添加文件类型支持**：
```typescript
// src/generator.ts
const commentStyles = {
  '.ts': '/* %content% */',
  '.tsx': '/* %content% */',
  '.py': '# %content%',
  '.rs': '// %content%',  // 新增：Rust 支持
  '.go': '// %content%'   // 新增：Go 支持
};
```

## 调试

### 启用调试日志

```bash
DEBUG=mcp:* npm run dev
```

### 调试特定组件

```bash
DEBUG=mcp:scan,mcp:generator npm run dev
```

### VS Code 配置

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "调试 MCP 服务器",
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

## 性能优化

### 性能分析

```bash
# CPU 分析
node --prof dist/server.js serve --root ./large-project

# 内存使用
node --inspect dist/server.js serve --root ./large-project
```

### 优化策略

1. **文件系统优化**：
```typescript
// 使用异步操作
const files = await Promise.all(
  filePaths.map(path => fs.readFile(path, 'utf-8'))
);

// 批量文件操作
const stats = await Promise.all(
  filePaths.map(path => fs.stat(path))
);
```

2. **内存管理**：
```typescript
// 流式处理大文件
const stream = fs.createReadStream(largePath);
// 分块处理
```

3. **缓存**：
```typescript
// 缓存文件哈希
const hashCache = new Map<string, string>();

if (!hashCache.has(filePath)) {
  hashCache.set(filePath, await calculateHash(content));
}
```

## 发布流程

### 版本管理

```bash
# 更新版本
npm version patch  # 0.2.0 -> 0.2.1
npm version minor  # 0.2.0 -> 0.3.0
npm version major  # 0.2.0 -> 1.0.0
```

### 发布

```bash
# 生产构建
npm run build

# 运行所有测试
npm test

# 创建 GitHub 发布
git push origin main --tags

# GitHub Actions 自动发布到 GitHub Packages
```

### 文档更新

```bash
# 更新文档中的版本
find docs/ -name "*.md" -exec sed -i 's/v0\.2\.0/v0\.2\.1/g' {} \;

# 更新 CHANGELOG
echo "## v0.2.1\n- 错误修复\n" >> CHANGELOG.md
```

## 最佳实践

### 错误处理

```typescript
// 使用特定错误类型
export class BlockNotFoundError extends Error {
  constructor(blockId: string) {
    super(`找不到块 '${blockId}'`);
    this.name = 'BlockNotFoundError';
  }
}

// 优雅地处理错误
try {
  await applyEdit(request);
} catch (error) {
  if (error instanceof BlockNotFoundError) {
    return { error: 'BOUNDARY_NOT_FOUND' };
  }
  throw error;
}
```

### 类型安全

```typescript
// 使用严格类型
interface StrictRequest {
  readonly param: string;
  readonly options?: Readonly<Options>;
}

// 验证运行时数据
function validateRequest(data: unknown): ScanRequest {
  if (typeof data !== 'object' || !data) {
    throw new Error('无效的请求');
  }
  return data as ScanRequest;
}
```

### 文档

```typescript
/**
 * 为给定文件生成单文件卡片（SFC）。
 *
 * @param filePath - 目标文件的绝对路径
 * @param content - 用于分析的文件内容
 * @param options - 生成选项
 * @returns 生成的卡片数据
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
  // 实现
}
```