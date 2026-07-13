#!/usr/bin/env node

/**
 * Import demo data for the Mangaka API database.
 *
 * Usage from repository root:
 *   node mobile/doc/import-demo-data.js
 *
 * The script is intentionally idempotent. It uses deterministic high IDs for
 * demo content and user id 2 for every user-owned or user-created relation.
 */

const fs = require('fs');
const path = require('path');

const USER_ID = 2;
const BASE_ID = 920000;
const API_ROOT = path.resolve(__dirname, '../../api');
const API_ENV_PATH = path.join(API_ROOT, '.env');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function requireFromApi(packageName) {
  return require(path.join(API_ROOT, 'node_modules', packageName));
}

loadEnvFile(API_ENV_PATH);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Check api/.env before running this script.');
}

const { PrismaClient } = requireFromApi('@prisma/client');
const { PrismaPg } = requireFromApi('@prisma/adapter-pg');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const imageUrls = {
  avatar:
    'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=512&q=80',
  board:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  project:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
  arc: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  chapter:
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  page01:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  page02:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
};

const ids = {
  editorBoard: BASE_ID + 1,
  project: BASE_ID + 1,
  folders: {
    arc: BASE_ID + 1,
    drafts: BASE_ID + 2,
    artwork: BASE_ID + 3,
  },
  files: {
    script: BASE_ID + 1,
    storyboard: BASE_ID + 2,
    page01: BASE_ID + 3,
  },
  materials: {
    scriptV1: BASE_ID + 1,
    storyboardV1: BASE_ID + 2,
    page01V1: BASE_ID + 3,
  },
  tasks: {
    reviewPacing: BASE_ID + 1,
    adjustPanel: BASE_ID + 2,
    finalQa: BASE_ID + 3,
    inkDialogue: BASE_ID + 4,
    roughCleanup: BASE_ID + 5,
    tonePass: BASE_ID + 6,
    letteringReview: BASE_ID + 7,
    continuityCheck: BASE_ID + 8,
    exportPackage: BASE_ID + 9,
  },
  frames: {
    panelOne: BASE_ID + 1,
    panelThree: BASE_ID + 2,
  },
  applications: {
    createArc: BASE_ID + 1,
    createChapter: BASE_ID + 2,
  },
  projectStat: BASE_ID + 1,
  activityLogs: {
    folderCreated: BASE_ID + 1,
    fileCreated: BASE_ID + 2,
    taskCreated: BASE_ID + 3,
    materialUploaded: BASE_ID + 4,
    commentCreated: BASE_ID + 5,
    applicationCreated: BASE_ID + 6,
  },
};

const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;
const dateDaysAgo = (days) => new Date(now.getTime() - days * dayMs);
const dateDaysFromNow = (days) => new Date(now.getTime() + days * dayMs);

