// ============================================
// SewaKita — Billing Workflow: Two Design Options
// Run on: "Landlord Flow" page
// Option A: Aggregate card + property checklist
// Option B: Per-property swipeable cards
// ============================================

const W = 390;
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
const P100 = { r: 224/255, g: 242/255, b: 254/255 };
const P600 = { r: 0/255, g: 144/255, b: 209/255 };
const P700 = { r: 0/255, g: 112/255, b: 163/255 };
const G50 = { r: 249/255, g: 250/255, b: 251/255 };
const G100 = { r: 243/255, g: 244/255, b: 246/255 };
const G200 = { r: 229/255, g: 231/255, b: 235/255 };
const G300 = { r: 209/255, g: 213/255, b: 219/255 };
const G400 = { r: 156/255, g: 163/255, b: 175/255 };
const G500 = { r: 107/255, g: 114/255, b: 128/255 };
const G700 = { r: 55/255, g: 65/255, b: 81/255 };
const G800 = { r: 31/255, g: 41/255, b: 55/255 };
const GREEN50 = { r: 240/255, g: 253/255, b: 244/255 };
const GREEN500 = { r: 34/255, g: 197/255, b: 94/255 };
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };
const AMBER500 = { r: 245/255, g: 158/255, b: 11/255 };
const RED50 = { r: 254/255, g: 242/255, b: 242/255 };
const RED500 = { r: 239/255, g: 68/255, b: 68/255 };

const SC = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.06 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' };

await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Medium" });
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Bold" });

function txt(s, sz, wt, c, w) {
  const n = figma.createText(); n.characters = s; n.fontSize = sz;
  n.fontName = { family: "Inter", style: wt === 700 ? "Bold" : wt === 600 ? "Semi Bold" : wt === 500 ? "Medium" : "Regular" };
  n.fills = [{ type: 'SOLID', color: c }];
  if (w) { n.resize(w, n.height); n.textAutoResize = 'HEIGHT'; }
  return n;
}

