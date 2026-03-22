export const adminWorkspaceTextPt = {
  title: 'Painel de controle ADMIN.',
  description:
    'Revise previews internos e concentre ações exclusivas de admin sem expor áreas inacabadas para usuários comuns.',
  badge: 'Somente ADMIN',
  session: {
    title: 'Sessão administrativa atual',
    description: 'Esta página só renderiza depois de uma checagem server-side de admin.',
    name: 'Nome',
    email: 'E-mail',
    role: 'Função',
  },
  preview: {
    title: 'Previews internos',
    description:
      'Quando uma feature estiver em estágio interno, admins podem abri-la por aqui enquanto visitantes sem ADMIN recebem 404.',
    featureStateLabel: 'Estágio da feature Article',
    states: {
      off: 'Desligada',
      internal: 'Preview interno',
      public: 'Pública',
    },
    unavailable: 'O Article System está desligado neste ambiente.',
    openFeed: 'Abrir feed de artigos',
    openWorkspace: 'Abrir workspace de artigos',
    createDraft: 'Abrir editor de artigos',
  },
  management: {
    title: 'Gerenciamento de usuários',
    description:
      'Este painel já está pronto para futuras operações administrativas, como mudança de papéis, moderação e fluxos restritos de manutenção.',
    placeholder:
      'A fundação da interface já existe, mas as ações reais de alteração de usuários ainda dependem de endpoints administrativos no backend.',
  },
  security: {
    title: 'Política de acesso',
    description:
      'Rotas marcadas como internas agora exigem sessão ADMIN no servidor. Todo o resto recebe a página 404 compartilhada.',
  },
} as const;
