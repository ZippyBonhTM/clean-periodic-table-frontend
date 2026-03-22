export const appHeaderTextPt = {
  brand: {
    eyebrow: 'Clean Periodic Table',
    title: 'Explorador Químico',
  },
  theme: {
    switchToLight: 'Trocar para o tema claro',
    switchToDark: 'Trocar para o tema escuro',
  },
  localeSwitcher: {
    ariaLabel: 'Alternar idioma',
    options: {
      'en-US': {
        shortLabel: 'EN',
        label: 'English',
      },
      'pt-BR': {
        shortLabel: 'PT',
        label: 'Português',
      },
    },
  },
  navigation: {
    openMenu: 'Abrir menu de rotas',
    closeMenu: 'Fechar',
    closeMenuBackdrop: 'Fechar fundo do menu de rotas',
    dialogLabel: 'Menu de rotas',
    menuTitle: 'Rotas',
    links: {
      periodicTable: 'Tabela Periódica',
      balanceEquation: 'Balancear Equação',
      molecularEditor: 'Editor Molecular',
      moleculeGallery: 'Galeria de Moléculas',
    },
  },
  auth: {
    login: 'Entrar',
    register: 'Cadastrar',
  },
  userMenu: {
    open: 'Abrir menu do usuário',
    close: 'Fechar',
    closeBackdrop: 'Fechar fundo do menu do usuário',
    dialogLabel: 'Menu do usuário',
    dragHandle: 'Arraste ou toque na borda para fechar o menu do usuário',
    subtitle: 'Menu do usuário',
    confirmLogout: 'Confirmar saída?',
    cancel: 'Cancelar',
    logout: 'Sair',
    adminPanel: 'Painel ADMIN',
    guest: 'Visitante',
    userFallback: 'Usuário',
    profileLoadErrorFallback: 'Não foi possível carregar o perfil agora.',
  },
  profile: {
    title: 'Perfil',
    notAuthenticated: 'Não autenticado.',
    loading: 'Carregando perfil...',
    unavailable: 'Perfil indisponível.',
    name: 'Nome',
    email: 'E-mail',
    role: 'Função no auth',
    id: 'ID',
  },
} as const;
