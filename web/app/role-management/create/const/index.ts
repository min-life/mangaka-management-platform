export const createRoleModal = {
  title: 'Create New Role',
  description: 'Define a new set of permissions for your project contributors.',
  roleNamePlaceholder: 'e.g., Lead Assistant',
  scopeOptions: [
    { label: 'System (SYS)', value: 'SYS' },
    { label: 'Company (CO)', value: 'CO' },
    { label: 'Project (PRJ)', value: 'PRJ' },
  ],
  scopeDescriptions: {
    SYS: 'Global role managed at platform level.',
    CO: 'Default company role template.',
    PRJ: 'Default project role template.',
  },
};
