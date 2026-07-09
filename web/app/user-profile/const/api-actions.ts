export const apiActions = {
  search: { method: 'GET', endpoint: '/projects' },
  notifications: { method: 'GET', endpoint: '/users/me' },
  settings: { method: 'GET', endpoint: '/users/me' },
  linkGoogleAccount: { method: 'GET', endpoint: '/users/me/link-account' },
  editProfile: { method: 'PATCH', endpoint: '/users/me' },
  updateAvatar: { method: 'PATCH', endpoint: '/users/me' },
  activities: { method: 'LOCAL', endpoint: 'derived-empty-state-until-activity-api-exists' },
  viewAllProjects: { method: 'GET', endpoint: '/users/:userId/projects' },
  editorBoards: { method: 'GET', endpoint: '/users/:userId/editor-boards' },
  securityPassword: { method: 'PATCH', endpoint: '/users/me/password' },
  notificationPreferences: { method: 'PATCH', endpoint: '/users/me' },
  languagePreferences: { method: 'PATCH', endpoint: '/users/me' },
  appearancePreferences: { method: 'LOCAL', endpoint: 'localStorage:mangaka:user-profile-theme' },
  deactivateAccount: { method: 'DELETE', endpoint: '/users/:id' },
} as const;

export type ApiActionKey = keyof typeof apiActions;
