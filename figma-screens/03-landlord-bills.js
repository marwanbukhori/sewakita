// ============================================
// SewaKita - Landlord: Bills Page (Monthly + Utility tabs)
// Run on: "Landlord Flow" page
// ============================================

const W = 390;
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
const P600 = { r: 0/255, g: 144/255, b: 209/255 };
const P700 = { r: 0/255, g: 112/255, b: 163/255 };
const P800 = { r: 0/255, g: 85/255, b: 128/255 };
const G100 = { r: 243/255, g: 244/255, b: 246/255 };
const G200 = { r: 229/255, g: 231/255, b: 235/255 };
const G400 = { r: 156/255, g: 163/255, b: 175/255 };
const G500 = { r: 107/255, g: 114/255, b: 128/255 };
const G600 = { r: 75/255, g: 85/255, b: 99/255 };
const G700 = { r: 55/255, g: 65/255, b: 81/255 };
const G800 = { r: 31/255, g: 41/255, b: 55/255 };
const GREEN50 = { r: 240/255, g: 253/255, b: 244/255 };
const GREEN300 = { r: 134/255, g: 239/255, b: 172/255 };
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const GREEN700 = { r: 21/255, g: 128/255, b: 61/255 };
const AMBER300 = { r: 252/255, g: 211/255, b: 77/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };
const AMBER700 = { r: 180/255, g: 83/255, b: 9/255 };
const RED50 = { r: 254/255, g: 242/255, b: 242/255 };
const RED700 = { r: 185/255, g: 28/255, b: 28/255 };

const SC = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 4, spread: 0, visible: true, blendMode: 'NORMAL' };
const SM = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' };

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
  b.appendChild(t(text, 12, 500, fg));
  return b;
}

function inp(label, ph, w) {
  const g = figma.createFrame(); g.name = label;
  g.layoutMode = 'VERTICAL'; g.itemSpacing = 6; g.fills = [];
  g.resize(w, 1); g.primaryAxisSizingMode = 'AUTO'; g.counterAxisSizingMode = 'FIXED';
  g.appendChild(t(label, 14, 500, G700, w));
  const i = figma.createFrame(); i.layoutMode = 'HORIZONTAL'; i.resize(w, 44);
  i.primaryAxisSizingMode = 'FIXED'; i.counterAxisSizingMode = 'FIXED';
  i.fills = [{ type: 'SOLID', color: WHITE }]; i.strokes = [{ type: 'SOLID', color: G200 }];
  i.strokeWeight = 1; i.cornerRadius = 8; i.paddingLeft = 12; i.paddingRight = 12;
  i.counterAxisAlignItems = 'CENTER';
  i.appendChild(t(ph, 16, 400, G400));
  g.appendChild(i); return g;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// =====================
// BILLS PAGE - Monthly Tab
// =====================
const bills = figma.createFrame();
bills.name = 'Bills - Monthly';
bills.resize(W, 1200);
bills.fills = [{ type: 'SOLID', color: SURFACE }];
bills.layoutMode = 'VERTICAL'; bills.primaryAxisSizingMode = 'AUTO';
bills.counterAxisSizingMode = 'FIXED';
bills.paddingTop = 16; bills.paddingBottom = 24;
bills.paddingLeft = 16; bills.paddingRight = 16;
bills.itemSpacing = 16;

// Tab switcher
const tabs = figma.createFrame(); tabs.name = 'Tab Switcher';
tabs.layoutMode = 'HORIZONTAL'; tabs.resize(358, 48);
tabs.primaryAxisSizingMode = 'FIXED'; tabs.counterAxisSizingMode = 'FIXED';
tabs.fills = [{ type: 'SOLID', color: G100 }]; tabs.cornerRadius = 16;
tabs.paddingLeft = 6; tabs.paddingRight = 6; tabs.paddingTop = 6; tabs.paddingBottom = 6;
tabs.itemSpacing = 4;

const tab1 = figma.createFrame();
tab1.layoutMode = 'HORIZONTAL'; tab1.layoutGrow = 1;
tab1.resize(1, 36); tab1.counterAxisSizingMode = 'FIXED';
tab1.primaryAxisAlignItems = 'CENTER'; tab1.counterAxisAlignItems = 'CENTER';
tab1.fills = [{ type: 'SOLID', color: WHITE }]; tab1.cornerRadius = 12; tab1.effects = [SM];
tab1.appendChild(t('Bil Bulanan', 14, 600, P700));

const tab2 = figma.createFrame();
tab2.layoutMode = 'HORIZONTAL'; tab2.layoutGrow = 1;
tab2.resize(1, 36); tab2.counterAxisSizingMode = 'FIXED';
tab2.primaryAxisAlignItems = 'CENTER'; tab2.counterAxisAlignItems = 'CENTER';
tab2.fills = []; tab2.cornerRadius = 12;
tab2.appendChild(t('Utiliti & Jana', 14, 600, G400));

tabs.appendChild(tab1); tabs.appendChild(tab2);
bills.appendChild(tabs);

// Summary Hero Card
const hero = figma.createFrame(); hero.name = 'Summary Card';
hero.resize(358, 1); hero.primaryAxisSizingMode = 'AUTO'; hero.counterAxisSizingMode = 'FIXED';
hero.layoutMode = 'VERTICAL';
hero.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
  { color: { ...P600, a: 1 }, position: 0 },
  { color: { ...P700, a: 1 }, position: 0.5 },
  { color: { ...P800, a: 1 }, position: 1 }
], gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]] }];
hero.cornerRadius = 16; hero.effects = [SM];
hero.paddingTop = 16; hero.paddingBottom = 16; hero.paddingLeft = 16; hero.paddingRight = 16;
hero.itemSpacing = 12;