const permissions = [
  ['admin', 'SYS', 'Quyen Admin toi cao'],
  ['staff', 'SYS', 'Dinh danh nhan vien quan tri'],
  ['user:read', 'SYS', 'Xem danh sach nguoi dung'],
  ['user:create', 'SYS', 'Tao nguoi dung'],
  ['user:update', 'SYS', 'Cap nhat nguoi dung'],
  ['user:delete', 'SYS', 'Xoa nguoi dung'],
  ['role:read', 'SYS', 'Xem danh sach vai tro'],
  ['role:create', 'SYS', 'Tao vai tro'],
  ['role:update', 'SYS', 'Cap nhat vai tro'],
  ['role:delete', 'SYS', 'Xoa vai tro'],
  ['permission:read', 'SYS', 'Xem danh sach quyen'],
  ['permission:update', 'SYS', 'Cap nhat quyen'],
  ['project:read', 'PRJ', 'Xem thong tin du an'],
  ['project:update', 'PRJ', 'Cap nhat thong tin du an'],
  ['project:delete', 'PRJ', 'Xoa du an'],
  ['project:member.read', 'PRJ', 'Xem danh sach thanh vien du an'],
  ['project:member.add', 'PRJ', 'Them thanh vien vao du an'],
  ['project:member.update', 'PRJ', 'Cap nhat vai tro thanh vien du an'],
  ['project:member.remove', 'PRJ', 'Xoa thanh vien khoi du an'],
  ['project:folder.create', 'PRJ', 'Tao thu muc trong du an'],
  ['project:folder.update', 'PRJ', 'Cap nhat thu muc'],
  ['project:folder.delete', 'PRJ', 'Xoa thu muc'],
  ['project:file.create', 'PRJ', 'Tao tep tin'],
  ['project:file.update', 'PRJ', 'Cap nhat tep tin'],
  ['project:file.delete', 'PRJ', 'Xoa tep tin'],
  ['project:material.create', 'PRJ', 'Upload material'],
  ['project:material.update', 'PRJ', 'Cap nhat material'],
  ['project:material.delete', 'PRJ', 'Xoa material'],
  ['project:material.restore', 'PRJ', 'Khoi phuc material'],
  ['project:task.create', 'PRJ', 'Tao cong viec'],
  ['project:task.update', 'PRJ', 'Cap nhat cong viec'],
  ['project:task.delete', 'PRJ', 'Xoa cong viec'],
  ['project:frame.create', 'PRJ', 'Tao khung binh luan frame'],
  ['project:frame.update', 'PRJ', 'Cap nhat khung binh luan'],
  ['project:frame.delete', 'PRJ', 'Xoa khung binh luan'],
  ['project:comment.create', 'PRJ', 'Tao binh luan'],
  ['project:comment.update', 'PRJ', 'Cap nhat binh luan'],
  ['project:comment.delete', 'PRJ', 'Xoa binh luan'],
  ['project:application.create', 'PRJ', 'Tao application'],
  ['project:application.read', 'PRJ', 'Xem danh sach application'],
  ['project:application.update', 'PRJ', 'Cap nhat application'],
  ['project:application.delete', 'PRJ', 'Xoa application'],
  ['project:application.approve', 'PRJ', 'Duyet application'],
];

const roles = [
  { code: 'ADMIN', name: 'Admin', scope: 'SYS', isDefault: false },
  { code: 'STAFF', name: 'Staff', scope: 'SYS', isDefault: false },
  { code: 'MEMBER', name: 'Member', scope: 'SYS', isDefault: true },
  { code: 'MANGAKA', name: 'Mangaka', scope: 'PRJ', isDefault: true },
  { code: 'ASSISTANT', name: 'Assistant', scope: 'PRJ', isDefault: false },
  { code: 'TANTOU_EDITOR', name: 'Tantou Editor', scope: 'PRJ', isDefault: false },
];

const rolePermissionNames = {
  ADMIN: ['admin'],
  STAFF: [
    'staff',
    'user:read',
    'user:create',
    'user:update',
    'role:read',
    'role:create',
    'role:update',
    'permission:read',
    'permission:update',
  ],
  MEMBER: ['user:read', 'role:read', 'permission:read'],
  MANGAKA: [
    'project:read',
    'project:update',
    'project:delete',
    'project:member.read',
    'project:member.add',
    'project:member.update',
    'project:member.remove',
    'project:folder.create',
    'project:folder.update',
    'project:folder.delete',
    'project:file.create',
    'project:file.update',
    'project:file.delete',
    'project:material.create',
    'project:material.update',
    'project:material.delete',
    'project:material.restore',
    'project:task.create',
    'project:task.update',
    'project:task.delete',
    'project:frame.create',
    'project:frame.update',
    'project:frame.delete',
    'project:comment.create',
    'project:comment.update',
    'project:comment.delete',
    'project:application.create',
    'project:application.read',
    'project:application.update',
    'project:application.delete',
  ],
  ASSISTANT: [
    'project:read',
    'project:member.read',
    'project:material.create',
    'project:material.update',
    'project:task.update',
    'project:frame.create',
    'project:frame.update',
    'project:comment.create',
    'project:comment.update',
    'project:application.read',
  ],
  TANTOU_EDITOR: [
    'project:read',
    'project:member.read',
    'project:comment.create',
    'project:comment.update',
    'project:application.read',
    'project:application.update',
    'project:application.approve',
  ],
};

