export const homeLandingTextPt = {
  hero: {
    eyebrow: 'Uma nova forma de apresentar química',
    title: 'Uma experiência de química feita para chamar atenção sem cansar.',
    description:
      'Mais presença, menos ruído e um jeito melhor de transformar curiosidade em clique já na primeira visita.',
    primaryCta: 'Ver tabela periódica',
    secondaryCta: 'Balancear equação',
    tertiaryCta: 'Abrir editor molecular',
    highlights: [
      'Visual marcante',
      'Navegação imediata',
      'Em português e inglês',
    ],
    showcaseTitle: 'Elementos que vivem na própria home',
    showcaseDescription:
      'Toque, descubra e veja a página ganhar movimento sem sair do primeiro bloco.',
    showcaseHint: 'Toque em um elemento para abrir um resumo rápido.',
    showcaseRotationHint: 'A seleção muda sozinha com o tempo.',
    showcaseEmptyHint: 'Escolha um dos elementos ao lado e veja um resumo aparecer aqui.',
    showcaseOpenTableCta: 'Abrir tabela completa',
  },
  features: {
    title: 'Três caminhos principais, sem excesso de explicação.',
    description:
      'A home mostra o essencial e deixa o resto para a própria experiência provar.',
    items: [
      {
        title: 'Tabela periódica',
        description: 'Descubra elementos com uma leitura mais agradável, visual forte e navegação simples.',
        href: '/periodic-table',
        cta: 'Explorar',
      },
      {
        title: 'Equações químicas',
        description: 'Mostre resultados rapidamente com uma experiência mais direta e fácil de acompanhar.',
        href: '/balance-equation',
        cta: 'Testar',
      },
      {
        title: 'Editor molecular',
        description: 'Abra uma área interativa que transforma curiosidade em experimentação imediata.',
        href: '/molecular-editor',
        cta: 'Experimentar',
      },
    ],
  },
  positioning: {
    title: 'Boa para apresentar, fácil de percorrer e pronta para continuar.',
    description:
      'Sem virar mural de features, a home ajuda a mostrar valor rápido e sustenta uma demonstração mais elegante.',
    items: [
      {
        title: 'Primeira impressão',
        description: 'Quando a entrada é boa, a confiança aparece antes mesmo do segundo clique.',
      },
      {
        title: 'Navegação natural',
        description: 'A pessoa entende rápido onde tocar, o que ver e para onde seguir depois.',
      },
      {
        title: 'Próximo passo claro',
        description: 'Depois da curiosidade inicial, os caminhos principais já estão na mão e sem fricção.',
      },
    ],
  },
  faq: {
    title: 'O básico que quase todo visitante quer saber.',
    items: [
      {
        question: 'Dá para usar direto no navegador?',
        answer: 'Sim. A experiência principal já começa ali mesmo, sem exigir instalação para mostrar valor.',
      },
      {
        question: 'Preciso criar conta para começar?',
        answer: 'Não para conhecer a experiência. A conta entra melhor quando a pessoa decide continuar e salvar o que fez.',
      },
      {
        question: 'A plataforma serve só para estudo?',
        answer: 'Não. Ela também funciona bem como demonstração, vitrine de experiência e ponto de partida para uma conversa comercial.',
      },
    ],
  },
  finalCta: {
    title: 'Quando a entrada é boa, o próximo clique acontece quase sozinho.',
    description:
      'A ideia aqui é abrir a porta certa, não disputar atenção com uma página pesada.',
    primary: 'Começar pela tabela',
    secondary: 'Abrir equações',
  },
  footer: {
    note: 'Uma entrada mais leve, mais elegante e mais preparada para transformar visita em interesse.',
  },
  examples: [
    { label: 'Elementos', formula: 'Na · Fe · Cl' },
    { label: 'Equações', formula: 'H2 + O2 -> H2O' },
    { label: 'Moléculas', formula: 'C6H6' },
  ],
} as const;