// Progress label
const progRow = figma.createFrame();
progRow.layoutMode = 'HORIZONTAL'; progRow.fills = [];
progRow.resize(326, 1); progRow.primaryAxisSizingMode = 'FIXED'; progRow.counterAxisSizingMode = 'AUTO';
progRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
progRow.appendChild(t('Collection Rate', 12, 500, WHITE));
progRow.appendChild(t('78%', 14, 700, WHITE));
hero.appendChild(progRow);

// Progress bar
const pBg = figma.createFrame();
pBg.resize(326, 6); pBg.fills = [{ type: 'SOLID', color: WHITE, opacity: 0.2 }]; pBg.cornerRadius = 999;
const pFill = figma.createRectangle();
pFill.resize(254, 6); pFill.fills = [{ type: 'SOLID', color: WHITE }]; pFill.cornerRadius = 999;
pBg.appendChild(pFill); pFill.x = 0; pFill.y = 0;
hero.appendChild(pBg);

// 3-col stats
const statsGrid = figma.createFrame();
statsGrid.layoutMode = 'HORIZONTAL'; statsGrid.fills = []; statsGrid.itemSpacing = 8;
statsGrid.resize(326, 1); statsGrid.primaryAxisSizingMode = 'FIXED'; statsGrid.counterAxisSizingMode = 'AUTO';

const statItems = [
  ['EXPECTED', 'RM3,200', WHITE],
  ['COLLECTED', 'RM2,500', GREEN300],
  ['OUTSTANDING', 'RM700', AMBER300],
];
for (const [label, value, valColor] of statItems) {
  const stat = figma.createFrame();
  stat.layoutMode = 'VERTICAL'; stat.counterAxisAlignItems = 'CENTER';
  stat.fills = [{ type: 'SOLID', color: WHITE, opacity: 0.1 }];
  stat.cornerRadius = 12; stat.paddingTop = 10; stat.paddingBottom = 10;
  stat.paddingLeft = 8; stat.paddingRight = 8;
  stat.itemSpacing = 4; stat.layoutGrow = 1;
  stat.primaryAxisSizingMode = 'AUTO';
  stat.appendChild(t(label, 10, 500, WHITE));
  stat.appendChild(t(value, 14, 700, valColor));
  statsGrid.appendChild(stat);
}
hero.appendChild(statsGrid);
bills.appendChild(hero);

