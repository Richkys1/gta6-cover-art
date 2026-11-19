// Vice Cover Studio — deterministic shot mode for screenshots.
// URL params: ?shot=cover|editor&photo=pier|boulevard&caption=...&layout=hero
// &grade=sunset&subtitle=...&size=1080x1080|1080x1350|1920x1080
// In cover mode the page hides the editor chrome and paints the cover
// edge to edge; in editor mode it presets the editor state. Either way the
// page sets window.__shotReady = true once painted (double rAF).

export function parseShotParams(search) {
  const q = new URLSearchParams(search || window.location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  return {
    shot,
    photo: q.get('photo') || 'pier',
    caption: q.get('caption') || 'Sunset Heist',
    subtitle: q.get('subtitle') || 'Vice City Nights',
    layout: q.get('layout') || 'hero',
    grade: q.get('grade') || 'sunset',
    size: q.get('size') || '',
    captionTop: q.get('captionTop') !== 'bottom',
  };
}

// Map the ?photo= name to a sample file under app/samples/.
export function sampleUrlFor(photoName) {
  const name = photoName === 'boulevard' ? 'boulevard' : 'pier';
  return `samples/${name}.jpg`;
}

// Apply a shot config to the editor state object.
export function applyShotToState(state, cfg) {
  state.layout = cfg.layout;
  state.grade = cfg.grade;
  state.title = cfg.caption;
  state.subtitle = cfg.subtitle;
  state.captionTop = cfg.captionTop;
  if (cfg.size) {
    const [w, h] = cfg.size.split('x').map(Number);
    if (w > 0 && h > 0) state.exportSize = cfg.size;
  }
  return state;
}

// Mark the page ready for a screenshot once the cover is painted.
// Double requestAnimationFrame so the canvas is actually on screen.
export function markShotReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

// In cover mode, size a canvas to the full viewport and paint the cover
// into it at viewport resolution. Returns true when it painted.
export function paintFullCover(canvas, draw, state, photos) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  draw(canvas, {
    photos,
    slots: state.slots,
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    captionTop: state.captionTop,
    titleSize: state.titleSize,
    W: w,
    H: h,
  });
  return true;
}

