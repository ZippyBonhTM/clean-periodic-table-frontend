import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { ChemicalElement } from '@/shared/types/element';

export type HomeHeroElement = ChemicalElement & {
  teaser: Record<AppLocale, string>;
};

type HomeHeroElementInput = {
  number: number;
  name: string;
  symbol: string;
  atomicMass: number;
  category: string;
  phase: string;
  group: number;
  period: number;
  block: string;
  teaser: Record<AppLocale, string>;
};

function createHomeHeroElement(input: HomeHeroElementInput): HomeHeroElement {
  return {
    appearance: null,
    atomic_mass: input.atomicMass,
    block: input.block,
    bohr_model_3d: null,
    bohr_model_image: null,
    boil: null,
    category: input.category,
    'cpk-hex': null,
    density: null,
    discovered_by: null,
    electron_affinity: null,
    electron_configuration: '',
    electron_configuration_semantic: '',
    electronegativity_pauling: null,
    group: input.group,
    image: {
      title: '',
      url: '',
      attribution: '',
    },
    ionization_energies: [],
    melt: null,
    molar_heat: null,
    name: input.name,
    named_by: null,
    number: input.number,
    period: input.period,
    phase: input.phase,
    shells: [],
    source: '',
    spectral_img: null,
    summary: '',
    symbol: input.symbol,
    wxpos: 0,
    wypos: 0,
    xpos: 0,
    ypos: 0,
    teaser: input.teaser,
  };
}

export const HOME_HERO_ELEMENTS: HomeHeroElement[] = [
  createHomeHeroElement({
    number: 1,
    name: 'Hydrogen',
    symbol: 'H',
    atomicMass: 1.008,
    category: 'diatomic nonmetal',
    phase: 'Gas',
    group: 1,
    period: 1,
    block: 's',
    teaser: {
      'pt-BR': 'Pequeno, leve e sempre lembrado. Um bom jeito de começar uma conversa sobre química.',
      'en-US': 'Small, light, and always memorable. A strong way to begin a chemistry conversation.',
    },
  }),
  createHomeHeroElement({
    number: 6,
    name: 'Carbon',
    symbol: 'C',
    atomicMass: 12.011,
    category: 'polyatomic nonmetal',
    phase: 'Solid',
    group: 14,
    period: 2,
    block: 'p',
    teaser: {
      'pt-BR': 'Versátil e familiar, aparece em muitos caminhos da química e deixa a cena mais reconhecível.',
      'en-US': 'Versatile and familiar, it shows up in many chemistry paths and makes the scene instantly recognizable.',
    },
  }),
  createHomeHeroElement({
    number: 8,
    name: 'Oxygen',
    symbol: 'O',
    atomicMass: 15.999,
    category: 'diatomic nonmetal',
    phase: 'Gas',
    group: 16,
    period: 2,
    block: 'p',
    teaser: {
      'pt-BR': 'Um símbolo simples, forte e conhecido até por quem ainda está chegando agora.',
      'en-US': 'A simple, strong symbol that even first-time visitors already recognize.',
    },
  }),
  createHomeHeroElement({
    number: 10,
    name: 'Neon',
    symbol: 'Ne',
    atomicMass: 20.18,
    category: 'noble gas',
    phase: 'Gas',
    group: 18,
    period: 2,
    block: 'p',
    teaser: {
      'pt-BR': 'Tem brilho de vitrine. Funciona muito bem quando a ideia é chamar atenção rápido.',
      'en-US': 'It carries showcase energy. Great when the goal is to catch attention quickly.',
    },
  }),
  createHomeHeroElement({
    number: 11,
    name: 'Sodium',
    symbol: 'Na',
    atomicMass: 22.99,
    category: 'alkali metal',
    phase: 'Solid',
    group: 1,
    period: 3,
    block: 's',
    teaser: {
      'pt-BR': 'Fácil de reconhecer e ótimo para dar cor e personalidade ao conjunto.',
      'en-US': 'Easy to recognize and great for adding color and personality to the set.',
    },
  }),
  createHomeHeroElement({
    number: 14,
    name: 'Silicon',
    symbol: 'Si',
    atomicMass: 28.085,
    category: 'metalloid',
    phase: 'Solid',
    group: 14,
    period: 3,
    block: 'p',
    teaser: {
      'pt-BR': 'Entrega uma sensação mais moderna e ajuda a equilibrar curiosidade com familiaridade.',
      'en-US': 'It feels more modern and helps balance curiosity with familiarity.',
    },
  }),
  createHomeHeroElement({
    number: 17,
    name: 'Chlorine',
    symbol: 'Cl',
    atomicMass: 35.45,
    category: 'halogen',
    phase: 'Gas',
    group: 17,
    period: 3,
    block: 'p',
    teaser: {
      'pt-BR': 'Tem presença visual forte e reforça a ideia de descoberta desde o primeiro toque.',
      'en-US': 'It has strong visual presence and reinforces the feeling of discovery from the first tap.',
    },
  }),
  createHomeHeroElement({
    number: 26,
    name: 'Iron',
    symbol: 'Fe',
    atomicMass: 55.845,
    category: 'transition metal',
    phase: 'Solid',
    group: 8,
    period: 4,
    block: 'd',
    teaser: {
      'pt-BR': 'Firme, conhecido e fácil de associar com aplicações do mundo real.',
      'en-US': 'Steady, familiar, and easy to connect with real-world applications.',
    },
  }),
  createHomeHeroElement({
    number: 29,
    name: 'Copper',
    symbol: 'Cu',
    atomicMass: 63.546,
    category: 'transition metal',
    phase: 'Solid',
    group: 11,
    period: 4,
    block: 'd',
    teaser: {
      'pt-BR': 'Quente, memorável e excelente para quebrar a rigidez de uma interface fria.',
      'en-US': 'Warm, memorable, and excellent for breaking the feel of a colder interface.',
    },
  }),
  createHomeHeroElement({
    number: 35,
    name: 'Bromine',
    symbol: 'Br',
    atomicMass: 79.904,
    category: 'halogen',
    phase: 'Liquid',
    group: 17,
    period: 4,
    block: 'p',
    teaser: {
      'pt-BR': 'Um detalhe diferente no meio da seleção. Ótimo para surpreender sem exagero.',
      'en-US': 'A different note within the selection. Great for surprising without overdoing it.',
    },
  }),
  createHomeHeroElement({
    number: 79,
    name: 'Gold',
    symbol: 'Au',
    atomicMass: 196.967,
    category: 'transition metal',
    phase: 'Solid',
    group: 11,
    period: 6,
    block: 'd',
    teaser: {
      'pt-BR': 'Clássico, elegante e instantaneamente reconhecível. Ajuda a dar valor percebido.',
      'en-US': 'Classic, elegant, and instantly recognizable. It helps raise perceived value.',
    },
  }),
  createHomeHeroElement({
    number: 92,
    name: 'Uranium',
    symbol: 'U',
    atomicMass: 238.029,
    category: 'actinide',
    phase: 'Solid',
    group: 0,
    period: 7,
    block: 'f',
    teaser: {
      'pt-BR': 'Traz impacto imediato e dá contraste para a seleção aparecer viva e menos previsível.',
      'en-US': 'It brings immediate impact and gives the selection a livelier, less predictable contrast.',
    },
  }),
];
