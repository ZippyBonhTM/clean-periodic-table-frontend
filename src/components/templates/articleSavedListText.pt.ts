export const articleSavedListTextPt = {
  title: 'Seus artigos salvos.',
  description:
    'Revisite os artigos públicos que você salvou sem expor esta rota publicamente.',
  internalBadge: 'Preview Interno',
  yourArticles: 'Seus artigos',
  browseFeed: 'Explorar feed',
  stats: {
    loadedCountLabel: 'artigos salvos carregados',
  },
  states: {
    loading: 'Carregando seus artigos salvos...',
    unavailable: 'A biblioteca de artigos salvos não está disponível agora.',
    loadFailed: 'Não foi possível carregar seus artigos salvos agora.',
    loadFailedNetwork:
      'Não foi possível carregar seus artigos salvos. Verifique sua conexão e tente de novo.',
    empty: 'Você ainda não salvou nenhum artigo.',
    signInRequired: 'Entre para abrir sua biblioteca de artigos salvos.',
    loadingMore: 'Carregando mais artigos salvos...',
    loadMore: 'Carregar mais',
    retry: 'Tentar novamente',
    discoverArticles: 'Descobrir artigos',
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
    publishedAtPrefix: 'Publicado',
    updatedAtPrefix: 'Atualizado',
    openArticle: 'Abrir artigo',
    unavailableArticle: 'Indisponível agora',
  },
} as const;
