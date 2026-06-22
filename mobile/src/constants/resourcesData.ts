import {
  ProjectResourceTree,
  ResourceFileNode,
  ResourceFolderNode,
  ResourceNode,
} from '@/src/types/resources';

const apiTree: ResourceFolderNode = {
  id: 'root',
  name: 'Resource',
  type: 'folder',
  parentId: null,
  description: 'Project resource root',
  children: [
    {
      id: 'api',
      name: 'api',
      type: 'folder',
      parentId: null,
      description: 'Backend API source, configuration, and project service resources.',
      children: [
        {
          id: 'api-prisma',
          name: 'prisma',
          type: 'folder',
          parentId: 'api',
          description: 'Database schema and Prisma migration resources.',
          children: [
            {
              id: 'api-prisma-schema',
              name: 'schema.prisma',
              type: 'file',
              language: 'Prisma',
              content: `# Prisma Schema

Project resources map to folders, files, and file materials.

\`\`\`prisma
model Project {
  id        Int      @id @default(autoincrement())
  name      String
  folders   Folder[]
}
\`\`\`
`,
            },
          ],
        },
        {
          id: 'api-src',
          name: 'src',
          type: 'folder',
          parentId: 'api',
          description: 'API application source code and services.',
          children: [
            {
              id: 'api-src-main',
              name: 'main.ts',
              type: 'file',
              language: 'TypeScript',
              content: `# API Entry

Bootstraps the backend service for project and manuscript workflows.

\`\`\`ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
\`\`\`
`,
            },
            {
              id: 'api-src-projects',
              name: 'projects.service.ts',
              type: 'file',
              language: 'TypeScript',
              content: `# Projects Service

Handles project membership, resource browsing, and application summaries.

- Load projects by user role.
- Resolve folder trees by project.
- Return file metadata and materials.
`,
            },
          ],
        },
        {
          id: 'api-test',
          name: 'test',
          type: 'folder',
          parentId: 'api',
          description: 'Automated API test resources.',
          children: [
            {
              id: 'api-test-projects',
              name: 'projects.e2e-spec.ts',
              type: 'file',
              language: 'TypeScript',
              content: `# Project E2E

Verifies project resource access rules and folder traversal.
`,
            },
          ],
        },
        {
          id: 'api-gitignore',
          name: '.gitignore',
          type: 'file',
          language: 'Text',
          content: `# Ignore

node_modules
dist
.env
`,
        },
        {
          id: 'api-prettierrc',
          name: '.prettierrc',
          type: 'file',
          language: 'JSON',
          content: `# Prettier

\`\`\`json
{
  "singleQuote": true,
  "trailingComma": "all"
}
\`\`\`
`,
        },
        {
          id: 'api-readme',
          name: 'README.md',
          type: 'file',
          language: 'Markdown',
          content: `# API

Tài liệu cài đặt và chạy cho thư mục \`api\`.

## Yêu cầu

- Node.js đã được cài sẵn.
- Bạn đang đứng trong thư mục \`api\`.

## Cài đặt

Trong thư mục \`api\`, ưu tiên cài dependencies bằng lệnh sau:

\`\`\`bash
npm ci
\`\`\`

Lệnh này cài theo đúng \`package-lock.json\` và thường ổn định hơn.
`,
        },
        {
          id: 'api-eslint',
          name: 'eslint.config.mjs',
          type: 'file',
          language: 'JavaScript',
          content: `# ESLint Config

Shared lint rules for API source files.
`,
        },
        {
          id: 'api-nest-cli',
          name: 'nest-cli.json',
          type: 'file',
          language: 'JSON',
          content: `# Nest CLI

\`\`\`json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
\`\`\`
`,
        },
        {
          id: 'api-package-lock',
          name: 'package-lock.json',
          type: 'file',
          language: 'JSON',
          content: `# Lockfile

Generated dependency lockfile for reproducible installs.
`,
        },
        {
          id: 'api-package',
          name: 'package.json',
          type: 'file',
          language: 'JSON',
          content: `# Package

\`\`\`json
{
  "scripts": {
    "start": "nest start",
    "test": "jest"
  }
}
\`\`\`
`,
        },
        {
          id: 'api-prisma-config',
          name: 'prisma.config.ts',
          type: 'file',
          language: 'TypeScript',
          content: `# Prisma Config

Loads database configuration for Prisma migrations.
`,
        },
      ],
    },
    {
      id: 'mobile',
      name: 'mobile',
      type: 'folder',
      parentId: null,
      description: 'React Native mobile client resources.',
      children: [
        {
          id: 'mobile-src',
          name: 'src',
          type: 'folder',
          parentId: 'mobile',
          description: 'Mobile app source files.',
          children: [
            {
              id: 'mobile-src-readme',
              name: 'README.md',
              type: 'file',
              language: 'Markdown',
              content: `# Mobile

React Native app for manga production workflows.
`,
            },
          ],
        },
        {
          id: 'mobile-app',
          name: 'App.tsx',
          type: 'file',
          language: 'TypeScript',
          content: `# App

Root provider and navigation entry for the mobile client.
`,
        },
      ],
    },
    {
      id: 'web',
      name: 'web',
      type: 'folder',
      parentId: null,
      description: 'Web dashboard resources.',
      children: [
        {
          id: 'web-readme',
          name: 'README.md',
          type: 'file',
          language: 'Markdown',
          content: `# Web

Web dashboard for editorial and admin workflows.
`,
        },
      ],
    },
  ],
};

export const PROJECT_RESOURCE_TREES: ProjectResourceTree[] = [
  { projectId: 'dragon-blade', root: apiTree },
  { projectId: 'moonlight-ronin', root: apiTree },
  { projectId: 'frame-cleaner', root: apiTree },
  { projectId: 'lettering-queue', root: apiTree },
  { projectId: 'night-market', root: apiTree },
];

export function getProjectResourceTree(projectId: string): ResourceFolderNode {
  return PROJECT_RESOURCE_TREES.find((tree) => tree.projectId === projectId)?.root ?? apiTree;
}

export function findResourceNode(
  root: ResourceFolderNode,
  nodeId: string,
): ResourceNode | undefined {
  if (root.id === nodeId) return root;

  for (const child of root.children) {
    if (child.id === nodeId) return child;
    if (child.type === 'folder') {
      const match = findResourceNode(child, nodeId);
      if (match) return match;
    }
  }

  return undefined;
}

export function findResourceFile(
  root: ResourceFolderNode,
  fileId: string,
): ResourceFileNode | undefined {
  const node = findResourceNode(root, fileId);
  return node?.type === 'file' ? node : undefined;
}

export function findParentFolderId(
  root: ResourceFolderNode,
  childId: string,
): string | undefined {
  for (const child of root.children) {
    if (child.id === childId) return root.id;
    if (child.type === 'folder') {
      const match = findParentFolderId(child, childId);
      if (match) return match;
    }
  }

  return undefined;
}