async function ensureUser() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {
      avatarUrl: imageUrls.avatar,
      displayName: 'Mangaka Demo User',
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: USER_ID,
      avatarUrl: imageUrls.avatar,
      displayName: 'Mangaka Demo User',
      email: 'user2.demo@mangaka.local',
      isActive: true,
    },
  });
}

async function ensureRolesAndPermissions() {
  await prisma.permission.createMany({
    data: permissions.map(([name, scope, description]) => ({ name, scope, description })),
    skipDuplicates: true,
  });

  const roleRows = {};
  for (const role of roles) {
    roleRows[role.code] = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        isDefault: role.isDefault,
        name: role.name,
        scope: role.scope,
        updatedBy: USER_ID,
      },
      create: {
        ...role,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      },
    });
  }

  await prisma.userRole.createMany({
    data: [
      { userId: USER_ID, roleId: roleRows.MEMBER.id },
      { userId: USER_ID, roleId: roleRows.STAFF.id },
    ],
    skipDuplicates: true,
  });

  const permissionRows = await prisma.permission.findMany({
    where: { name: { in: permissions.map(([name]) => name) } },
  });
  const permissionByName = Object.fromEntries(permissionRows.map((item) => [item.name, item]));

  const rolePermissionData = [];
  for (const [roleCode, permissionNames] of Object.entries(rolePermissionNames)) {
    const role = roleRows[roleCode];
    if (!role) continue;

    for (const permissionName of permissionNames) {
      const permission = permissionByName[permissionName];
      if (!permission) continue;
      rolePermissionData.push({ roleId: role.id, permissionId: permission.id });
    }
  }

  if (rolePermissionData.length > 0) {
    await prisma.rolePermission.createMany({
      data: rolePermissionData,
      skipDuplicates: true,
    });
  }

  return roleRows;
}

async function upsertCoreWorkspace(roleRows) {
  await prisma.editorBoard.upsert({
    where: { id: ids.editorBoard },
    update: {
      description: 'Demo editorial board used for mobile API testing.',
      imageUrl: imageUrls.board,
      name: 'Demo Editorial Board',
      updatedBy: USER_ID,
    },
    create: {
      id: ids.editorBoard,
      createdBy: USER_ID,
      description: 'Demo editorial board used for mobile API testing.',
      imageUrl: imageUrls.board,
      name: 'Demo Editorial Board',
      updatedBy: USER_ID,
    },
  });

  await prisma.userEditorBoard.upsert({
    where: {
      userId_editorBoardId: {
        editorBoardId: ids.editorBoard,
        userId: USER_ID,
      },
    },
    update: { isLead: true },
    create: {
      editorBoardId: ids.editorBoard,
      isLead: true,
      userId: USER_ID,
    },
  });

  await prisma.project.upsert({
    where: { id: ids.project },
    update: {
      description:
        'Seeded manga production project with folders, tasks, comments, and applications.',
      editorBoardId: ids.editorBoard,
      imageUrl: imageUrls.project,
      name: 'Demo Manga Project',
      updatedBy: USER_ID,
    },
    create: {
      id: ids.project,
      createdBy: USER_ID,
      description:
        'Seeded manga production project with folders, tasks, comments, and applications.',
      editorBoardId: ids.editorBoard,
      imageUrl: imageUrls.project,
      name: 'Demo Manga Project',
      updatedBy: USER_ID,
    },
  });

  await prisma.userProject.deleteMany({
    where: {
      projectId: ids.project,
      userId: USER_ID,
    },
  });
  await prisma.userProject.create({
    data: {
      createdBy: USER_ID,
      projectId: ids.project,
      roleId: roleRows.MANGAKA.id,
      updatedBy: USER_ID,
      userId: USER_ID,
    },
  });
}

