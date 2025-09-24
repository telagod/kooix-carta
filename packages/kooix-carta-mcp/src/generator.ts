import path from "node:path";
import fs from "node:fs/promises";

export interface GenerateOptions {
  template?: 'minimal' | 'detailed';
  inferFromPath?: boolean;
  inferFromContent?: boolean;
  dryRun?: boolean;
}

export interface GeneratedCard {
  type: 'sfc' | 'dfc';
  content: string;
  reason: string;
}

/**
 * 从文件路径推断基本信息
 */
function inferFromPath(filePath: string) {
  const parsed = path.parse(filePath);
  const dirName = path.basename(parsed.dir);
  const fileName = parsed.name;
  const extension = parsed.ext;

  // 基于扩展名推断文件类型
  const fileType = getFileType(extension);

  // 基于路径推断组件类型
  const componentType = inferComponentType(filePath);

  // 生成标签
  const tags = generateTags(filePath, fileType, componentType);

  return {
    name: fileName,
    dirName,
    fileType,
    componentType,
    tags,
    extension
  };
}

/**
 * 从文件内容推断信息
 */
async function inferFromContent(filePath: string, content: string) {
  const info = {
    hasExports: /export\s+(default\s+)?(class|function|const|interface|type)/.test(content),
    hasImports: /import\s+.+from/.test(content),
    hasClasses: /class\s+\w+/.test(content),
    hasFunctions: /function\s+\w+|const\s+\w+\s*=.*=>/.test(content),
    hasComponents: /React\.Component|extends\s+Component|function\s+[A-Z]/.test(content),
    hasTypes: /interface\s+\w+|type\s+\w+/.test(content),
    hasTests: /describe\s*\(|test\s*\(|it\s*\(/.test(content),
    lineCount: content.split('\n').length
  };

  return info;
}

/**
 * 获取文件类型
 */
function getFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'react-typescript',
    '.js': 'javascript',
    '.jsx': 'react-javascript',
    '.vue': 'vue-component',
    '.py': 'python',
    '.md': 'markdown',
    '.json': 'json-config',
    '.yaml': 'yaml-config',
    '.yml': 'yaml-config',
    '.html': 'html',
    '.css': 'stylesheet',
    '.scss': 'sass-stylesheet',
    '.less': 'less-stylesheet'
  };

  return typeMap[extension] || 'unknown';
}

/**
 * 推断组件类型
 */
function inferComponentType(filePath: string): string {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('component')) return 'component';
  if (lowerPath.includes('service')) return 'service';
  if (lowerPath.includes('util')) return 'utility';
  if (lowerPath.includes('helper')) return 'helper';
  if (lowerPath.includes('hook')) return 'hook';
  if (lowerPath.includes('store')) return 'store';
  if (lowerPath.includes('model')) return 'model';
  if (lowerPath.includes('controller')) return 'controller';
  if (lowerPath.includes('middleware')) return 'middleware';
  if (lowerPath.includes('config')) return 'configuration';
  if (lowerPath.includes('test') || lowerPath.includes('spec')) return 'test';
  if (lowerPath.includes('type')) return 'types';

  return 'module';
}

/**
 * 生成标签
 */
function generateTags(filePath: string, fileType: string, componentType: string): string[] {
  const tags = new Set<string>();

  // 基于文件类型的标签
  if (fileType.includes('react')) tags.add('react');
  if (fileType.includes('typescript')) tags.add('typescript');
  if (fileType.includes('javascript')) tags.add('javascript');
  if (fileType === 'vue-component') tags.add('vue');

  // 基于组件类型的标签
  tags.add(componentType);

  // 基于路径的标签
  const pathParts = filePath.split(path.sep);
  if (pathParts.includes('src')) tags.add('source');
  if (pathParts.includes('components')) tags.add('ui');
  if (pathParts.includes('pages')) tags.add('page');
  if (pathParts.includes('api')) tags.add('api');
  if (pathParts.includes('lib')) tags.add('library');
  if (pathParts.includes('utils')) tags.add('utility');

  return Array.from(tags).slice(0, 5); // 限制标签数量
}

/**
 * 生成 SFC 卡片
 */
