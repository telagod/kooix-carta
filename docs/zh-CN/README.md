# @kooix/carta-mcp - 完整中文文档

这是 @kooix/carta-mcp 的完整中文文档，一个具有智能自动生成功能的模型上下文协议服务器。

## 目录

1. [安装指南](installation.md)
2. [自动生成功能](auto-generation.md)
3. [配置选项](configuration.md)
4. [MCP 客户端集成](integration.md)
5. [开发指南](development.md)
6. [API 参考](#api-参考)

## API 参考

### MCP 工具概览

本服务器提供四个 MCP 工具用于智能项目交互：

### `cards.scan`

**用途**：递归扫描项目卡片和可编辑块，支持智能自动生成。

**参数**：
```typescript
{
  root?: string;         // 可选的子目录路径
  include?: string[];    // 要包含的 glob 模式
  exclude?: string[];    // 要排除的 glob 模式
  autoGenerate?: boolean;// 启用自动卡片生成
  generateOptions?: {    // 自动生成配置
    template?: 'minimal' | 'detailed';     // 模板风格
    inferFromPath?: boolean;               // 从文件路径推断
    inferFromContent?: boolean;            // 从文件内容推断
    dryRun?: boolean;                      // 仅预览，不写入文件
  };
}
```

**返回**：发现的文件数组，包含元数据：
- 文件路径和 SHA-256 哈希
- `@SFC`/`@DFC` 卡片存在指示器
- `LLM-EDIT` 块位置和内容哈希
- **新功能**：生成的卡片信息和统计

### `cards.get`

**用途**：从指定文件检索元数据和内容。

**参数**：
```typescript
{
  path: string; // 相对于服务器根目录的文件路径
}
```

**返回**：文件元数据包括：
- 文件路径和 SHA-256 哈希
- 原始 `@SFC`/`@DFC` YAML 内容（如果存在）
- 完整的文件结构信息

### `edits.apply`

**用途**：使用乐观锁定安全地替换 `LLM-EDIT` 块内的内容。

**参数**：
```typescript
{
  file: string;       // 目标文件路径
  blockId: string;    // LLM-EDIT 块标识符
  oldHash: string;    // 当前块内容哈希
  newContent: string; // 替换内容
  reason?: string;    // 可选的更改描述
}
```

**错误码**：
- `BOUNDARY_NOT_FOUND`：未找到块标识符
- `STALE_BLOCK`：哈希不匹配（内容已更改）
- `OUT_OF_BOUND_WRITE`：写入超出块边界
- `READ_ONLY_MODE`：服务器处于只读模式

### `io.readlog.append`

**用途**：记录文件访问事件用于审计跟踪。

**参数**：
```typescript
{
  runId: string;  // 唯一运行标识符
  path: string;   // 被访问的文件路径
  sha256: string; // 访问时的文件内容哈希
}
```

**输出**：记录到 `.kooix/logs/readlog.jsonl` 或 `.kooix/logs/readlog.sqlite`

## 文件格式规范

### 项目卡片

使用 YAML 前置元数据定义项目元数据：

#### 单文件卡片（`@SFC`）
```markdown
# 我的组件

@SFC
name: user-profile
description: 用户资料组件，包含头像和详细信息
version: 1.2.0
tags: [component, user, ui]

组件实现如下...
```

#### 目录文件卡片（`@DFC`）
```markdown
# 模块文档

@DFC
name: auth-module
description: 身份验证和授权模块
structure:
  - controllers/
  - services/
  - middleware/

模块内容...
```

### 可编辑块

标记可以被 AI 工具安全修改的代码部分：

```typescript
function processUser(data: UserData) {
  /* LLM-EDIT:BEGIN validation-logic */
  if (!data.email || !data.name) {
    throw new Error('缺少必填字段');
  }
  /* LLM-EDIT:END validation-logic */

  return transformUserData(data);
}
```

**支持的注释风格**：
- `/* ... */` (JavaScript、TypeScript、CSS)
- `// ...` (单行注释)
- `# ...` (Python、Shell、YAML)
- `<!-- ... -->` (HTML、XML、Markdown)

**块规则**：
- 标识符在每个文件中必须唯一
- 内容会自动规范化行尾符
- 哈希验证防止并发修改冲突

## 审计日志

选择三种审计模式之一来跟踪文件访问：

### JSONL 模式（默认）
```bash
carta-mcp serve --audit jsonl
```
- 记录到 `.kooix/logs/readlog.jsonl`
- 人类可读的结构化格式
- 易于使用标准工具解析

### SQLite 模式
```bash
npm install better-sqlite3 --save-optional
carta-mcp serve --audit sqlite
```
- 记录到 `.kooix/logs/readlog.sqlite`
- 可查询的数据库格式
- 大量数据的更好性能

### 禁用
```bash
carta-mcp serve --audit none
```
- 无审计日志
- 最小开销
- 适用于开发环境