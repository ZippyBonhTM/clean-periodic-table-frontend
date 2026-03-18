export const appHeaderTextEn = {
  brand: {
    eyebrow: 'Clean Periodic Table',
    title: 'Chemical Explorer',
  },
  theme: {
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
  },
  localeSwitcher: {
    ariaLabel: 'Language switcher',
    options: {
      'en-US': {
        shortLabel: 'EN',
        label: 'English',
      },
      'pt-BR': {
        shortLabel: 'PT',
        label: 'Português',
      },
    },
  },
  navigation: {
    openMenu: 'Open routes menu',
    closeMenu: 'Close',
    closeMenuBackdrop: 'Close routes menu backdrop',
    dialogLabel: 'Routes menu',
    menuTitle: 'Routes',
    links: {
      periodicTable: 'Periodic Table',
      search: 'Search',
      balanceEquation: 'Balance Equation',
      molecularEditor: 'Molecular Editor',
      moleculeGallery: 'Molecule Gallery',
    },
  },
  auth: {
    login: 'Login',
    register: 'Register',
  },
  userMenu: {
    open: 'Open user menu',
    close: 'Close',
    closeBackdrop: 'Close user menu backdrop',
    dialogLabel: 'User menu',
    dragHandle: 'Drag or tap edge to close user menu',
    subtitle: 'User menu',
    confirmLogout: 'Confirm logout?',
    cancel: 'Cancel',
    logout: 'Logout',
    guest: 'Guest',
    userFallback: 'User',
    profileLoadErrorFallback: 'Could not load user profile right now.',
  },
  profile: {
    title: 'Profile',
    notAuthenticated: 'Not authenticated.',
    loading: 'Loading profile...',
    unavailable: 'Profile unavailable.',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    id: 'ID',
  },
} as const;
