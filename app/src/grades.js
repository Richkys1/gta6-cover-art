// Vice Cover Studio — colour grades.
// A grade is a full look: sky gradient, photo tint, sun, palms, caption
// lettering colours and the halftone ink. All of it is drawn on canvas;
// no external images or fonts are involved.

export const GRADES = {
  sunset: {
    id: 'sunset',
    name: 'Vice Sunset',
    blurb: 'Orange into pink into purple dusk.',
    sky: ['#ff9a3d', '#ff5e7a', '#7b2f8b', '#2a1650'],
    tint: 'rgba(255, 94, 122, 0.16)',
    sun: '#ffd166',
    sunGlow: 'rgba(255, 180, 80, 0.55)',
    palm: '#1c0b2e',
    skyline: '#241040',
    captionFill: ['#fff3d6', '#ffb347', '#ff5e7a'],
    captionStroke: '#2a0a3d',
    captionShadow: 'rgba(20, 4, 40, 0.85)',
    subFill: '#ffe9f2',
    halftone: 'rgba(255, 255, 255, 0.10)',
    gutter: '#160a24',
    accent: '#ff5e7a',
  },
  neon: {
    id: 'neon',
    name: 'Neon Nights',
    blurb: 'Cyan and magenta after dark.',
    sky: ['#0b1035', '#123a6b', '#7a1fa2', '#ff2e88'],
    tint: 'rgba(46, 226, 255, 0.14)',
    sun: '#2ee2ff',
    sunGlow: 'rgba(46, 226, 255, 0.5)',
    palm: '#05081f',
    skyline: '#0a1030',
    captionFill: ['#e8fbff', '#2ee2ff', '#ff2e88'],
    captionStroke: '#12002e',
    captionShadow: 'rgba(0, 8, 30, 0.9)',
    subFill: '#c8f6ff',
    halftone: 'rgba(46, 226, 255, 0.12)',
    gutter: '#05081f',
    accent: '#2ee2ff',
  },
  gold: {
    id: 'gold',
    name: 'Palm Gold',
    blurb: 'Warm gold light over deep teal water.',
    sky: ['#ffe08a', '#f2a541', '#0f766e', '#083344'],
    tint: 'rgba(255, 190, 80, 0.15)',
    sun: '#fff7cc',
    sunGlow: 'rgba(255, 210, 100, 0.55)',
    palm: '#062a2a',
    skyline: '#0a2e2e',
    captionFill: ['#fffbe8', '#ffd166', '#f2a541'],
    captionStroke: '#082f2f',
    captionShadow: 'rgba(4, 32, 32, 0.85)',
    subFill: '#fff3c4',
    halftone: 'rgba(255, 240, 180, 0.10)',
    gutter: '#062a2a',
    accent: '#ffd166',
  },
  noir: {
    id: 'noir',
    name: 'Noir',
    blurb: 'High-contrast black and white, hard shadows.',
    sky: ['#e8e8e8', '#9a9a9a', '#3a3a3a', '#0a0a0a'],
    tint: 'rgba(0, 0, 0, 0.10)',
    sun: '#ffffff',
    sunGlow: 'rgba(255, 255, 255, 0.35)',
    palm: '#000000',
    skyline: '#111111',
    captionFill: ['#ffffff', '#e8e8e8', '#bdbdbd'],
    captionStroke: '#000000',
    captionShadow: 'rgba(0, 0, 0, 0.9)',
    subFill: '#f2f2f2',
    halftone: 'rgba(255, 255, 255, 0.14)',
    gutter: '#000000',
    accent: '#ffffff',
  },
};

// Resolve a grade id, falling back to sunset.
export function gradeById(id) {
  return GRADES[id] || GRADES.sunset;
}

// Ordered list for the grade buttons in the editor.
export function gradeList() {
  return [GRADES.sunset, GRADES.neon, GRADES.gold, GRADES.noir];
}

