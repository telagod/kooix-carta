# MCP 客户端集成

本指南展示如何将 @kooix/carta-mcp 与各种 MCP 客户端集成。

## Claude Desktop

### 前置要求

1. 安装包：
```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

2. 确保安装了 Claude Desktop

### 配置

添加到您的 Claude Desktop MCP 配置：

```bash
claude mcp add kooix-carta -- npx carta-mcp serve --root .
```

或使用自定义选项：

```bash
claude mcp add kooix-carta -- npx carta-mcp serve --root ./src --audit sqlite --read-only
```

### 替代方案：一次性运行

如果您不想在本地安装：

```bash
claude mcp add kooix-carta -- npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .
```

## 其他 MCP 客户端

### 标准 JSON 配置

对于使用 JSON 配置的 MCP 客户端：

```json
{
  "mcpServers": {
    "kooix-carta": {
      "command": "npx",
      "args": [
        "carta-mcp",
        "serve",
        "--root",
        ".",
        "--audit",
        "jsonl"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 使用自定义根目录

```json
{
  "mcpServers": {
    "kooix-carta": {
      "command": "npx",
      "args": [
        "carta-mcp",
        "serve",
        "--root",
        "./src",
        "--audit",
        "sqlite"
      ]
    }
  }
}
```

### 只读模式

适用于生产环境：

```json
{
  "mcpServers": {
    "kooix-carta": {
      "command": "npx",
      "args": [
        "carta-mcp",
        "serve",
        "--root",
        ".",
        "--read-only",
        "--audit",
        "none"
      ]
    }
  }
}
```

## 自定义 MCP 客户端

### 使用 TypeScript SDK

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['carta-mcp', 'serve', '--root', '.']
});

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);

// 使用工具
const result = await client.callTool({
  name: 'cards.scan',
  arguments: {
    root: 'src',
    autoGenerate: true,
    generateOptions: {
      dryRun: true
    }
  }
});

console.log(result);
```

### Python 集成

```python
import subprocess
import json

# 启动 MCP 服务器
process = subprocess.Popen([
    'npx', 'carta-mcp', 'serve', '--root', '.'
], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

# 发送 MCP 请求
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "cards.scan",
        "arguments": {
            "autoGenerate": True,
            "generateOptions": {
                "template": "minimal"
            }
        }
    }
}

process.stdin.write(json.dumps(request) + '\n')
process.stdin.flush()

response = process.stdout.readline()
result = json.loads(response)
print(result)
```

## 环境配置

### 环境变量

设置环境变量以确保一致的行为：

```bash
export CARTA_MCP_ROOT="./src"
export CARTA_MCP_AUDIT="sqlite"
export CARTA_MCP_READ_ONLY="false"
```

然后在配置中使用：

```json
{
  "mcpServers": {
    "kooix-carta": {
      "command": "npx",
      "args": [
        "carta-mcp",
        "serve",
        "--root",
        "${CARTA_MCP_ROOT}",
        "--audit",
        "${CARTA_MCP_AUDIT}"
      ]
    }
  }
}
```

### Docker 集成

创建用于容器化部署的 Dockerfile：

```dockerfile
FROM node:20-alpine

RUN npm install -g @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com

WORKDIR /workspace
EXPOSE 3000

CMD ["npx", "carta-mcp", "serve", "--root", ".", "--audit", "jsonl"]
```

## 测试集成

### 手动测试

手动测试集成：

```bash
# 启动服务器
npx carta-mcp serve --root . &

# 测试工具（在另一个终端）
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | nc localhost 3000
```

### 自动化测试

创建集成测试：

```typescript
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP 集成', () => {
  let serverProcess;
  let client;

  beforeAll(async () => {
    // 启动服务器
    serverProcess = spawn('npx', ['carta-mcp', 'serve', '--root', '.']);

    // 连接客户端
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['carta-mcp', 'serve', '--root', '.']
    });

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
  });

  afterAll(() => {
    serverProcess?.kill();
    client?.close();
  });

  test('应该列出可用工具', async () => {
    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(4);
    expect(tools.tools.map(t => t.name)).toContain('cards.scan');
  });
});
```

## 故障排除

### 常见问题

1. **找不到命令**：确保包已安装且 npx 可用
2. **权限被拒绝**：检查文件权限并使用适当的用户
3. **端口冲突**：MCP 默认使用 stdio，无端口冲突问题
4. **路径问题**：为 `--root` 参数使用绝对路径

### 调试模式

启用调试日志：

```bash
DEBUG=mcp:* npx carta-mcp serve --root .
```

### 日志分析

检查审计日志以排查问题：

```bash
# JSONL 日志
tail -f .kooix/logs/readlog.jsonl

# SQLite 日志
sqlite3 .kooix/logs/readlog.sqlite "SELECT * FROM readlog ORDER BY timestamp DESC LIMIT 10"
```