// ============================================
// SewaKita - 3 Metrics Card Concepts
// Run on: "creative mode" page
// ============================================
(async () => {

const W = 390;
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
const P500 = { r: 0/255, g: 176/255, b: 255/255 };
const P600 = { r: 0/255, g: 144/255, b: 209/255 };
const P700 = { r: 0/255, g: 112/255, b: 163/255 };
const P800 = { r: 0/255, g: 85/255, b: 128/255 };
const G50 = { r: 249/255, g: 250/255, b: 251/255 };
const G100 = { r: 243/255, g: 244/255, b: 246/255 };
const G200 = { r: 229/255, g: 231/255, b: 235/255 };
const G300 = { r: 209/255, g: 213/255, b: 219/255 };
const G400 = { r: 156/255, g: 163/255, b: 175/255 };
const G500 = { r: 107/255, g: 114/255, b: 128/255 };
const G600 = { r: 75/255, g: 85/255, b: 99/255 };
const G700 = { r: 55/255, g: 65/255, b: 81/255 };
const G800 = { r: 31/255, g: 41/255, b: 55/255 };
const GREEN50 = { r: 240/255, g: 253/255, b: 244/255 };
const GREEN400 = { r: 74/255, g: 222/255, b: 128/255 };
const GREEN500 = { r: 34/255, g: 197/255, b: 94/255 };
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const BLUE50 = { r: 239/255, g: 246/255, b: 255/255 };
const BLUE200 = { r: 191/255, g: 219/255, b: 254/255 };
const BLUE500 = { r: 59/255, g: 130/255, b: 246/255 };
const BLUE600 = { r: 37/255, g: 99/255, b: 235/255 };
const RED50 = { r: 254/255, g: 242/255, b: 242/255 };
const RED500 = { r: 239/255, g: 68/255, b: 68/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };
const AMBER400 = { r: 251/255, g: 191/255, b: 36/255 };
const AMBER500 = { r: 245/255, g: 158/255, b: 11/255 };
const PURPLE50 = { r: 250/255, g: 245/255, b: 255/255 };
const PURPLE500 = { r: 168/255, g: 85/255, b: 247/255 };

const SC = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 4, spread: 0, visible: true, blendMode: 'NORMAL' };
const SM = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' };
const SL = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 8 }, radius: 28, spread: 0, visible: true, blendMode: 'NORMAL' };

await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Medium" });
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Bold" });

function t(s, sz, wt, c, w) {
  const n = figma.createText(); n.characters = s; n.fontSize = sz;
  n.fontName = { family: "Inter", style: wt === 700 ? "Bold" : wt === 600 ? "Semi Bold" : wt === 500 ? "Medium" : "Regular" };
  n.fills = [{ type: 'SOLID', color: c }];
  if (w) { n.resize(w, n.height); n.textAutoResize = 'HEIGHT'; }
  return n;
}

function sp(h) { const s = figma.createFrame(); s.resize(10, h); s.fills = []; return s; }

// ==========================================
// CONCEPT A: Sparklines + Trend Badges
// ==========================================
const conceptA = figma.createFrame();
conceptA.name = 'A: Sparklines + Trend Badges';
conceptA.resize(W, 600);
conceptA.fills = [{ type: 'SOLID', color: SURFACE }];
conceptA.layoutMode = 'VERTICAL';
conceptA.primaryAxisSizingMode = 'AUTO';
conceptA.counterAxisSizingMode = 'FIXED';
conceptA.paddingTop = 24; conceptA.paddingBottom = 24;
conceptA.paddingLeft = 16; conceptA.paddingRight = 16;
conceptA.itemSpacing = 12;

// Title
const titleA = figma.createFrame();
titleA.layoutMode = 'VERTICAL'; titleA.fills = []; titleA.itemSpacing = 4;
titleA.resize(358, 1); titleA.primaryAxisSizingMode = 'AUTO'; titleA.counterAxisSizingMode = 'FIXED';
titleA.appendChild(t('Concept A', 20, 700, G800));
titleA.appendChild(t('Sparklines + Trend Badges', 14, 500, P600));
titleA.appendChild(t('Each card has a mini trend chart and month-over-month indicator', 12, 400, G500, 358));
conceptA.appendChild(titleA);
conceptA.appendChild(sp(4));

