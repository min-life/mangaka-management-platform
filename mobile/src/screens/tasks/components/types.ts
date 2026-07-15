export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'In Progress' | 'Review' | 'Pending' | 'Done';
export type FilterChip = 'All' | 'Assigned' | 'In Progress' | 'Review' | 'Done';
export type TaskScopeFilter = 'All' | 'Mine';

export interface Task {
  assignedById?: string;
  createdById?: string;
  fileId: string;
  id: string;
  projectId: string;
  priority: Priority;
  title: string;
  project: string;
  status: TaskStatus;
  assignees: string[];
  dueLabel: string;
}
