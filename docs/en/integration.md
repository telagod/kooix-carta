# MCP Client Integration

This guide shows how to integrate @kooix/carta-mcp with various MCP clients.

## Claude Desktop

### Prerequisites

1. Install the package:
```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

2. Ensure Claude Desktop is installed

### Configuration

Add to your Claude Desktop MCP configuration:

```bash
claude mcp add kooix-carta -- npx carta-mcp serve --root .
```

Or with custom options:

```bash
claude mcp add kooix-carta -- npx carta-mcp serve --root ./src --audit sqlite --read-only
```

### Alternative: One-Time Run

If you prefer not to install locally:

```bash
claude mcp add kooix-carta -- npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .
```

## Other MCP Clients

### Standard JSON Configuration

For MCP clients that use JSON configuration:

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

### With Custom Root Directory

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

### Read-Only Mode

For production environments:

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

## Custom MCP Clients

### Using the TypeScript SDK

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

// Use the tools
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

### Python Integration

```python
import subprocess
import json

# Start the MCP server
process = subprocess.Popen([
    'npx', 'carta-mcp', 'serve', '--root', '.'
], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

# Send MCP requests
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

## Environment Configuration

### Environment Variables

Set environment variables for consistent behavior:

```bash
export CARTA_MCP_ROOT="./src"
export CARTA_MCP_AUDIT="sqlite"
export CARTA_MCP_READ_ONLY="false"
```

Then use in configuration:

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

### Docker Integration

Create a Dockerfile for containerized deployment:

```dockerfile
FROM node:20-alpine

RUN npm install -g @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com

WORKDIR /workspace
EXPOSE 3000

CMD ["npx", "carta-mcp", "serve", "--root", ".", "--audit", "jsonl"]
```

## Testing Integration

### Manual Testing

Test the integration manually:

```bash
# Start the server
npx carta-mcp serve --root . &

# Test tools (in another terminal)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | nc localhost 3000
```

### Automated Testing

Create integration tests:

```typescript
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('MCP Integration', () => {
  let serverProcess;
  let client;

  beforeAll(async () => {
    // Start server
    serverProcess = spawn('npx', ['carta-mcp', 'serve', '--root', '.']);

    // Connect client
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

  test('should list available tools', async () => {
    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(4);
    expect(tools.tools.map(t => t.name)).toContain('cards.scan');
  });
});
```

## Troubleshooting

### Common Issues

1. **Command not found**: Ensure the package is installed and npx is available
2. **Permission denied**: Check file permissions and use appropriate user
3. **Port conflicts**: MCP uses stdio by default, no port conflicts expected
4. **Path issues**: Use absolute paths for `--root` parameter

### Debug Mode

Enable debug logging:

```bash
DEBUG=mcp:* npx carta-mcp serve --root .
```

### Log Analysis

Check audit logs for issues:

```bash
# JSONL logs
tail -f .kooix/logs/readlog.jsonl

# SQLite logs
sqlite3 .kooix/logs/readlog.sqlite "SELECT * FROM readlog ORDER BY timestamp DESC LIMIT 10"
```