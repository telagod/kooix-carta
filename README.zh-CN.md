# @kooix/carta-mcp

[English](README.md) | [中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node->=18.18-brightgreen)](https://nodejs.org)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

**@kooix/carta-mcp** 是一个 [模型上下文协议 (MCP)](https://modelcontextprotocol.io) 服务器，为项目提供智能文件发现和受控编辑功能。它通过"卡片"提供标准化的项目元数据访问，并支持在带注释的代码区域进行安全的、有界限的编辑。

## ✨ 核心特性

- 🔍 **智能发现** - 自动扫描 `@SFC`（单文件）和 `@DFC`（目录）元数据卡片
- ✏️ **安全编辑** - 在 `LLM-EDIT` 块内进行带哈希验证的受控编辑
- 🤖 **智能生成** - 开发过程中智能生成缺失的卡片，渐进完善项目
- 📊 **审计日志** - 支持 JSONL 或 SQLite 格式的文件访问追踪
- 🔒 **只读模式** - 通过禁写模式保护生产环境

## 🚀 快速开始

### 从 GitHub Packages 安装

```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
npx carta-mcp serve --root . --audit jsonl
```

### 一次性运行（备选）

```bash
npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .
```

### 与 Claude Desktop 集成

```bash
# 首先安装
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com

# 添加到 Claude
claude mcp add kooix-carta -- npx carta-mcp serve --root .
```

## 🛠️ MCP 工具

| 工具 | 用途 |
|------|------|
| `cards.scan` | 扫描项目卡片，支持**自动生成**功能 |
| `cards.get` | 从指定文件检索元数据 |
| `edits.apply` | 在 `LLM-EDIT` 块内安全替换内容 |
| `io.readlog.append` | 记录文件访问用于审计 |

## 📚 文档

- **[📖 完整文档](docs/zh-CN/README.md)** - 完整的 API 参考和使用指南
- **[🤖 自动生成指南](docs/zh-CN/auto-generation.md)** - 智能卡片生成功能
- **[⚙️ 配置说明](docs/zh-CN/configuration.md)** - 高级设置和选项
- **[🔧 开发指南](docs/zh-CN/development.md)** - 贡献和开发指南

**English Docs**: [Full Documentation](docs/en/README.md) | [Auto-Generation Guide](docs/en/auto-generation.md)

## 🤖 自动生成预览

自动生成缺失的 `@SFC` 卡片：

```typescript
// 预览将要生成的内容
await mcpClient.callTool('cards.scan', {
  root: 'src',
  autoGenerate: true,
  generateOptions: { dryRun: true }
});

// 实际生成缺失的卡片
await mcpClient.callTool('cards.scan', {
  autoGenerate: true,
  generateOptions: { template: 'detailed' }
});
```

## 📦 安装选项

查看不同的安装方法和 MCP 客户端集成示例：
- [📖 安装指南](docs/zh-CN/installation.md)
- [🔗 MCP 客户端集成](docs/zh-CN/integration.md)

## 🤝 贡献

欢迎贡献！请查看我们的[开发指南](docs/zh-CN/development.md)了解详情。

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

<div align="center">

**为模型上下文协议生态系统构建 ❤️**

[文档](https://modelcontextprotocol.io) • [规范](https://github.com/modelcontextprotocol/specification) • [社区](https://github.com/modelcontextprotocol)

</div>