async function upsertResources() {
  const folders = [
    {
      id: ids.folders.arc,
      description: 'Main production workspace for chapter 01.',
      imageUrl: imageUrls.arc,
      parentId: null,
      title: 'Chapter 01',
    },
    {
      id: ids.folders.drafts,
      description: 'Scripts and storyboards.',
      imageUrl: imageUrls.chapter,
      parentId: ids.folders.arc,
      title: 'Drafts',
    },
    {
      id: ids.folders.artwork,
      description: 'Artwork source and reviewed pages.',
      imageUrl: imageUrls.page01,
      parentId: ids.folders.arc,
      title: 'Artwork',
    },
  ];

  for (const folder of folders) {
    await prisma.folder.upsert({
      where: { id: folder.id },
      update: {
        description: folder.description,
        imageUrl: folder.imageUrl,
        parentId: folder.parentId,
        projectId: ids.project,
        title: folder.title,
        updatedBy: USER_ID,
      },
      create: {
        ...folder,
        createdBy: USER_ID,
        projectId: ids.project,
        updatedBy: USER_ID,
      },
    });
  }

  const files = [
    {
      id: ids.files.script,
      description: 'First chapter script review document.',
      folderId: ids.folders.drafts,
      title: 'Chapter 01 Script',
    },
    {
      id: ids.files.storyboard,
      description: 'Storyboard pacing review file.',
      folderId: ids.folders.drafts,
      title: 'Chapter 01 Storyboard',
    },
    {
      id: ids.files.page01,
      description: 'First page artwork and PSD source.',
      folderId: ids.folders.artwork,
      title: 'page1.psd',
    },
  ];

  for (const file of files) {
    await prisma.file.upsert({
      where: { id: file.id },
      update: {
        description: file.description,
        folderId: file.folderId,
        title: file.title,
        updatedBy: USER_ID,
      },
      create: {
        ...file,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      },
    });
  }
}

