export const articleDetailTextPt = {
  eyebrow: 'Detalhe do Artigo',
  backToFeed: 'Voltar para artigos',
  internalBadge: 'Preview Interno',
  actions: {
    saveArticle: 'Salvar artigo',
    savingArticle: 'Salvando artigo...',
    savedArticle: 'Salvo',
    copyLink: 'Copiar link',
    copyingLink: 'Copiando link...',
    copiedLink: 'Link copiado',
  },
  notices: {
    saveRequiresLogin: 'Entre para salvar este artigo.',
    saveSucceeded: 'Artigo salvo com sucesso.',
    saveFailed: 'Não foi possível salvar este artigo agora.',
    saveFailedNetwork: 'Não foi possível salvar este artigo. Verifique sua conexão e tente de novo.',
    copyLinkFailed: 'Não foi possível copiar o link deste artigo agora.',
    unavailable: 'A experiência de detalhe do artigo não está disponível agora.',
  },
  unavailableTitle: 'Este artigo não está disponível agora.',
  unavailableDescription:
    'A rota de detalhe já está pronta, mas o frontend não conseguiu carregar o artigo solicitado na article API.',
  authorFallback: 'Autor desconhecido',
  status: {
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Arquivado',
  },
  meta: {
    updatedLabel: 'Atualizado',
    publishedLabel: 'Publicado',
    slugLabel: 'Slug',
    hashtagsLabel: 'Tópicos',
    browseHashtag: 'Explorar hashtag',
    noHashtags: 'Sem hashtags',
  },
} as const;
