import {
  ProjectResourceTree,
  ResourceFileNode,
  ResourceFileTask,
  ResourceTaskComment,
  ResourceTaskFrame,
  ResourceFolderNode,
  ResourceNode,
} from '@/src/types/resources';

interface PageSeed {
  id: string;
  name: string;
  description: string;
  content: string;
}

const STATUS_ROTATION: ResourceFileTask['status'][] = [
  'PENDING',
  'INPROGRESS',
  'REVIEW',
  'DONE',
];

function buildPageImageUri(seed: string, version = 'latest') {
  return `https://picsum.photos/seed/${seed}-${version}/900/1200`;
}

function makeFrame(
  id: string,
  name: string,
  description: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): ResourceTaskFrame {
  return {
    id,
    name,
    description,
    startX,
    startY,
    endX,
    endY,
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
  };
}

function makeComment(
  id: string,
  frameId: string,
  author: string,
  authorRole: string,
  initials: string,
  time: string,
  text: string,
  mention?: string,
): ResourceTaskComment {
  return {
    id,
    frameId,
    author,
    authorRole,
    initials,
    time,
    body: text,
    mention,
    content: {
      text,
      mentions: mention ? [mention] : [],
      attachments: [],
    },
  };
}

function makePageTasks(projectId: string, fileId: string, page: PageSeed): ResourceFileTask[] {
  const taskKey = `${projectId}-${page.id}`;
  const cleanupFrames = [
    makeFrame(
      `${taskKey}-frame-ink-1`,
      'Panel ink cleanup',
      'Review contour weight and clean stray ink around the main figure.',
      7,
      8,
      58,
      34,
    ),
    makeFrame(
      `${taskKey}-frame-tone-2`,
      'Screentone balance',
      'Reduce dense tone so the speech area remains readable.',
      12,
      42,
      88,
      66,
    ),
  ];
  const letteringFrames = [
    makeFrame(
      `${taskKey}-frame-letter-1`,
      'Speech bubble check',
      'Check translation fit and bubble tail direction.',
      55,
      6,
      93,
      24,
    ),
    makeFrame(
      `${taskKey}-frame-sfx-2`,
      'SFX placement',
      'Keep sound effect readable without covering the action line.',
      18,
      70,
      82,
      92,
    ),
  ];

  return [
    {
      id: `${taskKey}-task-cleanup`,
      fileId,
      title: `Clean up ${page.name}`,
      description: page.description,
      status: STATUS_ROTATION[page.id.length % STATUS_ROTATION.length],
      deadline: '2026-07-02T17:00:00.000Z',
      assignedBy: 'user-ren-editor',
      assignedByName: 'Ren Editor',
      createdBy: 'user-kaito-yamamoto',
      createdByName: 'Kaito Yamamoto',
      updatedBy: 'user-ren-editor',
      updatedByName: 'Ren Editor',
      createdAt: '2026-06-24T09:00:00.000Z',
      updatedAt: '2026-06-28T05:00:00.000Z',
      frames: cleanupFrames,
      comments: [
        makeComment(
          `${taskKey}-comment-ink-1`,
          cleanupFrames[0].id,
          'Kaito Yamamoto',
          'LEAD ARTIST',
          'KY',
          '2 hours ago',
          'Viền nhân vật ở panel này cần dày hơn một chút để tách khỏi nền.',
          '@Ren_Editor',
        ),
        makeComment(
          `${taskKey}-comment-tone-1`,
          cleanupFrames[1].id,
          'Ren Editor',
          'CONTENT EDITOR',
          'RE',
          '1 hour ago',
          'Mình sẽ giảm density vùng này trước khi gửi bản review tiếp theo.',
        ),
      ],
    },
    {
      id: `${taskKey}-task-lettering`,
      fileId,
      title: `Lettering pass for ${page.name}`,
      description: 'Review dialogue, SFX placement, and bubble spacing for this manga page.',
      status: page.id.includes('002') ? 'DONE' : 'REVIEW',
      deadline: '2026-07-03T12:00:00.000Z',
      assignedBy: 'user-yumi-tanaka',
      assignedByName: 'Yumi Tanaka',
      createdBy: 'user-ren-editor',
      createdByName: 'Ren Editor',
      updatedBy: 'user-yumi-tanaka',
      updatedByName: 'Yumi Tanaka',
      createdAt: '2026-06-25T10:30:00.000Z',
      updatedAt: '2026-06-28T03:20:00.000Z',
      frames: letteringFrames,
      comments: [
        makeComment(
          `${taskKey}-comment-letter-1`,
          letteringFrames[0].id,
          'Yumi Tanaka',
          'LETTERER',
          'YT',
          '3 hours ago',
          'Bubble này hơi sát viền panel, nên kéo vào trong khoảng 4px.',
          '@Kaito',
        ),
        makeComment(
          `${taskKey}-comment-sfx-1`,
          letteringFrames[1].id,
          'Ren Editor',
          'CONTENT EDITOR',
          'RE',
          '45 minutes ago',
          'SFX ổn, chỉ cần tránh che motion line chính.',
        ),
      ],
    },
  ];
}

