// ============================================
// SewaKita — Photo OCR + Smart Templates (Tier 1 automation)
// Run on: "Landlord Flow" page
// 3 screens: Smart Entry, Scan Result, Anomaly Warning
// ============================================

const W = 390;
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
const P100 = { r: 224/255, g: 242/255, b: 254/255 };
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
const G900 = { r: 17/255, g: 24/255, b: 39/255 };
const GREEN50 = { r: 240/255, g: 253/255, b: 244/255 };
const GREEN100 = { r: 220/255, g: 252/255, b: 231/255 };
const GREEN500 = { r: 34/255, g: 197/255, b: 94/255 };
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const GREEN700 = { r: 21/255, g: 128/255, b: 61/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };
const AMBER100 = { r: 254/255, g: 243/255, b: 199/255 };
const AMBER500 = { r: 245/255, g: 158/255, b: 11/255 };
const AMBER600 = { r: 217/255, g: 119/255, b: 6/255 };
const AMBER700 = { r: 180/255, g: 83/255, b: 9/255 };
const RED50 = { r: 254/255, g: 242/255, b: 242/255 };
const RED100 = { r: 254/255, g: 226/255, b: 226/255 };
const RED500 = { r: 239/255, g: 68/255, b: 68/255 };
const RED600 = { r: 220/255, g: 38/255, b: 38/255 };
const RED700 = { r: 185/255, g: 28/255, b: 28/255 };

const SC = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 4, spread: 0, visible: true, blendMode: 'NORMAL' };
const SM = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' };
const SL = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' };

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

function badge(text, bg, fg) {
  const b = figma.createFrame();
  b.layoutMode = 'HORIZONTAL'; b.fills = [{ type: 'SOLID', color: bg }];
  b.cornerRadius = 999; b.paddingLeft = 8; b.paddingRight = 8;
  b.paddingTop = 2; b.paddingBottom = 2;
  b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
  b.appendChild(t(text, 11, 600, fg));
  return b;
}

function divider(w) {
  const d = figma.createRectangle();
  d.resize(w, 1); d.fills = [{ type: 'SOLID', color: G200 }];
  return d;
}

function card(w, padding = 16) {
  const c = figma.createFrame();
  c.layoutMode = 'VERTICAL'; c.itemSpacing = 12;
  c.fills = [{ type: 'SOLID', color: WHITE }];
  c.cornerRadius = 16; c.effects = [SC];
  c.paddingTop = padding; c.paddingBottom = padding;
  c.paddingLeft = padding; c.paddingRight = padding;
  c.resize(w, 1); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  return c;
}

function button(label, bg, fg, w, icon) {
  const b = figma.createFrame();
  b.layoutMode = 'HORIZONTAL'; b.itemSpacing = 8;
  b.fills = [{ type: 'SOLID', color: bg }]; b.cornerRadius = 12;
  b.paddingTop = 14; b.paddingBottom = 14; b.paddingLeft = 16; b.paddingRight = 16;
  b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER';
  b.resize(w, 48); b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED';
  if (icon) b.appendChild(t(icon, 16, 600, fg));
  b.appendChild(t(label, 15, 600, fg));
  return b;
}

