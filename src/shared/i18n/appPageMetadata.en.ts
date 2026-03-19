export const appPageMetadataEn = {
  brandTitle: 'Clean Periodic Table',
  brandDescription: 'Explore elements, balance equations, and build molecules in one place.',
  pages: {
    home: {
      title: 'Interactive Chemistry Experience',
      description: 'Explore chemistry through a more inviting homepage, a striking periodic table, quick equation balancing, and an easy-to-open molecular editor.',
      keywords: [
        'online chemistry workspace',
        'periodic table app',
        'chemical equation balancer',
        'molecular editor',
        'chemistry tools',
      ],
    },
    periodicTable: {
      title: 'Periodic Table',
      description: 'Explore the periodic table, search elements quickly, and open rich element details in one place.',
    },
    balanceEquation: {
      title: 'Balance Equation',
      description: 'Balance chemical equations and compare the result with extra analysis.',
    },
    molecularEditor: {
      title: 'Molecular Editor',
      description: 'Build, edit, and inspect molecules in one place.',
    },
    moleculeGallery: {
      title: 'Molecule Gallery',
      description: 'Open, review, and continue editing the molecules saved in your gallery.',
      indexable: false,
    },
    login: {
      title: 'Login',
      description: 'Sign in to sync your data and keep your chemistry tools in step.',
      indexable: false,
    },
    register: {
      title: 'Create Account',
      description: 'Create an account to save your progress and come back later.',
      indexable: false,
    },
  },
} as const;
