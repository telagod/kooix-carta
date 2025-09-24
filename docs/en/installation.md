# Installation Guide

This guide covers all installation methods for @kooix/carta-mcp.

## GitHub Packages (Recommended)

### Method 1: Direct Installation

```bash
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

### Method 2: Configure Registry

Configure npm to use GitHub Packages for the `@kooix` scope:

```bash
npm config set @kooix:registry https://npm.pkg.github.com
npm install @kooix/carta-mcp@latest
```

### Method 3: Using .npmrc

Create a `.npmrc` file in your project or home directory:

```ini
@kooix:registry=https://npm.pkg.github.com
```

Then install normally:

```bash
npm install @kooix/carta-mcp@latest
```

## Alternative Methods

### GitHub Release Tarball

For environments where GitHub Packages isn't accessible:

```bash
# One-time run (no installation)
npx --yes https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz serve --root .

# Local installation
npm install https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz
```

### Development Installation

For development or contributing:

```bash
git clone https://github.com/telagod/kooix-carta.git
cd kooix-carta/packages/kooix-carta-mcp
npm ci
npm run build
```

## Verification

After installation, verify the CLI is working:

```bash
npx carta-mcp --help
```

Expected output:
```
Usage: carta-mcp serve [options]

Options:
  --root <dir>         Root directory to expose (default: current working directory)
  --audit <mode>       Audit mode: jsonl | sqlite | none (default: jsonl)
  --read-only          Disallow edits.apply writes
  --help               Show this help message
```

## Optional Dependencies

### SQLite Audit Support

For SQLite audit logging, install the optional dependency:

```bash
npm install better-sqlite3 --save-optional
```

Then you can use SQLite audit mode:

```bash
npx carta-mcp serve --audit sqlite
```

## Troubleshooting

### GitHub Packages Authentication

If you encounter authentication issues with GitHub Packages, you may need to authenticate:

1. Generate a [Personal Access Token](https://github.com/settings/tokens) with `read:packages` permission
2. Configure npm authentication:

```bash
npm login --scope=@kooix --registry=https://npm.pkg.github.com
```

### Permission Issues

On Unix systems, you may need to use `sudo` for global installations:

```bash
sudo npm install -g @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

### Network Issues

If GitHub Packages is blocked, use the tarball method:

```bash
npm install https://github.com/telagod/kooix-carta/releases/download/v0.2.0/kooix-carta-mcp-0.2.0.tgz
```

## Version Management

### Installing Specific Versions

```bash
# Install specific version
npm install @kooix/carta-mcp@0.2.0 --registry=https://npm.pkg.github.com

# Install from specific tag
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

### Updating

```bash
# Update to latest version
npm update @kooix/carta-mcp --registry=https://npm.pkg.github.com

# Or reinstall
npm uninstall @kooix/carta-mcp
npm install @kooix/carta-mcp@latest --registry=https://npm.pkg.github.com
```

## Next Steps

After installation, see:
- [MCP Client Integration](integration.md) - Connect with MCP clients
- [Configuration](configuration.md) - Advanced configuration options
- [Auto-Generation Guide](auto-generation.md) - Using smart card generation