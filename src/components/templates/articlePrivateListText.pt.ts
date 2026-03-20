export const articlePrivateListTextPt = {
  title: 'Seu workspace de artigos.',
  description:
    'Revise seus rascunhos, posts privados e textos publicados sem expor esta rota publicamente.',
  internalBadge: 'Preview Interno',
  createDraft: 'Novo rascunho',
  stats: {
    loadedCountLabel: 'artigos carregados',
  },
  states: {
    loading: 'Carregando seus artigos...',
    unavailable: 'O workspace de artigos não está disponível agora.',
    loadFailed: 'Não foi possível carregar seus artigos agora.',
    loadFailedNetwork: 'Não foi possível carregar seus artigos. Verifique sua conexão e tente de novo.',
    empty: 'Você ainda não tem artigos salvos.',
    signInRequired: 'Entre para abrir seu workspace privado de artigos.',
    loadingMore: 'Carregando mais artigos...',
    loadMore: 'Carregar mais',
    retry: 'Tentar novamente',
    createFirstDraft: 'Começar seu primeiro rascunho',
  },
  cards: {
    untitled: 'Artigo sem título',
    noExcerpt: 'Ainda não há resumo disponível.',
    publicVisibility: 'Público',
    privateVisibility: 'Privado',
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Arquivado',
    bylineFallback: 'Autor desconhecido',
    openPublicArticle: 'Abrir página pública',
    noPublicPage: 'Somente privado',
  },
} as const;