// Month picker
bills.appendChild(inp('Month', 'April 2026', 358));

// Filter pills
const filters = figma.createFrame(); filters.name = 'Filters';
filters.layoutMode = 'HORIZONTAL'; filters.fills = []; filters.itemSpacing = 8;
filters.resize(358, 1); filters.primaryAxisSizingMode = 'FIXED'; filters.counterAxisSizingMode = 'AUTO';

const filterItems = [['Semua', true], ['Tertunggak', false], ['Belum Bayar', false], ['Selesai', false]];
for (const [label, active] of filterItems) {
  const pill = figma.createFrame();
  pill.layoutMode = 'HORIZONTAL';
  pill.fills = [{ type: 'SOLID', color: active ? P600 : WHITE }];
  if (!active) pill.effects = [SC];
  pill.cornerRadius = 999; pill.paddingLeft = 14; pill.paddingRight = 14;
  pill.paddingTop = 8; pill.paddingBottom = 8;
  pill.primaryAxisSizingMode = 'AUTO'; pill.counterAxisSizingMode = 'AUTO';
  pill.appendChild(t(label, 12, 600, active ? WHITE : G600));
  filters.appendChild(pill);
}
bills.appendChild(filters);

// Property grouped bills
const propSections = [
  {
    name: 'RUMAH TERES BANGI',
    count: '3 bil',
    bills: [
      { tenant: 'Ali bin Ahmad', room: 'A1', amount: 'RM850', status: 'Selesai', statusBg: GREEN50, statusFg: GREEN700 },
      { tenant: 'Siti Aminah', room: 'A2', amount: 'RM750', status: 'Tertunggak', statusBg: RED50, statusFg: RED700 },
      { tenant: 'Farid Hakim', room: 'B2', amount: 'RM650', status: 'Belum Bayar', statusBg: G100, statusFg: G600 },
    ]
  },
  {
    name: 'APARTMENT SHAH ALAM',
    count: '4 bil',
    bills: [
      { tenant: 'Razak Ismail', room: 'Unit 3A', amount: 'RM1,200', status: 'Selesai', statusBg: GREEN50, statusFg: GREEN700 },
      { tenant: 'Nora Hassan', room: 'Unit 5B', amount: 'RM950', status: 'Separa', statusBg: AMBER50, statusFg: AMBER700 },
    ]
  }
];

for (const section of propSections) {
  // Section header
  const sHdr = figma.createFrame();
  sHdr.layoutMode = 'HORIZONTAL'; sHdr.fills = [];
  sHdr.resize(358, 1); sHdr.primaryAxisSizingMode = 'FIXED'; sHdr.counterAxisSizingMode = 'AUTO';
  sHdr.primaryAxisAlignItems = 'SPACE_BETWEEN';
  sHdr.appendChild(t(section.name, 12, 700, G800));
  sHdr.appendChild(t(section.count, 14, 500, P600));
  bills.appendChild(sHdr);

  // Bills card
  const bCard = figma.createFrame(); bCard.name = section.name;
  bCard.layoutMode = 'VERTICAL'; bCard.resize(358, 1);
  bCard.primaryAxisSizingMode = 'AUTO'; bCard.counterAxisSizingMode = 'FIXED';
  bCard.fills = [{ type: 'SOLID', color: WHITE }]; bCard.cornerRadius = 16; bCard.effects = [SM];

  for (let i = 0; i < section.bills.length; i++) {
    const bill = section.bills[i];
    const row = figma.createFrame();
    row.layoutMode = 'HORIZONTAL'; row.fills = [];
    row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
    row.paddingTop = 12; row.paddingBottom = 12; row.paddingLeft = 16; row.paddingRight = 16;
    row.itemSpacing = 8; row.counterAxisAlignItems = 'CENTER';

    if (i > 0) {
      row.strokes = [{ type: 'SOLID', color: G100 }];
      row.strokesIncludedInLayout = false;
      row.strokeTopWeight = 1; row.strokeBottomWeight = 0;
      row.strokeLeftWeight = 0; row.strokeRightWeight = 0;
    }

    const info = figma.createFrame();
    info.layoutMode = 'VERTICAL'; info.fills = []; info.itemSpacing = 2;
    info.primaryAxisSizingMode = 'AUTO'; info.layoutGrow = 1;
    info.appendChild(t(bill.tenant, 14, 500, G800));
    info.appendChild(t(bill.room, 12, 400, G500));
    row.appendChild(info);

    row.appendChild(t(bill.amount, 14, 700, G800));
    row.appendChild(badge(bill.status, bill.statusBg, bill.statusFg));
    row.appendChild(t('v', 14, 400, G400));

    bCard.appendChild(row);
  }
  bills.appendChild(bCard);
}

