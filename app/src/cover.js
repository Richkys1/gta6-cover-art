// Vice Cover Studio — the cover renderer.
// drawCover paints a whole poster onto a canvas: sky gradient, the photos
// in their panels (cover-fit, per-panel pan + zoom), grade tint, procedural
// decor (sun disc, skyline, palm silhouettes, halftone dots, vignette) and
// the bold GTA-style caption. Everything is drawn; nothing is fetched.

import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';

const GUTTER = 10; // dark gap between panels, in cover pixels at 1080 wide

// Draw one photo into a panel rect with cover-fit, pan (ox, oy in panel
// fractions) and zoom. Falls back to a gradient + label when no photo.
function drawPhotoInto(ctx, img, rect, slot) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img || !img.naturalWidth) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3d2b5c');
    g.addColorStop(1, '#1a1030');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `700 ${Math.max(14, w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }
  const zoom = slot.zoom || 1;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2 + (slot.ox || 0) * w;
  const dy = y + (h - dh) / 2 + (slot.oy || 0) * h;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Procedural palm silhouette: a curved trunk and five drooping fronds.
function drawPalm(ctx, bx, by, s, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + s * 0.08, by - s * 0.55, bx + s * 0.22, by - s * 0.95);
  ctx.stroke();
  const topX = bx + s * 0.22;
  const topY = by - s * 0.95;
  const fronds = [
    [-0.62, -0.10], [-0.42, -0.34], [-0.08, -0.44], [0.30, -0.34], [0.58, -0.08],
  ];
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + fx * s * 0.55, topY + fy * s * 0.5,
      topX + fx * s, topY + fy * s + s * 0.28,
    );
    ctx.lineWidth = Math.max(1.5, s * 0.03);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Blocky skyline silhouette along the bottom of a rect.
function drawSkyline(ctx, rect, colour, seed) {
  const { x, y, w, h } = rect;
  const base = y + h;
  let bx = x;
  let n = 0;
  ctx.fillStyle = colour;
  while (bx < x + w) {
    const bw = w * (0.06 + ((seed * 37 + n * 53) % 10) / 90);
    const bh = h * (0.10 + ((seed * 91 + n * 29) % 10) / 55);
    ctx.fillRect(bx, base - bh, bw, bh);
    if ((n * 7 + seed) % 3 === 0) {
      ctx.fillRect(bx + bw * 0.3, base - bh - h * 0.05, bw * 0.12, h * 0.05);
    }
    bx += bw + w * 0.012;
    n += 1;
  }
}

// Halftone dot field fading down from the top of the cover.
function drawHalftone(ctx, W, H, colour) {
  const step = Math.max(14, W * 0.016);
  ctx.fillStyle = colour;
  for (let yy = step / 2; yy < H * 0.22; yy += step) {
    const fade = 1 - yy / (H * 0.22);
    for (let xx = step / 2; xx < W; xx += step) {
      const r = step * 0.16 * fade + 0.4;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Soft dark vignette around the edges.
function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Bold condensed-capitals caption with gradient fill, outline and shadow.
// Title may wrap to two lines; the subtitle sits under it as a tagline.
function drawCaption(ctx, W, H, grade, title, subtitle, opts) {
  const top = opts.captionTop !== false;
  const scale = Math.min(W, H) / 1080;
  const size = (opts.titleSize || 120) * scale;
  const cx = W / 2;
  const lines = (title || 'SUNSET HEIST').toUpperCase().split('\n');
  const wrapped = [];
  for (const line of lines) {
    const words = line.split(/\s+/).filter(Boolean);
    let cur = '';
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      ctx.font = `900 ${size}px "Arial Narrow", Impact, "Helvetica Neue", sans-serif`;
      if (ctx.measureText(test).width > W * 0.92 && cur) {
        wrapped.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) wrapped.push(cur);
  }
  const lineH = size * 0.98;
  const totalH = wrapped.length * lineH + (subtitle ? size * 0.42 : 0);
  let y = top ? H * 0.06 + size * 0.8 : H - H * 0.06 - totalH + size * 0.8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const line of wrapped) {
    const grad = ctx.createLinearGradient(0, y - size, 0, y + size * 0.15);
    grade.captionFill.forEach((c, i) => grad.addColorStop(i / (grade.captionFill.length - 1), c));
    ctx.save();
    ctx.shadowColor = grade.captionShadow;
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.06;
    ctx.font = `900 ${size}px "Arial Narrow", Impact, "Helvetica Neue", sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch (e) { /* older canvas */ }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = grade.captionStroke;
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(line, cx, y);
    ctx.fillStyle = grad;
    ctx.fillText(line, cx, y);
    ctx.restore();
    y += lineH;
  }
  if (subtitle) {
    const subSize = Math.max(16, size * 0.26);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${subSize * 0.28}px`; } catch (e) { /* older canvas */ }
    ctx.fillStyle = grade.subFill;
    ctx.shadowColor = grade.captionShadow;
    ctx.shadowBlur = subSize * 0.3;
    ctx.shadowOffsetY = subSize * 0.08;
    ctx.fillText(subtitle.toUpperCase(), cx, y + subSize * 0.5);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}

// Paint the whole cover. opts: { photos, slots, layout, grade, title,
// subtitle, captionTop, titleSize, W, H }. slots[i] = { photo, zoom, ox, oy }.
export function drawCover(canvas, opts) {
  const W = opts.W || canvas.width;
  const H = opts.H || canvas.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(opts.grade);
  const layout = layoutById(opts.layout);
  const gap = GUTTER * (W / 1080);

  // Sky gradient behind everything.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Panels: photos first, then the grade tint over each.
  const panels = layout.panels(W, H);
  const slots = opts.slots || [];
  panels.forEach((rect, i) => {
    const inset = {
      x: rect.x + (rect.x > 0 ? gap / 2 : 0),
      y: rect.y + (rect.y > 0 ? gap / 2 : 0),
      w: rect.w - (rect.x > 0 ? gap / 2 : 0) - (rect.x + rect.w < W ? gap / 2 : 0),
      h: rect.h - (rect.y > 0 ? gap / 2 : 0) - (rect.y + rect.h < H ? gap / 2 : 0),
    };
    const slot = slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = opts.photos ? opts.photos[slot.photo] : null;
    drawPhotoInto(ctx, img, inset, slot);
    ctx.fillStyle = grade.tint;
    ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
    // Thin neon frame around the selected panel is drawn by the editor;
    // every panel gets a hairline gutter edge here.
    ctx.strokeStyle = grade.gutter;
    ctx.lineWidth = Math.max(1, gap * 0.5);
    ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  });

  // Decor on top of the photos: the sun disc overlaps the top-right
  // corner like a poster graphic, then skyline, palms, halftone, vignette.
  const sunR = Math.min(W, H) * 0.085;
  const sunX = W * 0.90;
  const sunY = H * 0.10;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  glow.addColorStop(0, grade.sunGlow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.6, sunY - sunR * 2.6, sunR * 5.2, sunR * 5.2);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  drawSkyline(ctx, { x: 0, y: H * 0.86, w: W, h: H * 0.14 }, grade.skyline, 3);
  drawPalm(ctx, W * 0.03, H * 0.99, Math.min(W, H) * 0.24, grade.palm);
  drawPalm(ctx, W * 0.97, H * 0.99, Math.min(W, H) * 0.19, grade.palm);
  drawHalftone(ctx, W, H, grade.halftone);
  drawVignette(ctx, W, H);

  // Caption last so the lettering sits over everything.
  drawCaption(ctx, W, H, grade, opts.title, opts.subtitle, {
    captionTop: opts.captionTop !== false,
    titleSize: opts.titleSize || 120,
  });
  return canvas;
}

// Render the cover to an offscreen canvas at export size and return it.
export function renderExport(opts) {
  const canvas = document.createElement('canvas');
  return drawCover(canvas, opts);
}

