export const notFoundTextPt = {
  brand: 'Clean Periodic Table',
  eyebrow: '404',
  title: 'Essa página saiu do caminho.',
  description:
    'O endereço que você abriu não está mais aqui. Volte para a home ou siga direto para a tabela periódica.',
  stageHint: 'Ainda tem muito para descobrir.',
  actions: {
    home: 'Voltar para a home',
    periodicTable: 'Abrir tabela periódica',
  },
  meter: {
    label: 'RAD',
    status: 'BIP',
    level: 'ALTO',
  },
  elements: [
    {
      number: '16',
      symbol: 'S',
      name: 'Enxofre',
      label: 'Cristal amarelo',
      mass: '32,06',
      accent: 'amber',
      imageAlt: 'Cristais amarelos de enxofre.',
    },
    {
      number: '92',
      symbol: 'U',
      name: 'Urânio',
      label: 'Metal pesado',
      mass: '238,03',
      accent: 'cyan',
      imageAlt: 'Peça metálica de urânio.',
    },
    {
      number: '79',
      symbol: 'Au',
      name: 'Ouro',
      label: 'Brilho metálico',
      mass: '196,97',
      accent: 'amber',
      imageAlt: 'Folha metálica de ouro puro.',
    },
  ],
} as const;