// Floating WhatsApp button
const waFloat = figma.createFrame(); waFloat.name = 'WhatsApp Float';
waFloat.layoutMode = 'HORIZONTAL';
waFloat.fills = [{ type: 'SOLID', color: GREEN600 }]; waFloat.cornerRadius = 999;
waFloat.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: 16 }, radius: 48, spread: 0, visible: true, blendMode: 'NORMAL' }];
waFloat.paddingLeft = 20; waFloat.paddingRight = 20;
waFloat.paddingTop = 14; waFloat.paddingBottom = 14;
waFloat.primaryAxisSizingMode = 'AUTO'; waFloat.counterAxisSizingMode = 'AUTO';
waFloat.itemSpacing = 8; waFloat.counterAxisAlignItems = 'CENTER';
waFloat.appendChild(t('Hantar Semua Bil', 14, 600, WHITE));
bills.appendChild(waFloat);

bills.x = startX; bills.y = 0;

// =====================
// BILLS PAGE - Utility Tab
// =====================
const utilTab = figma.createFrame();
utilTab.name = 'Bills - Utility & Generate';
utilTab.resize(W, 1000);
utilTab.fills = [{ type: 'SOLID', color: SURFACE }];
utilTab.layoutMode = 'VERTICAL'; utilTab.primaryAxisSizingMode = 'AUTO';
utilTab.counterAxisSizingMode = 'FIXED';
utilTab.paddingTop = 16; utilTab.paddingBottom = 24;
utilTab.paddingLeft = 16; utilTab.paddingRight = 16;
utilTab.itemSpacing = 16;

// Tab switcher (tab 2 active)
const tabs2 = figma.createFrame(); tabs2.name = 'Tab Switcher';
tabs2.layoutMode = 'HORIZONTAL'; tabs2.resize(358, 48);
tabs2.primaryAxisSizingMode = 'FIXED'; tabs2.counterAxisSizingMode = 'FIXED';
tabs2.fills = [{ type: 'SOLID', color: G100 }]; tabs2.cornerRadius = 16;
tabs2.paddingLeft = 6; tabs2.paddingRight = 6; tabs2.paddingTop = 6; tabs2.paddingBottom = 6;
tabs2.itemSpacing = 4;

const t2a = figma.createFrame();
t2a.layoutMode = 'HORIZONTAL'; t2a.layoutGrow = 1;
t2a.resize(1, 36); t2a.counterAxisSizingMode = 'FIXED';
t2a.primaryAxisAlignItems = 'CENTER'; t2a.counterAxisAlignItems = 'CENTER';
t2a.fills = []; t2a.cornerRadius = 12;
t2a.appendChild(t('Bil Bulanan', 14, 600, G400));

const t2b = figma.createFrame();
t2b.layoutMode = 'HORIZONTAL'; t2b.layoutGrow = 1;
t2b.resize(1, 36); t2b.counterAxisSizingMode = 'FIXED';
t2b.primaryAxisAlignItems = 'CENTER'; t2b.counterAxisAlignItems = 'CENTER';
t2b.fills = [{ type: 'SOLID', color: WHITE }]; t2b.cornerRadius = 12; t2b.effects = [SM];
t2b.appendChild(t('Utiliti & Jana', 14, 600, P700));