function makeMaterialVersions(projectId: string, fileId: string, page: PageSeed) {
  const seed = `${projectId}-${page.id}`;

  return [
    {
      id: `${fileId}-material-v3`,
      fileId,
      materials: {
        title: 'Version 03 - Review render',
        note: 'Latest review render with updated tones and lettering.',
        imageUri: buildPageImageUri(seed, 'v3'),
        layers: ['background', 'characters', 'screentone', 'lettering'],
        pages: [{ index: 1, url: buildPageImageUri(seed, 'v3') }],
        editorState: { activeLayer: 'lettering', zoom: 0.84 },
      },
      createdBy: 'user-ren-editor',
      createdByName: 'Ren Editor',
      updatedBy: 'user-ren-editor',
      updatedByName: 'Ren Editor',
      createdAt: '2026-06-28T05:00:00.000Z',
      updatedAt: '2026-06-28T05:00:00.000Z',
    },
    {
      id: `${fileId}-material-v2`,
      fileId,
      materials: {
        title: 'Version 02 - Tone pass',
        note: 'Screentone pass before final lettering adjustments.',
        imageUri: buildPageImageUri(seed, 'v2'),
        layers: ['background', 'characters', 'screentone'],
        pages: [{ index: 1, url: buildPageImageUri(seed, 'v2') }],
        editorState: { activeLayer: 'screentone', zoom: 0.76 },
      },
      createdBy: 'user-kaito-yamamoto',
      createdByName: 'Kaito Yamamoto',
      createdAt: '2026-06-27T14:20:00.000Z',
      updatedAt: '2026-06-27T14:20:00.000Z',
    },
    {
      id: `${fileId}-material-v1`,
      fileId,
      materials: {
        title: 'Version 01 - Rough layout',
        note: 'Initial page layout from the chapter storyboard.',
        imageUri: buildPageImageUri(seed, 'v1'),
        layers: ['rough', 'panel-layout'],
        pages: [{ index: 1, url: buildPageImageUri(seed, 'v1') }],
        editorState: { activeLayer: 'rough', zoom: 0.68 },
      },
      createdBy: 'user-page-team',
      createdByName: 'Page Team',
      createdAt: '2026-06-24T08:45:00.000Z',
      updatedAt: '2026-06-24T08:45:00.000Z',
    },
  ];
}

interface ChapterSeed {
  id: string;
  name: string;
  description: string;
  pages: PageSeed[];
}

interface ArcSeed {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  chapters: ChapterSeed[];
}

