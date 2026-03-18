export const homeLandingTextEn = {
  hero: {
    eyebrow: 'A new way to present chemistry',
    title: 'A chemistry experience designed to stand out without feeling crowded.',
    description:
      'More presence, less noise, and a better way to turn curiosity into action on the very first visit.',
    primaryCta: 'View periodic table',
    secondaryCta: 'Balance an equation',
    tertiaryCta: 'Open molecular editor',
    highlights: [
      'Stronger first impression',
      'Easy to navigate',
      'English and Portuguese',
    ],
    showcaseTitle: 'Elements already alive inside the homepage',
    showcaseDescription:
      'Tap, explore, and watch the page move before leaving the first scene.',
    showcaseHint: 'Tap an element to open a quick summary.',
    showcaseRotationHint: 'The selection changes on its own over time.',
    showcaseEmptyHint: 'Pick one of the elements beside it and a quick summary will appear here.',
    showcaseOpenTableCta: 'Open full table',
  },
  features: {
    title: 'Three main paths, without overexplaining the page.',
    description:
      'The homepage shows the essentials and lets the experience itself do the convincing.',
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
    title: 'Good for presenting, easy to follow, ready to continue.',
    description:
      'Without turning into a wall of features, the homepage helps show value quickly and supports a cleaner walkthrough.',
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
    title: 'What most visitors want to know first.',
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
    title: 'When the entrance feels right, the next click almost happens on its own.',
    description:
      'The goal here is to open the right door, not compete for attention with a heavy landing page.',
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
