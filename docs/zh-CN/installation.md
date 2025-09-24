# 安装指南

本指南涵盖了 @kooix/carta-mcp 的所有安装方法。

## GitHub Packages（推荐）

### 方法1：直接安装

```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

### 方法2：配置注册表

为 `@kooix` 作用域配置 npm 使用 GitHub Packages：

```bash
npm config set @kooix:registry https://npm.pkg.github.com
npm install @kooix/carta-mcp@latest
```

### 方法3：使用 .npmrc

在项目或主目录中创建 `.npmrc` 文件：

```ini
@kooix:registry=https://npm.pkg.github.com
```

然后正常安装：

```bash
npm install @kooix/carta-mcp@latest
```

## 替代方法

### GitHub 发布包

对于无法访问 GitHub Packages 的环境：

```bash
# 一次性运行（不安装）
npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .

# 本地安装
npm install https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz
```

### 开发安装

用于开发或贡献：

```bash
git clone https://github.com/telagod/kooix-carta.git
cd kooix-carta/packages/kooix-carta-mcp
npm ci
npm run build
```

## 验证

安装后，验证 CLI 是否正常工作：

```bash
npx carta-mcp --help
```

预期输出：
```
Usage: carta-mcp serve [options]

Options:
  --root <dir>         Root directory to expose (default: current working directory)
  --audit <mode>       Audit mode: jsonl | sqlite | none (default: jsonl)
  --read-only          Disallow edits.apply writes
  --help               Show this help message
```

## 可选依赖

### SQLite 审计支持

对于 SQLite 审计日志记录，安装可选依赖：

```bash
npm install better-sqlite3 --save-optional
```

然后可以使用 SQLite 审计模式：

```bash
npx carta-mcp serve --audit sqlite
```

## 故障排除

### GitHub Packages 身份验证

如果遇到 GitHub Packages 身份验证问题，可能需要认证：

1. 生成带有 `read:packages` 权限的 [Personal Access Token](https://github.com/settings/tokens)
2. 配置 npm 身份验证：

```bash
npm login --scope=@kooix --registry=https://npm.pkg.github.com
```

### 权限问题

在 Unix 系统上，全局安装可能需要使用 `sudo`：

```bash
sudo npm install -g @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

### 网络问题

如果 GitHub Packages 被阻止，使用 tarball 方法：

```bash
npm install https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz
```

## 版本管理

### 安装特定版本

```bash
# 安装特定版本
npm install @kooix/carta-mcp@0.2.0 --registry=https://npm.pkg.github.com

# 从特定标签安装
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

### 更新

```bash
# 更新到最新版本
npm update @kooix/carta-mcp --registry=https://npm.pkg.github.com

# 或重新安装
npm uninstall @kooix/carta-mcp
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

## 下一步

安装后，请参考：
- [MCP 客户端集成](integration.md) - 连接 MCP 客户端
- [配置选项](configuration.md) - 高级配置选项
- [自动生成指南](auto-generation.md) - 使用智能卡片生成