tabs2.appendChild(t2a); tabs2.appendChild(t2b);
utilTab.appendChild(tabs2);

// Selectors row
const selRow = figma.createFrame();
selRow.layoutMode = 'HORIZONTAL'; selRow.fills = []; selRow.itemSpacing = 12;
selRow.resize(358, 1); selRow.primaryAxisSizingMode = 'FIXED'; selRow.counterAxisSizingMode = 'AUTO';
selRow.appendChild(inp('Property', 'Rumah Teres Bangi', 200));
selRow.appendChild(inp('Month', 'April 2026', 146));
utilTab.appendChild(selRow);

// Utility Bills Card
const utilCard = figma.createFrame(); utilCard.name = 'Utility Bills';
utilCard.layoutMode = 'VERTICAL'; utilCard.resize(358, 1);
utilCard.primaryAxisSizingMode = 'AUTO'; utilCard.counterAxisSizingMode = 'FIXED';
utilCard.fills = [{ type: 'SOLID', color: WHITE }]; utilCard.cornerRadius = 16;
utilCard.effects = [SM]; utilCard.paddingTop = 20; utilCard.paddingBottom = 20;
utilCard.paddingLeft = 20; utilCard.paddingRight = 20; utilCard.itemSpacing = 12;

const utilHdr = figma.createFrame();
utilHdr.layoutMode = 'HORIZONTAL'; utilHdr.fills = [];
utilHdr.resize(318, 1); utilHdr.primaryAxisSizingMode = 'FIXED'; utilHdr.counterAxisSizingMode = 'AUTO';
utilHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; utilHdr.counterAxisAlignItems = 'CENTER';
utilHdr.appendChild(t('Bil Utiliti', 14, 700, G800));
utilHdr.appendChild(t('+ Tambah', 14, 500, P600));
utilCard.appendChild(utilHdr);

// Existing utilities
const utils = [['Electric', 'RM120'], ['Water', 'RM45'], ['Internet', 'RM89']];
for (const [name, amount] of utils) {
  const uRow = figma.createFrame();
  uRow.layoutMode = 'HORIZONTAL'; uRow.resize(318, 48);
  uRow.primaryAxisSizingMode = 'FIXED'; uRow.counterAxisSizingMode = 'FIXED';
  uRow.fills = [{ type: 'SOLID', color: { r: 249/255, g: 250/255, b: 251/255 } }];
  uRow.cornerRadius = 12; uRow.paddingLeft = 12; uRow.paddingRight = 12;
  uRow.counterAxisAlignItems = 'CENTER'; uRow.primaryAxisAlignItems = 'SPACE_BETWEEN';

  const uLeft = figma.createFrame();
  uLeft.layoutMode = 'HORIZONTAL'; uLeft.fills = []; uLeft.itemSpacing = 8;
  uLeft.primaryAxisSizingMode = 'AUTO'; uLeft.counterAxisSizingMode = 'AUTO';
  uLeft.counterAxisAlignItems = 'CENTER';
  const uIcon = figma.createFrame(); uIcon.resize(32, 32);
  uIcon.fills = [{ type: 'SOLID', color: P50 }]; uIcon.cornerRadius = 8;
  uIcon.layoutMode = 'HORIZONTAL'; uIcon.primaryAxisAlignItems = 'CENTER'; uIcon.counterAxisAlignItems = 'CENTER';
  uIcon.appendChild(t(name === 'Electric' ? 'E' : name === 'Water' ? 'W' : 'I', 12, 700, P600));
  uLeft.appendChild(uIcon);
  uLeft.appendChild(t(name, 14, 500, G800));
  uRow.appendChild(uLeft);
  uRow.appendChild(t(amount, 14, 700, G800));
  utilCard.appendChild(uRow);
}
utilTab.appendChild(utilCard);

