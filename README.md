# @kooix/carta-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node->=18.18-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

**@kooix/carta-mcp** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that enables intelligent file discovery and controlled editing within projects. It provides standardized access to project metadata through "cards" and supports safe, bounded edits in annotated code regions.

## ✨ Key Features

- 🔍 **Smart Discovery** - Automatically scan for `@SFC` (single file) and `@DFC` (directory) metadata cards
- ✏️ **Safe Editing** - Apply controlled edits within `LLM-EDIT` blocks with hash verification
- 🤖 **Auto-Generation** - Intelligently generate missing cards during development workflow
- 📊 **Audit Logging** - Track file access with JSONL or SQLite audit trails
- 🔒 **Read-Only Mode** - Protect production environments with write-disabled mode

## 🚀 Quick Start

### Install from GitHub Packages

```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
npx carta-mcp serve --root . --audit jsonl
```

### One-Time Run (Alternative)

```bash
npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .
```

### With Claude Desktop

```bash
# Install first
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com

# Add to Claude
claude mcp add kooix-carta -- npx carta-mcp serve --root .
```

## 🛠️ MCP Tools

| Tool | Purpose |
|------|---------|
| `cards.scan` | Scan for project cards with **auto-generation** support |
| `cards.get` | Retrieve metadata from specific files |
| `edits.apply` | Safely replace content in `LLM-EDIT` blocks |
| `io.readlog.append` | Record file access for audit trails |

## 📚 Documentation

- **[📖 Full Documentation](docs/en/README.md)** - Complete API reference and usage guide
- **[🤖 Auto-Generation Guide](docs/en/auto-generation.md)** - Smart card generation features
- **[⚙️ Configuration](docs/en/configuration.md)** - Advanced setup and options
- **[🔧 Development](docs/en/development.md)** - Contributing and development guide

**中文文档**: [完整中文文档](docs/zh-CN/README.md) | [自动生成指南](docs/zh-CN/auto-generation.md)

## 🤖 Auto-Generation Preview

Generate missing `@SFC` cards automatically:

```typescript
// Preview what would be generated
await mcpClient.callTool('cards.scan', {
  root: 'src',
  autoGenerate: true,
  generateOptions: { dryRun: true }
});

// Actually generate missing cards
await mcpClient.callTool('cards.scan', {
  autoGenerate: true,
  generateOptions: { template: 'detailed' }
});
```

## 📦 Installation Options

For different installation methods and MCP client integration examples, see:
- [📖 Installation Guide](docs/en/installation.md)
- [🔗 MCP Client Integration](docs/en/integration.md)

## 🤝 Contributing

We welcome contributions! See our [Development Guide](docs/en/development.md) for details.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for the Model Context Protocol ecosystem**

[Documentation](https://modelcontextprotocol.io) • [Specification](https://github.com/modelcontextprotocol/specification) • [Community](https://github.com/modelcontextprotocol)

</div>