async function upsertTasksAndMaterials() {
  const tasks = [
    {
      id: ids.tasks.reviewPacing,
      deadline: dateDaysFromNow(3),
      description: 'Check panel flow, speech bubble placement, and emotional beat.',
      fileId: ids.files.storyboard,
      status: 'REVIEW',
      title: 'Review storyboard pacing',
    },
    {
      id: ids.tasks.adjustPanel,
      deadline: dateDaysFromNow(5),
      description: 'Resize the third panel and strengthen the expression.',
      fileId: ids.files.page01,
      status: 'INPROGRESS',
      title: 'Adjust page 1 panel three',
    },
    {
      id: ids.tasks.finalQa,
      deadline: dateDaysFromNow(8),
      description: 'Final QA before internal approval.',
      fileId: ids.files.page01,
      status: 'PENDING',
      title: 'Final QA page 01',
    },
    {
      id: ids.tasks.inkDialogue,
      deadline: dateDaysFromNow(2),
      description: 'Review dialogue placement and make sure bubbles do not cover key art.',
      fileId: ids.files.storyboard,
      status: 'REVIEW',
      title: 'Review dialogue bubble layout',
    },
    {
      id: ids.tasks.roughCleanup,
      deadline: dateDaysFromNow(4),
      description: 'Clean rough construction lines before the ink pass begins.',
      fileId: ids.files.page01,
      status: 'INPROGRESS',
      title: 'Clean rough sketch lines',
    },
    {
      id: ids.tasks.tonePass,
      deadline: dateDaysFromNow(6),
      description: 'Add basic screentone values and separate foreground from background.',
      fileId: ids.files.page01,
      status: 'PENDING',
      title: 'Add screentone pass',
    },
    {
      id: ids.tasks.letteringReview,
      deadline: dateDaysFromNow(7),
      description: 'Check punctuation, reading order, and lettering consistency.',
      fileId: ids.files.script,
      status: 'REVIEW',
      title: 'Review lettering notes',
    },
    {
      id: ids.tasks.continuityCheck,
      deadline: dateDaysFromNow(9),
      description: 'Compare page details against previous scenes for costume and prop continuity.',
      fileId: ids.files.storyboard,
      status: 'PENDING',
      title: 'Continuity check',
    },
    {
      id: ids.tasks.exportPackage,
      deadline: dateDaysFromNow(10),
      description: 'Prepare final export package after all review comments are resolved.',
      fileId: ids.files.page01,
      status: 'DONE',
      title: 'Prepare export package',
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        assignedBy: USER_ID,
        deadline: task.deadline,
        description: task.description,
        fileId: task.fileId,
        status: task.status,
        title: task.title,
        updatedBy: USER_ID,
      },
      create: {
        ...task,
        assignedBy: USER_ID,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      },
    });
  }

  const materialRows = [
    {
      id: ids.materials.scriptV1,
      fileId: ids.files.script,
      imageUri: imageUrls.chapter,
      name: 'Chapter 01 Script v1',
      taskId: ids.tasks.reviewPacing,
    },
    {
      id: ids.materials.storyboardV1,
      fileId: ids.files.storyboard,
      imageUri: imageUrls.page02,
      name: 'Storyboard v1',
      taskId: ids.tasks.reviewPacing,
    },
    {
      id: ids.materials.page01V1,
      fileId: ids.files.page01,
      imageUri: imageUrls.page01,
      name: 'Page 01 Artwork v1',
      taskId: ids.tasks.adjustPanel,
    },
  ];

  for (const material of materialRows) {
    await prisma.fileMaterial.upsert({
      where: { id: material.id },
      update: {
        fileId: material.fileId,
        materials: {
          editorState: { zoom: 1, tool: 'comment' },
          imageUri: material.imageUri,
          layers: ['rough', 'ink', 'tones', 'notes'],
          note: `${material.name} seeded preview.`,
          pages: [{ index: 1, url: material.imageUri }],
          thumbnailUrl: material.imageUri,
          title: material.name,
        },
        name: material.name,
        taskId: material.taskId,
        updatedBy: USER_ID,
      },
      create: {
        createdBy: USER_ID,
        fileId: material.fileId,
        id: material.id,
        materials: {
          editorState: { zoom: 1, tool: 'comment' },
          imageUri: material.imageUri,
          layers: ['rough', 'ink', 'tones', 'notes'],
          note: `${material.name} seeded preview.`,
          pages: [{ index: 1, url: material.imageUri }],
          thumbnailUrl: material.imageUri,
          title: material.name,
        },
        name: material.name,
        taskId: material.taskId,
        updatedBy: USER_ID,
      },
    });
  }

  const frames = [
    {
      id: ids.frames.panelOne,
      endX: '0.4600',
      endY: '0.4200',
      materialId: ids.materials.page01V1,
      name: 'Panel 1 expression',
      startX: '0.1200',
      startY: '0.1400',
    },
    {
      id: ids.frames.panelThree,
      endX: '0.8400',
      endY: '0.7800',
      materialId: ids.materials.page01V1,
      name: 'Panel 3 expression',
      startX: '0.5200',
      startY: '0.4400',
    },
  ];

  for (const frame of frames) {
    await prisma.materialCommentFrame.upsert({
      where: { id: frame.id },
      update: {
        endX: frame.endX,
        endY: frame.endY,
        materialId: frame.materialId,
        name: frame.name,
        startX: frame.startX,
        startY: frame.startY,
        updatedBy: USER_ID,
      },
      create: {
        ...frame,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      },
    });
  }
}

