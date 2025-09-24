# 自动生成功能

MCP 服务器可以在扫描过程中智能生成缺失的 `@SFC` 卡片，非常适合渐进式项目改进。

## 智能推断

### 基于路径的推断

**文件类型检测**：
- `.tsx` → React TypeScript
- `.vue` → Vue.js 组件
- `.py` → Python 模块
- `.md` → Markdown 文档

**组件分类**：
- `components/` → UI 组件
- `services/` → 业务逻辑
- `utils/` → 工具函数
- `hooks/` → 自定义 React hooks

**自动标签生成**：
- 基于文件扩展名和目录结构
- 框架检测（React、Vue 等）
- 用途推断（测试、配置等）

### 基于内容的推断

**代码模式检测**：
- 函数与类实现对比
- 导出模式分析
- 框架识别
- 测试文件识别

## 模板

### 精简模板
```yaml
@SFC
name: component-name
description: 自动生成的描述
version: 1.0.0
tags: [typescript, component]
```

### 详细模板
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

## 使用示例

### 开发工作流

```typescript
// 1. 预览将生成的内容（干运行）
const preview = await mcpClient.callTool('cards.scan', {
  root: 'src',
  autoGenerate: true,
  generateOptions: {
    dryRun: true,
    template: 'minimal'
  }
});

console.log(`将生成 ${preview.generated.count} 个卡片`);
preview.generated.files.forEach(file => {
  console.log(`- ${file}`);
});

// 2. 实际生成缺失的卡片
const result = await mcpClient.callTool('cards.scan', {
  root: 'src/components',
  autoGenerate: true,
  generateOptions: {
    template: 'detailed',
    inferFromContent: true
  }
});

console.log(`已生成 ${result.generated.count} 个卡片`);
```

### 批量处理

```typescript
// 为特定文件类型生成卡片
await mcpClient.callTool('cards.scan', {
  include: ['**/*.tsx', '**/*.ts'],
  exclude: ['**/*.test.*'],
  autoGenerate: true,
  generateOptions: {
    template: 'detailed',
    inferFromPath: true,
    inferFromContent: true
  }
});
```

### 选择性生成

```typescript
// 仅为没有现有卡片的文件生成
const files = await mcpClient.callTool('cards.scan', { root: 'src' });
const needsCards = files.files.filter(f => !f.sfc.exists && !f.dfc.exists);

if (needsCards.length > 0) {
  await mcpClient.callTool('cards.scan', {
    root: 'src',
    autoGenerate: true,
    generateOptions: { template: 'minimal' }
  });
}
```

## 支持的文件类型

| 扩展名 | 类型 | 生成的标签 |
|--------|------|-----------|
| `.ts` | TypeScript | `[typescript, module]` |
| `.tsx` | React TypeScript | `[typescript, react, component]` |
| `.js` | JavaScript | `[javascript, module]` |
| `.jsx` | React JavaScript | `[javascript, react, component]` |
| `.vue` | Vue 组件 | `[vue, component]` |
| `.py` | Python | `[python, module]` |
| `.md` | Markdown | `[documentation, markdown]` |

## 配置选项

### `generateOptions`

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `template` | `'minimal' \| 'detailed'` | `'minimal'` | 卡片模板样式 |
| `inferFromPath` | `boolean` | `true` | 使用文件路径进行推断 |
| `inferFromContent` | `boolean` | `true` | 分析文件内容 |
| `dryRun` | `boolean` | `false` | 仅预览，不写入文件 |

### 注释样式选择

生成器会自动选择合适的注释样式：

| 文件类型 | 注释样式 |
|----------|---------|
| `.ts`, `.tsx`, `.js`, `.jsx` | `/* ... */` |
| `.py` | `# ...` |
| `.html`, `.md` | `<!-- ... -->` |
| 默认 | `/* ... */` |

## 最佳实践

1. **从干运行开始**：应用之前始终预览生成内容
2. **使用选择性模式**：针对特定目录或文件类型
3. **审查生成的卡片**：根据需要自定义自动生成的内容
4. **迭代改进**：随着项目发展逐步生成
5. **结合手动卡片**：混合自动生成与手动管理