const arcSeeds: ArcSeed[] = [
  {
    id: 'awakening-arc',
    name: 'Awakening Arc',
    description: 'Opening arc where the lead discovers the blade mark and leaves the harbor town.',
    createdBy: 'user-haruto-sato',
    createdByName: 'Haruto Sato',
    createdAt: '2026-05-18T08:30:00.000Z',
    updatedAt: '2026-06-28T03:40:00.000Z',
    chapters: [
      {
        id: 'awakening-chapter-01',
        name: 'Chapter 01 - The First Mark',
        description: 'Introduce the village, the mark, and the first editorial review batch.',
        pages: [
          {
            id: 'awakening-c01-page-001',
            name: 'Page 001',
            description: 'Opening splash page for the coastal village.',
            content: `# Page 001

Wide establishing panel of the harbor town at dawn.

- Check skyline perspective.
- Confirm speech balloon placement does not cover the blade mark.
- Background tone should stay soft for the opening mood.
`,
          },
          {
            id: 'awakening-c01-page-002',
            name: 'Page 002',
            description: 'Lead character notices the mark on his palm.',
            content: `# Page 002

Close-up sequence where the lead discovers the glowing blade mark.

- Review hand anatomy.
- Add stronger contrast around the mark.
- Keep final panel silent.
`,
          },
          {
            id: 'awakening-c01-page-003',
            name: 'Page 003',
            description: 'Inciting incident at the shrine gate.',
            content: `# Page 003

The shrine gate fractures as the first shadow creature appears.

- Verify action line direction.
- Mark panel 4 for sound effect lettering.
- Needs frame comments for creature silhouette.
`,
          },
        ],
      },
      {
        id: 'awakening-chapter-02',
        name: 'Chapter 02 - Harbor Oath',
        description: 'The lead accepts the journey and makes the first promise.',
        pages: [
          {
            id: 'awakening-c02-page-001',
            name: 'Page 001',
            description: 'Departure scene with the mentor.',
            content: `# Page 001

Mentor gives the wrapped sword at the old pier.

- Check emotional beat in panel 2.
- Reduce texture density behind dialogue.
`,
          },
          {
            id: 'awakening-c02-page-002',
            name: 'Page 002',
            description: 'Travel montage toward the mountain path.',
            content: `# Page 002

Travel montage from harbor to mountain trail.

- Confirm page flow from left cliff to bottom road.
- Add weather notes for final render.
`,
          },
        ],
      },
    ],
  },
  {
    id: 'ronin-trial-arc',
    name: 'Ronin Trial Arc',
    description: 'Tournament and trial arc focused on rival introductions and combat review.',
    createdBy: 'user-yumi-tanaka',
    createdByName: 'Yumi Tanaka',
    createdAt: '2026-05-24T06:45:00.000Z',
    updatedAt: '2026-06-27T11:30:00.000Z',
    chapters: [
      {
        id: 'ronin-trial-chapter-03',
        name: 'Chapter 03 - Trial Gate',
        description: 'Candidates enter the trial grounds and meet the masked judge.',
        pages: [
          {
            id: 'ronin-c03-page-001',
            name: 'Page 001',
            description: 'Trial gate crowd composition.',
            content: `# Page 001

Crowd scene at the trial gate.

- Simplify background faces in panels 1 and 2.
- Check mask design consistency.
`,
          },
          {
            id: 'ronin-c03-page-002',
            name: 'Page 002',
            description: 'First rival reveal.',
            content: `# Page 002

Rival reveal with vertical speed-line panel.

- Increase contrast on cloak edge.
- Review lettering around the challenge line.
`,
          },
        ],
      },
      {
        id: 'ronin-trial-chapter-04',
        name: 'Chapter 04 - Broken Bamboo',
        description: 'First combat chapter with choreography and impact frames.',
        pages: [
          {
            id: 'ronin-c04-page-001',
            name: 'Page 001',
            description: 'Opening exchange in the bamboo field.',
            content: `# Page 001

Opening sword exchange in the bamboo field.

- Mark action impact frames.
- Check panel 5 motion blur.
`,
          },
          {
            id: 'ronin-c04-page-002',
            name: 'Page 002',
            description: 'Counterattack and cliffhanger beat.',
            content: `# Page 002

Counterattack lands near the final page turn.

- Strengthen black fill in final panel.
- Add comment frame over the broken sword guard.
`,
          },
        ],
      },
    ],
  },
  {
    id: 'night-market-arc',
    name: 'Night Market Arc',
    description: 'Investigation arc through the hidden market and its spirit merchants.',
    createdBy: 'user-linh-tran',
    createdByName: 'Linh Tran',
    createdAt: '2026-06-03T07:45:00.000Z',
    updatedAt: '2026-06-28T04:35:00.000Z',
    chapters: [
      {
        id: 'night-market-chapter-05',
        name: 'Chapter 05 - Lantern Deal',
        description: 'The crew follows a coded lantern trail into the market.',
        pages: [
          {
            id: 'night-c05-page-001',
            name: 'Page 001',
            description: 'Lantern alley entrance.',
            content: `# Page 001

The crew enters the lantern alley.

- Review value grouping in the crowd.
- Keep lantern symbols readable at mobile scale.
`,
          },
          {
            id: 'night-c05-page-002',
            name: 'Page 002',
            description: 'Merchant bargain sequence.',
            content: `# Page 002

Spirit merchant offers the first bargain.

- Check expression clarity.
- Add frame notes for prop continuity.
`,
          },
        ],
      },
    ],
  },
];

