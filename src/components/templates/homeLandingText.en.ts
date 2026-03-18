export const homeLandingTextEn = {
  hero: {
    eyebrow: 'A new way to present chemistry',
    title: 'A chemistry experience built to catch attention fast.',
    description:
      'Strong visuals, easy reading, and clear paths that turn curiosity into the urge to keep exploring.',
    primaryCta: 'View periodic table',
    secondaryCta: 'Balance an equation',
    tertiaryCta: 'Open molecular editor',
    highlights: [
      'Stronger first impression',
      'Easy to navigate',
      'English and Portuguese',
    ],
    showcaseTitle: 'Everything feels part of the same experience',
    showcaseDescription:
      'Elements, equations, and molecules feel connected from the first glance instead of looking like separate screens.',
  },
  features: {
    title: 'Visitors understand where to start right away.',
    description:
      'The homepage points to the main experiences without feeling crowded or weighed down by internal language.',
    items: [
      {
        title: 'Periodic table',
        description: 'Present elements through a friendlier reading experience, stronger visuals, and simpler navigation.',
        href: '/periodic-table',
        cta: 'Explore',
      },
      {
        title: 'Chemical equations',
        description: 'Show results quickly through a cleaner experience that is easier to follow from the first click.',
        href: '/balance-equation',
        cta: 'Try it',
      },
      {
        title: 'Molecular editor',
        description: 'Open an interactive space that turns curiosity into hands-on exploration right away.',
        href: '/molecular-editor',
        cta: 'Experiment',
      },
    ],
  },
  positioning: {
    title: 'Made to look strong in a demo and feel easy in real use.',
    description:
      'The goal here is to open the conversation, support a strong walkthrough, and make people want to continue.',
    items: [
      {
        title: 'First impression',
        description: 'When the entrance feels polished, trust starts showing up before the second click.',
      },
      {
        title: 'Natural navigation',
        description: 'People quickly understand where to click, what they will see, and what comes next.',
      },
      {
        title: 'Clear next step',
        description: 'After the first spark of curiosity, the main paths are already in front of them.',
      },
    ],
  },
  faq: {
    title: 'Questions people usually ask at the beginning.',
    items: [
      {
        question: 'Does it work directly in the browser?',
        answer: 'Yes. The main experience starts right there in the browser, with no installation needed to show value.',
      },
      {
        question: 'Do I need an account to begin?',
        answer: 'Not to discover the experience. An account makes more sense once the visitor decides to continue and save progress.',
      },
      {
        question: 'Is this only for studying?',
        answer: 'No. It also works well as a demo, an experience showcase, and a starting point for commercial conversations.',
      },
    ],
  },
  finalCta: {
    title: 'The first visit should make people want to stay.',
    description:
      'If the entry feels right, visitors will find the next step on their own and the experience can take over.',
    primary: 'Start with the table',
    secondary: 'Open equations',
  },
  footer: {
    note: 'A cleaner, more memorable entry point for people who are still discovering what this experience can become.',
  },
  examples: [
    { label: 'Elements', formula: 'Na · Fe · Cl' },
    { label: 'Equations', formula: 'H2 + O2 -> H2O' },
    { label: 'Molecules', formula: 'C6H6' },
  ],
} as const;
