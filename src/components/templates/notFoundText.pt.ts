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
  elements: [
    {
      number: '6',
      symbol: 'C',
      name: 'Carbono',
      label: 'Não metal',
      mass: '12,01',
      accent: 'cyan',
    },
    {
      number: '8',
      symbol: 'O',
      name: 'Oxigênio',
      label: 'Não metal',
      mass: '15,99',
      accent: 'violet',
    },
    {
      number: '79',
      symbol: 'Au',
      name: 'Ouro',
      label: 'Metal de transição',
      mass: '196,97',
      accent: 'amber',
    },
  ],
} as const;