async function upsertApplications() {
  const applications = [
    {
      id: ids.applications.createArc,
      description: 'Create the first production arc for mobile testing.',
      folderImageUrl: imageUrls.arc,
      materials: [
        {
          height: 900,
          isThumbnail: true,
          mimeType: 'image/jpeg',
          originalName: 'chapter-01-arc.jpg',
          size: 240000,
          url: imageUrls.arc,
          width: 1200,
        },
      ],
      parentFolderId: null,
      status: 'SUBMITTED',
      title: 'Create Chapter 01 Arc',
      type: 'CREATE_ARC',
    },
    {
      id: ids.applications.createChapter,
      description: 'Request approval for chapter 01 draft folder.',
      folderImageUrl: imageUrls.chapter,
      materials: [
        {
          height: 900,
          isThumbnail: true,
          mimeType: 'image/jpeg',
          originalName: 'chapter-01-drafts.jpg',
          size: 210000,
          url: imageUrls.chapter,
          width: 1200,
        },
      ],
      parentFolderId: ids.folders.arc,
      status: 'PENDING',
      title: 'Create Drafts Chapter',
      type: 'CREATE_CHAPTER',
    },
  ];

  for (const application of applications) {
    await prisma.application.upsert({
      where: { id: application.id },
      update: {
        description: application.description,
        folderImageUrl: application.folderImageUrl,
        materials: application.materials,
        parentFolderId: application.parentFolderId,
        projectId: ids.project,
        status: application.status,
        title: application.title,
        type: application.type,
        updatedBy: USER_ID,
        verifyBy: USER_ID,
        voteDeadline: dateDaysFromNow(7),
      },
      create: {
        ...application,
        createdBy: USER_ID,
        projectId: ids.project,
        updatedBy: USER_ID,
        verifyBy: USER_ID,
        voteDeadline: dateDaysFromNow(7),
      },
    });
  }

  await prisma.applicationVote.upsert({
    where: {
      applicationId_userId: {
        applicationId: ids.applications.createArc,
        userId: USER_ID,
      },
    },
    update: {
      comment: 'Approved for demo review flow.',
      decision: 'APPROVE',
    },
    create: {
      applicationId: ids.applications.createArc,
      comment: 'Approved for demo review flow.',
      decision: 'APPROVE',
      userId: USER_ID,
    },
  });
}

async function upsertComments() {
  const comments = [
    {
      id: BASE_ID + 1,
      content: { text: 'File looks ready for storyboard review.' },
      fileId: ids.files.storyboard,
    },
    {
      id: BASE_ID + 2,
      content: { text: 'Please tighten the emotional beat before approval.' },
      taskId: ids.tasks.reviewPacing,
    },
    {
      id: BASE_ID + 3,
      content: { text: 'Panel 3 needs a clearer expression and stronger silhouette.' },
      frameId: ids.frames.panelThree,
    },
    {
      id: BASE_ID + 4,
      content: { text: 'Application is waiting for internal approval.' },
      applicationId: ids.applications.createChapter,
    },
  ];

  for (const comment of comments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {
        applicationId: comment.applicationId ?? null,
        content: comment.content,
        fileId: comment.fileId ?? null,
        frameId: comment.frameId ?? null,
        taskId: comment.taskId ?? null,
      },
      create: {
        ...comment,
        createdBy: USER_ID,
      },
    });
  }
}

async function upsertStatsLogsAndNotifications() {
  await prisma.projectStat.upsert({
    where: { id: ids.projectStat },
    update: {
      metrics: {
        completedTasks: 1,
        completionRate: 42,
        frameComments: 1,
        pagesReviewed: 2,
        progress: 42,
      },
      projectId: ids.project,
    },
    create: {
      id: ids.projectStat,
      metrics: {
        completedTasks: 1,
        completionRate: 42,
        frameComments: 1,
        pagesReviewed: 2,
        progress: 42,
      },
      projectId: ids.project,
    },
  });

  const logs = [
    {
      id: ids.activityLogs.folderCreated,
      action: 'FOLDER_CREATED',
      entityId: ids.folders.arc,
      entityType: 'FOLDER',
      fileId: null,
      metadata: { title: 'Chapter 01' },
    },
    {
      id: ids.activityLogs.fileCreated,
      action: 'FILE_CREATED',
      entityId: ids.files.page01,
      entityType: 'FILE',
      fileId: ids.files.page01,
      metadata: { title: 'page1.psd' },
    },
    {
      id: ids.activityLogs.taskCreated,
      action: 'TASK_CREATED',
      entityId: ids.tasks.reviewPacing,
      entityType: 'TASK',
      fileId: ids.files.storyboard,
      metadata: { title: 'Review storyboard pacing' },
    },
    {
      id: ids.activityLogs.materialUploaded,
      action: 'MATERIAL_UPLOADED',
      entityId: ids.materials.page01V1,
      entityType: 'MATERIAL',
      fileId: ids.files.page01,
      metadata: { name: 'Page 01 Artwork v1' },
    },
    {
      id: ids.activityLogs.commentCreated,
      action: 'COMMENT_CREATED',
      entityId: BASE_ID + 3,
      entityType: 'COMMENT',
      fileId: ids.files.page01,
      metadata: { frameId: ids.frames.panelThree },
    },
    {
      id: ids.activityLogs.applicationCreated,
      action: 'APPLICATION_CREATED',
      entityId: ids.applications.createChapter,
      entityType: 'APPLICATION',
      fileId: null,
      metadata: { title: 'Create Drafts Chapter' },
    },
  ];

  for (const [index, log] of logs.entries()) {
    await prisma.activityLog.upsert({
      where: { id: log.id },
      update: {
        action: log.action,
        actorId: USER_ID,
        editorBoardId: ids.editorBoard,
        entityId: log.entityId,
        entityType: log.entityType,
        fileId: log.fileId,
        metadata: log.metadata,
        projectId: ids.project,
      },
      create: {
        ...log,
        actorId: USER_ID,
        createdAt: dateDaysAgo(6 - index),
        editorBoardId: ids.editorBoard,
        projectId: ids.project,
      },
    });
  }

  for (const [index, log] of logs.entries()) {
    await prisma.notification.upsert({
      where: { id: BASE_ID + index + 1 },
      update: {
        activityLogId: log.id,
        isRead: index < 2,
        userId: USER_ID,
      },
      create: {
        activityLogId: log.id,
        id: BASE_ID + index + 1,
        isRead: index < 2,
        userId: USER_ID,
      },
    });
  }
}