function confBar(pct, color) {
  const bar = figma.createFrame();
  bar.layoutMode = 'HORIZONTAL'; bar.fills = [{ type: 'SOLID', color: G200 }];
  bar.cornerRadius = 999; bar.resize(40, 4);
  bar.primaryAxisSizingMode = 'FIXED'; bar.counterAxisSizingMode = 'FIXED';
  bar.clipsContent = true;
  const fill = figma.createRectangle();
  fill.resize(40 * pct, 4); fill.fills = [{ type: 'SOLID', color }];
  bar.appendChild(fill);
  return bar;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// ====================================================================
// SCREEN 1: SMART ENTRY — utility entry with pre-fill + Scan CTA
// ====================================================================
const s1 = figma.createFrame();
s1.name = 'OCR — Smart Entry';
s1.resize(W, 780);
s1.fills = [{ type: 'SOLID', color: SURFACE }];
s1.layoutMode = 'VERTICAL'; s1.primaryAxisSizingMode = 'AUTO';
s1.counterAxisSizingMode = 'FIXED';
s1.paddingTop = 16; s1.paddingBottom = 24;
s1.paddingLeft = 16; s1.paddingRight = 16;
s1.itemSpacing = 16;

// Header row
const s1Header = figma.createFrame();
s1Header.layoutMode = 'HORIZONTAL'; s1Header.fills = [];
s1Header.resize(358, 1); s1Header.primaryAxisSizingMode = 'FIXED';
s1Header.counterAxisSizingMode = 'AUTO'; s1Header.counterAxisAlignItems = 'CENTER';
s1Header.primaryAxisAlignItems = 'SPACE_BETWEEN';
const s1H = figma.createFrame();
s1H.layoutMode = 'VERTICAL'; s1H.fills = []; s1H.itemSpacing = 2;
s1H.primaryAxisSizingMode = 'AUTO'; s1H.counterAxisSizingMode = 'AUTO';
s1H.appendChild(t('Bil Elektrik', 20, 700, G800));
s1H.appendChild(t('April 2026 · Taman Mutiara', 13, 400, G500));
s1Header.appendChild(s1H);
s1Header.appendChild(badge('STEP 1 OF 3', P100, P700));
s1.appendChild(s1Header);

// Big scan card — primary action
const scanCard = figma.createFrame();
scanCard.name = 'Scan CTA Card';
scanCard.layoutMode = 'VERTICAL'; scanCard.itemSpacing = 12;
scanCard.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
  { color: { ...P600, a: 1 }, position: 0 },
  { color: { ...P700, a: 1 }, position: 1 }
], gradientTransform: [[1, 0, 0], [0, 1, 0]] }];
scanCard.cornerRadius = 20; scanCard.effects = [SM];
scanCard.paddingTop = 20; scanCard.paddingBottom = 20;
scanCard.paddingLeft = 20; scanCard.paddingRight = 20;
scanCard.resize(358, 1); scanCard.primaryAxisSizingMode = 'AUTO';
scanCard.counterAxisSizingMode = 'FIXED'; scanCard.counterAxisAlignItems = 'CENTER';

// camera icon placeholder (circle with emoji)
const camIcon = figma.createFrame();
camIcon.resize(56, 56); camIcon.cornerRadius = 999;
camIcon.fills = [{ type: 'SOLID', color: WHITE, opacity: 0.2 }];
camIcon.layoutMode = 'HORIZONTAL';
camIcon.primaryAxisAlignItems = 'CENTER'; camIcon.counterAxisAlignItems = 'CENTER';
camIcon.primaryAxisSizingMode = 'FIXED'; camIcon.counterAxisSizingMode = 'FIXED';
camIcon.appendChild(t('📸', 28, 400, WHITE));
scanCard.appendChild(camIcon);

scanCard.appendChild(t('Imbas bil TNB anda', 17, 700, WHITE));
const sub = t('Snap gambar bil kertas atau PDF.\nKami baca jumlahnya untuk anda.', 13, 400, { r: 1, g: 1, b: 1 }, 318);
sub.textAlignHorizontal = 'CENTER';
sub.opacity = 0.85;
scanCard.appendChild(sub);

// scan button
const scanBtn = figma.createFrame();
scanBtn.layoutMode = 'HORIZONTAL'; scanBtn.itemSpacing = 6;
scanBtn.fills = [{ type: 'SOLID', color: WHITE }]; scanBtn.cornerRadius = 12;
scanBtn.paddingTop = 12; scanBtn.paddingBottom = 12;
scanBtn.paddingLeft = 20; scanBtn.paddingRight = 20;
scanBtn.primaryAxisAlignItems = 'CENTER'; scanBtn.counterAxisAlignItems = 'CENTER';
scanBtn.primaryAxisSizingMode = 'AUTO'; scanBtn.counterAxisSizingMode = 'AUTO';
scanBtn.appendChild(t('Scan Bill', 15, 700, P700));
scanCard.appendChild(scanBtn);

// confidence nudge
const trustRow = figma.createFrame();
trustRow.layoutMode = 'HORIZONTAL'; trustRow.fills = []; trustRow.itemSpacing = 6;
trustRow.primaryAxisSizingMode = 'AUTO'; trustRow.counterAxisSizingMode = 'AUTO';
trustRow.counterAxisAlignItems = 'CENTER';
const trustText = t('Accurate 94% · ~20 sec', 11, 500, WHITE);
trustText.opacity = 0.75;
trustRow.appendChild(trustText);
scanCard.appendChild(trustRow);

s1.appendChild(scanCard);

