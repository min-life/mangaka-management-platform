import { ApplicationItem, ApplicationStatus, ApplicationType } from '@/src/types/applications';

export const APPLICATION_STATUS_FILTERS: Array<ApplicationStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'APPROVE',
  'REJECT',
  'CANCELLED',
];

export const APPLICATION_TYPE_FILTERS: Array<ApplicationType | 'ALL'> = [
  'ALL',
  'MANUSCRIPT_REVIEW',
  'PUBLISH_REQUEST',
];

export const APPLICATIONS: ApplicationItem[] = [
  {
    id: 'app-dragon-review-1',
    projectId: 'dragon-blade',
    title: 'Chapter 12 page review',
    description:
      'Final manuscript review for Chapter 12 pages 14-18 before sending the batch to the editorial board.',
    type: 'MANUSCRIPT_REVIEW',
    status: 'PENDING',
    createdBy: 'Kaito Yamamoto',
    createdAtLabel: '2h ago',
    updatedAtLabel: 'Updated 25m ago',
    materials: {
      note: 'Focus on screentone density, page flow, and speech bubble placement.',
      pages: [
        { id: 'p14', title: 'Page 14', fileName: 'C12_P14.psd', status: 'Needs review' },
        { id: 'p15', title: 'Page 15', fileName: 'C12_P15.psd', status: 'Ready' },
        { id: 'p16', title: 'Page 16', fileName: 'C12_P16.psd', status: 'Ready' },
      ],
    },
  },
  {
    id: 'app-dragon-publish-1',
    projectId: 'dragon-blade',
    title: 'Publish request for Chapter 12',
    description:
      'Requesting board approval to publish Chapter 12 after manuscript review and final lettering pass.',
    type: 'PUBLISH_REQUEST',
    status: 'APPROVE',
    createdBy: 'Ren Editor',
    verifyBy: 'Mika Lead',
    createdAtLabel: 'Yesterday',
    updatedAtLabel: 'Approved 3h ago',
    materials: {
      note: 'All files exported to the publication bundle with cover, pages, and metadata.',
      pages: [
        { id: 'bundle', title: 'Publication bundle', fileName: 'dragon-blade-c12.zip', status: 'Ready' },
        { id: 'cover', title: 'Cover image', fileName: 'C12_cover.png', status: 'Ready' },
      ],
    },
  },
  {
    id: 'app-dragon-review-2',
    projectId: 'dragon-blade',
    title: 'Rework page 11 background',
    description:
      'Background detail was rejected in review. Artist needs to resubmit the reworked city panel.',
    type: 'MANUSCRIPT_REVIEW',
    status: 'REJECT',
    createdBy: 'Kaito Yamamoto',
    verifyBy: 'Ren Editor',
    createdAtLabel: '2d ago',
    updatedAtLabel: 'Rejected yesterday',
    materials: {
      note: 'Panel 3 needs stronger depth and cleaner perspective lines.',
      pages: [
        { id: 'p11', title: 'Page 11', fileName: 'C12_P11.psd', status: 'Blocked' },
      ],
    },
  },
  {
    id: 'app-moon-review-1',
    projectId: 'moonlight-ronin',
    title: 'Chapter 08 tone review',
    description:
      'Review the night market pages and confirm whether the mood is consistent across the chapter.',
    type: 'MANUSCRIPT_REVIEW',
    status: 'PENDING',
    createdBy: 'Aya Artist',
    createdAtLabel: '5h ago',
    updatedAtLabel: 'Updated 1h ago',
    materials: {
      note: 'Please compare contrast level against pages from the previous chapter.',
      pages: [
        { id: 'mr-p08', title: 'Page 08', fileName: 'MR_C08_P08.clip', status: 'Needs review' },
        { id: 'mr-p09', title: 'Page 09', fileName: 'MR_C08_P09.clip', status: 'Ready' },
      ],
    },
  },
  {
    id: 'app-frame-publish-1',
    projectId: 'frame-cleaner',
    title: 'Tooling release review',
    description:
      'Approval request for the frame cleaner release notes and demo package before internal rollout.',
    type: 'PUBLISH_REQUEST',
    status: 'CANCELLED',
    createdBy: 'Tools Maintainer',
    createdAtLabel: '4d ago',
    updatedAtLabel: 'Cancelled 2d ago',
    materials: {
      note: 'Release was paused because the edge detection regression needs another pass.',
      pages: [
        { id: 'demo', title: 'Demo package', fileName: 'frame-cleaner-demo.zip', status: 'Blocked' },
      ],
    },
  },
  {
    id: 'app-lettering-publish-1',
    projectId: 'lettering-queue',
    title: 'Weekly lettering batch',
    description:
      'Publish request for all lettering queue assets completed this week.',
    type: 'PUBLISH_REQUEST',
    status: 'PENDING',
    createdBy: 'Production Coordinator',
    createdAtLabel: '45m ago',
    updatedAtLabel: 'Updated 10m ago',
    materials: {
      note: 'Batch includes exported pages, text manifests, and final QA checklist.',
      pages: [
        { id: 'manifest', title: 'Text manifest', fileName: 'lettering-manifest.json', status: 'Ready' },
        { id: 'exports', title: 'Exported pages', fileName: 'lettering-weekly.zip', status: 'Needs review' },
      ],
    },
  },
];

export function getProjectApplications(projectId: string) {
  return APPLICATIONS.filter((application) => application.projectId === projectId);
}

export function getUserProjectApplications(projectIds: string[]) {
  const projectIdSet = new Set(projectIds);
  return APPLICATIONS.filter((application) => projectIdSet.has(application.projectId));
}

export function findApplication(applicationId: string) {
  return APPLICATIONS.find((application) => application.id === applicationId);
}
