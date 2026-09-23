// Toutes les couleurs de l'interface vivent ici, et nulle part ailleurs. Le
// CSS les lit par variables, le canvas de la mini-carte par `color()` : une
// seule table à changer pour repeindre tout le jeu.
//
// Règle d'accessibilité tenue partout : une couleur ne porte jamais seule une
// information. Chaque marqueur a sa forme, chaque jauge son icône et son
// nombre. Le rouge et le vert ne s'opposent jamais sans autre signe.

export const THEMES = {
  nocturne: {
    label: 'Nocturne urbain',
    tokens: {
      ground: '#0B1020',
      panel: 'rgba(16, 22, 38, 0.82)',
      'panel-hover': 'rgba(27, 38, 62, 0.94)',
      'panel-solid': '#101626',
      edge: '#334155',
      'edge-active': '#FF6B4A',
      ink: '#F5F1E8',
      'ink-dim': '#A8B3C7',
      'ink-off': '#68738A',
      accent: '#FF6B4A',
      'accent-hover': '#FF9A62',
      'accent-2': '#4DA3FF',
      'health-high': '#55D6A5',
      'health-mid': '#F6C453',
      'health-low': '#EF5B5B',
      armor: '#71B7FF',
      money: '#E8C66A',
      danger: '#FF5C70',
      objective: '#55C7E8',
      success: '#B18CFF',
      gold: '#E8C66A',
      police: '#4DA3FF',
      // Mini-carte
      'map-bg': '#0B1020',
      'map-road': '#2A3348',
      'map-block': '#151C2E',
      'map-edge': 'rgba(245, 241, 232, 0.22)',
    },
  },

  contraste: {
    label: 'Contraste élevé',
    tokens: {
      ground: '#05070D',
      panel: 'rgba(17, 24, 39, 0.96)',
      'panel-hover': '#1F2937',
      'panel-solid': '#111827',
      edge: '#FFFFFF',
      'edge-active': '#FFB000',
      ink: '#FFFFFF',
      'ink-dim': '#D1D5DB',
      'ink-off': '#9CA3AF',
      accent: '#FFB000',
      'accent-hover': '#FFC94D',
      'accent-2': '#44C7FF',
      'health-high': '#5DFFB0',
      'health-mid': '#FFD400',
      'health-low': '#FF5E73',
      armor: '#7CC7FF',
      money: '#FFD400',
      danger: '#FF5E73',
      objective: '#44C7FF',
      success: '#C9A7FF',
      gold: '#FFD400',
      police: '#44C7FF',
      'map-bg': '#05070D',
      'map-road': '#3A4557',
      'map-block': '#131A28',
      'map-edge': 'rgba(255, 255, 255, 0.45)',
    },
  },

  daltonisme: {
    label: 'Daltonisme',
    // Bleu / orange / violet : trois teintes qui restent distinctes pour les
    // trois formes de daltonisme, là où le rouge et le vert se confondent.
    tokens: {
      ground: '#10141C',
      panel: 'rgba(27, 31, 42, 0.88)',
      'panel-hover': 'rgba(40, 46, 60, 0.96)',
      'panel-solid': '#1B1F2A',
      edge: '#4A5468',
      'edge-active': '#F2994A',
      ink: '#F2F2F2',
      'ink-dim': '#B4BCC9',
      'ink-off': '#78808F',
      accent: '#F2994A',
      'accent-hover': '#FFB877',
      'accent-2': '#2D9CDB',
      'health-high': '#2D9CDB',
      'health-mid': '#F2C94C',
      'health-low': '#F2994A',
      armor: '#9B51E0',
      money: '#F2C94C',
      danger: '#F2994A',
      objective: '#2D9CDB',
      success: '#9B51E0',
      gold: '#F2C94C',
      police: '#2D9CDB',
      'map-bg': '#10141C',
      'map-road': '#333B4A',
      'map-block': '#1A1F2B',
      'map-edge': 'rgba(242, 242, 242, 0.3)',
    },
  },
};

let current = 'nocturne';

export function applyTheme(name) {
  current = THEMES[name] ? name : 'nocturne';
  const root = document.documentElement;
  for (const [key, value] of Object.entries(THEMES[current].tokens)) {
    root.style.setProperty(`--${key}`, value);
  }
  return current;
}

// Le canvas ne sait pas lire une variable CSS : il passe par ici.
export function color(token) {
  return THEMES[current].tokens[token] ?? '#ffffff';
}

export function themeName() {
  return current;
}

// Couleur de la vie selon le niveau. Toujours accompagnée, à l'écran, d'une
// icône et d'un nombre — la teinte seule ne dit rien à qui ne la distingue pas.
export function healthColor(ratio) {
  if (ratio > 0.55) return color('health-high');
  if (ratio > 0.25) return color('health-mid');
  return color('health-low');
}
