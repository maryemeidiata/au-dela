/**
 * Realistic planet renderer for canvas.
 * Each planet is drawn with proper limb-darkening, atmospheric banding,
 * and (for Saturn) a multi-layer ring system drawn behind and in front of the disc.
 */

// ─── Shared helpers ───────────────────────────────────────────────────────────

function limbDarken(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  intensity = 0.6
) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
  g.addColorStop(0,    "rgba(0,0,0,0)");
  g.addColorStop(0.6,  "rgba(0,0,0,0)");
  g.addColorStop(0.82, `rgba(0,0,0,${(intensity * 0.3).toFixed(2)})`);
  g.addColorStop(0.94, `rgba(0,0,0,${(intensity * 0.65).toFixed(2)})`);
  g.addColorStop(1,    `rgba(0,0,0,${intensity.toFixed(2)})`);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function atmoGlow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  r1: string, r2: string, g1: string, g2: string, b1: string, b2: string,
  alpha1: number, alpha2: number
) {
  const grd = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.6);
  grd.addColorStop(0,   `rgba(${r1},${g1},${b1},${alpha1})`);
  grd.addColorStop(0.55,`rgba(${r1},${g1},${b1},${(alpha1 * 0.4).toFixed(2)})`);
  grd.addColorStop(1,   `rgba(${r2},${g2},${b2},${alpha2})`);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Jupiter ─────────────────────────────────────────────────────────────────

function drawJupiter(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Base color — warm cream
  ctx.fillStyle = "#d8bc84";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Atmospheric bands (north pole → south pole)
  const bands: [number, number, string][] = [
    // [relative_y_center, relative_height, rgba_color]
    [-0.88, 0.18, "rgba(100,68,38,0.50)"],   // North Polar Region
    [-0.70, 0.10, "rgba(215,185,120,0.55)"],  // NTZ
    [-0.58, 0.13, "rgba(142,88,46,0.58)"],    // NNTB
    [-0.44, 0.08, "rgba(220,190,130,0.45)"],  // NTZ
    [-0.34, 0.16, "rgba(158,98,52,0.62)"],    // NEB (prominent dark belt)
    [-0.17, 0.15, "rgba(232,208,148,0.50)"],  // EZ — equatorial zone, bright
    [-0.02, 0.06, "rgba(175,110,58,0.38)"],   // SEB-n
    [ 0.05, 0.18, "rgba(148,88,42,0.60)"],    // SEB — south equatorial belt (where GRS is)
    [ 0.24, 0.12, "rgba(228,200,138,0.48)"],  // STZ
    [ 0.38, 0.13, "rgba(135,82,38,0.50)"],    // STB
    [ 0.52, 0.10, "rgba(218,188,125,0.42)"],  // SToZ
    [ 0.64, 0.14, "rgba(118,72,36,0.50)"],    // SPR
    [ 0.82, 0.22, "rgba(100,65,32,0.48)"],    // South Polar Region
  ];

  for (const [yRel, hRel, color] of bands) {
    ctx.fillStyle = color;
    ctx.fillRect(cx - r, cy + yRel * r - (hRel * r) / 2, r * 2, hRel * r);
  }

  // Great Red Spot — oval in SEB
  ctx.save();
  const grsCx = cx + r * 0.22;
  const grsCy = cy + r * 0.10;
  const grsRx = r * 0.24;
  const grsRy = r * 0.14;
  ctx.beginPath();
  ctx.ellipse(grsCx, grsCy, grsRx, grsRy, 0, 0, Math.PI * 2);
  const grs = ctx.createRadialGradient(grsCx, grsCy, 0, grsCx, grsCy, grsRx);
  grs.addColorStop(0,   "rgba(175,60,30,0.80)");
  grs.addColorStop(0.45,"rgba(195,80,35,0.72)");
  grs.addColorStop(0.8, "rgba(190,110,48,0.55)");
  grs.addColorStop(1,   "rgba(165,100,42,0)");
  ctx.fillStyle = grs;
  ctx.fill();
  ctx.restore();

  // Subtle horizontal texture lines
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = "#60380a";
  ctx.lineWidth = 0.5;
  for (let i = -9; i <= 9; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + i * r * 0.095);
    ctx.lineTo(cx + r, cy + i * r * 0.095);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Limb darkening
  limbDarken(ctx, cx, cy, r, 0.58);
  ctx.restore();

  // Atmospheric halo
  atmoGlow(ctx, cx, cy, r, "210","180","160","140","115","100", 0.22, 0);
}

