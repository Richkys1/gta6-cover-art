// Vice Cover Studio — panel layouts.
// Every layout is a list of panels in normalised coordinates (0..1 of the
// cover), so the same layout works at 1080x1080, 1080x1350 and 1920x1080.
// A panel has a key (its slot id), a rect, and a caption hint for the UI.

export const LAYOUTS = {
  hero: {
    id: 'hero',
    name: 'Hero Split',
    blurb: 'Big left hero, two stacked on the right.',
    panels(W, H) {
      return [
        { key: 'hero', x: 0, y: 0, w: W * 0.62, h: H },
        { key: 'top', x: W * 0.62, y: 0, w: W * 0.38, h: H * 0.5 },
        { key: 'bottom', x: W * 0.62, y: H * 0.5, w: W * 0.38, h: H * 0.5 },
      ];
    },
  },
  quad: {
    id: 'quad',
    name: 'Quad',
    blurb: 'Four equal panels, two by two.',
    panels(W, H) {
      return [
        { key: 'nw', x: 0, y: 0, w: W * 0.5, h: H * 0.5 },
        { key: 'ne', x: W * 0.5, y: 0, w: W * 0.5, h: H * 0.5 },
        { key: 'sw', x: 0, y: H * 0.5, w: W * 0.5, h: H * 0.5 },
        { key: 'se', x: W * 0.5, y: H * 0.5, w: W * 0.5, h: H * 0.5 },
      ];
    },
  },
  triptych: {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three tall vertical panels side by side.',
    panels(W, H) {
      const third = W / 3;
      return [
        { key: 'left', x: 0, y: 0, w: third, h: H },
        { key: 'mid', x: third, y: 0, w: third, h: H },
        { key: 'right', x: third * 2, y: 0, w: third, h: H },
      ];
    },
  },
  banner: {
    id: 'banner',
    name: 'Banner',
    blurb: 'Wide hero on top, two panels in the strip below.',
    panels(W, H) {
      return [
        { key: 'hero', x: 0, y: 0, w: W, h: H * 0.68 },
        { key: 'left', x: 0, y: H * 0.68, w: W * 0.5, h: H * 0.32 },
        { key: 'right', x: W * 0.5, y: H * 0.68, w: W * 0.5, h: H * 0.32 },
      ];
    },
  },
  single: {
    id: 'single',
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, caption over it.',
    panels(W, H) {
      return [{ key: 'full', x: 0, y: 0, w: W, h: H }];
    },
  },
};

// Resolve a layout id to its definition, falling back to hero.
export function layoutById(id) {
  return LAYOUTS[id] || LAYOUTS.hero;
}

// Ordered list for the layout buttons in the editor.
export function layoutList() {
  return [LAYOUTS.hero, LAYOUTS.quad, LAYOUTS.triptych, LAYOUTS.banner, LAYOUTS.single];
}

// Which panel (if any) contains point (px, py) in a W x H cover.
export function panelAt(layoutId, W, H, px, py) {
  const panels = layoutById(layoutId).panels(W, H);
  for (let i = 0; i < panels.length; i += 1) {
    const p = panels[i];
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return i;
  }
  return -1;
}

