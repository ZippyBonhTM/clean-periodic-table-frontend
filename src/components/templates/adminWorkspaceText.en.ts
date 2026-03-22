export const adminWorkspaceTextEn = {
  title: 'Admin control panel.',
  description:
    'Review internal previews and centralize admin-only actions without exposing unfinished areas to regular users.',
  badge: 'ADMIN only',
  session: {
    title: 'Current admin session',
    description: 'This page only renders after a server-side admin check.',
    name: 'Name',
    email: 'Email',
    role: 'Role',
  },
  preview: {
    title: 'Internal previews',
    description:
      'When a feature is in the internal stage, admins can open it from here while non-admin visitors receive 404.',
    featureStateLabel: 'Article feature stage',
    states: {
      off: 'Off',
      internal: 'Internal preview',
      public: 'Public',
    },
    unavailable: 'The Article System is currently off in this environment.',
    openFeed: 'Open article feed',
    openWorkspace: 'Open article workspace',
    createDraft: 'Open article editor',
  },
  management: {
    title: 'User management',
    description:
      'This panel is ready for future admin operations such as role changes, moderation actions, and restricted maintenance flows.',
    placeholder:
      'The UI foundation is in place, but real user mutation actions still depend on dedicated backend admin endpoints.',
  },
  security: {
    title: 'Access policy',
    description:
      'Routes marked as internal now require an ADMIN session on the server. Everyone else receives the shared 404 page.',
  },
} as const;