// Divider text
const orRow = figma.createFrame();
orRow.layoutMode = 'HORIZONTAL'; orRow.fills = []; orRow.itemSpacing = 12;
orRow.resize(358, 1); orRow.primaryAxisSizingMode = 'FIXED';
orRow.counterAxisSizingMode = 'AUTO'; orRow.counterAxisAlignItems = 'CENTER';
const line1 = figma.createRectangle(); line1.resize(150, 1);
line1.fills = [{ type: 'SOLID', color: G200 }]; line1.layoutGrow = 1;
orRow.appendChild(line1);
orRow.appendChild(t('atau key-in manual', 12, 500, G400));
const line2 = figma.createRectangle(); line2.resize(150, 1);
line2.fills = [{ type: 'SOLID', color: G200 }]; line2.layoutGrow = 1;
orRow.appendChild(line2);
s1.appendChild(orRow);

// Smart template card — pre-fill with history context
const tmplCard = card(358, 16);
tmplCard.itemSpacing = 14;

// history context strip
const histRow = figma.createFrame();
histRow.layoutMode = 'HORIZONTAL'; histRow.fills = []; histRow.itemSpacing = 8;
histRow.resize(326, 1); histRow.primaryAxisSizingMode = 'FIXED';
histRow.counterAxisSizingMode = 'AUTO';

const mkHist = (label, value, isLast) => {
  const h = figma.createFrame();
  h.layoutMode = 'VERTICAL'; h.itemSpacing = 2;
  h.fills = [{ type: 'SOLID', color: isLast ? P50 : G50 }];
  h.cornerRadius = 10;
  h.paddingTop = 8; h.paddingBottom = 8; h.paddingLeft = 10; h.paddingRight = 10;
  h.layoutGrow = 1;
  h.primaryAxisSizingMode = 'AUTO'; h.counterAxisSizingMode = 'AUTO';
  h.appendChild(t(label, 10, 500, isLast ? P700 : G500));
  h.appendChild(t(value, 13, 700, isLast ? P800 : G700));
  return h;
};
histRow.appendChild(mkHist('JAN', 'RM180', false));
histRow.appendChild(mkHist('FEB', 'RM165', false));
histRow.appendChild(mkHist('MAR', 'RM180', true));
tmplCard.appendChild(histRow);

// "3-month avg" footer line
const avgLine = figma.createFrame();
avgLine.layoutMode = 'HORIZONTAL'; avgLine.fills = [];
avgLine.primaryAxisSizingMode = 'AUTO'; avgLine.counterAxisSizingMode = 'AUTO';
avgLine.itemSpacing = 6; avgLine.counterAxisAlignItems = 'CENTER';
avgLine.appendChild(t('📊', 12, 400, G500));
avgLine.appendChild(t('Purata 3 bulan: RM 175', 12, 500, G500));
tmplCard.appendChild(avgLine);

// input field — pre-filled
const inputLabel = t('Jumlah bil bulan ini', 13, 500, G700);
tmplCard.appendChild(inputLabel);

const amtInput = figma.createFrame();
amtInput.layoutMode = 'HORIZONTAL'; amtInput.itemSpacing = 8;
amtInput.fills = [{ type: 'SOLID', color: WHITE }];
amtInput.strokes = [{ type: 'SOLID', color: P600 }]; amtInput.strokeWeight = 2;
amtInput.cornerRadius = 12;
amtInput.paddingLeft = 16; amtInput.paddingRight = 16;
amtInput.counterAxisAlignItems = 'CENTER';
amtInput.resize(326, 56); amtInput.primaryAxisSizingMode = 'FIXED'; amtInput.counterAxisSizingMode = 'FIXED';
amtInput.appendChild(t('RM', 18, 500, G400));
amtInput.appendChild(t('180', 22, 700, G900));
// prefilled badge pushed right
const spacer = figma.createFrame(); spacer.fills = []; spacer.layoutGrow = 1;
spacer.resize(1, 1); spacer.primaryAxisSizingMode = 'FIXED'; spacer.counterAxisSizingMode = 'AUTO';
amtInput.appendChild(spacer);
amtInput.appendChild(badge('Pre-filled', P100, P700));
tmplCard.appendChild(amtInput);

// primary CTA
const okBtn = button('✓ Looks right — save', P600, WHITE, 326);
tmplCard.appendChild(okBtn);