// ─── Saturn body ─────────────────────────────────────────────────────────────

function drawSaturnBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Base warm honey-yellow
  ctx.fillStyle = "#e2c87a";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Subtle bands
  const bands: [number, number, string][] = [
    [-0.75, 0.18, "rgba(165,128,55,0.35)"],
    [-0.52, 0.12, "rgba(215,185,115,0.30)"],
    [-0.32, 0.10, "rgba(150,120,50,0.28)"],
    [-0.10, 0.16, "rgba(225,198,128,0.22)"],
    [ 0.14, 0.12, "rgba(155,122,55,0.28)"],
    [ 0.38, 0.14, "rgba(210,178,105,0.30)"],
    [ 0.60, 0.18, "rgba(148,115,48,0.35)"],
  ];
  for (const [yRel, hRel, color] of bands) {
    ctx.fillStyle = color;
    ctx.fillRect(cx - r, cy + yRel * r - (hRel * r) / 2, r * 2, hRel * r);
  }

  // Ring shadow on planet (dark band cast by rings)
  const shadowGrd = ctx.createLinearGradient(cx, cy - r * 0.28, cx, cy + r * 0.05);
  shadowGrd.addColorStop(0,    "rgba(20,15,5,0)");
  shadowGrd.addColorStop(0.25, "rgba(20,15,5,0.28)");
  shadowGrd.addColorStop(0.60, "rgba(20,15,5,0.38)");
  shadowGrd.addColorStop(1,    "rgba(20,15,5,0)");
  ctx.fillStyle = shadowGrd;
  ctx.fillRect(cx - r, cy - r * 0.28, r * 2, r * 0.33);

  // Limb darkening
  limbDarken(ctx, cx, cy, r, 0.52);
  ctx.restore();
}

// Shared ring geometry constants
const RING_TILT = 0.40; // vertical compression (sin of view angle ~24°)

function drawSaturnRingsPass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  frontHalf: boolean
) {
  // Ring definitions [inner_ratio, outer_ratio, color]
  const rings: [number, number, string][] = [
    [1.20, 1.52, "rgba(148,132,92,0.40)"],    // C ring
    [1.52, 1.95, "rgba(232,212,160,0.82)"],   // B ring — brightest
    [1.95, 2.04, "rgba(12,8,20,0.90)"],        // Cassini division
    [2.04, 2.28, "rgba(200,180,130,0.72)"],   // A ring
    [2.28, 2.32, "rgba(235,220,172,0.28)"],   // F ring hint
  ];

  ctx.save();
  // Clip to correct half
  if (frontHalf) {
    ctx.beginPath();
    ctx.rect(cx - r * 3.5, cy, r * 7, r * 3.5);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(cx - r * 3.5, cy - r * 3.5, r * 7, r * 3.5);
    ctx.clip();
  }

  for (const [inner, outer, color] of rings) {
    ctx.beginPath();
    // outer ellipse (clockwise)
    ctx.ellipse(cx, cy, outer * r, outer * r * RING_TILT, 0, 0, Math.PI * 2, false);
    // inner ellipse (counter-clockwise = hole)
    ctx.ellipse(cx, cy, inner * r, inner * r * RING_TILT, 0, 0, Math.PI * 2, true);
    ctx.fillStyle = color;
    ctx.fill("evenodd");
  }
  ctx.restore();
}

// ─── Mars ─────────────────────────────────────────────────────────────────────

