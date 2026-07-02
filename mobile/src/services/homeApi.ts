import { Colors } from '@/src/constants/colors';
import { ActivityItem, WorkItem } from '@/src/types/home';

import { fetchApplications } from './applicationApi';
import { fetchEditorBoards } from './editorBoardApi';
import { relativeDate } from './formatters';
import { fetchNotifications } from './notificationApi';
import { fetchProjects } from './projectApi';
import { fetchTasks } from './taskApi';

export async function fetchHomeSummary() {
  const [projects, tasks, applications, boards, notifications] = await Promise.all([
    fetchProjects(),
    fetchTasks(),
    fetchApplications(),
    fetchEditorBoards(),
    fetchNotifications().catch(() => ({ items: [] })),
  ]);

  const projectCount = projects.pagination?.total ?? projects.projects.length;
  console.log(projectCount);
  const taskCount = tasks.pagination?.total ?? tasks.tasks.length;
  const applicationCount = applications.pagination?.total ?? applications.applications.length;
  const boardCount = boards.pagination?.total ?? boards.boards.length;

  const workItems: WorkItem[] = [
    {
      badge: String(taskCount),
      icon: 'checklist',
      iconColor: Colors.iconTask,
      id: 'tasks',
      label: 'Tasks',
    },
    {
      badge: String(projectCount),
      icon: 'folder',
      iconColor: Colors.iconFolder,
      id: 'projects',
      label: 'Projects',
    },
    {
      badge: String(applicationCount),
      icon: 'send',
      iconColor: Colors.iconApp,
      id: 'applications',
      label: 'Applications',
    },
    {
      badge: String(boardCount),
      icon: 'groups',
      iconColor: Colors.text,
      id: 'editor-board',
      label: 'Editor board',
    },
  ];

  const activities: ActivityItem[] = notifications.items.slice(0, 5).map((item, index, list) => ({
    bgColor: 'rgba(77,166,255,0.2)',
    hasLine: index < list.length - 1,
    icon: item.icon,
    iconColor: Colors.statusProgress,
    id: item.id,
    subtitle: item.subtitle || item.project,
    time: item.time || relativeDate(new Date().toISOString()),
    title: item.title,
  }));

  return { activities, workItems };
}