s1.appendChild(tmplCard);

// Secondary link
const editLink = figma.createFrame();
editLink.layoutMode = 'HORIZONTAL'; editLink.fills = [];
editLink.primaryAxisSizingMode = 'AUTO'; editLink.counterAxisSizingMode = 'AUTO';
editLink.itemSpacing = 4; editLink.counterAxisAlignItems = 'CENTER';
editLink.layoutAlign = 'CENTER';
editLink.appendChild(t('Edit amount', 13, 500, G500));
s1.appendChild(editLink);

s1.x = startX; s1.y = 0;
figma.currentPage.appendChild(s1);

// ====================================================================
// SCREEN 2: SCAN RESULT — shows extracted fields with confidence
// ====================================================================
const s2 = figma.createFrame();
s2.name = 'OCR — Scan Result';
s2.resize(W, 860);
s2.fills = [{ type: 'SOLID', color: SURFACE }];
s2.layoutMode = 'VERTICAL'; s2.primaryAxisSizingMode = 'AUTO';
s2.counterAxisSizingMode = 'FIXED';
s2.paddingTop = 16; s2.paddingBottom = 24;
s2.paddingLeft = 16; s2.paddingRight = 16;
s2.itemSpacing = 16;

// Header with back
const s2Header = figma.createFrame();
s2Header.layoutMode = 'HORIZONTAL'; s2Header.fills = []; s2Header.itemSpacing = 12;
s2Header.resize(358, 1); s2Header.primaryAxisSizingMode = 'FIXED';
s2Header.counterAxisSizingMode = 'AUTO'; s2Header.counterAxisAlignItems = 'CENTER';
s2Header.appendChild(t('←', 24, 400, G700));
const s2H = figma.createFrame();
s2H.layoutMode = 'VERTICAL'; s2H.fills = []; s2H.itemSpacing = 2;
s2H.primaryAxisSizingMode = 'AUTO'; s2H.counterAxisSizingMode = 'AUTO';
s2H.appendChild(t('Scan result', 20, 700, G800));
s2H.appendChild(t('TNB · April 2026', 13, 400, G500));
s2Header.appendChild(s2H);
s2.appendChild(s2Header);

// Scanned image preview
const imgPreview = figma.createFrame();
imgPreview.name = 'Scanned image';
imgPreview.layoutMode = 'VERTICAL'; imgPreview.itemSpacing = 0;
imgPreview.fills = [{ type: 'SOLID', color: G800 }];
imgPreview.cornerRadius = 16;
imgPreview.resize(358, 160); imgPreview.primaryAxisSizingMode = 'FIXED';
imgPreview.counterAxisSizingMode = 'FIXED';
imgPreview.primaryAxisAlignItems = 'CENTER'; imgPreview.counterAxisAlignItems = 'CENTER';
imgPreview.clipsContent = true;
// mock TNB bill inside
const mockBill = figma.createFrame();
mockBill.fills = [{ type: 'SOLID', color: WHITE }];
mockBill.cornerRadius = 4; mockBill.resize(240, 140);
mockBill.layoutMode = 'VERTICAL'; mockBill.itemSpacing = 6;
mockBill.paddingTop = 12; mockBill.paddingBottom = 12;
mockBill.paddingLeft = 12; mockBill.paddingRight = 12;
mockBill.primaryAxisSizingMode = 'FIXED'; mockBill.counterAxisSizingMode = 'FIXED';
mockBill.effects = [SM];
mockBill.appendChild(t('TNB  ⚡', 11, 700, P700));
const ln1 = figma.createRectangle(); ln1.resize(100, 4);
ln1.fills = [{ type: 'SOLID', color: G200 }]; mockBill.appendChild(ln1);
const ln2 = figma.createRectangle(); ln2.resize(180, 4);
ln2.fills = [{ type: 'SOLID', color: G200 }]; mockBill.appendChild(ln2);
const ln3 = figma.createRectangle(); ln3.resize(140, 4);
ln3.fills = [{ type: 'SOLID', color: G200 }]; mockBill.appendChild(ln3);
// highlighted amount
const highlight = figma.createFrame();
highlight.layoutMode = 'HORIZONTAL'; highlight.itemSpacing = 4;
highlight.fills = [{ type: 'SOLID', color: AMBER100 }];
highlight.strokes = [{ type: 'SOLID', color: AMBER500 }]; highlight.strokeWeight = 1;
highlight.cornerRadius = 4;
highlight.paddingTop = 4; highlight.paddingBottom = 4;
highlight.paddingLeft = 6; highlight.paddingRight = 6;
highlight.primaryAxisSizingMode = 'AUTO'; highlight.counterAxisSizingMode = 'AUTO';
highlight.appendChild(t('RM 182.40', 13, 700, AMBER700));
mockBill.appendChild(highlight);
imgPreview.appendChild(mockBill);
s2.appendChild(imgPreview);

