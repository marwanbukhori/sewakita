// ============================================
// SewaKita - Shared: Account, Profile Edit, FAQ, Report, Monthly Report
// Run on: "Tenant & Shared" page
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
const P200 = { r: 185/255, g: 230/255, b: 255/255 };
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
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const GREEN700 = { r: 21/255, g: 128/255, b: 61/255 };
const RED500 = { r: 239/255, g: 68/255, b: 68/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };

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

function badgeSm(text, bg, fg) {
  const b = figma.createFrame();
  b.layoutMode = 'HORIZONTAL'; b.fills = [{ type: 'SOLID', color: bg }];
  b.cornerRadius = 999; b.paddingLeft = 8; b.paddingRight = 8;
  b.paddingTop = 2; b.paddingBottom = 2;
  b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
  b.appendChild(t(text, 12, 500, fg));
  return b;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// =====================
// ACCOUNT PAGE
// =====================
const acct = figma.createFrame();
acct.name = 'Account';
acct.resize(W, 800);
acct.fills = [{ type: 'SOLID', color: SURFACE }];
acct.layoutMode = 'VERTICAL'; acct.primaryAxisSizingMode = 'AUTO';
acct.counterAxisSizingMode = 'FIXED';
acct.paddingTop = 16; acct.paddingBottom = 24;
acct.paddingLeft = 16; acct.paddingRight = 16;
acct.itemSpacing = 20;

// Profile header
const profRow = figma.createFrame();
profRow.layoutMode = 'HORIZONTAL'; profRow.fills = []; profRow.itemSpacing = 16;
profRow.resize(358, 1); profRow.primaryAxisSizingMode = 'FIXED'; profRow.counterAxisSizingMode = 'AUTO';
profRow.counterAxisAlignItems = 'CENTER';

const profAvatar = figma.createFrame(); profAvatar.resize(56, 56);
profAvatar.fills = [{ type: 'SOLID', color: P500 }]; profAvatar.cornerRadius = 999;
profAvatar.layoutMode = 'HORIZONTAL'; profAvatar.primaryAxisAlignItems = 'CENTER'; profAvatar.counterAxisAlignItems = 'CENTER';
profAvatar.appendChild(t('A', 20, 700, WHITE));
profRow.appendChild(profAvatar);

const profInfo = figma.createFrame();
profInfo.layoutMode = 'VERTICAL'; profInfo.fills = []; profInfo.itemSpacing = 4;
profInfo.primaryAxisSizingMode = 'AUTO'; profInfo.layoutGrow = 1;
profInfo.appendChild(t('Ahmad Razif', 20, 700, G800));

const profMeta = figma.createFrame();
profMeta.layoutMode = 'HORIZONTAL'; profMeta.fills = []; profMeta.itemSpacing = 8;
profMeta.primaryAxisSizingMode = 'AUTO'; profMeta.counterAxisSizingMode = 'AUTO';
profMeta.counterAxisAlignItems = 'CENTER';

const roleBadge = figma.createFrame();
roleBadge.layoutMode = 'HORIZONTAL'; roleBadge.fills = [{ type: 'SOLID', color: P50 }];
roleBadge.cornerRadius = 999; roleBadge.paddingLeft = 8; roleBadge.paddingRight = 8;
roleBadge.paddingTop = 2; roleBadge.paddingBottom = 2;
roleBadge.primaryAxisSizingMode = 'AUTO'; roleBadge.counterAxisSizingMode = 'AUTO';
roleBadge.appendChild(t('Landlord', 12, 500, P600));
profMeta.appendChild(roleBadge);
profMeta.appendChild(t('012-345 6789', 12, 400, G500));
profInfo.appendChild(profMeta);
profRow.appendChild(profInfo);
acct.appendChild(profRow);

// Settings groups
function settingsGroup(label, items) {
  const group = figma.createFrame();
  group.layoutMode = 'VERTICAL'; group.fills = []; group.itemSpacing = 8;
  group.resize(358, 1); group.primaryAxisSizingMode = 'AUTO'; group.counterAxisSizingMode = 'FIXED';
  group.appendChild(t(label, 12, 700, G500));

  const card = figma.createFrame();
  card.layoutMode = 'VERTICAL'; card.resize(358, 1);
  card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'FIXED';
  card.fills = [{ type: 'SOLID', color: WHITE }]; card.cornerRadius = 16; card.effects = [SM];

  for (let i = 0; i < items.length; i++) {
    const [icon, text, color] = items[i];
    const row = figma.createFrame();
    row.layoutMode = 'HORIZONTAL'; row.fills = [];
    row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
    row.paddingTop = 14; row.paddingBottom = 14; row.paddingLeft = 16; row.paddingRight = 16;
    row.itemSpacing = 12; row.counterAxisAlignItems = 'CENTER';
    if (i > 0) {
      row.strokes = [{ type: 'SOLID', color: G100 }]; row.strokesIncludedInLayout = false;
      row.strokeTopWeight = 1; row.strokeBottomWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0;
    }
    row.appendChild(t(icon, 16, 400, color || G500));
    const label = t(text, 14, 400, color || G800);
    label.layoutGrow = 1;
    row.appendChild(label);
    if (!color) row.appendChild(t('>', 14, 400, G300));
    card.appendChild(row);
  }
  group.appendChild(card);
  return group;
}

acct.appendChild(settingsGroup('ACCOUNT', [['👤', 'Personal Info'], ['🏢', 'My Properties']]));
acct.appendChild(settingsGroup('REPORTS', [['📊', 'Monthly Report'], ['📄', 'Annual Report']]));
acct.appendChild(settingsGroup('SECURITY', [['🔒', 'Change Password']]));
acct.appendChild(settingsGroup('', [['🚪', 'Log Out', RED500]]));

// Version
const verText = t('SewaKita v1.0', 12, 400, G400);
verText.textAlignHorizontal = 'CENTER';
acct.appendChild(verText);

acct.x = startX; acct.y = 0;

// =====================
// PROFILE EDIT
// =====================
const profEdit = figma.createFrame();
profEdit.name = 'Profile Edit';
profEdit.resize(W, 700);
profEdit.fills = [{ type: 'SOLID', color: SURFACE }];
profEdit.layoutMode = 'VERTICAL'; profEdit.primaryAxisSizingMode = 'AUTO';
profEdit.counterAxisSizingMode = 'FIXED';
profEdit.paddingTop = 16; profEdit.paddingBottom = 24;
profEdit.paddingLeft = 16; profEdit.paddingRight = 16;
profEdit.itemSpacing = 16;

profEdit.appendChild(t('< Back', 14, 500, P600));

// Title row
const peTitle = figma.createFrame();
peTitle.layoutMode = 'HORIZONTAL'; peTitle.fills = []; peTitle.itemSpacing = 12;
peTitle.resize(358, 1); peTitle.primaryAxisSizingMode = 'FIXED'; peTitle.counterAxisSizingMode = 'AUTO';
peTitle.counterAxisAlignItems = 'CENTER';
const peIcon = figma.createFrame(); peIcon.resize(40, 40);
peIcon.fills = [{ type: 'SOLID', color: P50 }]; peIcon.cornerRadius = 12;
peIcon.layoutMode = 'HORIZONTAL'; peIcon.primaryAxisAlignItems = 'CENTER'; peIcon.counterAxisAlignItems = 'CENTER';
peIcon.appendChild(t('👤', 18, 400, P600));
peTitle.appendChild(peIcon);
peTitle.appendChild(t('Personal Info', 20, 700, G800));
profEdit.appendChild(peTitle);

// Form card
const peCard = figma.createFrame(); peCard.name = 'Form';
peCard.layoutMode = 'VERTICAL'; peCard.resize(358, 1);
peCard.primaryAxisSizingMode = 'AUTO'; peCard.counterAxisSizingMode = 'FIXED';
peCard.fills = [{ type: 'SOLID', color: WHITE }]; peCard.cornerRadius = 16;
peCard.effects = [SM]; peCard.paddingTop = 20; peCard.paddingBottom = 20;
peCard.paddingLeft = 20; peCard.paddingRight = 20; peCard.itemSpacing = 16;

peCard.appendChild(inp('Full Name *', 'Ahmad Razif', 318));
peCard.appendChild(inp('Phone *', '012-345 6789', 318));
peCard.appendChild(inp('IC Number', '900101-01-1234', 318));
peCard.appendChild(inp('Emergency Contact', '013-999 8888', 318));

const saveBtn = figma.createFrame(); saveBtn.name = 'Save';
saveBtn.layoutMode = 'HORIZONTAL'; saveBtn.resize(318, 48);
saveBtn.primaryAxisSizingMode = 'FIXED'; saveBtn.counterAxisSizingMode = 'FIXED';
saveBtn.primaryAxisAlignItems = 'CENTER'; saveBtn.counterAxisAlignItems = 'CENTER';
saveBtn.fills = [{ type: 'SOLID', color: P600 }]; saveBtn.cornerRadius = 8;
saveBtn.appendChild(t('Save', 16, 500, WHITE));
peCard.appendChild(saveBtn);
profEdit.appendChild(peCard);

profEdit.x = startX + W + 50; profEdit.y = 0;

// =====================
// FAQ PAGE
// =====================
const faq = figma.createFrame();
faq.name = 'FAQ';
faq.resize(W, 900);
faq.fills = [{ type: 'SOLID', color: SURFACE }];
faq.layoutMode = 'VERTICAL'; faq.primaryAxisSizingMode = 'AUTO';
faq.counterAxisSizingMode = 'FIXED';
faq.paddingTop = 16; faq.paddingBottom = 24;
faq.paddingLeft = 16; faq.paddingRight = 16;
faq.itemSpacing = 8;

faq.appendChild(t('< Back', 14, 500, P600));
const spFaq = figma.createFrame(); spFaq.resize(10, 8); spFaq.fills = [];
faq.appendChild(spFaq);
faq.appendChild(t('FAQ', 20, 700, G800));
faq.appendChild(t('Common questions about SewaKita', 14, 400, G500, 358));
const spFaq2 = figma.createFrame(); spFaq2.resize(10, 8); spFaq2.fills = [];
faq.appendChild(spFaq2);

const faqItems = [
  { q: 'How do I add a property?', a: 'Go to Properties and tap "+ Add" to create a new property. Enter the name, address, and billing date.', open: true },
  { q: 'How do billing cycles work?', a: '', open: false },
  { q: 'Can I manage multiple properties?', a: '', open: false },
  { q: 'How do tenants pay their bills?', a: '', open: false },
  { q: 'Is my data secure?', a: '', open: false },
  { q: 'How do I generate a rental agreement?', a: '', open: false },
  { q: 'Can I export my financial data?', a: '', open: false },
  { q: 'How do I contact support?', a: '', open: false },
];

for (const item of faqItems) {
  const faqCard = figma.createFrame();
  faqCard.layoutMode = 'VERTICAL'; faqCard.resize(358, 1);
  faqCard.primaryAxisSizingMode = 'AUTO'; faqCard.counterAxisSizingMode = 'FIXED';
  faqCard.fills = [{ type: 'SOLID', color: WHITE }]; faqCard.cornerRadius = 16; faqCard.effects = [SC];

  // Question row
  const qRow = figma.createFrame();
  qRow.layoutMode = 'HORIZONTAL'; qRow.fills = [];
  qRow.resize(358, 1); qRow.primaryAxisSizingMode = 'FIXED'; qRow.counterAxisSizingMode = 'AUTO';
  qRow.paddingTop = 14; qRow.paddingBottom = 14; qRow.paddingLeft = 16; qRow.paddingRight = 16;
  qRow.itemSpacing = 12; qRow.counterAxisAlignItems = 'CENTER';

  const qText = t(item.q, 14, 500, G800, 290);
  qRow.appendChild(qText);
  qRow.appendChild(t(item.open ? '^' : 'v', 14, 400, G400));
  faqCard.appendChild(qRow);

  // Answer (if open)
  if (item.open && item.a) {
    const aRow = figma.createFrame();
    aRow.layoutMode = 'HORIZONTAL'; aRow.fills = [];
    aRow.resize(358, 1); aRow.primaryAxisSizingMode = 'FIXED'; aRow.counterAxisSizingMode = 'AUTO';
    aRow.paddingBottom = 16; aRow.paddingLeft = 16; aRow.paddingRight = 16;
    aRow.appendChild(t(item.a, 14, 400, G600, 326));
    faqCard.appendChild(aRow);
  }
  faq.appendChild(faqCard);
}

faq.x = startX + (W + 50) * 2; faq.y = 0;

// =====================
// REPORT PAGE (Bug/Feedback)
// =====================
const report = figma.createFrame();
report.name = 'Report Issue';
report.resize(W, 700);
report.fills = [{ type: 'SOLID', color: SURFACE }];
report.layoutMode = 'VERTICAL'; report.primaryAxisSizingMode = 'AUTO';
report.counterAxisSizingMode = 'FIXED';
report.paddingTop = 16; report.paddingBottom = 24;
report.paddingLeft = 16; report.paddingRight = 16;
report.itemSpacing = 16;

report.appendChild(t('< Back', 14, 500, P600));

const rpTitle = figma.createFrame();
rpTitle.layoutMode = 'HORIZONTAL'; rpTitle.fills = []; rpTitle.itemSpacing = 12;
rpTitle.resize(358, 1); rpTitle.primaryAxisSizingMode = 'FIXED'; rpTitle.counterAxisSizingMode = 'AUTO';
rpTitle.counterAxisAlignItems = 'CENTER';
const rpIcon = figma.createFrame(); rpIcon.resize(40, 40);
rpIcon.fills = [{ type: 'SOLID', color: AMBER50 }]; rpIcon.cornerRadius = 12;
rpIcon.layoutMode = 'HORIZONTAL'; rpIcon.primaryAxisAlignItems = 'CENTER'; rpIcon.counterAxisAlignItems = 'CENTER';
rpIcon.appendChild(t('!', 18, 700, { r: 217/255, g: 119/255, b: 6/255 }));
rpTitle.appendChild(rpIcon);
rpTitle.appendChild(t('Report', 20, 700, G800));
report.appendChild(rpTitle);

const rpCard = figma.createFrame(); rpCard.name = 'Report Form';
rpCard.layoutMode = 'VERTICAL'; rpCard.resize(358, 1);
rpCard.primaryAxisSizingMode = 'AUTO'; rpCard.counterAxisSizingMode = 'FIXED';
rpCard.fills = [{ type: 'SOLID', color: WHITE }]; rpCard.cornerRadius = 16;
rpCard.effects = [SM]; rpCard.paddingTop = 20; rpCard.paddingBottom = 20;
rpCard.paddingLeft = 20; rpCard.paddingRight = 20; rpCard.itemSpacing = 16;

// Category select
const catGroup = figma.createFrame(); catGroup.name = 'Category';
catGroup.layoutMode = 'VERTICAL'; catGroup.itemSpacing = 6; catGroup.fills = [];
catGroup.resize(318, 1); catGroup.primaryAxisSizingMode = 'AUTO'; catGroup.counterAxisSizingMode = 'FIXED';
catGroup.appendChild(t('Category', 14, 500, G700, 318));
const catSel = figma.createFrame(); catSel.layoutMode = 'HORIZONTAL'; catSel.resize(318, 44);
catSel.primaryAxisSizingMode = 'FIXED'; catSel.counterAxisSizingMode = 'FIXED';
catSel.fills = [{ type: 'SOLID', color: WHITE }]; catSel.strokes = [{ type: 'SOLID', color: G200 }];
catSel.strokeWeight = 1; catSel.cornerRadius = 8; catSel.paddingLeft = 12; catSel.paddingRight = 12;
catSel.counterAxisAlignItems = 'CENTER'; catSel.primaryAxisAlignItems = 'SPACE_BETWEEN';
catSel.appendChild(t('Select category', 16, 400, G400));
catSel.appendChild(t('v', 12, 400, G400));
catGroup.appendChild(catSel);
rpCard.appendChild(catGroup);

rpCard.appendChild(inp('Subject *', 'Brief description', 318));

// Textarea
const taGroup = figma.createFrame(); taGroup.name = 'Description';
taGroup.layoutMode = 'VERTICAL'; taGroup.itemSpacing = 6; taGroup.fills = [];
taGroup.resize(318, 1); taGroup.primaryAxisSizingMode = 'AUTO'; taGroup.counterAxisSizingMode = 'FIXED';
taGroup.appendChild(t('Description', 14, 500, G700, 318));
const ta = figma.createFrame(); ta.resize(318, 128);
ta.fills = [{ type: 'SOLID', color: WHITE }]; ta.strokes = [{ type: 'SOLID', color: G200 }];
ta.strokeWeight = 1; ta.cornerRadius = 8; ta.paddingLeft = 12; ta.paddingTop = 8;
ta.layoutMode = 'VERTICAL';
ta.appendChild(t('Describe your issue in detail...', 16, 400, G400, 294));
taGroup.appendChild(ta);
rpCard.appendChild(taGroup);

const submitBtn = figma.createFrame(); submitBtn.name = 'Submit';
submitBtn.layoutMode = 'HORIZONTAL'; submitBtn.resize(318, 48);
submitBtn.primaryAxisSizingMode = 'FIXED'; submitBtn.counterAxisSizingMode = 'FIXED';
submitBtn.primaryAxisAlignItems = 'CENTER'; submitBtn.counterAxisAlignItems = 'CENTER';
submitBtn.fills = [{ type: 'SOLID', color: P600 }]; submitBtn.cornerRadius = 8;
submitBtn.appendChild(t('Submit', 16, 500, WHITE));
rpCard.appendChild(submitBtn);
report.appendChild(rpCard);

report.x = startX + (W + 50) * 3; report.y = 0;

// =====================
// MONTHLY REPORT
// =====================
const monthly = figma.createFrame();
monthly.name = 'Monthly Report';
monthly.resize(W, 900);
monthly.fills = [{ type: 'SOLID', color: SURFACE }];
monthly.layoutMode = 'VERTICAL'; monthly.primaryAxisSizingMode = 'AUTO';
monthly.counterAxisSizingMode = 'FIXED';
monthly.paddingTop = 16; monthly.paddingBottom = 24;
monthly.paddingLeft = 16; monthly.paddingRight = 16;
monthly.itemSpacing = 16;

monthly.appendChild(t('< Back', 14, 500, P600));

// Header with export
const mrHdr = figma.createFrame();
mrHdr.layoutMode = 'HORIZONTAL'; mrHdr.fills = [];
mrHdr.resize(358, 1); mrHdr.primaryAxisSizingMode = 'FIXED'; mrHdr.counterAxisSizingMode = 'AUTO';
mrHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; mrHdr.counterAxisAlignItems = 'CENTER';
mrHdr.appendChild(t('Monthly Report', 20, 700, G800));
mrHdr.appendChild(t('CSV', 14, 500, P600));
monthly.appendChild(mrHdr);

monthly.appendChild(inp('Month', 'April 2026', 358));

// Summary Hero Card
const mrHero = figma.createFrame(); mrHero.name = 'Summary';
mrHero.resize(358, 1); mrHero.primaryAxisSizingMode = 'AUTO'; mrHero.counterAxisSizingMode = 'FIXED';
mrHero.layoutMode = 'VERTICAL';
mrHero.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
  { color: { ...P600, a: 1 }, position: 0 },
  { color: { ...P700, a: 1 }, position: 0.5 },
  { color: { ...P800, a: 1 }, position: 1 }
], gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]] }];
mrHero.cornerRadius = 16; mrHero.effects = [SM];
mrHero.paddingTop = 20; mrHero.paddingBottom = 20;
mrHero.paddingLeft = 20; mrHero.paddingRight = 20;
mrHero.itemSpacing = 12;

