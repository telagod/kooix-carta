# 配置选项

本指南涵盖了 @kooix/carta-mcp 的所有配置选项。

## 服务器选项

### `--root <dir>`

指定要服务的根目录。

```bash
# 当前目录（默认）
npx carta-mcp serve

# 特定目录
npx carta-mcp serve --root ./src

# 绝对路径
npx carta-mcp serve --root /absolute/path/to/project
```

**默认值**：当前工作目录

### `--audit <mode>`

设置审计日志模式。

```bash
# JSONL 格式（默认）
npx carta-mcp serve --audit jsonl

# SQLite 数据库
npx carta-mcp serve --audit sqlite

# 禁用日志
npx carta-mcp serve --audit none
```

**选项**：
- `jsonl` - `.kooix/logs/readlog.jsonl` 中的人类可读结构化日志
- `sqlite` - `.kooix/logs/readlog.sqlite` 中的可查询数据库（需要 `better-sqlite3`）
- `none` - 无审计日志

**默认值**：`jsonl`

### `--read-only`

禁用 `edits.apply` 工具写入，使服务器只读。

```bash
npx carta-mcp serve --read-only
```

**使用场景**：
- 生产环境
- 代码审查会话
- 文档生成
- 只读访问控制

## 自动生成选项

### 模板选择

在精简和详细卡片模板之间选择：

```typescript
// 精简模板
{
  autoGenerate: true,
  generateOptions: {
    template: 'minimal'
  }
}

// 详细模板
{
  autoGenerate: true,
  generateOptions: {
    template: 'detailed'
  }
}
```

**精简模板输出**：
```yaml
@SFC
name: component-name
description: 自动生成的描述
version: 1.0.0
tags: [typescript, component]
```

**详细模板输出**：
```yaml
@SFC
name: component-name
description: 自动生成的描述
version: 1.0.0
type: react-typescript
category: component
tags: [typescript, react, component]
created: 2025-09-24
author: auto-generated
```

### 推断选项

控制如何推断元数据：

```typescript
{
  autoGenerate: true,
  generateOptions: {
    inferFromPath: true,    // 使用文件路径进行推断
    inferFromContent: true  // 分析文件内容
  }
}
```

**基于路径的推断**：
- 文件扩展名检测
- 目录结构分析
- 命名约定识别

**基于内容的推断**：
- 代码模式检测
- 框架识别
- 导出模式分析

### 干运行模式

预览生成而不写入文件：

```typescript
{
  autoGenerate: true,
  generateOptions: {
    dryRun: true
  }
}
```

**返回**：
- 将被修改的文件列表
- 生成内容的预览
- 生成统计信息

## 扫描过滤

### 包含模式

使用 glob 模式指定要包含的文件：

```typescript
{
  include: [
    '**/*.ts',
    '**/*.tsx',
    'src/components/**/*'
  ]
}
```

### 排除模式

指定要排除的文件：

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

### 组合过滤

```typescript
{
  root: 'src',
  include: ['**/*.{ts,tsx}'],
  exclude: ['**/*.test.*', '**/__tests__/**']
}
```

## 环境变量

### 设置变量

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

### 在脚本中使用

```bash
#!/bin/bash
export CARTA_MCP_ROOT="${PROJECT_ROOT}/src"
export CARTA_MCP_AUDIT="jsonl"

npx carta-mcp serve \
  --root "${CARTA_MCP_ROOT}" \
  --audit "${CARTA_MCP_AUDIT}"
```

## 高级配置

### 自定义注释样式

服务器自动检测适当的注释样式：

| 文件扩展名 | 注释样式 |
|-----------|---------|
| `.ts`, `.tsx`, `.js`, `.jsx` | `/* ... */` |
| `.py` | `# ...` |
| `.html`, `.xml`, `.md` | `<!-- ... -->` |
| `.css`, `.scss` | `/* ... */` |
| `.yaml`, `.yml` | `# ...` |

### 哈希算法

内容哈希使用 SHA-256：
- 块内容验证
- 文件完整性检查
- 乐观锁定

### 行尾符规范化

所有内容规范化为 LF (`\n`)：
- 跨平台一致性
- Git 友好的差异
- 可预测的哈希

## 配置示例

### 开发设置

```bash
npx carta-mcp serve \
  --root . \
  --audit jsonl
```

### 生产设置

```bash
npx carta-mcp serve \
  --root /var/www/app \
  --audit sqlite \
  --read-only
```

### 测试设置

```bash
npx carta-mcp serve \
  --root ./test-fixtures \
  --audit none
```

### CI/CD 设置

```bash
npx carta-mcp serve \
  --root "${CI_PROJECT_DIR}/src" \
  --audit sqlite \
  --read-only
```

## 性能调优

### 大型代码库

对于包含数千个文件的项目：

1. 使用特定的 `--root` 路径
2. 应用严格的 `include`/`exclude` 模式
3. 考虑 SQLite 审计模式
4. 不需要写入时启用 `--read-only`

### 内存优化

```typescript
// 批量扫描
const batches = [
  { root: 'src/components', include: ['**/*.tsx'] },
  { root: 'src/services', include: ['**/*.ts'] },
  { root: 'src/utils', include: ['**/*.ts'] }
];

for (const config of batches) {
  await mcpClient.callTool('cards.scan', config);
}
```

### 缓存策略

服务器默认不缓存。对于频繁扫描：

1. 在客户端存储扫描结果
2. 比较文件哈希以检测更改
3. 仅重新扫描修改的文件

## 安全考虑

### 文件访问控制

- 服务器仅访问 `--root` 目录内的文件
- 谨慎跟随符号链接
- 默认排除隐藏文件（`.` 前缀）

### 只读模式

启用 `--read-only` 时：
- `edits.apply` 工具返回错误
- 无法进行文件修改
- 审计日志仍然正常工作

### 审计日志

审计日志包含：
- 文件访问时间戳
- 文件路径（相对于根目录）
- 内容哈希
- 运行标识符

**隐私说明**：日志不包含文件内容，仅包含元数据。

## 故障排除

### 配置问题

**问题**：设置未应用
```bash
# 解决方案：检查环境变量优先级
env | grep CARTA_MCP
```

**问题**：未创建审计日志
```bash
# 解决方案：检查写入权限
ls -la .kooix/logs/
mkdir -p .kooix/logs
```

**问题**：SQLite 审计失败
```bash
# 解决方案：安装可选依赖
npm install better-sqlite3 --save-optional
```

### 性能问题

**问题**：扫描缓慢
```bash
# 解决方案：使用更具体的模式
{
  root: 'src',
  include: ['components/**/*.tsx'],
  exclude: ['**/*.test.*', '**/node_modules/**']
}
```

## 迁移指南

### 从 v0.1.x 升级

v0.2.0 中的重大变更：
- 新的自动生成参数
- 增强的扫描响应格式

```typescript
// v0.1.x
const result = await client.callTool('cards.scan', {
  root: 'src'
});

// v0.2.x（向后兼容）
const result = await client.callTool('cards.scan', {
  root: 'src',
  autoGenerate: false  // 显式禁用新功能
});
```