// Success banner
const successBanner = figma.createFrame();
successBanner.layoutMode = 'HORIZONTAL'; successBanner.itemSpacing = 10;
successBanner.fills = [{ type: 'SOLID', color: GREEN50 }];
successBanner.cornerRadius = 12;
successBanner.paddingTop = 12; successBanner.paddingBottom = 12;
successBanner.paddingLeft = 14; successBanner.paddingRight = 14;
successBanner.resize(358, 1); successBanner.primaryAxisSizingMode = 'FIXED';
successBanner.counterAxisSizingMode = 'AUTO'; successBanner.counterAxisAlignItems = 'CENTER';
successBanner.appendChild(t('✓', 18, 700, GREEN600));
const succText = figma.createFrame();
succText.layoutMode = 'VERTICAL'; succText.fills = []; succText.itemSpacing = 2;
succText.layoutGrow = 1;
succText.primaryAxisSizingMode = 'AUTO'; succText.counterAxisSizingMode = 'AUTO';
succText.appendChild(t('Scan berjaya', 13, 600, GREEN700));
succText.appendChild(t('3 medan dibaca dari bil TNB', 11, 400, GREEN700));
successBanner.appendChild(succText);
s2.appendChild(successBanner);

// Extracted fields card
const fieldsCard = card(358, 0);
fieldsCard.itemSpacing = 0;

const fieldsHeader = figma.createFrame();
fieldsHeader.layoutMode = 'HORIZONTAL'; fieldsHeader.fills = [];
fieldsHeader.paddingTop = 14; fieldsHeader.paddingBottom = 10;
fieldsHeader.paddingLeft = 16; fieldsHeader.paddingRight = 16;
fieldsHeader.resize(358, 1); fieldsHeader.primaryAxisSizingMode = 'FIXED';
fieldsHeader.counterAxisSizingMode = 'AUTO';
fieldsHeader.primaryAxisAlignItems = 'SPACE_BETWEEN'; fieldsHeader.counterAxisAlignItems = 'CENTER';
fieldsHeader.appendChild(t('Medan yang dibaca', 11, 700, G500));
fieldsHeader.appendChild(t('Confidence', 10, 500, G400));
fieldsCard.appendChild(fieldsHeader);
fieldsCard.appendChild(divider(358));

const mkField = (label, value, conf, confColor, isHero) => {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = []; row.itemSpacing = 12;
  row.paddingTop = 14; row.paddingBottom = 14;
  row.paddingLeft = 16; row.paddingRight = 16;
  row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED';
  row.counterAxisSizingMode = 'AUTO'; row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';

  const lv = figma.createFrame();
  lv.layoutMode = 'VERTICAL'; lv.fills = []; lv.itemSpacing = 2;
  lv.primaryAxisSizingMode = 'AUTO'; lv.counterAxisSizingMode = 'AUTO';
  lv.appendChild(t(label, 11, 500, G500));
  lv.appendChild(t(value, isHero ? 20 : 14, 700, isHero ? G900 : G800));
  row.appendChild(lv);

  const confGroup = figma.createFrame();
  confGroup.layoutMode = 'VERTICAL'; confGroup.fills = []; confGroup.itemSpacing = 4;
  confGroup.counterAxisAlignItems = 'MAX';
  confGroup.primaryAxisSizingMode = 'AUTO'; confGroup.counterAxisSizingMode = 'AUTO';
  confGroup.appendChild(t(Math.round(conf * 100) + '%', 11, 600, confColor));
  confGroup.appendChild(confBar(conf, confColor));
  row.appendChild(confGroup);
  return row;
};

fieldsCard.appendChild(mkField('Jumlah', 'RM 182.40', 0.98, GREEN600, true));
fieldsCard.appendChild(divider(358));
fieldsCard.appendChild(mkField('Tempoh bil', '01 Apr – 30 Apr 2026', 0.95, GREEN600, false));
fieldsCard.appendChild(divider(358));
fieldsCard.appendChild(mkField('Akaun', '220012345678', 0.72, AMBER600, false));
s2.appendChild(fieldsCard);