function drawMars(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Base rusty orange-red
  const base = ctx.createRadialGradient(cx + r * 0.15, cy - r * 0.15, 0, cx, cy, r);
  base.addColorStop(0,    "#d4663a");
  base.addColorStop(0.45, "#c85530");
  base.addColorStop(0.8,  "#b04428");
  base.addColorStop(1,    "#8c3020");
  ctx.fillStyle = base;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Dark maria (darker regions)
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = "#6a2018";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.15, cy + r * 0.10, r * 0.4, r * 0.28, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.30, cy - r * 0.20, r * 0.25, r * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // North polar cap — white ice
  const capR = r * 0.22;
  const capGrd = ctx.createRadialGradient(cx, cy - r * 0.78, 0, cx, cy - r * 0.78, capR);
  capGrd.addColorStop(0,   "rgba(240,235,230,0.92)");
  capGrd.addColorStop(0.6, "rgba(220,215,210,0.65)");
  capGrd.addColorStop(1,   "rgba(200,195,190,0)");
  ctx.fillStyle = capGrd;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.78, capR, 0, Math.PI * 2);
  ctx.fill();

  // South polar cap (smaller)
  const scapR = r * 0.14;
  const scapGrd = ctx.createRadialGradient(cx + r * 0.05, cy + r * 0.78, 0, cx, cy + r * 0.78, scapR);
  scapGrd.addColorStop(0,  "rgba(240,235,230,0.80)");
  scapGrd.addColorStop(0.7,"rgba(220,215,210,0.40)");
  scapGrd.addColorStop(1,  "rgba(200,195,190,0)");
  ctx.fillStyle = scapGrd;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.80, scapR, 0, Math.PI * 2);
  ctx.fill();

  // Limb darkening (reddish edge)
  const limb = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  limb.addColorStop(0,    "rgba(0,0,0,0)");
  limb.addColorStop(0.70, "rgba(0,0,0,0)");
  limb.addColorStop(0.88, "rgba(40,0,0,0.20)");
  limb.addColorStop(1,    "rgba(40,0,0,0.60)");
  ctx.fillStyle = limb;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  atmoGlow(ctx, cx, cy, r, "180","80","50","40","180","80", 0.18, 0);
}

// ─── Venus ────────────────────────────────────────────────────────────────────

