[English](README.md) | [中文](README.zh-CN.md)

# @kooix/carta-mcp

`@kooix/carta-mcp` is a Model Context Protocol (MCP) server that standardises how IDE/agent clients discover project "cards" (file and directory metadata) and apply bounded edits inside annotated regions. It exposes four MCP tools ready for consumption by Codex CLI, Claude Code, Gemini CLI, OpenCode, and similar runtimes.

## Features
- **Card discovery** – scan repositories for `@SFC` (single file) and `@DFC` (directory) YAML headers, plus `LLM-EDIT` blocks with line offsets and content hashes.
- **Optimistic block edits** – enforce hash checks, boundary protection, and newline normalisation before writing back to disk.
- **Read auditing** – append read events to JSONL by default or to SQLite when the optional dependency is present.
- **Read-only guardrail** – `--read-only` mode blocks writes while still serving metadata.
- **Typed SDK integration** – implemented in TypeScript with MCP stdio transport and a CLI launcher.

## Installation
1. Download the latest packaged tarball from the [GitHub Releases](https://github.com/telagod/kooix-carta/releases) page. Each release publishes a `kooix-carta-mcp-*.tgz` asset.
2. Install the tarball locally:
   ```bash
   npm install /path/to/kooix-carta-mcp-x.y.z.tgz
   # or reference the release asset URL directly
   npm install https://github.com/telagod/kooix-carta/releases/download/vx.y.z/kooix-carta-mcp-x.y.z.tgz
   ```
3. Optional: install `better-sqlite3` if you plan to use SQLite audit mode:
   ```bash
   npm install better-sqlite3 --save-optional
   ```

## CLI usage
```bash
npx @kooix/carta-mcp serve --root . --audit jsonl
```

| Option | Default | Description |
| --- | --- | --- |
| `--root <dir>` | current directory | Workspace root exposed to clients |
| `--audit <jsonl|sqlite|none>` | `jsonl` | Destination for read audit logs. `sqlite` requires the optional dependency. |
| `--read-only` | false | Rejects `edits.apply` requests |

Register the CLI with your preferred MCP client, for example:
```bash
claude mcp add kooix-carta -- npx -y @kooix-carta-mcp serve --root .
```

## Exposed MCP tools
### `cards.scan`
- **Purpose**: Recursively scan for cards and edit blocks.
- **Input**:
  ```json
  {
    "root": "optional subdirectory",
    "include": ["glob"],
    "exclude": ["glob"]
  }
  ```
- **Result**: Array of files with SFC/DFC presence, block line numbers, SHA-256 hash, and per-block hashes.

### `cards.get`
- **Purpose**: Return the raw `@SFC` / `@DFC` YAML snippets and file hash.
- **Input**: `{ "path": "relative/file" }`
- **Result**: `{ "path", "sha256", "sfc?", "dfc?" }`

### `edits.apply`
- **Purpose**: Replace the body of an `LLM-EDIT` block after verifying `oldHash`.
- **Input**:
  ```json
  {
    "file": "relative/path",
    "blockId": "identifier",
    "oldHash": "hex",
    "newContent": "string",
    "reason": "optional"
  }
  ```
- **Errors**: `BOUNDARY_NOT_FOUND`, `STALE_BLOCK`, `OUT_OF_BOUND_WRITE`, `READ_ONLY_MODE`.

### `io.readlog.append`
- **Purpose**: Record file reads for auditing.
- **Input**: `{ "runId": "string", "path": "string", "sha256": "hex" }`

## Edit block contract
Wrap editable sections using any supported comment style:
```ts
/* LLM-EDIT:BEGIN handler-body */
// editable content
/* LLM-EDIT:END handler-body */
```
The server strips trailing blank lines, normalises newlines, and reconstitutes the original newline style when writing.

## Audit logging modes
- `jsonl`: appends entries to `.kooix/logs/readlog.jsonl`.
- `sqlite`: stores rows in `.kooix/logs/readlog.sqlite` (requires `better-sqlite3`).
- `none`: disables logging.

## Development
```bash
cd packages/kooix-carta-mcp
npm ci
npm run build
npm test
```
The project targets Node.js 18.18+ and TypeScript `moduleResolution: NodeNext`.

## Continuous integration
Two GitHub workflows are provided:
- `.github/workflows/ci.yml` – runs on push/PR; installs, builds, and tests.
- `.github/workflows/release.yml` – runs on tagged pushes (`v*`), GitHub Releases, or manual dispatch; builds the package and uploads the `.tgz` asset to the release (or to workflow artifacts when manually triggered).

## Publishing
1. Bump the version in `packages/kooix-carta-mcp/package.json`.
2. Commit changes and tag the release (`git tag vX.Y.Z`).
3. Push the tag or create a GitHub Release.
4. The `Release` workflow will package the project and attach `npm pack` tarballs to the published release; downloaders can install the asset directly with `npm install`.

## License
MIT