// Generate Bills Card
const genCard = figma.createFrame(); genCard.name = 'Generate Bills';
genCard.layoutMode = 'VERTICAL'; genCard.resize(358, 1);
genCard.primaryAxisSizingMode = 'AUTO'; genCard.counterAxisSizingMode = 'FIXED';
genCard.fills = [{ type: 'SOLID', color: WHITE }]; genCard.cornerRadius = 16;
genCard.effects = [SM]; genCard.paddingTop = 20; genCard.paddingBottom = 20;
genCard.paddingLeft = 20; genCard.paddingRight = 20; genCard.itemSpacing = 12;

const genHdr = figma.createFrame();
genHdr.layoutMode = 'HORIZONTAL'; genHdr.fills = [];
genHdr.resize(318, 1); genHdr.primaryAxisSizingMode = 'FIXED'; genHdr.counterAxisSizingMode = 'AUTO';
genHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; genHdr.counterAxisAlignItems = 'CENTER';
genHdr.appendChild(t('Jana Bil (April 2026)', 14, 700, G800));

const genBtn = figma.createFrame();
genBtn.layoutMode = 'HORIZONTAL'; genBtn.resize(90, 36);
genBtn.primaryAxisSizingMode = 'FIXED'; genBtn.counterAxisSizingMode = 'FIXED';
genBtn.primaryAxisAlignItems = 'CENTER'; genBtn.counterAxisAlignItems = 'CENTER';
genBtn.fills = [{ type: 'SOLID', color: P600 }]; genBtn.cornerRadius = 8;
genBtn.appendChild(t('Jana Bil', 14, 500, WHITE));
genHdr.appendChild(genBtn);
genCard.appendChild(genHdr);

// Generated bill preview rows
const genBills = [
  { tenant: 'Ali bin Ahmad', room: 'A1 - RM850', total: 'RM935', status: 'Selesai', bg: GREEN50, fg: GREEN700 },
  { tenant: 'Siti Aminah', room: 'A2 - RM750', total: 'RM825', status: 'Belum Bayar', bg: G100, fg: G600 },
  { tenant: 'Farid Hakim', room: 'B2 - RM650', total: 'RM715', status: 'Belum Bayar', bg: G100, fg: G600 },
];
for (const gb of genBills) {
  const gRow = figma.createFrame();
  gRow.layoutMode = 'HORIZONTAL'; gRow.resize(318, 48);
  gRow.primaryAxisSizingMode = 'FIXED'; gRow.counterAxisSizingMode = 'FIXED';
  gRow.fills = [{ type: 'SOLID', color: { r: 249/255, g: 250/255, b: 251/255 } }];
  gRow.cornerRadius = 12; gRow.paddingLeft = 12; gRow.paddingRight = 12;
  gRow.counterAxisAlignItems = 'CENTER'; gRow.primaryAxisAlignItems = 'SPACE_BETWEEN';

  const gInfo = figma.createFrame();
  gInfo.layoutMode = 'VERTICAL'; gInfo.fills = []; gInfo.itemSpacing = 1;
  gInfo.primaryAxisSizingMode = 'AUTO'; gInfo.counterAxisSizingMode = 'AUTO';
  gInfo.appendChild(t(gb.tenant, 14, 500, G800));
  gInfo.appendChild(t(gb.room, 12, 400, G500));
  gRow.appendChild(gInfo);

  const gRight = figma.createFrame();
  gRight.layoutMode = 'HORIZONTAL'; gRight.fills = []; gRight.itemSpacing = 8;
  gRight.primaryAxisSizingMode = 'AUTO'; gRight.counterAxisSizingMode = 'AUTO';
  gRight.counterAxisAlignItems = 'CENTER';
  gRight.appendChild(t(gb.total, 14, 700, G800));
  gRight.appendChild(badge(gb.status, gb.bg, gb.fg));
  gRow.appendChild(gRight);
  genCard.appendChild(gRow);
}
utilTab.appendChild(genCard);

utilTab.x = startX + W + 50; utilTab.y = 0;

figma.notify('Bills page (Monthly + Utility tabs) created!');