export function generateSFC(filePath: string, content: string, options: GenerateOptions = {}): GeneratedCard {
  const pathInfo = inferFromPath(filePath);
  const template = options.template || 'minimal';

  let cardContent: string;

  if (template === 'minimal') {
    cardContent = `@SFC
name: ${pathInfo.name}
description: ${generateDescription(pathInfo, content)}
version: 1.0.0
tags: [${pathInfo.tags.join(', ')}]`;
  } else {
    cardContent = `@SFC
name: ${pathInfo.name}
description: ${generateDescription(pathInfo, content)}
version: 1.0.0
type: ${pathInfo.fileType}
category: ${pathInfo.componentType}
tags: [${pathInfo.tags.join(', ')}]
created: ${new Date().toISOString().split('T')[0]}
author: auto-generated`;
  }

  return {
    type: 'sfc',
    content: cardContent,
    reason: `Generated ${template} SFC card for ${pathInfo.fileType} file`
  };
}

/**
 * 生成 DFC 卡片
 */
export function generateDFC(dirPath: string, options: GenerateOptions = {}): GeneratedCard {
  const dirName = path.basename(dirPath);
  const template = options.template || 'minimal';

  let cardContent: string;

  if (template === 'minimal') {
    cardContent = `@DFC
name: ${dirName}
description: ${generateDirDescription(dirName)}
version: 1.0.0`;
  } else {
    cardContent = `@DFC
name: ${dirName}
description: ${generateDirDescription(dirName)}
version: 1.0.0
type: module
created: ${new Date().toISOString().split('T')[0]}
structure:
  - "TODO: Document directory structure"`;
  }

  return {
    type: 'dfc',
    content: cardContent,
    reason: `Generated ${template} DFC card for directory`
  };
}

/**
 * 生成文件描述
 */
function generateDescription(pathInfo: any, content: string): string {
  const { name, fileType, componentType } = pathInfo;

  // 基于内容的描述生成
  if (content.includes('export default class')) {
    return `${componentType} class implementation`;
  }
  if (content.includes('export default function') || content.includes('export function')) {
    return `${componentType} function implementation`;
  }
  if (content.includes('interface ') || content.includes('type ')) {
    return `Type definitions and interfaces`;
  }
  if (content.includes('describe(') || content.includes('test(')) {
    return `Test suite for ${name}`;
  }

  // 基于文件类型的默认描述
  const typeDescriptions: Record<string, string> = {
    'react-typescript': 'React component with TypeScript',
    'react-javascript': 'React component with JavaScript',
    'typescript': 'TypeScript module',
    'javascript': 'JavaScript module',
    'vue-component': 'Vue.js component',
    'python': 'Python module',
    'markdown': 'Documentation file',
    'json-config': 'Configuration file',
    'yaml-config': 'YAML configuration'
  };

  return typeDescriptions[fileType] || `${componentType} implementation`;
}

/**
 * 生成目录描述
 */
function generateDirDescription(dirName: string): string {
  const descriptions: Record<string, string> = {
    'components': 'Reusable UI components',
    'pages': 'Application pages and routes',
    'services': 'Business logic and API services',
    'utils': 'Utility functions and helpers',
    'hooks': 'Custom React hooks',
    'store': 'State management',
    'types': 'TypeScript type definitions',
    'api': 'API routes and handlers',
    'lib': 'Third-party library integrations',
    'config': 'Configuration files',
    'assets': 'Static assets and resources',
    'styles': 'CSS and styling files',
    'tests': 'Test files and test utilities'
  };

  return descriptions[dirName.toLowerCase()] || `${dirName} module collection`;
}

/**
 * 判断文件是否应该生成 SFC 卡片
 */
export function shouldGenerateSFC(filePath: string, content: string): boolean {
  const extension = path.extname(filePath);

  // 跳过配置文件、锁文件等
  const skipExtensions = ['.lock', '.log', '.tmp', '.cache'];
  if (skipExtensions.includes(extension)) return false;

  // 跳过 node_modules、dist 等目录
  if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('.git')) {
    return false;
  }

  // 跳过空文件或太小的文件
  if (content.trim().length < 10) return false;

  // 支持的文件类型
  const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.md'];
  return supportedExtensions.includes(extension);
}

/**
 * 判断目录是否应该生成 DFC 卡片
 */
export function shouldGenerateDFC(dirPath: string): boolean {
  const dirName = path.basename(dirPath);

  // 跳过系统目录
  const skipDirs = ['node_modules', '.git', '.vscode', 'dist', 'build', '.next', '.cache'];
  return !skipDirs.includes(dirName);
}