function sparkCard(title, value, trendText, trendUp, iconLetter, iconBg, iconFg, sparkColor, cw) {
  const c = figma.createFrame(); c.name = title;
  c.layoutMode = 'VERTICAL'; c.fills = [{ type: 'SOLID', color: WHITE }];
  c.cornerRadius = 16; c.effects = [SC];
  c.paddingTop = 14; c.paddingBottom = 14; c.paddingLeft = 14; c.paddingRight = 14;
  c.itemSpacing = 8; c.layoutGrow = 1;
  c.primaryAxisSizingMode = 'AUTO';

  // Top row: icon + trend badge
  const top = figma.createFrame();
  top.layoutMode = 'HORIZONTAL'; top.fills = [];
  top.resize(cw, 1); top.primaryAxisSizingMode = 'FIXED'; top.counterAxisSizingMode = 'AUTO';
  top.primaryAxisAlignItems = 'SPACE_BETWEEN'; top.counterAxisAlignItems = 'CENTER';

  const ib = figma.createFrame(); ib.resize(32, 32);
  ib.fills = [{ type: 'SOLID', color: iconBg }]; ib.cornerRadius = 10;
  ib.layoutMode = 'HORIZONTAL'; ib.primaryAxisAlignItems = 'CENTER'; ib.counterAxisAlignItems = 'CENTER';
  ib.appendChild(t(iconLetter, 13, 700, iconFg));
  top.appendChild(ib);

  const badge = figma.createFrame();
  badge.layoutMode = 'HORIZONTAL';
  badge.fills = [{ type: 'SOLID', color: trendUp ? GREEN50 : (trendText === '0' ? G100 : RED50) }];
  badge.cornerRadius = 999; badge.paddingLeft = 6; badge.paddingRight = 6;
  badge.paddingTop = 3; badge.paddingBottom = 3;
  badge.primaryAxisSizingMode = 'AUTO'; badge.counterAxisSizingMode = 'AUTO';
  badge.itemSpacing = 2;
  const arrowColor = trendUp ? GREEN600 : (trendText === '0' ? G400 : RED500);
  if (trendText !== '0') badge.appendChild(t(trendUp ? '↑' : '↓', 9, 700, arrowColor));
  badge.appendChild(t(trendText, 10, 600, arrowColor));
  top.appendChild(badge);
  c.appendChild(top);

  // Value
  c.appendChild(t(value, 22, 700, G800));

  // Sparkline area
  const sparkH = 28;
  const sparkFrame = figma.createFrame();
  sparkFrame.resize(cw, sparkH); sparkFrame.fills = [];
  sparkFrame.primaryAxisSizingMode = 'FIXED'; sparkFrame.counterAxisSizingMode = 'FIXED';
  sparkFrame.clipsContent = true;

  // Create gradient area under spark
  const area = figma.createRectangle();
  area.resize(cw, sparkH);
  area.fills = [{ type: 'SOLID', color: sparkColor, opacity: 0.06 }];
  area.cornerRadius = 4;
  sparkFrame.appendChild(area); area.x = 0; area.y = 0;

  // Spark dots and lines
  const pts = title === 'Properties' ? [20, 20, 18, 18, 14, 10, 8]
    : title === 'Rooms Filled' ? [8, 10, 12, 14, 18, 20, 22]
    : title === 'Expected' ? [22, 18, 20, 14, 12, 8, 6]
    : [10, 10, 10, 10, 10, 10, 10];

  const step = cw / (pts.length - 1);
  for (let i = 0; i < pts.length; i++) {
    const dot = figma.createEllipse();
    dot.resize(i === pts.length - 1 ? 6 : 4, i === pts.length - 1 ? 6 : 4);
    dot.fills = [{ type: 'SOLID', color: sparkColor }];
    if (i === pts.length - 1) dot.effects = [{ type: 'DROP_SHADOW', color: { ...sparkColor, a: 0.3 }, offset: { x: 0, y: 0 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }];
    sparkFrame.appendChild(dot);
    dot.x = i * step - (i === pts.length - 1 ? 3 : 2);
    dot.y = pts[i] - (i === pts.length - 1 ? 3 : 2);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const line = figma.createLine();
    const dx = step;
    const dy = pts[i + 1] - pts[i];
    const len = Math.sqrt(dx * dx + dy * dy);
    line.resize(len, 0);
    line.rotation = -Math.atan2(dy, dx) * (180 / Math.PI);
    line.strokes = [{ type: 'SOLID', color: sparkColor }];
    line.strokeWeight = 2;
    line.opacity = 0.6;
    sparkFrame.appendChild(line);
    line.x = i * step; line.y = pts[i];
  }
  c.appendChild(sparkFrame);

  // Label + period
  const labelRow = figma.createFrame();
  labelRow.layoutMode = 'HORIZONTAL'; labelRow.fills = [];
  labelRow.resize(cw, 1); labelRow.primaryAxisSizingMode = 'FIXED'; labelRow.counterAxisSizingMode = 'AUTO';
  labelRow.primaryAxisAlignItems = 'SPACE_BETWEEN'; labelRow.counterAxisAlignItems = 'CENTER';
  labelRow.appendChild(t(title, 12, 500, G500));
  labelRow.appendChild(t('3 months', 10, 400, G400));
  c.appendChild(labelRow);

  return c;
}

const gridA = figma.createFrame();
gridA.layoutMode = 'VERTICAL'; gridA.fills = []; gridA.itemSpacing = 12;
gridA.resize(358, 1); gridA.primaryAxisSizingMode = 'AUTO'; gridA.counterAxisSizingMode = 'FIXED';

const rowA1 = figma.createFrame();
rowA1.layoutMode = 'HORIZONTAL'; rowA1.fills = []; rowA1.itemSpacing = 12;
rowA1.resize(358, 1); rowA1.primaryAxisSizingMode = 'FIXED'; rowA1.counterAxisSizingMode = 'AUTO';
rowA1.appendChild(sparkCard('Properties', '3', '+1', true, 'P', P50, P600, P600, 145));
rowA1.appendChild(sparkCard('Rooms Filled', '1/4', '-25%', false, 'R', BLUE50, BLUE600, BLUE500, 145));
gridA.appendChild(rowA1);

const rowA2 = figma.createFrame();
rowA2.layoutMode = 'HORIZONTAL'; rowA2.fills = []; rowA2.itemSpacing = 12;
rowA2.resize(358, 1); rowA2.primaryAxisSizingMode = 'FIXED'; rowA2.counterAxisSizingMode = 'AUTO';
rowA2.appendChild(sparkCard('Expected', 'RM500', '+8%', true, 'E', GREEN50, GREEN600, GREEN500, 145));
rowA2.appendChild(sparkCard('Overdue', '0', '0', true, 'O', G100, G500, G400, 145));
gridA.appendChild(rowA2);
conceptA.appendChild(gridA);
conceptA.x = 0; conceptA.y = 0;

// ==========================================
// CONCEPT B: Progress Rings + Horizontal
// ==========================================
const conceptB = figma.createFrame();
conceptB.name = 'B: Progress Rings + Scroll';
conceptB.resize(W, 580);
conceptB.fills = [{ type: 'SOLID', color: SURFACE }];
conceptB.layoutMode = 'VERTICAL';
conceptB.primaryAxisSizingMode = 'AUTO';
conceptB.counterAxisSizingMode = 'FIXED';
conceptB.paddingTop = 24; conceptB.paddingBottom = 24;
conceptB.paddingLeft = 16; conceptB.paddingRight = 16;
conceptB.itemSpacing = 12;

const titleB = figma.createFrame();
titleB.layoutMode = 'VERTICAL'; titleB.fills = []; titleB.itemSpacing = 4;
titleB.resize(358, 1); titleB.primaryAxisSizingMode = 'AUTO'; titleB.counterAxisSizingMode = 'FIXED';
titleB.appendChild(t('Concept B', 20, 700, G800));
titleB.appendChild(t('Progress Rings + Horizontal Scroll', 14, 500, P600));
titleB.appendChild(t('Circular progress for key rates. Swipeable cards.', 12, 400, G500, 358));
conceptB.appendChild(titleB);
conceptB.appendChild(sp(4));

function ringCard(title, value, subtitle, pct, ringColor, ringBgColor, accentBg) {
  const c = figma.createFrame(); c.name = title;
  c.layoutMode = 'VERTICAL'; c.counterAxisAlignItems = 'CENTER';
  c.fills = [{ type: 'SOLID', color: WHITE }];
  c.cornerRadius = 20; c.effects = [SM];
  c.paddingTop = 20; c.paddingBottom = 16; c.paddingLeft = 20; c.paddingRight = 20;
  c.itemSpacing = 12;
  c.resize(160, 1); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';

  // Ring
  const ringFrame = figma.createFrame();
  ringFrame.resize(64, 64); ringFrame.fills = [];

  const bgRing = figma.createEllipse();
  bgRing.resize(64, 64); bgRing.fills = [];
  bgRing.strokes = [{ type: 'SOLID', color: ringBgColor }]; bgRing.strokeWeight = 5;
  ringFrame.appendChild(bgRing);

  if (pct > 0) {
    const fgRing = figma.createEllipse();
    fgRing.resize(64, 64); fgRing.fills = [];
    fgRing.strokes = [{ type: 'SOLID', color: ringColor }]; fgRing.strokeWeight = 5;
    fgRing.strokeCap = 'ROUND';
    fgRing.arcData = { startingAngle: -Math.PI / 2, endingAngle: -Math.PI / 2 + (2 * Math.PI * pct / 100), innerRadius: 0.84 };
    ringFrame.appendChild(fgRing);
  }

  const pctLabel = t(pct + '%', 14, 700, ringColor);
  ringFrame.appendChild(pctLabel);
  pctLabel.x = pct === 100 ? 16 : pct < 10 ? 24 : 20; pctLabel.y = 23;
  c.appendChild(ringFrame);

  // Value
  c.appendChild(t(value, 20, 700, G800));

  // Label
  c.appendChild(t(title, 12, 500, G500));

  // Subtitle
  if (subtitle) c.appendChild(t(subtitle, 10, 400, G400));

  return c;
}

// Scroll row with 3 ring cards
const scrollRow = figma.createFrame();
scrollRow.name = 'Ring Cards';
scrollRow.layoutMode = 'HORIZONTAL'; scrollRow.fills = [];
scrollRow.resize(358, 1); scrollRow.primaryAxisSizingMode = 'FIXED'; scrollRow.counterAxisSizingMode = 'AUTO';
scrollRow.itemSpacing = 12; scrollRow.clipsContent = true;

scrollRow.appendChild(ringCard('Occupancy', '1 / 4', 'rooms filled', 25, BLUE500, BLUE200, BLUE50));
scrollRow.appendChild(ringCard('Collection', 'RM500', 'of RM500', 100, GREEN500, { r: 187/255, g: 247/255, b: 208/255 }, GREEN50));
// Third card partially visible to hint scrolling
const thirdCard = ringCard('On Time', '100%', 'payment rate', 100, PURPLE500, { r: 233/255, g: 213/255, b: 255/255 }, PURPLE50);
scrollRow.appendChild(thirdCard);
conceptB.appendChild(scrollRow);

// Bottom row: compact stat pills
const pillRow = figma.createFrame();
pillRow.layoutMode = 'HORIZONTAL'; pillRow.fills = []; pillRow.itemSpacing = 10;
pillRow.resize(358, 1); pillRow.primaryAxisSizingMode = 'FIXED'; pillRow.counterAxisSizingMode = 'AUTO';

function statPill(label, value, dotColor) {
  const p = figma.createFrame();
  p.layoutMode = 'HORIZONTAL'; p.fills = [{ type: 'SOLID', color: WHITE }];
  p.cornerRadius = 12; p.effects = [SC];
  p.paddingTop = 10; p.paddingBottom = 10; p.paddingLeft = 12; p.paddingRight = 14;
  p.itemSpacing = 8; p.counterAxisAlignItems = 'CENTER';
  p.layoutGrow = 1; p.primaryAxisSizingMode = 'FIXED';

  const dot = figma.createFrame(); dot.resize(8, 8);
  dot.fills = [{ type: 'SOLID', color: dotColor }]; dot.cornerRadius = 999;
  p.appendChild(dot);

  const info = figma.createFrame();
  info.layoutMode = 'HORIZONTAL'; info.fills = []; info.itemSpacing = 6;
  info.primaryAxisSizingMode = 'AUTO'; info.counterAxisSizingMode = 'AUTO';
  info.counterAxisAlignItems = 'CENTER';
  info.appendChild(t(value, 15, 700, G800));
  info.appendChild(t(label, 11, 500, G500));
  p.appendChild(info);
  return p;
}

pillRow.appendChild(statPill('Properties', '3', P600));
pillRow.appendChild(statPill('Overdue', '0', GREEN500));
pillRow.appendChild(statPill('Vacant', '3', AMBER500));
conceptB.appendChild(pillRow);

conceptB.x = W + 60; conceptB.y = 0;

// ==========================================
// CONCEPT C: Summary Strip + Drill-down
// ==========================================
const conceptC = figma.createFrame();
conceptC.name = 'C: Summary Strip + Drill-down';
conceptC.resize(W, 700);
conceptC.fills = [{ type: 'SOLID', color: SURFACE }];
conceptC.layoutMode = 'VERTICAL';
conceptC.primaryAxisSizingMode = 'AUTO';
conceptC.counterAxisSizingMode = 'FIXED';
conceptC.paddingTop = 24; conceptC.paddingBottom = 24;
conceptC.paddingLeft = 16; conceptC.paddingRight = 16;
conceptC.itemSpacing = 12;

const titleC = figma.createFrame();
titleC.layoutMode = 'VERTICAL'; titleC.fills = []; titleC.itemSpacing = 4;
titleC.resize(358, 1); titleC.primaryAxisSizingMode = 'AUTO'; titleC.counterAxisSizingMode = 'FIXED';
titleC.appendChild(t('Concept C', 20, 700, G800));
titleC.appendChild(t('Summary Strip + Drill-down', 14, 500, P600));
titleC.appendChild(t('Single card with all stats. Tap any to expand inline details.', 12, 400, G500, 358));
conceptC.appendChild(titleC);
conceptC.appendChild(sp(4));

// Main summary card (collapsed)
const sumCard = figma.createFrame(); sumCard.name = 'Summary Card (collapsed)';
sumCard.layoutMode = 'VERTICAL'; sumCard.fills = [{ type: 'SOLID', color: WHITE }];
sumCard.cornerRadius = 20; sumCard.effects = [SM];
sumCard.resize(358, 1); sumCard.primaryAxisSizingMode = 'AUTO'; sumCard.counterAxisSizingMode = 'FIXED';
sumCard.paddingTop = 20; sumCard.paddingBottom = 16;
sumCard.paddingLeft = 0; sumCard.paddingRight = 0;
sumCard.itemSpacing = 16;

// 4 stat columns
const statsRow = figma.createFrame();
statsRow.layoutMode = 'HORIZONTAL'; statsRow.fills = [];
statsRow.resize(358, 1); statsRow.primaryAxisSizingMode = 'FIXED'; statsRow.counterAxisSizingMode = 'AUTO';

function statCol(value, label, accent, isLast) {
  const wrapper = figma.createFrame();
  wrapper.layoutMode = 'HORIZONTAL'; wrapper.fills = [];
  wrapper.layoutGrow = 1; wrapper.primaryAxisSizingMode = 'FIXED';
  wrapper.counterAxisSizingMode = 'AUTO';

  const col = figma.createFrame();
  col.layoutMode = 'VERTICAL'; col.counterAxisAlignItems = 'CENTER';
  col.fills = []; col.itemSpacing = 6;
  col.layoutGrow = 1; col.primaryAxisSizingMode = 'AUTO';

  // Accent dot
  const dot = figma.createFrame(); dot.resize(6, 6);
  dot.fills = [{ type: 'SOLID', color: accent }]; dot.cornerRadius = 999;
  col.appendChild(dot);

  col.appendChild(t(value, 22, 700, G800));

  const lbl = t(label, 11, 500, G500);
  lbl.textAlignHorizontal = 'CENTER';
  col.appendChild(lbl);

  wrapper.appendChild(col);

  // Divider (except last)
  if (!isLast) {
    const div = figma.createRectangle();
    div.resize(1, 50); div.fills = [{ type: 'SOLID', color: G200 }];
    wrapper.appendChild(div);
  }

  return wrapper;
}

statsRow.appendChild(statCol('3', 'Properties', P600, false));
statsRow.appendChild(statCol('1/4', 'Rooms', BLUE500, false));
statsRow.appendChild(statCol('RM500', 'Income', GREEN500, false));
statsRow.appendChild(statCol('0', 'Overdue', G400, true));
sumCard.appendChild(statsRow);

// Tap hint
const hintBar = figma.createFrame();
hintBar.layoutMode = 'HORIZONTAL'; hintBar.fills = [{ type: 'SOLID', color: G50 }];
hintBar.resize(358, 1); hintBar.primaryAxisSizingMode = 'FIXED'; hintBar.counterAxisSizingMode = 'AUTO';
hintBar.primaryAxisAlignItems = 'CENTER'; hintBar.counterAxisAlignItems = 'CENTER';
hintBar.paddingTop = 8; hintBar.paddingBottom = 8;
hintBar.cornerRadius = 0;
hintBar.appendChild(t('Tap any stat for details  ↓', 12, 500, P600));
sumCard.appendChild(hintBar);
conceptC.appendChild(sumCard);

// Expanded version with drill-down
const sumExpanded = figma.createFrame(); sumExpanded.name = 'Summary Card (expanded: Rooms)';
sumExpanded.layoutMode = 'VERTICAL'; sumExpanded.fills = [{ type: 'SOLID', color: WHITE }];
sumExpanded.cornerRadius = 20; sumExpanded.effects = [SL];
sumExpanded.resize(358, 1); sumExpanded.primaryAxisSizingMode = 'AUTO'; sumExpanded.counterAxisSizingMode = 'FIXED';
sumExpanded.paddingTop = 20; sumExpanded.paddingBottom = 20;
sumExpanded.paddingLeft = 0; sumExpanded.paddingRight = 0;
sumExpanded.itemSpacing = 0;

// Stat columns (rooms highlighted)
const statsRow2 = figma.createFrame();
statsRow2.layoutMode = 'HORIZONTAL'; statsRow2.fills = [];
statsRow2.resize(358, 1); statsRow2.primaryAxisSizingMode = 'FIXED'; statsRow2.counterAxisSizingMode = 'AUTO';

function statColHL(value, label, accent, isActive, isLast) {
  const wrapper = figma.createFrame();
  wrapper.layoutMode = 'HORIZONTAL'; wrapper.fills = [];
  wrapper.layoutGrow = 1; wrapper.primaryAxisSizingMode = 'FIXED';
  wrapper.counterAxisSizingMode = 'AUTO';

  const col = figma.createFrame();
  col.layoutMode = 'VERTICAL'; col.counterAxisAlignItems = 'CENTER';
  col.fills = isActive ? [{ type: 'SOLID', color: { r: 239/255, g: 246/255, b: 255/255 } }] : [];
  col.itemSpacing = 6; col.layoutGrow = 1;
  col.primaryAxisSizingMode = 'AUTO';
  col.paddingTop = 8; col.paddingBottom = 8;
  if (isActive) col.cornerRadius = 12;

  const dot = figma.createFrame(); dot.resize(6, 6);
  dot.fills = [{ type: 'SOLID', color: accent }]; dot.cornerRadius = 999;
  col.appendChild(dot);
  col.appendChild(t(value, 22, 700, isActive ? BLUE600 : G800));
  const lbl = t(label, 11, isActive ? 600 : 500, isActive ? BLUE600 : G500);
  lbl.textAlignHorizontal = 'CENTER';
  col.appendChild(lbl);
  wrapper.appendChild(col);

  if (!isLast) {
    const div = figma.createRectangle();
    div.resize(1, 56); div.fills = [{ type: 'SOLID', color: G200 }];
    wrapper.appendChild(div);
  }
  return wrapper;
}

statsRow2.appendChild(statColHL('3', 'Properties', P600, false, false));
statsRow2.appendChild(statColHL('1/4', 'Rooms', BLUE500, true, false));
statsRow2.appendChild(statColHL('RM500', 'Income', GREEN500, false, false));
statsRow2.appendChild(statColHL('0', 'Overdue', G400, false, true));
sumExpanded.appendChild(statsRow2);

// Expanded detail panel
const detailPanel = figma.createFrame(); detailPanel.name = 'Detail Panel';
detailPanel.layoutMode = 'VERTICAL'; detailPanel.fills = [{ type: 'SOLID', color: G50 }];
detailPanel.resize(358, 1); detailPanel.primaryAxisSizingMode = 'AUTO'; detailPanel.counterAxisSizingMode = 'FIXED';
detailPanel.paddingTop = 16; detailPanel.paddingBottom = 16;
detailPanel.paddingLeft = 20; detailPanel.paddingRight = 20;
detailPanel.itemSpacing = 14;

// Header
const detHdr = figma.createFrame();
detHdr.layoutMode = 'HORIZONTAL'; detHdr.fills = [];
detHdr.resize(318, 1); detHdr.primaryAxisSizingMode = 'FIXED'; detHdr.counterAxisSizingMode = 'AUTO';
detHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; detHdr.counterAxisAlignItems = 'CENTER';
detHdr.appendChild(t('Room Occupancy', 14, 700, G800));
detHdr.appendChild(t('↑ Collapse', 12, 500, P600));
detailPanel.appendChild(detHdr);

// Property breakdown bars
const propBreakdown = [
  ['Rumah Teres Bangi', '1/4 rooms', 25, AMBER400],
  ['Apt Shah Alam', '0/3 rooms', 0, G300],
];
for (const [name, label, pct, barColor] of propBreakdown) {
  const pRow = figma.createFrame();
  pRow.layoutMode = 'VERTICAL'; pRow.fills = [];
  pRow.resize(318, 1); pRow.primaryAxisSizingMode = 'AUTO'; pRow.counterAxisSizingMode = 'FIXED';
  pRow.itemSpacing = 6;

  const pLblRow = figma.createFrame();
  pLblRow.layoutMode = 'HORIZONTAL'; pLblRow.fills = [];
  pLblRow.resize(318, 1); pLblRow.primaryAxisSizingMode = 'FIXED'; pLblRow.counterAxisSizingMode = 'AUTO';
  pLblRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pLblRow.appendChild(t(name, 13, 500, G800));
  pLblRow.appendChild(t(label, 12, 400, G500));
  pRow.appendChild(pLblRow);

  const barBg = figma.createFrame();
  barBg.resize(318, 8); barBg.fills = [{ type: 'SOLID', color: G200 }]; barBg.cornerRadius = 999;
  if (pct > 0) {
    const barFill = figma.createRectangle();
    barFill.resize(Math.max(318 * pct / 100, 8), 8);
    barFill.fills = [{ type: 'SOLID', color: barColor }];
    barFill.cornerRadius = 999;
    barBg.appendChild(barFill); barFill.x = 0; barFill.y = 0;
  }
  pRow.appendChild(barBg);
  detailPanel.appendChild(pRow);
}

// View all link
const viewAll = figma.createFrame();
viewAll.layoutMode = 'HORIZONTAL'; viewAll.fills = [];
viewAll.resize(318, 1); viewAll.primaryAxisSizingMode = 'FIXED'; viewAll.counterAxisSizingMode = 'AUTO';
viewAll.primaryAxisAlignItems = 'MAX';
viewAll.appendChild(t('View all properties →', 12, 600, P600));
detailPanel.appendChild(viewAll);

sumExpanded.appendChild(detailPanel);
conceptC.appendChild(sumExpanded);

conceptC.x = (W + 60) * 2; conceptC.y = 0;

figma.notify('3 metrics concepts created on creative mode page!');

})();