// 3-col stats
const mrStats = figma.createFrame();
mrStats.layoutMode = 'HORIZONTAL'; mrStats.fills = []; mrStats.itemSpacing = 8;
mrStats.resize(318, 1); mrStats.primaryAxisSizingMode = 'FIXED'; mrStats.counterAxisSizingMode = 'AUTO';

for (const [label, value] of [['Expected', 'RM3,200'], ['Collected', 'RM2,500'], ['Rate', '78%']]) {
  const col = figma.createFrame();
  col.layoutMode = 'VERTICAL'; col.counterAxisAlignItems = 'CENTER';
  col.fills = []; col.itemSpacing = 4; col.layoutGrow = 1;
  col.primaryAxisSizingMode = 'AUTO';
  col.appendChild(t(label, 12, 400, WHITE));
  col.appendChild(t(value, 18, 700, WHITE));
  mrStats.appendChild(col);
}
mrHero.appendChild(mrStats);

// Progress bar
const mrBar = figma.createFrame();
mrBar.resize(318, 8); mrBar.fills = [{ type: 'SOLID', color: WHITE, opacity: 0.2 }]; mrBar.cornerRadius = 999;
const mrFill = figma.createRectangle();
mrFill.resize(248, 8); mrFill.fills = [{ type: 'SOLID', color: WHITE }]; mrFill.cornerRadius = 999;
mrBar.appendChild(mrFill); mrFill.x = 0; mrFill.y = 0;
mrHero.appendChild(mrBar);
monthly.appendChild(mrHero);

