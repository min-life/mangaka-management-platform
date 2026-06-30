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
    fetchProjects().catch(() => ({ projects: [] })),
    fetchTasks().catch(() => ({ tasks: [] })),
    fetchApplications().catch(() => ({ applications: [] })),
    fetchEditorBoards().catch(() => ({ boards: [] })),
    fetchNotifications().catch(() => ({ items: [] })),
  ]);

  const workItems: WorkItem[] = [
    {
      badge: String(tasks.tasks.length),
      icon: 'checklist',
      iconColor: Colors.iconTask,
      id: 'tasks',
      label: 'Tasks',
    },
    {
      badge: String(projects.projects.length),
      icon: 'folder',
      iconColor: Colors.iconFolder,
      id: 'projects',
      label: 'Projects',
    },
    {
      badge: String(applications.applications.length),
      icon: 'send',
      iconColor: Colors.iconApp,
      id: 'applications',
      label: 'Applications',
    },
    {
      badge: String(boards.boards.length),
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

