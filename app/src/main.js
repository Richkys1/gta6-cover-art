// Vice Cover Studio — editor wiring.
// Owns the state, the controls panel, panel picking + drag-pan + zoom,
// photo uploads, and the PNG export. The painting itself lives in cover.js.

import { drawCover, renderExport } from './cover.js';
import { layoutById, layoutList, panelAt } from './layouts.js';
import { gradeById, gradeList } from './grades.js';
import { parseShotParams, sampleUrlFor, applyShotToState, markShotReady, paintFullCover } from './shots.js';

export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape · 1920 × 1080' },
};

const state = {
  layout: 'hero',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Vice City Nights',
  captionTop: true,
  titleSize: 120,
  exportSize: '1080x1080',
  photos: [], // HTMLImageElements, index 0 = first sample
  slots: [], // per panel: { photo, zoom, ox, oy }
  selected: 0,
};

function panelCount() {
  return layoutById(state.layout).panels(100, 100).length;
}

// Make sure there is one slot per panel; new panels start on photo 0.
function syncSlots() {
  const n = panelCount();
  while (state.slots.length < n) state.slots.push({ photo: 0, zoom: 1, ox: 0, oy: 0 });
  state.slots.length = n;
  if (state.selected >= n) state.selected = 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Preload the two bundled sample photos so the app works in one click.
async function loadSamples() {
  const pier = await loadImage(sampleUrlFor('pier'));
  const boulevard = await loadImage(sampleUrlFor('boulevard'));
  state.photos = [pier, boulevard];
  syncSlots();
}

function previewCanvas() {
  return document.getElementById('stage');
}

function renderPreview() {
  syncSlots();
  const canvas = previewCanvas();
  const box = canvas.parentElement.getBoundingClientRect();
  const availW = Math.max(320, Math.floor(box.width));
  const availH = Math.max(320, Math.floor(box.height));
  const size = EXPORT_SIZES[state.exportSize];
  const aspect = size.w / size.h;
  let w = availW;
  let h = Math.floor(w / aspect);
  if (h > availH) {
    h = availH;
    w = Math.floor(h * aspect);
  }
  drawCover(canvas, {
    photos: state.photos,
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
  // In shot-cover mode the canvas is the cover itself: no editor ring.
  if (!document.body.classList.contains('shot-cover')) drawSelectionRing(canvas, w, h);
  updateReadout();
}

// Bright ring around the selected panel so the user sees what they edit.
function drawSelectionRing(canvas, W, H) {
  const ctx = canvas.getContext('2d');
  const panels = layoutById(state.layout).panels(W, H);
  const p = panels[state.selected];
  if (!p) return;
  const grade = gradeById(state.grade);
  ctx.save();
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.setLineDash([Math.max(10, W * 0.02), Math.max(6, W * 0.012)]);
  ctx.strokeRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6);
  ctx.setLineDash([]);
  ctx.fillStyle = grade.accent;
  ctx.font = `700 ${Math.max(12, W * 0.022)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`PANEL ${state.selected + 1}`, p.x + 10, p.y + 8);
  ctx.restore();
}

function updateReadout() {
  const el = document.getElementById('readout');
  if (!el) return;
  const slot = state.slots[state.selected] || { photo: 0, zoom: 1 };
  const size = EXPORT_SIZES[state.exportSize];
  el.textContent = `Panel ${state.selected + 1} of ${panelCount()} · photo ${slot.photo + 1} · zoom ${slot.zoom.toFixed(2)}× · ${layoutById(state.layout).name} · ${gradeById(state.grade).name} · export ${size.label}`;
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.value = String(slot.zoom);
}

// Build the layout + grade buttons from the definitions.
function buildChoiceButtons() {
  const layoutBox = document.getElementById('layouts');
  layoutList().forEach((def) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.textContent = def.name;
    b.title = def.blurb;
    b.dataset.id = def.id;
    b.addEventListener('click', () => {
      state.layout = def.id;
      state.selected = 0;
      refreshChoices();
      renderPreview();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = document.getElementById('grades');
  gradeList().forEach((def) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.textContent = def.name;
    b.title = def.blurb;
    b.dataset.id = def.id;
    b.style.setProperty('--swatch', def.accent);
    b.addEventListener('click', () => {
      state.grade = def.id;
      refreshChoices();
      renderPreview();
    });
    gradeBox.appendChild(b);
  });
}

function refreshChoices() {
  document.querySelectorAll('#layouts .choice').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.layout);
  });
  document.querySelectorAll('#grades .choice').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === state.grade);
  });
}

// Photo strip: one thumb per loaded photo; click to put it in the panel.
function buildPhotoStrip() {
  const strip = document.getElementById('photostrip');
  strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb';
    thumb.title = `Photo ${i + 1} — click to place in the selected panel`;
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 72;
    const ctx = c.getContext('2d');
    const s = Math.max(96 / img.naturalWidth, 72 / img.naturalHeight);
    ctx.drawImage(img, (96 - img.naturalWidth * s) / 2, (72 - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    thumb.appendChild(c);
    const label = document.createElement('span');
    label.textContent = i === 0 ? 'Pier' : i === 1 ? 'Boulevard' : `Photo ${i + 1}`;
    thumb.appendChild(label);
    thumb.addEventListener('click', () => {
      syncSlots();
      state.slots[state.selected].photo = i;
      renderPreview();
    });
    strip.appendChild(thumb);
  });
}

async function addUploadedFiles(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.photos.push(img);
      added += 1;
    } catch (e) { /* unreadable file: skip it */ }
  }
  if (added) {
    buildPhotoStrip();
    state.slots[state.selected].photo = state.photos.length - 1;
    renderPreview();
  }
  return added;
}

// Export the current cover at the chosen size as a PNG download.
function exportPng() {
  const size = EXPORT_SIZES[state.exportSize];
  const canvas = renderExport({
    photos: state.photos,
    slots: state.slots,
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    captionTop: state.captionTop,
    titleSize: state.titleSize,
    W: size.w,
    H: size.h,
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const safe = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
    a.download = `vice-cover-${safe}-${size.w}x${size.h}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

// Click a panel to select it; drag to pan its photo; wheel to zoom it.
function wireCanvasPointer() {
  const canvas = previewCanvas();
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function pointInCover(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: canvas.width, h: canvas.height };
  }

  canvas.addEventListener('pointerdown', (ev) => {
    const p = pointInCover(ev);
    const idx = panelAt(state.layout, p.w, p.h, p.x, p.y);
    if (idx < 0) return;
    state.selected = idx;
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    canvas.setPointerCapture(ev.pointerId);
    renderPreview();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const slot = state.slots[state.selected];
    if (!slot) return;
    const r = canvas.getBoundingClientRect();
    slot.ox += (ev.clientX - lastX) / r.width;
    slot.oy += (ev.clientY - lastY) / r.height;
    slot.ox = Math.max(-0.6, Math.min(0.6, slot.ox));
    slot.oy = Math.max(-0.6, Math.min(0.6, slot.oy));
    lastX = ev.clientX;
    lastY = ev.clientY;
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const slot = state.slots[state.selected];
    if (!slot) return;
    const factor = ev.deltaY < 0 ? 1.08 : 0.93;
    slot.zoom = Math.max(1, Math.min(4, slot.zoom * factor));
    renderPreview();
  }, { passive: false });
}

function wireControls() {
  const title = document.getElementById('title');
  title.addEventListener('input', () => { state.title = title.value; renderPreview(); });
  const subtitle = document.getElementById('subtitle');
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; renderPreview(); });
  const titleSize = document.getElementById('titlesize');
  titleSize.addEventListener('input', () => { state.titleSize = Number(titleSize.value); renderPreview(); });
  const captionPos = document.getElementById('captionpos');
  captionPos.addEventListener('change', () => { state.captionTop = captionPos.value === 'top'; renderPreview(); });
  const zoom = document.getElementById('zoom');
  zoom.addEventListener('input', () => {
    const slot = state.slots[state.selected];
    if (slot) slot.zoom = Number(zoom.value);
    renderPreview();
  });
  const sizeSel = document.getElementById('exportsize');
  Object.entries(EXPORT_SIZES).forEach(([key, s]) => {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = s.label;
    sizeSel.appendChild(o);
  });
  sizeSel.value = state.exportSize;
  sizeSel.addEventListener('change', () => { state.exportSize = sizeSel.value; renderPreview(); });
  document.getElementById('export').addEventListener('click', exportPng);
  document.getElementById('resetpan').addEventListener('click', () => {
    const slot = state.slots[state.selected];
    if (slot) { slot.ox = 0; slot.oy = 0; slot.zoom = 1; }
    renderPreview();
  });
  const fileInput = document.getElementById('upload');
  fileInput.addEventListener('change', () => {
    addUploadedFiles(fileInput.files);
    fileInput.value = '';
  });
  const drop = document.getElementById('dropzone');
  drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (ev) => {
    ev.preventDefault();
    drop.classList.remove('over');
    addUploadedFiles(ev.dataTransfer.files);
  });
  window.addEventListener('resize', renderPreview);
}

async function boot() {
  const cfg = parseShotParams();
  if (cfg) applyShotToState(state, cfg);
  buildChoiceButtons();
  wireControls();
  wireCanvasPointer();
  refreshChoices();
  try {
    await loadSamples();
  } catch (e) {
    state.photos = [];
  }
  // Shot mode: the requested photo goes into every panel first.
  if (cfg) {
    const wanted = cfg.photo === 'boulevard' ? 1 : 0;
    syncSlots();
    state.slots.forEach((s) => { s.photo = wanted; });
  }
  buildPhotoStrip();
  // Keep the inputs in sync with the shot (or default) state.
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('titlesize').value = String(state.titleSize);
  document.getElementById('captionpos').value = state.captionTop ? 'top' : 'bottom';
  document.getElementById('exportsize').value = state.exportSize;
  refreshChoices();
  if (cfg && cfg.shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = previewCanvas();
    paintFullCover(canvas, drawCover, state, state.photos);
    markShotReady();
    return;
  }
  renderPreview();
  if (cfg && cfg.shot === 'editor') markShotReady();
  else window.__shotReady = true;
}

boot();