// Property breakdown
monthly.appendChild(t('RUMAH TERES BANGI', 12, 700, G800));

const mrCard = figma.createFrame(); mrCard.name = 'Property Breakdown';
mrCard.layoutMode = 'VERTICAL'; mrCard.resize(358, 1);
mrCard.primaryAxisSizingMode = 'AUTO'; mrCard.counterAxisSizingMode = 'FIXED';
mrCard.fills = [{ type: 'SOLID', color: WHITE }]; mrCard.cornerRadius = 16; mrCard.effects = [SM];

const mrBills = [
  { room: 'Room A1', tenant: 'Ali bin Ahmad', amount: 'RM935', status: 'Selesai', bg: GREEN50, fg: GREEN700 },
  { room: 'Room A2', tenant: 'Siti Aminah', amount: 'RM825', status: 'Tertunggak', bg: { r: 254/255, g: 242/255, b: 242/255 }, fg: { r: 185/255, g: 28/255, b: 28/255 } },
  { room: 'Room B2', tenant: 'Farid Hakim', amount: 'RM715', status: 'Belum Bayar', bg: G100, fg: G600 },
];

for (let i = 0; i < mrBills.length; i++) {
  const bill = mrBills[i];
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = [];
  row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.paddingTop = 12; row.paddingBottom = 12; row.paddingLeft = 16; row.paddingRight = 16;
  row.itemSpacing = 8; row.counterAxisAlignItems = 'CENTER';
  if (i > 0) { row.strokes = [{ type: 'SOLID', color: G100 }]; row.strokesIncludedInLayout = false; row.strokeTopWeight = 1; row.strokeBottomWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; }

  const bInfo = figma.createFrame();
  bInfo.layoutMode = 'VERTICAL'; bInfo.fills = []; bInfo.itemSpacing = 2;
  bInfo.primaryAxisSizingMode = 'AUTO'; bInfo.layoutGrow = 1;
  bInfo.appendChild(t(bill.room, 14, 500, G800));
  bInfo.appendChild(t(bill.tenant, 12, 400, G500));
  row.appendChild(bInfo);

  row.appendChild(t(bill.amount, 14, 700, G800));
  row.appendChild(badgeSm(bill.status, bill.bg, bill.fg));
  mrCard.appendChild(row);
}
monthly.appendChild(mrCard);

monthly.x = startX + (W + 50) * 4; monthly.y = 0;

figma.notify('Shared screens created: Account, Profile Edit, FAQ, Report, Monthly Report!');

})();