// Green nudge — normal range
const nudge = figma.createFrame();
nudge.layoutMode = 'HORIZONTAL'; nudge.itemSpacing = 10;
nudge.fills = [{ type: 'SOLID', color: GREEN50 }];
nudge.cornerRadius = 12;
nudge.paddingTop = 12; nudge.paddingBottom = 12;
nudge.paddingLeft = 14; nudge.paddingRight = 14;
nudge.resize(358, 1); nudge.primaryAxisSizingMode = 'FIXED';
nudge.counterAxisSizingMode = 'AUTO'; nudge.counterAxisAlignItems = 'CENTER';
nudge.appendChild(t('📊', 14, 400, GREEN700));
const nudgeText = figma.createFrame();
nudgeText.layoutMode = 'VERTICAL'; nudgeText.fills = []; nudgeText.itemSpacing = 2;
nudgeText.layoutGrow = 1;
nudgeText.primaryAxisSizingMode = 'AUTO'; nudgeText.counterAxisSizingMode = 'AUTO';
nudgeText.appendChild(t('+2% dari purata 3 bulan', 12, 600, GREEN700));
nudgeText.appendChild(t('Normal. Boleh teruskan.', 11, 400, GREEN700));
nudge.appendChild(nudgeText);
s2.appendChild(nudge);

// Actions
const actRow = figma.createFrame();
actRow.layoutMode = 'HORIZONTAL'; actRow.fills = []; actRow.itemSpacing = 8;
actRow.resize(358, 1); actRow.primaryAxisSizingMode = 'FIXED';
actRow.counterAxisSizingMode = 'AUTO';
const rescanBtn = button('Scan semula', WHITE, G700, 109);
rescanBtn.strokes = [{ type: 'SOLID', color: G300 }]; rescanBtn.strokeWeight = 1;
const editBtn = button('Edit', WHITE, G700, 80);
editBtn.strokes = [{ type: 'SOLID', color: G300 }]; editBtn.strokeWeight = 1;
const acceptBtn = button('✓ Terima', P600, WHITE, 153);
actRow.appendChild(rescanBtn);
actRow.appendChild(editBtn);
actRow.appendChild(acceptBtn);
s2.appendChild(actRow);

s2.x = startX + W + 40; s2.y = 0;
figma.currentPage.appendChild(s2);

// ====================================================================
// SCREEN 3: ANOMALY WARNING — amount deviates significantly
// ====================================================================
const s3 = figma.createFrame();
s3.name = 'OCR — Anomaly Warning';
s3.resize(W, 820);
s3.fills = [{ type: 'SOLID', color: SURFACE }];
s3.layoutMode = 'VERTICAL'; s3.primaryAxisSizingMode = 'AUTO';
s3.counterAxisSizingMode = 'FIXED';
s3.paddingTop = 16; s3.paddingBottom = 24;
s3.paddingLeft = 16; s3.paddingRight = 16;
s3.itemSpacing = 16;

// Header
const s3Header = figma.createFrame();
s3Header.layoutMode = 'HORIZONTAL'; s3Header.fills = []; s3Header.itemSpacing = 12;
s3Header.resize(358, 1); s3Header.primaryAxisSizingMode = 'FIXED';
s3Header.counterAxisSizingMode = 'AUTO'; s3Header.counterAxisAlignItems = 'CENTER';
s3Header.appendChild(t('←', 24, 400, G700));
const s3H = figma.createFrame();
s3H.layoutMode = 'VERTICAL'; s3H.fills = []; s3H.itemSpacing = 2;
s3H.primaryAxisSizingMode = 'AUTO'; s3H.counterAxisSizingMode = 'AUTO';
s3H.appendChild(t('Scan result', 20, 700, G800));
s3H.appendChild(t('TNB · April 2026', 13, 400, G500));
s3Header.appendChild(s3H);
s3.appendChild(s3Header);

