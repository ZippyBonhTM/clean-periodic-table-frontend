export const notFoundTextEn = {
  brand: 'Clean Periodic Table',
  eyebrow: '404',
  title: 'This page slipped out of view.',
  description:
    'The address you opened is no longer here. Head back home or jump straight into the periodic table.',
  stageHint: 'There is still plenty to discover.',
  actions: {
    home: 'Back to home',
    periodicTable: 'Open periodic table',
  },
  meter: {
    label: 'RAD',
    status: 'BEEP',
    level: 'HIGH',
  },
  elements: [
    {
      number: '16',
      symbol: 'S',
      name: 'Sulfur',
      label: 'Yellow crystal',
      mass: '32.06',
      accent: 'amber',
      imageAlt: 'Yellow sulfur crystals.',
    },
    {
      number: '92',
      symbol: 'U',
      name: 'Uranium',
      label: 'Heavy metal',
      mass: '238.03',
      accent: 'cyan',
      imageAlt: 'A metallic uranium sample.',
    },
    {
      number: '79',
      symbol: 'Au',
      name: 'Gold',
      label: 'Metallic shine',
      mass: '196.97',
      accent: 'amber',
      imageAlt: 'A pure metallic gold sheet.',
    },
  ],
} as const;
