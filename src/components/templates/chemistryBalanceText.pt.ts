export const chemistryBalanceTextPt = {
  common: {
    yes: 'Sim',
    no: 'Não',
    unknown: 'Desconhecido',
    notAvailable: 'N/D',
    balanced: 'Balanceada',
    recent: 'Recente',
    unchanged: 'sem mudança',
    warnings: {
      warning: 'Aviso',
      info: 'Informação',
    },
    reactionTypes: {
      'combustion-like': 'Semelhante à combustão',
      synthesis: 'Síntese',
      decomposition: 'Decomposição',
      exchange: 'Troca',
      unknown: 'Desconhecido',
    },
  },
  locale: {
    label: 'Idioma',
    options: {
      'en-US': 'English',
      'pt-BR': 'Português',
    },
  },
  workspace: {
    eyebrow: 'Química Client-First',
    title: 'Balancear Equação',
    description:
      'Esta página usa apenas o pipeline químico local: parsing da equação, criação da reação, balanceamento matricial e formatação determinística.',
    equationLabel: 'Equação',
    equationPlaceholder: 'H2 + O2 -> H2O',
    submit: 'Balancear localmente',
    clear: 'Limpar',
    resultEyebrow: 'Resultado',
    resultTitle: 'Saída Balanceada',
    formattedLabel: 'Formatada',
    termsLabel: 'Termos',
    elementsLabel: 'Elementos',
    vectorLabel: 'Vetor',
    failurePrefix: 'A equação não pôde ser balanceada na etapa local de',
    failureSuffix: '.',
  },
  comparison: {
    eyebrow: 'Comparação',
    title: 'Entrada vs Balanceada',
    unavailable:
      'Este painel fica disponível depois que a equação é balanceada com sucesso.',
    originalLabel: 'Original',
    balancedLabel: 'Balanceada',
    reactantLabel: 'reagente',
    productLabel: 'produto',
  },
  analysis: {
    eyebrow: 'Heurísticas',
    title: 'Análise da Reação',
    noResult:
      'A análise heurística roda depois que a equação é parseada e balanceada com sucesso.',
    typeLabel: 'Tipo',
    scoreLabel: 'Pontuação',
    plausibilityLabel: 'Plausibilidade',
    plausible: 'Provavelmente plausível',
    needsReview: 'Precisa de revisão',
    noNotices: 'Nenhum aviso heurístico foi gerado para esta reação balanceada.',
    metadata: {
      loading: 'Carregando metadados do banco de elementos para enriquecer as heurísticas.',
      ready: 'As heurísticas estão enriquecidas com metadados do banco de elementos.',
      unavailable: 'Os metadados do banco de elementos estão indisponíveis agora. Usando apenas heurísticas locais.',
      inactive: 'As heurísticas locais estão ativas. O login habilita o enriquecimento com Element DB quando disponível.',
    },
  },
  engine: {
    eyebrow: 'Engine Opcional',
    title: 'Enriquecimento Remoto',
    description:
      'O balanceamento e as heurísticas locais continuam sendo a base. Esta etapa opcional consulta a Chemical Engine do backend para validação extra quando habilitada.',
    toggleLabel: 'Remota',
    retry: 'Tentar análise remota novamente',
    off:
      'O enriquecimento remoto está desativado no momento. A página está usando apenas a química local.',
    idle:
      'O enriquecimento remoto vai rodar na próxima vez que uma equação balanceada for enviada.',
    loadingPrefix: 'Consultando a Chemical Engine opcional para enriquecer',
    failedTitle: 'O enriquecimento remoto não foi concluído.',
    classificationLabel: 'Classificação',
    scoreLabel: 'Pontuação',
    validLabel: 'Válida',
    noNotices:
      'A Chemical Engine opcional não retornou avisos adicionais para esta equação.',
  },
  analysisComparison: {
    eyebrow: 'Comparação',
    title: 'Local vs Remoto',
    unavailable:
      'Esta comparação fica disponível quando a análise local tem sucesso e o enriquecimento remoto retorna um resultado.',
    description:
      'Este painel nos ajuda a comparar a leitura heurística client-first com o enriquecimento opcional da Chemical Engine.',
    localLabel: 'Local',
    remoteLabel: 'Remoto',
    plausibleLabel: 'Plausível',
    classificationLabel: 'Classificação',
    confidenceAlignmentLabel: 'Alinhamento de Confiança',
    aligned: 'Alinhado',
    partial: 'Parcial',
    different: 'Diferente',
    deltaPrefix: 'Diferença:',
    remoteValidPrefix: 'Válida:',
    confidenceSentencePrefix: 'A plausibilidade local é',
    confidenceSentenceMiddle: 'enquanto a validade da engine remota é',
    positive: 'positiva',
    cautious: 'cautelosa',
  },
  history: {
    eyebrow: 'Histórico',
    title: 'Equações Recentes',
    clear: 'Limpar histórico',
    empty:
      'As equações recentes vão aparecer aqui depois que você as balancear localmente.',
    localFailureSummary: 'A equação não pôde ser balanceada localmente.',
    locale: 'pt-BR',
  },
  examples: {
    eyebrow: 'Exemplos Guiados',
    title: 'Testar por Categoria',
    description:
      'Esses exemplos são agrupados por padrões comuns de reação para que possamos inspecionar o solver local e as heurísticas por ângulos diferentes.',
    use: 'Usar',
    categories: {
      combustion: 'Combustão',
      synthesis: 'Síntese',
      decomposition: 'Decomposição',
      ionic: 'Iônica',
    },
    items: {
      methaneCombustion: {
        title: 'Combustão do metano',
        description: 'Um hidrocarboneto reage com oxigênio para formar dióxido de carbono e água.',
      },
      waterFormation: {
        title: 'Formação da água',
        description: 'Dois reagentes simples se combinam para formar uma única família de produto.',
      },
      ironOxideFormation: {
        title: 'Formação do óxido de ferro',
        description: 'A oxidação de metais é um bom exemplo de crescimento de coeficientes durante o balanceamento.',
      },
      calciumCarbonateBreakdown: {
        title: 'Decomposição do carbonato de cálcio',
        description: 'Um único reagente se decompõe em dois produtos mais simples.',
      },
      sodiumChlorideFormation: {
        title: 'Formação do cloreto de sódio',
        description: 'Um pequeno exemplo iônico que também exercita o tratamento de cargas explícitas.',
      },
    },
  },
  pipeline: {
    eyebrow: 'Pipeline',
    title: 'Etapas Locais',
    steps: [
      {
        title: '1. Parsing da equação',
        description:
          'separa seta, termos, coeficientes, fases e notação estrutural.',
      },
      {
        title: '2. Criação da reação',
        description: 'converte os termos em participantes estruturados com fórmulas parseadas.',
      },
      {
        title: '3. Balanceamento matricial',
        description:
          'monta a matriz estequiométrica, resolve o espaço nulo e normaliza os coeficientes.',
      },
      {
        title: '4. Análise heurística',
        description:
          'aplica regras locais leves e opcionalmente enriquece com metadados do banco de elementos.',
      },
      {
        title: '5. Formatação determinística',
        description: 'retorna um resultado textual estável para exibição.',
      },
    ],
  },
} as const;
