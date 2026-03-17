export const chemistryBalanceTextEn = {
  common: {
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown',
    notAvailable: 'N/A',
    balanced: 'Balanced',
    recent: 'Recent',
    unchanged: 'unchanged',
    warnings: {
      warning: 'Warning',
      info: 'Info',
    },
    reactionTypes: {
      'combustion-like': 'Combustion-like',
      synthesis: 'Synthesis',
      decomposition: 'Decomposition',
      exchange: 'Exchange',
      unknown: 'Unknown',
    },
  },
  locale: {
    label: 'Language',
    options: {
      'en-US': 'English',
      'pt-BR': 'Português',
    },
  },
  workspace: {
    eyebrow: 'Client-First Chemistry',
    title: 'Balance Equation',
    description:
      'This page uses the local chemistry pipeline only: equation parsing, reaction creation, matrix balancing, and deterministic formatting.',
    equationLabel: 'Equation',
    equationPlaceholder: 'H2 + O2 -> H2O',
    submit: 'Balance locally',
    clear: 'Clear',
    resultEyebrow: 'Result',
    resultTitle: 'Balanced Output',
    formattedLabel: 'Formatted',
    termsLabel: 'Terms',
    elementsLabel: 'Elements',
    vectorLabel: 'Vector',
    failurePrefix: 'The equation could not be balanced at the local',
    failureSuffix: 'stage.',
  },
  comparison: {
    eyebrow: 'Comparison',
    title: 'Input vs Balanced',
    unavailable:
      'This panel becomes available after the equation balances successfully.',
    originalLabel: 'Original',
    balancedLabel: 'Balanced',
    reactantLabel: 'reactant',
    productLabel: 'product',
  },
  analysis: {
    eyebrow: 'Heuristics',
    title: 'Reaction Analysis',
    noResult:
      'Heuristic analysis runs after the equation is parsed and balanced successfully.',
    typeLabel: 'Type',
    scoreLabel: 'Score',
    plausibilityLabel: 'Plausibility',
    plausible: 'Likely plausible',
    needsReview: 'Needs review',
    noNotices: 'No heuristic notices were raised for this balanced reaction.',
    metadata: {
      loading: 'Loading Element DB metadata to enrich heuristics.',
      ready: 'Heuristics are enriched with Element DB metadata.',
      unavailable: 'Element DB metadata is unavailable right now. Using local heuristics only.',
      inactive: 'Local heuristics are active. Login enables Element DB enrichment when available.',
    },
  },
  engine: {
    eyebrow: 'Optional Engine',
    title: 'Remote Enrichment',
    description:
      'Local balance and heuristics stay primary. This optional step asks the backend Chemical Engine for extra validation when enabled.',
    toggleLabel: 'Remote',
    retry: 'Retry remote check',
    off:
      'Remote enrichment is currently off. The page is using client-only chemistry.',
    idle:
      'Remote enrichment will run the next time a balanced equation is submitted.',
    loadingPrefix: 'Asking the optional Chemical Engine to enrich',
    failedTitle: 'Remote enrichment did not complete.',
    classificationLabel: 'Classification',
    scoreLabel: 'Score',
    validLabel: 'Valid',
    noNotices:
      'The optional Chemical Engine returned no additional notices for this equation.',
  },
  analysisComparison: {
    eyebrow: 'Comparison',
    title: 'Local vs Remote',
    unavailable:
      'This comparison becomes available when the local analysis succeeds and remote enrichment returns a result.',
    description:
      'This panel helps us compare the client-first heuristic reading with the optional Chemical Engine enrichment.',
    localLabel: 'Local',
    remoteLabel: 'Remote',
    plausibleLabel: 'Plausible',
    classificationLabel: 'Classification',
    confidenceAlignmentLabel: 'Confidence Alignment',
    aligned: 'Aligned',
    partial: 'Partial',
    different: 'Different',
    deltaPrefix: 'Delta:',
    remoteValidPrefix: 'Valid:',
    confidenceSentencePrefix: 'Local plausibility is',
    confidenceSentenceMiddle: 'while the remote engine validity is',
    positive: 'positive',
    cautious: 'cautious',
  },
  history: {
    eyebrow: 'History',
    title: 'Recent Equations',
    clear: 'Clear history',
    empty:
      'Recent equations will appear here after you balance them locally.',
    localFailureSummary: 'The equation could not be balanced locally.',
    locale: 'en-US',
  },
  examples: {
    eyebrow: 'Guided Examples',
    title: 'Try a Category',
    description:
      'These examples are grouped by common reaction patterns so we can inspect the local solver and heuristics from different angles.',
    use: 'Use',
    categories: {
      combustion: 'Combustion',
      synthesis: 'Synthesis',
      decomposition: 'Decomposition',
      ionic: 'Ionic',
    },
    items: {
      methaneCombustion: {
        title: 'Methane combustion',
        description: 'A hydrocarbon burns in oxygen to form carbon dioxide and water.',
      },
      waterFormation: {
        title: 'Water formation',
        description: 'Two simple reactants combine into a single product family.',
      },
      ironOxideFormation: {
        title: 'Iron oxide formation',
        description: 'Metal oxidation is a good example of coefficient growth during balancing.',
      },
      calciumCarbonateBreakdown: {
        title: 'Calcium carbonate breakdown',
        description: 'A single reactant decomposes into two simpler products.',
      },
      sodiumChlorideFormation: {
        title: 'Sodium chloride formation',
        description: 'A small ionic example that also exercises explicit charge handling.',
      },
    },
  },
  pipeline: {
    eyebrow: 'Pipeline',
    title: 'Local Stages',
    steps: [
      {
        title: '1. Equation parse',
        description:
          'separates arrow, terms, coefficients, phases, and structural notation.',
      },
      {
        title: '2. Reaction creation',
        description: 'converts terms into structured participants with parsed formulas.',
      },
      {
        title: '3. Matrix balancing',
        description:
          'builds the stoichiometric matrix, solves the null-space, and normalizes coefficients.',
      },
      {
        title: '4. Heuristic analysis',
        description:
          'applies lightweight local rules and optionally enriches them with Element DB metadata.',
      },
      {
        title: '5. Deterministic formatting',
        description: 'returns a stable text result for display.',
      },
    ],
  },
} as const;
