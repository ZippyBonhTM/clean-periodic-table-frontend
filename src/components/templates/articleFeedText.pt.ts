export const articleFeedTextPt = {
  eyebrow: 'Article System',
  title: 'A escrita pública de química começa aqui.',
  description:
    'Um feed somente leitura para notas, explicações e experimentos de química, preparado para evoluir até o Article System completo.',
  internalBadge: 'Preview Interno',
  stats: {
    loadedCountLabel: 'artigos carregados',
    availabilityAvailable: 'Feed público disponível',
    availabilityUnavailable: 'Feed aguardando conexão com o backend',
  },
  states: {
    unavailable: 'O feed público de artigos ainda não está disponível neste ambiente.',
    empty: 'Nenhum artigo público foi publicado ainda.',
    loadMore: 'Carregar mais',
    loadingMore: 'Carregando mais artigos...',
    loadMoreFailed: 'Não foi possível carregar mais artigos agora.',
    retry: 'Tentar novamente',
  },
  cards: {
    untitled: 'Artigo sem título',
    noExcerpt: 'Ainda não há resumo disponível.',
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Arquivado',
    bylineFallback: 'Autor desconhecido',
    hashtagFallback: 'Sem hashtags',
    scoreLabel: 'Score',
    openArticle: 'Abrir artigo',
  },
} as const;
