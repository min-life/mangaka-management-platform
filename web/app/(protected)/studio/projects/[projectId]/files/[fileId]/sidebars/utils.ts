import type { FileVersionItem } from '../../file-ui';
import type { TaskWorkspaceItem } from '../../../tasks/task-ui';

export function getTargetVersion(task: TaskWorkspaceItem, versions: FileVersionItem[]) {
  return task.targetVersion || (versions[0] ? `v${versions[0].version}` : 'v1');
}

export function getVersionFooter(
  selectedVersion: FileVersionItem | null,
  versions: FileVersionItem[],
) {
  const versionLabel = selectedVersion
    ? `v${selectedVersion.version}`
    : versions[0]
      ? `v${versions[0].version}`
      : 'v1';
  const dateLabel = selectedVersion
    ? selectedVersion.createdAt
    : versions[0]
      ? versions[0].createdAt
      : 'Today';

  return `${versionLabel} - ${dateLabel}`;
}