async function upsertTokenTables() {
  await prisma.refreshToken.upsert({
    where: { token: 'demo-refresh-token-user-2' },
    update: {
      expiresAt: dateDaysFromNow(30),
      userId: USER_ID,
    },
    create: {
      expiresAt: dateDaysFromNow(30),
      token: 'demo-refresh-token-user-2',
      userId: USER_ID,
    },
  });

  await prisma.blacklistToken.upsert({
    where: { token: 'demo-blacklist-token-user-2' },
    update: {
      expiresAt: dateDaysFromNow(1),
    },
    create: {
      expiresAt: dateDaysFromNow(1),
      token: 'demo-blacklist-token-user-2',
    },
  });
}

async function main() {
  console.log('Importing Mangaka demo data...');
  const target =
    await prisma.$queryRaw`select current_database() as database, current_schema() as schema`;
  const databaseUrl = new URL(process.env.DATABASE_URL);
  console.log(
    `Target database: ${databaseUrl.host}/${target[0].database}, schema: ${target[0].schema}`,
  );

  await ensureUser();
  const roleRows = await ensureRolesAndPermissions();
  await upsertCoreWorkspace(roleRows);
  await upsertResources();
  await upsertTasksAndMaterials();
  await upsertApplications();
  await upsertComments();
  await upsertStatsLogsAndNotifications();
  await upsertTokenTables();

  console.log('Demo data import complete.');
  await printTableCounts();
  console.table({
    userId: USER_ID,
    editorBoardId: ids.editorBoard,
    projectId: ids.project,
    folderIds: Object.values(ids.folders).join(', '),
    fileIds: Object.values(ids.files).join(', '),
    taskIds: Object.values(ids.tasks).join(', '),
    materialIds: Object.values(ids.materials).join(', '),
    frameIds: Object.values(ids.frames).join(', '),
    applicationIds: Object.values(ids.applications).join(', '),
  });
}

async function printTableCounts() {
  const tables = [
    'users',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'editor_boards',
    'user_editor_boards',
    'projects',
    'user_projects',
    'folders',
    'files',
    'file_materials',
    'tasks',
    'material_comment_frames',
    'comments',
    'applications',
    'application_votes',
    'project_stats',
    'activity_logs',
    'notifications',
    'refresh_tokens',
    'blacklist_tokens',
  ];
  const counts = {};

  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe(`select count(*)::int as count from public.${table}`);
    counts[table] = rows[0].count;
  }

  console.table(counts);
}

main()
  .catch((error) => {
    console.error('Demo data import failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
