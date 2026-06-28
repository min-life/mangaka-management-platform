export const projectRows = [
  {
    id: 'CR-2045',
    image:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=160&auto=format&fit=crop',
    memberCount: 0,
    members: [
      { color: '#0ea5e9', initials: 'TA' },
      { color: '#334155', initials: 'HN' },
      { color: '#8b8b7a', initials: 'LK' },
    ],
    name: 'Cyberpunk Ronin',
    progress: 75,
    role: 'Lead Writer',
    status: 'SCRIPT PHASE',
    updated: '2d ago',
  },
  {
    id: 'VE-002',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=160&auto=format&fit=crop',
    members: [
      { color: '#0ea5e9', initials: 'KM' },
      { color: '#334155', initials: 'DV' },
    ],
    memberCount: 12,
    name: 'Void Echoes',
    progress: 42,
    role: 'Editor-In-Chief',
    status: 'INKING',
    updated: '4h ago',
  },
  {
    id: 'AW-102',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=160&auto=format&fit=crop',
    members: [{ color: '#334155', initials: 'AW' }],
    memberCount: 3,
    name: 'Autumn Whisper',
    progress: 15,
    role: 'Art Director',
    status: 'STORYBOARD',
    updated: '1d ago',
  },
  {
    id: 'IH-390',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=160&auto=format&fit=crop',
    members: [
      { color: '#0ea5e9', initials: 'IR' },
      { color: '#334155', initials: 'MH' },
    ],
    memberCount: 2,
    name: 'Iron Heart',
    progress: 95,
    role: 'Lead Writer',
    status: 'SCRIPT PHASE',
    updated: '12m ago',
  },
] as const;

export const taskRows = [
  {
    assignee: { color: '#0ea5e9', initials: 'HN', name: 'Hana Nguyen' },
    due: 'Today',
    file: 'Chapter 03 / Page 12',
    id: 'TSK-1042',
    project: 'Cyberpunk Ronin',
    status: 'REVIEW',
    title: 'Review neon alley panel corrections',
    updated: '2h ago',
  },
  {
    assignee: { color: '#334155', initials: 'TA', name: 'Tuan Anh' },
    due: 'Tomorrow',
    file: 'Chapter 01 / Lettering',
    id: 'TSK-0978',
    project: 'Void Echoes',
    status: 'INPROGRESS',
    title: 'Fix speech bubble overflow',
    updated: '4h ago',
  },
  {
    assignee: { color: '#8b8b7a', initials: 'LK', name: 'Linh K.' },
    due: 'Jun 24',
    file: 'Storyboard / Scene 08',
    id: 'TSK-0881',
    project: 'Autumn Whisper',
    status: 'PENDING',
    title: 'Sketch shrine entrance composition',
    updated: '1d ago',
  },
  {
    assignee: { color: '#0ea5e9', initials: 'IR', name: 'Iris R.' },
    due: 'Jun 26',
    file: 'Chapter 05 / Final Ink',
    id: 'TSK-0722',
    project: 'Iron Heart',
    status: 'DONE',
    title: 'Finalize action sequence inks',
    updated: '3d ago',
  },
] as const;