function drawVenus(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Bright creamy base
  const base = ctx.createRadialGradient(cx + r * 0.12, cy - r * 0.15, 0, cx, cy, r);
  base.addColorStop(0,    "#fff8e8");
  base.addColorStop(0.35, "#fde8c0");
  base.addColorStop(0.7,  "#f8d890");
  base.addColorStop(1,    "#e8c068");
  ctx.fillStyle = base;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Subtle cloud bands
  const cloudBands: [number, number, string][] = [
    [-0.55, 0.16, "rgba(255,240,195,0.22)"],
    [-0.22, 0.12, "rgba(230,205,155,0.18)"],
    [ 0.08, 0.20, "rgba(250,230,185,0.20)"],
    [ 0.42, 0.14, "rgba(225,198,145,0.18)"],
  ];
  for (const [yRel, hRel, color] of cloudBands) {
    ctx.fillStyle = color;
    ctx.fillRect(cx - r, cy + yRel * r, r * 2, hRel * r);
  }

  // Limb darkening — warm
  const limb = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  limb.addColorStop(0,   "rgba(0,0,0,0)");
  limb.addColorStop(0.65,"rgba(0,0,0,0)");
  limb.addColorStop(0.85,"rgba(20,8,0,0.22)");
  limb.addColorStop(1,   "rgba(20,8,0,0.55)");
  ctx.fillStyle = limb;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Very strong atmospheric glow — Venus is extremely bright
  const grd = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.2);
  grd.addColorStop(0,   "rgba(255,240,180,0.30)");
  grd.addColorStop(0.4, "rgba(255,225,150,0.14)");
  grd.addColorStop(1,   "rgba(255,210,120,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Mercury ──────────────────────────────────────────────────────────────────

function drawMercury(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createRadialGradient(cx + r * 0.1, cy - r * 0.12, 0, cx, cy, r);
  base.addColorStop(0,   "#c8b898");
  base.addColorStop(0.4, "#b0a080");
  base.addColorStop(0.8, "#887060");
  base.addColorStop(1,   "#6a5248");
  ctx.fillStyle = base;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Slight brightness variation (large craters blended)
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = "#9a8868";
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy + r * 0.18, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  limbDarken(ctx, cx, cy, r, 0.70);
  ctx.restore();
}

// ─── Uranus ───────────────────────────────────────────────────────────────────

function drawUranus(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createRadialGradient(cx + r * 0.08, cy - r * 0.10, 0, cx, cy, r);
  base.addColorStop(0,   "#c8f0f5");
  base.addColorStop(0.35,"#94d8e8");
  base.addColorStop(0.70,"#68bcd8");
  base.addColorStop(1,   "#4898b8");
  ctx.fillStyle = base;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Very subtle banding at poles (Uranus is mostly featureless)
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#80c8dc";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 0.18);
  ctx.fillRect(cx - r, cy + r * 0.82, r * 2, r * 0.18);
  ctx.globalAlpha = 1;

  limbDarken(ctx, cx, cy, r, 0.48);
  ctx.restore();

  atmoGlow(ctx, cx, cy, r, "140","220","200","230","210","240", 0.16, 0);
}

// ─── Neptune ──────────────────────────────────────────────────────────────────

function drawNeptune(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createRadialGradient(cx + r * 0.08, cy - r * 0.10, 0, cx, cy, r);
  base.addColorStop(0,   "#6888e8");
  base.addColorStop(0.40,"#4060d0");
  base.addColorStop(0.75,"#2848b0");
  base.addColorStop(1,   "#183090");
  ctx.fillStyle = base;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Subtle storm bands
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#8898f0";
  ctx.fillRect(cx - r, cy - r * 0.20, r * 2, r * 0.12);
  ctx.fillRect(cx - r, cy + r * 0.30, r * 2, r * 0.08);
  ctx.globalAlpha = 1;

  // Great Dark Spot hint
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#1838a0";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.18, cy - r * 0.08, r * 0.20, r * 0.12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  limbDarken(ctx, cx, cy, r, 0.55);
  ctx.restore();

  atmoGlow(ctx, cx, cy, r, "80","100","150","120","220","200", 0.18, 0);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Draw a planet with atmospheric glow + realistic disc + label.
 * Saturn requires special two-pass ring rendering — use drawSaturnFull() instead.
 */
export function drawPlanetFull(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  id: string, name: string,
  r: number,
  zoom: number,
  showLabel = true
) {
  const scaledR = r * (0.55 + zoom * 0.45);

  if (id === "saturn") {
    drawSaturnFull(ctx, cx, cy, name, scaledR, showLabel);
    return;
  }

  switch (id) {
    case "jupiter": drawJupiter(ctx, cx, cy, scaledR); break;
    case "mars":    drawMars(ctx, cx, cy, scaledR); break;
    case "venus":   drawVenus(ctx, cx, cy, scaledR); break;
    case "mercury": drawMercury(ctx, cx, cy, scaledR); break;
    case "uranus":  drawUranus(ctx, cx, cy, scaledR); break;
    case "neptune": drawNeptune(ctx, cx, cy, scaledR); break;
    default: {
      // Generic planet with base color
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, scaledR, 0, Math.PI * 2);
      ctx.fillStyle = "#aaaaaa";
      ctx.fill();
      limbDarken(ctx, cx, cy, scaledR, 0.6);
      ctx.restore();
    }
  }

  if (showLabel) {
    ctx.save();
    ctx.fillStyle = "rgba(204,200,245,0.82)";
    ctx.font = `${Math.max(10, 9 + (zoom - 1) * 2)}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(name, cx, cy + scaledR + 14);
    ctx.restore();
  }
}

/**
 * Saturn: rings go both behind and in front of the disc.
 * Drawing order: rings-back → body → rings-front → label
 */
export function drawSaturnFull(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  name: string,
  r: number,
  showLabel = true
) {
  // 1. Back half of rings
  drawSaturnRingsPass(ctx, cx, cy, r, false);

  // 2. Planet body
  drawSaturnBody(ctx, cx, cy, r);

  // 3. Front half of rings
  drawSaturnRingsPass(ctx, cx, cy, r, true);

  // 4. Atmospheric glow
  atmoGlow(ctx, cx, cy, r, "210","190","155","140","115","100", 0.18, 0);

  // 5. Label
  if (showLabel) {
    ctx.save();
    ctx.fillStyle = "rgba(204,200,245,0.82)";
    ctx.font = "10px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, cx, cy + r * RING_TILT * 2.35 + 14);
    ctx.restore();
  }
}

/**
 * Standalone disc renderer for use in planet cards (no label, fixed scale).
 */
export function drawPlanetDisc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  id: string
) {
  if (id === "saturn") {
    drawSaturnRingsPass(ctx, cx, cy, r, false);
    drawSaturnBody(ctx, cx, cy, r);
    drawSaturnRingsPass(ctx, cx, cy, r, true);
    atmoGlow(ctx, cx, cy, r, "210","190","155","140","115","100", 0.18, 0);
    return;
  }
  switch (id) {
    case "jupiter": drawJupiter(ctx, cx, cy, r); break;
    case "mars":    drawMars(ctx, cx, cy, r); break;
    case "venus":   drawVenus(ctx, cx, cy, r); break;
    case "mercury": drawMercury(ctx, cx, cy, r); break;
    case "uranus":  drawUranus(ctx, cx, cy, r); break;
    case "neptune": drawNeptune(ctx, cx, cy, r); break;
    default: {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#aaaaaa";
      ctx.fill();
      limbDarken(ctx, cx, cy, r, 0.6);
      ctx.restore();
    }
  }
}