function pill(text, bg, fg) {
  const b = figma.createFrame();
  b.layoutMode = 'HORIZONTAL'; b.fills = [{ type: 'SOLID', color: bg }];
  b.cornerRadius = 999; b.paddingLeft = 6; b.paddingRight = 6;
  b.paddingTop = 2; b.paddingBottom = 2;
  b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
  b.appendChild(txt(text, 10, 600, fg));
  return b;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// ====================================================================
// OPTION A: Aggregate card + property checklist below
// ====================================================================
const optA = figma.createFrame();
optA.name = 'Option A — Aggregate + Checklist';
optA.resize(W, 700);
optA.fills = [{ type: 'SOLID', color: SURFACE }];
optA.layoutMode = 'VERTICAL'; optA.primaryAxisSizingMode = 'AUTO';
optA.counterAxisSizingMode = 'FIXED';
optA.paddingTop = 16; optA.paddingBottom = 24;
optA.paddingLeft = 16; optA.paddingRight = 16;
optA.itemSpacing = 12;

// Label
optA.appendChild(txt('OPTION A: Aggregate + Property Checklist', 11, 700, P600, 358));

// Header
const headerA = figma.createFrame();
headerA.layoutMode = 'HORIZONTAL'; headerA.fills = [];
headerA.resize(358, 1); headerA.primaryAxisSizingMode = 'FIXED';
headerA.counterAxisSizingMode = 'AUTO';
headerA.primaryAxisAlignItems = 'SPACE_BETWEEN'; headerA.counterAxisAlignItems = 'CENTER';
headerA.appendChild(txt('Billing', 20, 700, G800));
headerA.appendChild(txt('◀  April 2026  ▶', 13, 600, G700));
optA.appendChild(headerA);

// Aggregate workflow card — shows overall status
const wfCard = figma.createFrame();
wfCard.layoutMode = 'VERTICAL'; wfCard.itemSpacing = 10;
wfCard.fills = [{ type: 'SOLID', color: WHITE }]; wfCard.cornerRadius = 16; wfCard.effects = [SC];
wfCard.paddingTop = 16; wfCard.paddingBottom = 16;
wfCard.paddingLeft = 16; wfCard.paddingRight = 16;
wfCard.resize(358, 1); wfCard.primaryAxisSizingMode = 'AUTO'; wfCard.counterAxisSizingMode = 'FIXED';

const wfTop = figma.createFrame();
wfTop.layoutMode = 'HORIZONTAL'; wfTop.fills = [];
wfTop.resize(326, 1); wfTop.primaryAxisSizingMode = 'FIXED';
wfTop.counterAxisSizingMode = 'AUTO';
wfTop.primaryAxisAlignItems = 'SPACE_BETWEEN'; wfTop.counterAxisAlignItems = 'CENTER';

const wfLeft = figma.createFrame();
wfLeft.layoutMode = 'VERTICAL'; wfLeft.fills = []; wfLeft.itemSpacing = 2;
wfLeft.primaryAxisSizingMode = 'AUTO'; wfLeft.counterAxisSizingMode = 'AUTO';
wfLeft.appendChild(txt('APRIL 2026', 12, 700, P600));
wfLeft.appendChild(txt('2 of 3 properties done', 13, 400, G500));
wfTop.appendChild(wfLeft);

// Step dots
const dots = figma.createFrame();
dots.layoutMode = 'HORIZONTAL'; dots.fills = []; dots.itemSpacing = 4;
dots.primaryAxisSizingMode = 'AUTO'; dots.counterAxisSizingMode = 'AUTO';
for (let i = 0; i < 4; i++) {
  const dot = figma.createEllipse();
  dot.resize(6, 6);
  dot.fills = [{ type: 'SOLID', color: i < 3 ? P600 : G300 }];
  dots.appendChild(dot);
  if (i < 3) {
    const line = figma.createRectangle();
    line.resize(12, 2); line.fills = [{ type: 'SOLID', color: i < 2 ? P600 : G300 }];
    dots.appendChild(line);
  }
}
wfTop.appendChild(dots);
wfCard.appendChild(wfTop);

// Progress bar
const progBg = figma.createFrame();
progBg.resize(326, 4); progBg.fills = [{ type: 'SOLID', color: G200 }]; progBg.cornerRadius = 999;
progBg.clipsContent = true;
const progFill = figma.createRectangle();
progFill.resize(217, 4); progFill.fills = [{ type: 'SOLID', color: GREEN500 }]; progFill.cornerRadius = 999;
progBg.appendChild(progFill);
wfCard.appendChild(progBg);

optA.appendChild(wfCard);

// Property checklist — per-property status
const checkHeader = figma.createFrame();
checkHeader.layoutMode = 'HORIZONTAL'; checkHeader.fills = [];
checkHeader.resize(358, 1); checkHeader.primaryAxisSizingMode = 'FIXED';
checkHeader.counterAxisSizingMode = 'AUTO';
checkHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
checkHeader.appendChild(txt('Property Status', 12, 700, G800));
checkHeader.appendChild(txt('Utilities  Bills', 10, 500, G400));
optA.appendChild(checkHeader);

const mkPropertyRow = (name, utilitiesDone, billsDone) => {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.itemSpacing = 10;
  row.fills = [{ type: 'SOLID', color: WHITE }]; row.cornerRadius = 12; row.effects = [SC];
  row.paddingTop = 12; row.paddingBottom = 12;
  row.paddingLeft = 12; row.paddingRight = 12;
  row.resize(358, 1); row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'FIXED';
  row.counterAxisAlignItems = 'CENTER';

  // Status indicator
  const indicator = figma.createRectangle();
  indicator.resize(3, 32); indicator.cornerRadius = 4;
  indicator.fills = [{ type: 'SOLID', color: billsDone ? GREEN500 : utilitiesDone ? AMBER500 : RED500 }];
  row.appendChild(indicator);

  // Name
  const nameCol = figma.createFrame();
  nameCol.layoutMode = 'VERTICAL'; nameCol.fills = []; nameCol.itemSpacing = 2;
  nameCol.layoutGrow = 1;
  nameCol.primaryAxisSizingMode = 'AUTO'; nameCol.counterAxisSizingMode = 'AUTO';
  nameCol.appendChild(txt(name, 13, 600, G800));
  nameCol.appendChild(txt(
    billsDone ? 'Bills sent ✓' : utilitiesDone ? 'Ready to generate' : 'Utilities needed',
    11, 400, billsDone ? GREEN600 : utilitiesDone ? AMBER500 : G400
  ));
  row.appendChild(nameCol);

  // Checkboxes
  const checks = figma.createFrame();
  checks.layoutMode = 'HORIZONTAL'; checks.fills = []; checks.itemSpacing = 16;
  checks.primaryAxisSizingMode = 'AUTO'; checks.counterAxisSizingMode = 'AUTO';

  const mkCheck = (done) => {
    const c = figma.createFrame();
    c.resize(20, 20); c.cornerRadius = 6;
    c.fills = [{ type: 'SOLID', color: done ? GREEN500 : WHITE }];
    if (!done) { c.strokes = [{ type: 'SOLID', color: G300 }]; c.strokeWeight = 1.5; }
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
    if (done) c.appendChild(txt('✓', 12, 700, WHITE));
    return c;
  };
  checks.appendChild(mkCheck(utilitiesDone));
  checks.appendChild(mkCheck(billsDone));
  row.appendChild(checks);

  // Arrow
  row.appendChild(txt('›', 16, 400, G300));

  return row;
};

optA.appendChild(mkPropertyRow('Kg Alor Gunong', true, true));
optA.appendChild(mkPropertyRow('No 5, Taman Fajar', true, false));
optA.appendChild(mkPropertyRow('Taman Melati', false, false));

// Annotation
const annotA = txt('✅ One glance = see all properties\n✅ Tap a row to enter utilities or generate\n✅ Green/amber/red = instant status\n⚠️ Aggregate card less actionable', 11, 400, G500, 358);
optA.appendChild(annotA);

optA.x = startX; optA.y = 0;
figma.currentPage.appendChild(optA);

// ====================================================================
// OPTION B: Per-property swipeable cards
// ====================================================================
const optB = figma.createFrame();
optB.name = 'Option B — Per-Property Cards';
optB.resize(W, 700);
optB.fills = [{ type: 'SOLID', color: SURFACE }];
optB.layoutMode = 'VERTICAL'; optB.primaryAxisSizingMode = 'AUTO';
optB.counterAxisSizingMode = 'FIXED';
optB.paddingTop = 16; optB.paddingBottom = 24;
optB.paddingLeft = 16; optB.paddingRight = 16;
optB.itemSpacing = 12;

// Label
optB.appendChild(txt('OPTION B: Per-Property Swipeable Cards', 11, 700, P600, 358));

// Header
const headerB = figma.createFrame();
headerB.layoutMode = 'HORIZONTAL'; headerB.fills = [];
headerB.resize(358, 1); headerB.primaryAxisSizingMode = 'FIXED';
headerB.counterAxisSizingMode = 'AUTO';
headerB.primaryAxisAlignItems = 'SPACE_BETWEEN'; headerB.counterAxisAlignItems = 'CENTER';
headerB.appendChild(txt('Billing', 20, 700, G800));
headerB.appendChild(txt('◀  April 2026  ▶', 13, 600, G700));
optB.appendChild(headerB);

// Swipe indicator
const swipeRow = figma.createFrame();
swipeRow.layoutMode = 'HORIZONTAL'; swipeRow.fills = [];
swipeRow.resize(358, 1); swipeRow.primaryAxisSizingMode = 'FIXED';
swipeRow.counterAxisSizingMode = 'AUTO';
swipeRow.primaryAxisAlignItems = 'CENTER';
const swipeDots = figma.createFrame();
swipeDots.layoutMode = 'HORIZONTAL'; swipeDots.fills = []; swipeDots.itemSpacing = 6;
swipeDots.primaryAxisSizingMode = 'AUTO'; swipeDots.counterAxisSizingMode = 'AUTO';
for (let i = 0; i < 3; i++) {
  const d = figma.createFrame();
  d.resize(i === 0 ? 20 : 6, 6); d.cornerRadius = 3;
  d.fills = [{ type: 'SOLID', color: i === 0 ? P600 : G300 }];
  d.primaryAxisSizingMode = 'FIXED'; d.counterAxisSizingMode = 'FIXED';
  swipeDots.appendChild(d);
}
swipeRow.appendChild(swipeDots);
optB.appendChild(swipeRow);

// Card 1 — active property (full card)
const card1 = figma.createFrame();
card1.layoutMode = 'VERTICAL'; card1.itemSpacing = 10;
card1.fills = [{ type: 'SOLID', color: WHITE }]; card1.cornerRadius = 16; card1.effects = [SC];
card1.strokes = [{ type: 'SOLID', color: P600 }]; card1.strokeWeight = 2;
card1.paddingTop = 16; card1.paddingBottom = 16;
card1.paddingLeft = 16; card1.paddingRight = 16;
card1.resize(358, 1); card1.primaryAxisSizingMode = 'AUTO'; card1.counterAxisSizingMode = 'FIXED';

const card1Top = figma.createFrame();
card1Top.layoutMode = 'HORIZONTAL'; card1Top.fills = [];
card1Top.resize(326, 1); card1Top.primaryAxisSizingMode = 'FIXED';
card1Top.counterAxisSizingMode = 'AUTO';
card1Top.primaryAxisAlignItems = 'SPACE_BETWEEN'; card1Top.counterAxisAlignItems = 'CENTER';

const card1Left = figma.createFrame();
card1Left.layoutMode = 'VERTICAL'; card1Left.fills = []; card1Left.itemSpacing = 2;
card1Left.primaryAxisSizingMode = 'AUTO'; card1Left.counterAxisSizingMode = 'AUTO';
card1Left.appendChild(txt('Kg Alor Gunong', 15, 700, G800));
card1Left.appendChild(txt('3 utilities entered', 12, 400, G500));
card1Top.appendChild(card1Left);
card1Top.appendChild(pill('Ready', GREEN50, GREEN600));
card1.appendChild(card1Top);

// CTA
const cta1 = figma.createFrame();
cta1.layoutMode = 'HORIZONTAL'; cta1.itemSpacing = 6;
cta1.fills = [{ type: 'SOLID', color: P600 }]; cta1.cornerRadius = 12;
cta1.paddingTop = 14; cta1.paddingBottom = 14;
cta1.primaryAxisAlignItems = 'CENTER'; cta1.counterAxisAlignItems = 'CENTER';
cta1.resize(326, 48); cta1.primaryAxisSizingMode = 'FIXED'; cta1.counterAxisSizingMode = 'FIXED';
cta1.appendChild(txt('Semak & jana bil →', 14, 600, WHITE));
card1.appendChild(cta1);
optB.appendChild(card1);

// Card 2 — peek of next property (partially visible, faded)
const card2 = figma.createFrame();
card2.layoutMode = 'VERTICAL'; card2.itemSpacing = 8;
card2.fills = [{ type: 'SOLID', color: WHITE }]; card2.cornerRadius = 16; card2.effects = [SC];
card2.paddingTop = 14; card2.paddingBottom = 14;
card2.paddingLeft = 16; card2.paddingRight = 16;
card2.resize(358, 1); card2.primaryAxisSizingMode = 'AUTO'; card2.counterAxisSizingMode = 'FIXED';
card2.opacity = 0.5;

const card2Top = figma.createFrame();
card2Top.layoutMode = 'HORIZONTAL'; card2Top.fills = [];
card2Top.resize(326, 1); card2Top.primaryAxisSizingMode = 'FIXED';
card2Top.counterAxisSizingMode = 'AUTO';
card2Top.primaryAxisAlignItems = 'SPACE_BETWEEN'; card2Top.counterAxisAlignItems = 'CENTER';

const card2Left = figma.createFrame();
card2Left.layoutMode = 'VERTICAL'; card2Left.fills = []; card2Left.itemSpacing = 2;
card2Left.primaryAxisSizingMode = 'AUTO'; card2Left.counterAxisSizingMode = 'AUTO';
card2Left.appendChild(txt('No 5, Taman Fajar', 14, 600, G700));
card2Left.appendChild(txt('No utilities yet', 11, 400, G400));
card2Top.appendChild(card2Left);
card2Top.appendChild(pill('Pending', AMBER50, AMBER500));
card2.appendChild(card2Top);
optB.appendChild(card2);

// Annotation
const annotB = txt('✅ Each property = its own card with clear CTA\n✅ Swipe left/right to switch properties\n✅ Current property = bordered + full actions\n⚠️ Can\'t see all properties at once\n⚠️ More swipe interactions needed', 11, 400, G500, 358);
optB.appendChild(annotB);

// Comparison summary
const vsCard = figma.createFrame();
vsCard.layoutMode = 'VERTICAL'; vsCard.itemSpacing = 8;
vsCard.fills = [{ type: 'SOLID', color: P50 }]; vsCard.cornerRadius = 14;
vsCard.paddingTop = 14; vsCard.paddingBottom = 14;
vsCard.paddingLeft = 14; vsCard.paddingRight = 14;
vsCard.resize(358, 1); vsCard.primaryAxisSizingMode = 'AUTO'; vsCard.counterAxisSizingMode = 'FIXED';
vsCard.appendChild(txt('RECOMMENDATION', 10, 700, P600));
vsCard.appendChild(txt('Option A for landlords with 2-5 properties:\n→ See all properties at a glance\n→ Tap any property to take action\n→ Color-coded status = instant overview\n\nOption B for landlords with 1 property:\n→ Simpler, focused experience\n→ Less visual clutter', 11, 400, G700, 330));
optB.appendChild(vsCard);

optB.x = startX + W + 40; optB.y = 0;
figma.currentPage.appendChild(optB);

figma.viewport.scrollAndZoomIntoView([optA, optB]);
console.log('✓ Created 2 billing workflow options');