// Big anomaly warning hero
const warnCard = figma.createFrame();
warnCard.name = 'Anomaly Warning';
warnCard.layoutMode = 'VERTICAL'; warnCard.itemSpacing = 14;
warnCard.fills = [{ type: 'SOLID', color: AMBER50 }];
warnCard.strokes = [{ type: 'SOLID', color: AMBER500 }]; warnCard.strokeWeight = 2;
warnCard.cornerRadius = 20;
warnCard.paddingTop = 20; warnCard.paddingBottom = 20;
warnCard.paddingLeft = 20; warnCard.paddingRight = 20;
warnCard.resize(358, 1); warnCard.primaryAxisSizingMode = 'AUTO';
warnCard.counterAxisSizingMode = 'FIXED';

// icon + title row
const warnHead = figma.createFrame();
warnHead.layoutMode = 'HORIZONTAL'; warnHead.fills = []; warnHead.itemSpacing = 12;
warnHead.primaryAxisSizingMode = 'AUTO'; warnHead.counterAxisSizingMode = 'AUTO';
warnHead.counterAxisAlignItems = 'CENTER';
const warnIcon = figma.createFrame();
warnIcon.resize(40, 40); warnIcon.cornerRadius = 999;
warnIcon.fills = [{ type: 'SOLID', color: AMBER500 }];
warnIcon.layoutMode = 'HORIZONTAL';
warnIcon.primaryAxisAlignItems = 'CENTER'; warnIcon.counterAxisAlignItems = 'CENTER';
warnIcon.primaryAxisSizingMode = 'FIXED'; warnIcon.counterAxisSizingMode = 'FIXED';
warnIcon.appendChild(t('⚠', 20, 700, WHITE));
warnHead.appendChild(warnIcon);
warnHead.appendChild(t('Double-check this bill', 16, 700, AMBER700));
warnCard.appendChild(warnHead);

// Big amount
const amountRow = figma.createFrame();
amountRow.layoutMode = 'HORIZONTAL'; amountRow.fills = []; amountRow.itemSpacing = 12;
amountRow.counterAxisAlignItems = 'CENTER';
amountRow.primaryAxisSizingMode = 'AUTO'; amountRow.counterAxisSizingMode = 'AUTO';
const bigNum = t('RM 282.40', 32, 700, G900);
amountRow.appendChild(bigNum);
const deltaBadge = figma.createFrame();
deltaBadge.layoutMode = 'HORIZONTAL'; deltaBadge.itemSpacing = 2;
deltaBadge.fills = [{ type: 'SOLID', color: RED100 }];
deltaBadge.cornerRadius = 999;
deltaBadge.paddingTop = 4; deltaBadge.paddingBottom = 4;
deltaBadge.paddingLeft = 10; deltaBadge.paddingRight = 10;
deltaBadge.primaryAxisSizingMode = 'AUTO'; deltaBadge.counterAxisSizingMode = 'AUTO';
deltaBadge.counterAxisAlignItems = 'CENTER';
deltaBadge.appendChild(t('↑ 61%', 13, 700, RED700));
amountRow.appendChild(deltaBadge);
warnCard.appendChild(amountRow);

// Explanation
warnCard.appendChild(t('This is 61% higher than your 3-month average of RM 175. Please verify the bill before sending to tenants.', 13, 400, AMBER700, 318));

// compare bars
const compare = figma.createFrame();
compare.layoutMode = 'VERTICAL'; compare.itemSpacing = 10;
compare.fills = [{ type: 'SOLID', color: WHITE }]; compare.cornerRadius = 12;
compare.paddingTop = 12; compare.paddingBottom = 12;
compare.paddingLeft = 12; compare.paddingRight = 12;
compare.resize(318, 1); compare.primaryAxisSizingMode = 'AUTO';
compare.counterAxisSizingMode = 'FIXED';

const mkCompareRow = (label, value, width, barColor, isScan) => {
  const r = figma.createFrame();
  r.layoutMode = 'VERTICAL'; r.fills = []; r.itemSpacing = 4;
  r.primaryAxisSizingMode = 'AUTO'; r.counterAxisSizingMode = 'FIXED';
  r.resize(294, 1);
  const lr = figma.createFrame();
  lr.layoutMode = 'HORIZONTAL'; lr.fills = [];
  lr.resize(294, 1); lr.primaryAxisSizingMode = 'FIXED';
  lr.counterAxisSizingMode = 'AUTO';
  lr.primaryAxisAlignItems = 'SPACE_BETWEEN';
  lr.appendChild(t(label, 11, 500, G500));
  lr.appendChild(t(value, 11, isScan ? 700 : 500, isScan ? G900 : G600));
  r.appendChild(lr);
  const bBg = figma.createFrame();
  bBg.fills = [{ type: 'SOLID', color: G100 }]; bBg.cornerRadius = 4;
  bBg.resize(294, 6);
  bBg.primaryAxisSizingMode = 'FIXED'; bBg.counterAxisSizingMode = 'FIXED';
  bBg.clipsContent = true;
  const bFill = figma.createRectangle();
  bFill.resize(width, 6); bFill.fills = [{ type: 'SOLID', color: barColor }];
  bFill.cornerRadius = 4;
  bBg.appendChild(bFill);
  r.appendChild(bBg);
  return r;
};

