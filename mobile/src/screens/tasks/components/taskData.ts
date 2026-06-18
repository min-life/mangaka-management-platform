import { FilterChip, Task } from './types';

export const FILTER_CHIPS: FilterChip[] = ['All', 'Assigned', 'In Progress', 'Review', 'Done'];

export const TASKS: Task[] = [
  {
    id: '1',
    priority: 'HIGH',
    title: 'Color Page 14',
    project: 'Dragon Blade',
    status: 'In Progress',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAWrc_JjD2kZykTe0YSXzT6Q-mGKRg5LkFLvq8bMY-AdExCrnGPKSmJlNY6md2ThFn7EhyubBIvZPomnQndf5Q-D4XDTmcIRq5Wvs3oKRPaURsfYwRM5RidyknT8bCarY01I_VnHhiS8X0yG1JA87P5wNWtlKjq-yfL38SHtsBPmUANI-PDnp5zduivutIVxXOAC_jmwFGSB__IuAVFuK1-DKma2Jo4DZT0WVexhFUJdY9TmcGF1-a9ewkOMHd3nG_fgAX8VV3P8SpS',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjDUsImOkgZUrcZJXW7Obk5kCWdZOWLS0BA4nmJ9kN7N5OQlzdK-YiHCFjJ7nX_CRWBh7h4DX8ulXbB_AwDHJl5oUH-B9KjrniOCSsDC34lnQnfnLIzhPpzTCoJ3BVXXVacGLYpuJMQ9dLJTM_IGkY4KC17vdXt_ZT4YHQHu52MXMENoGzu2llViLOnpd83lfdt3BOXC3Rd5icKKxZzrVWFwFnB9skv8WmnDDkjcZkPEtEHISiWPACFkuPQD0lZ-N_-gyc0wtsxVQf',
    ],
    dueLabel: 'Today',
  },
  {
    id: '2',
    priority: 'MEDIUM',
    title: 'Review Chapter 12',
    project: 'Dragon Blade',
    status: 'Review',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABI9U7dhRUL96a6oVOPxRGNov0JEvHPvYv-8MoDkuccz8hhCGzYR5zzY429q-DaS7dI7b2aUo8IQQRek7FjFpbzXwcwZamFMv8lCNWUxpomRBlaoUZrcxTni5Klyt3fazAo0noDWerO2eMSi-amxDEE12faNd_xJ1Uzl4RNOAGNABewoJi2zAGH91hB_PqtE9Cm3d6m2qosZG8p3OiTdpAk-yE6hfDkkwtWwz6p4950L5LP8zDKBGrYEvr2duF644wZkjUbrvLCWvH',
    ],
    dueLabel: 'Tomorrow',
  },
  {
    id: '3',
    priority: 'LOW',
    title: 'Fix Background Details',
    project: 'Moonlight Ronin',
    status: 'Pending',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDe5OGJtM4X0kOfB9f5TpiiBBUxbN6DEsWj3lM_rYr6tmw6Pj8l_5SpB2zNvsRR8Z3YbQhtxR1LEV3mvL0lrnciqhkTZHUe31ehxT5qOHyIv6yu2cUIvTt-qjNrgqzC0TzPYLmnD3MO6FI_lPf9591jZwdaI0EfjGmBsJcKLywUGxcsM2VqjE7WpAt6PuxQG8fyxKkLRa-2aHscs4XYCF7Sz02CdqKLhyPCX7m0oVyDfxwrBCgc1t-YrXW6-x1sH9Aa_3aaqneN7yiy',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBV_3VdRREofH1BKi7v975TctxOfdR_3FSI1qZTNYZ9UGenoUBPIHyt1TRHKX9hd7jvjdsBmy1RutTNZQk4Y3OTnH_J8mQ1Wa1USIMbEd9muueEd5I3iloTJZjHM_7P19D7c4iZiLlWF_AAbLz7mbkvlL08A8KOvabwQG0MGVr9kd1-Uo9gB_BWL5bP4AVLCg2w3DV4q6Vlb7eP3pzKLNQ_t2fRTPUwRQZCAs7AtutZ0hXybKbrvRjXjFTKcaNJuaevyH0Yysbc5rMy',
    ],
    dueLabel: '3 Days',
  },
];