function makePage(projectId: string, chapterId: string, page: PageSeed): ResourceFileNode {
  const fileId = `${projectId}-${page.id}`;
  const materialVersions = makeMaterialVersions(projectId, fileId, page);

  return {
    id: fileId,
    name: page.name,
    type: 'file',
    folderId: `${projectId}-${chapterId}`,
    description: page.description,
    language: 'Manga Page',
    content: page.content,
    createdByName: 'Page Team',
    createdAt: '2026-06-20T09:00:00.000Z',
    updatedAt: '2026-06-28T05:00:00.000Z',
    previewImageUri: materialVersions[0].materials.imageUri,
    materialVersions,
    tasks: makePageTasks(projectId, fileId, page),
  };
}

function makeChapter(
  projectId: string,
  arcId: string,
  chapter: ChapterSeed,
): ResourceFolderNode {
  return {
    id: `${projectId}-${chapter.id}`,
    name: chapter.name,
    type: 'folder',
    projectId,
    parentId: `${projectId}-${arcId}`,
    description: chapter.description,
    createdByName: 'Chapter Team',
    createdAt: '2026-06-10T08:00:00.000Z',
    updatedAt: '2026-06-28T04:30:00.000Z',
    children: chapter.pages.map((page) => makePage(projectId, chapter.id, page)),
  };
}

function makeArc(projectId: string, arc: ArcSeed): ResourceFolderNode {
  return {
    id: `${projectId}-${arc.id}`,
    name: arc.name,
    type: 'folder',
    projectId,
    parentId: null,
    createdBy: arc.createdBy,
    createdByName: arc.createdByName,
    createdAt: arc.createdAt,
    updatedAt: arc.updatedAt,
    description: arc.description,
    children: arc.chapters.map((chapter) => makeChapter(projectId, arc.id, chapter)),
  };
}

function makeProjectResourceTree(projectId: string): ProjectResourceTree {
  return {
    projectId,
    root: {
      id: `${projectId}-resource-root`,
      name: 'Resource',
      type: 'folder',
      projectId,
      parentId: null,
      description: 'Project manga resources grouped by arc, chapter, and page.',
      children: arcSeeds.map((arc) => makeArc(projectId, arc)),
    },
  };
}

export const PROJECT_RESOURCE_TREES: ProjectResourceTree[] = [
  makeProjectResourceTree('dragon-blade'),
  makeProjectResourceTree('moonlight-ronin'),
  makeProjectResourceTree('frame-cleaner'),
  makeProjectResourceTree('lettering-queue'),
  makeProjectResourceTree('night-market'),
];

export function getProjectResourceTree(projectId: string): ResourceFolderNode {
  return (
    PROJECT_RESOURCE_TREES.find((tree) => tree.projectId === projectId)?.root ??
    makeProjectResourceTree(projectId).root
  );
}

export function getProjectRootFolders(projectId: string): ResourceFolderNode[] {
  return getProjectResourceTree(projectId).children.filter(
    (node): node is ResourceFolderNode => node.type === 'folder' && node.parentId === null,
  );
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

export function findResourceFolder(
  root: ResourceFolderNode,
  folderId: string,
): ResourceFolderNode | undefined {
  const node = findResourceNode(root, folderId);
  return node?.type === 'folder' ? node : undefined;
}

export function getFolderChildren(folder: ResourceFolderNode): ResourceFolderNode[] {
  return folder.children.filter(
    (node): node is ResourceFolderNode => node.type === 'folder',
  );
}

export function getFolderFiles(folder: ResourceFolderNode): ResourceFileNode[] {
  return folder.children.filter((node): node is ResourceFileNode => node.type === 'file');
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