compare.appendChild(mkCompareRow('Jan 2026', 'RM 180', 188, G300, false));
compare.appendChild(mkCompareRow('Feb 2026', 'RM 165', 172, G300, false));
compare.appendChild(mkCompareRow('Mar 2026', 'RM 180', 188, G300, false));
compare.appendChild(mkCompareRow('Apr 2026 (scanned)', 'RM 282', 294, RED500, true));

warnCard.appendChild(compare);
s3.appendChild(warnCard);

// OCR field detail (collapsible style)
const ocrCard = card(358, 0);
ocrCard.itemSpacing = 0;
const ocrHeader = figma.createFrame();
ocrHeader.layoutMode = 'HORIZONTAL'; ocrHeader.fills = [];
ocrHeader.paddingTop = 14; ocrHeader.paddingBottom = 14;
ocrHeader.paddingLeft = 16; ocrHeader.paddingRight = 16;
ocrHeader.resize(358, 1); ocrHeader.primaryAxisSizingMode = 'FIXED';
ocrHeader.counterAxisSizingMode = 'AUTO';
ocrHeader.primaryAxisAlignItems = 'SPACE_BETWEEN'; ocrHeader.counterAxisAlignItems = 'CENTER';
const ocrLeft = figma.createFrame();
ocrLeft.layoutMode = 'VERTICAL'; ocrLeft.fills = []; ocrLeft.itemSpacing = 2;
ocrLeft.primaryAxisSizingMode = 'AUTO'; ocrLeft.counterAxisSizingMode = 'AUTO';
ocrLeft.appendChild(t('Scanned amount', 11, 500, G500));
ocrLeft.appendChild(t('RM 282.40', 15, 700, G800));
ocrHeader.appendChild(ocrLeft);
const ocrRight = figma.createFrame();
ocrRight.layoutMode = 'HORIZONTAL'; ocrRight.fills = []; ocrRight.itemSpacing = 8;
ocrRight.counterAxisAlignItems = 'CENTER';
ocrRight.primaryAxisSizingMode = 'AUTO'; ocrRight.counterAxisSizingMode = 'AUTO';
ocrRight.appendChild(t('97%', 11, 600, GREEN600));
ocrRight.appendChild(confBar(0.97, GREEN600));
ocrHeader.appendChild(ocrRight);
ocrCard.appendChild(ocrHeader);
s3.appendChild(ocrCard);

// 3 action buttons
const actRow3 = figma.createFrame();
actRow3.layoutMode = 'VERTICAL'; actRow3.fills = []; actRow3.itemSpacing = 8;
actRow3.resize(358, 1); actRow3.primaryAxisSizingMode = 'AUTO';
actRow3.counterAxisSizingMode = 'FIXED';

const rescanBtn3 = button('📸  Rescan bill', WHITE, G700, 358);
rescanBtn3.strokes = [{ type: 'SOLID', color: G300 }]; rescanBtn3.strokeWeight = 1;
const editBtn3 = button('✎  Edit amount manually', WHITE, G700, 358);
editBtn3.strokes = [{ type: 'SOLID', color: G300 }]; editBtn3.strokeWeight = 1;
const acceptBtn3 = button('Accept anyway — RM 282.40', AMBER600, WHITE, 358);

actRow3.appendChild(rescanBtn3);
actRow3.appendChild(editBtn3);
actRow3.appendChild(acceptBtn3);
s3.appendChild(actRow3);

s3.x = startX + (W + 40) * 2; s3.y = 0;
figma.currentPage.appendChild(s3);

// Focus viewport
figma.viewport.scrollAndZoomIntoView([s1, s2, s3]);

console.log('✓ Created 3 OCR/Smart Template screens');
