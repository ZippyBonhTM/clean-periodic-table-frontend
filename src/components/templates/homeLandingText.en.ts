export const homeLandingTextEn = {
  hero: {
    eyebrow: 'Chemistry workspace',
    title: 'A clearer home for exploring chemistry online.',
    description:
      'Open the periodic table, balance equations, and build molecules in one place with a faster, calmer workflow for study, teaching, and product discovery.',
    primaryCta: 'Open periodic table',
    secondaryCta: 'Balance an equation',
    tertiaryCta: 'Try molecular editor',
    highlights: [
      'Localized experience',
      'Browser-based chemistry tools',
      'Built for clear exploration',
    ],
    previewTitle: 'Workspace preview',
    quickLinks: {
      search: 'Search',
      login: 'Login',
    },
  },
  spotlight: {
    eyebrow: 'Tools',
    title: 'What you can do here',
    items: [
      {
        title: 'Explore element data',
        description:
          'Search by name, symbol, phase, or category and open a cleaner element view with visuals, classifications, and core data.',
        href: '/search',
        cta: 'Explore elements',
      },
      {
        title: 'Balance chemical equations',
        description:
          'Check equations in the browser, compare the original form with the balanced result, and review extra analysis when it helps.',
        href: '/balance-equation',
        cta: 'Open balancer',
      },
      {
        title: 'Build and edit molecules',
        description:
          'Create molecular structures, inspect formulas, and keep working from your saved gallery when you want to continue later.',
        href: '/molecular-editor',
        cta: 'Open editor',
      },
    ],
  },
  audience: {
    eyebrow: 'Who it helps',
    title: 'Made for real chemistry workflows',
    description:
      'This home page is designed to help future customers understand the product quickly without digging through multiple tools first.',
    items: [
      {
        title: 'Students',
        description: 'Move from periodic table lookups to equation balancing and molecular structure practice without changing context.',
      },
      {
        title: 'Teachers',
        description: 'Use a cleaner surface to demonstrate element data, equation balancing, and molecule building in one browser session.',
      },
      {
        title: 'Product teams',
        description: 'Evaluate the chemistry UX, real product behavior, and the flow between tools before deeper integration discussions.',
      },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What can I do on Clean Periodic Table today?',
        answer:
          'You can explore elements, balance chemical equations locally in the browser, and build molecular structures with an interactive editor.',
      },
      {
        question: 'Do I need an account to use everything?',
        answer:
          'You can open the landing page and the equation balancer without signing in. Some synced flows, such as saved molecule workspaces, still depend on authentication.',
      },
      {
        question: 'Does equation balancing work in the browser?',
        answer:
          'Yes. The current architecture keeps balancing available directly in the browser, with optional remote enrichment added only when available.',
      },
      {
        question: 'Can I come back to molecules later?',
        answer:
          'Yes. Signed-in users can save molecules and continue editing them later from the gallery and editor flows.',
      },
    ],
  },
  finalCta: {
    title: 'Start with the workflow that fits you best',
    description:
      'If you are evaluating the product, the three best entry points are the periodic table, the equation balancer, and the molecular editor.',
    primary: 'Go to periodic table',
    secondary: 'Go to equation balancer',
  },
  footer: {
    note: 'Clean Periodic Table keeps chemistry tools in one calmer, more readable interface.',
  },
  examples: ['H2 + O2 -> H2O', 'N2O4 <-> 2 NO2', 'C6H6'],
} as const;
