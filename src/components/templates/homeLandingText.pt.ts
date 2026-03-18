export const homeLandingTextPt = {
  hero: {
    eyebrow: 'Plataforma de química',
    title: 'Uma home mais clara para explorar química online.',
    description:
      'Abra a tabela periódica, balanceie equações e monte moléculas em um só lugar, com um fluxo mais leve para estudo, ensino e descoberta do produto.',
    primaryCta: 'Abrir tabela periódica',
    secondaryCta: 'Balancear equação',
    tertiaryCta: 'Testar editor molecular',
    highlights: [
      'Experiência localizada',
      'Ferramentas no navegador',
      'Exploração mais clara',
    ],
    previewTitle: 'Prévia da plataforma',
    quickLinks: {
      search: 'Pesquisar',
      login: 'Entrar',
    },
  },
  spotlight: {
    eyebrow: 'Ferramentas',
    title: 'O que você pode fazer aqui',
    items: [
      {
        title: 'Explorar dados dos elementos',
        description:
          'Pesquise por nome, símbolo, fase ou categoria e abra uma visualização mais limpa do elemento com imagens, classificações e dados centrais.',
        href: '/search',
        cta: 'Explorar elementos',
      },
      {
        title: 'Balancear equações químicas',
        description:
          'Verifique equações no navegador, compare a forma original com o resultado balanceado e veja análises extras quando fizer sentido.',
        href: '/balance-equation',
        cta: 'Abrir balanceador',
      },
      {
        title: 'Montar e editar moléculas',
        description:
          'Crie estruturas moleculares, confira fórmulas e continue depois a partir da galeria quando quiser retomar o trabalho.',
        href: '/molecular-editor',
        cta: 'Abrir editor',
      },
    ],
  },
  audience: {
    eyebrow: 'Para quem serve',
    title: 'Feito para fluxos reais de química',
    description:
      'Esta home foi pensada para ajudar futuros clientes a entender o produto rápido, sem precisar abrir várias ferramentas antes.',
    items: [
      {
        title: 'Estudantes',
        description: 'Passe da consulta da tabela periódica para o balanceamento e a prática estrutural sem perder contexto.',
      },
      {
        title: 'Professores',
        description: 'Use uma superfície mais clara para demonstrar elementos, equações e construção molecular na mesma sessão.',
      },
      {
        title: 'Times de produto',
        description: 'Avalie a experiência química, o comportamento real do produto e o fluxo entre ferramentas antes de discutir integração.',
      },
    ],
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Perguntas frequentes',
    items: [
      {
        question: 'O que já dá para fazer no Clean Periodic Table?',
        answer:
          'Hoje já é possível explorar elementos, balancear equações químicas localmente no navegador e montar estruturas moleculares com um editor interativo.',
      },
      {
        question: 'Preciso de conta para usar tudo?',
        answer:
          'Você pode abrir a home e o balanceador de equações sem entrar. Alguns fluxos sincronizados, como salvar moléculas, ainda dependem de autenticação.',
      },
      {
        question: 'O balanceamento funciona no navegador?',
        answer:
          'Sim. A arquitetura atual mantém o balanceamento disponível direto no navegador, com enriquecimento remoto opcional apenas quando estiver disponível.',
      },
      {
        question: 'Consigo voltar para minhas moléculas depois?',
        answer:
          'Sim. Usuários autenticados podem salvar moléculas e continuar a edição mais tarde pela galeria e pelo editor.',
      },
    ],
  },
  finalCta: {
    title: 'Comece pelo fluxo que faz mais sentido para você',
    description:
      'Se você está avaliando o produto, os três melhores pontos de entrada são a tabela periódica, o balanceador e o editor molecular.',
    primary: 'Ir para a tabela periódica',
    secondary: 'Ir para o balanceador',
  },
  footer: {
    note: 'Clean Periodic Table reúne ferramentas de química em uma interface mais calma e mais legível.',
  },
  examples: ['H2 + O2 -> H2O', 'N2O4 <-> 2 NO2', 'C6H6'],
} as const;
