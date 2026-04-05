// ============================================
// SewaKita - Landlord: Tenants, Agreement View, Move Out, Notifications
// Run on: "Landlord Flow" page
// Wrapped in IIFE to avoid variable conflicts with previous scripts
// ============================================
(async () => {

const W = 390;
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
const P100 = { r: 224/255, g: 244/255, b: 255/255 };
const P200 = { r: 185/255, g: 230/255, b: 255/255 };
const P600 = { r: 0/255, g: 144/255, b: 209/255 };
const P700 = { r: 0/255, g: 112/255, b: 163/255 };
const G100 = { r: 243/255, g: 244/255, b: 246/255 };
const G200 = { r: 229/255, g: 231/255, b: 235/255 };
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
const RED600 = { r: 220/255, g: 38/255, b: 38/255 };

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

function btn(text, variant, w, h) {
  const b = figma.createFrame(); b.name = text;
  b.layoutMode = 'HORIZONTAL'; b.resize(w, h || 48);
  b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED';
  b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER';
  b.cornerRadius = 8; b.itemSpacing = 8;
  if (variant === 'primary') { b.fills = [{ type: 'SOLID', color: P600 }]; b.appendChild(t(text, h === 36 ? 14 : 16, 500, WHITE)); }
  else if (variant === 'danger') { b.fills = [{ type: 'SOLID', color: RED500 }]; b.appendChild(t(text, 16, 500, WHITE)); }
  return b;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// =====================
// TENANTS LIST
// =====================
const tenants = figma.createFrame();
tenants.name = 'Tenants';
tenants.resize(W, 700);
tenants.fills = [{ type: 'SOLID', color: SURFACE }];
tenants.layoutMode = 'VERTICAL'; tenants.primaryAxisSizingMode = 'AUTO';
tenants.counterAxisSizingMode = 'FIXED';
tenants.paddingTop = 16; tenants.paddingBottom = 24;
tenants.paddingLeft = 16; tenants.paddingRight = 16;
tenants.itemSpacing = 12;

// Header
const tHdr = figma.createFrame();
tHdr.layoutMode = 'HORIZONTAL'; tHdr.fills = [];
tHdr.resize(358, 1); tHdr.primaryAxisSizingMode = 'FIXED'; tHdr.counterAxisSizingMode = 'AUTO';
tHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; tHdr.counterAxisAlignItems = 'CENTER';
tHdr.appendChild(t('Tenants', 20, 700, G800));
const tAddBtn = figma.createFrame();
tAddBtn.layoutMode = 'HORIZONTAL'; tAddBtn.resize(70, 36);
tAddBtn.primaryAxisSizingMode = 'FIXED'; tAddBtn.counterAxisSizingMode = 'FIXED';
tAddBtn.primaryAxisAlignItems = 'CENTER'; tAddBtn.counterAxisAlignItems = 'CENTER';
tAddBtn.fills = [{ type: 'SOLID', color: P600 }]; tAddBtn.cornerRadius = 8;
tAddBtn.appendChild(t('+ Add', 14, 500, WHITE));
tHdr.appendChild(tAddBtn);
tenants.appendChild(tHdr);

// Tenant cards
const tenantData = [
  { name: 'Ali bin Ahmad', phone: '012-345 6789', email: 'ali@email.com', status: 'Aktif', prop: 'Rumah Teres Bangi' },
  { name: 'Siti Aminah', phone: '013-987 6543', email: 'siti@email.com', status: 'Aktif', prop: 'Rumah Teres Bangi' },
  { name: 'Razak Ismail', phone: '017-111 2233', email: 'razak@email.com', status: 'Aktif', prop: 'Apartment Shah Alam' },
  { name: 'Nora Hassan', phone: '019-444 5566', email: 'nora@email.com', status: 'Tamat', prop: '' },
];

for (const tn of tenantData) {
  const card = figma.createFrame(); card.name = tn.name;
  card.layoutMode = 'HORIZONTAL'; card.fills = [{ type: 'SOLID', color: WHITE }];
  card.cornerRadius = 16; card.effects = [SC];
  card.resize(358, 1); card.primaryAxisSizingMode = 'FIXED'; card.counterAxisSizingMode = 'AUTO';
  card.paddingTop = 16; card.paddingBottom = 16; card.paddingLeft = 16; card.paddingRight = 16;
  card.itemSpacing = 12; card.counterAxisAlignItems = 'CENTER';

  // Avatar
  const avatar = figma.createFrame(); avatar.resize(40, 40);
  avatar.fills = [{ type: 'SOLID', color: P100 }]; avatar.cornerRadius = 999;
  avatar.layoutMode = 'HORIZONTAL'; avatar.primaryAxisAlignItems = 'CENTER'; avatar.counterAxisAlignItems = 'CENTER';
  avatar.appendChild(t(tn.name[0], 14, 700, P700));
  card.appendChild(avatar);

  // Info
  const info = figma.createFrame();
  info.layoutMode = 'VERTICAL'; info.fills = []; info.itemSpacing = 2;
  info.primaryAxisSizingMode = 'AUTO'; info.layoutGrow = 1;
  info.appendChild(t(tn.name, 14, 600, G800));
  info.appendChild(t(tn.phone + '  |  ' + tn.email, 12, 400, G500, 200));
  card.appendChild(info);

  // Status badge
  const isActive = tn.status === 'Aktif';
  card.appendChild(badge(
    isActive ? tn.prop : 'Tamat',
    isActive ? GREEN50 : G100,
    isActive ? GREEN700 : G600
  ));
  tenants.appendChild(card);
}

tenants.x = startX; tenants.y = 0;

// =====================
// AGREEMENT VIEW
// =====================
const agree = figma.createFrame();
agree.name = 'Agreement View';
agree.resize(W, 1000);
agree.fills = [{ type: 'SOLID', color: SURFACE }];
agree.layoutMode = 'VERTICAL'; agree.primaryAxisSizingMode = 'AUTO';
agree.counterAxisSizingMode = 'FIXED';
agree.paddingTop = 16; agree.paddingBottom = 24;
agree.paddingLeft = 16; agree.paddingRight = 16;
agree.itemSpacing = 16;

agree.appendChild(t('< Back', 14, 500, P600));

// Header
const aHdr = figma.createFrame();
aHdr.layoutMode = 'HORIZONTAL'; aHdr.fills = [];
aHdr.resize(358, 1); aHdr.primaryAxisSizingMode = 'FIXED'; aHdr.counterAxisSizingMode = 'AUTO';
aHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; aHdr.counterAxisAlignItems = 'CENTER';
const aHdrLeft = figma.createFrame();
aHdrLeft.layoutMode = 'VERTICAL'; aHdrLeft.fills = []; aHdrLeft.itemSpacing = 2;
aHdrLeft.primaryAxisSizingMode = 'AUTO'; aHdrLeft.counterAxisSizingMode = 'AUTO';
aHdrLeft.appendChild(t('Rental Agreement', 20, 700, G800));
aHdrLeft.appendChild(t('Rumah Teres Bangi - Room A1', 14, 400, G500));
aHdr.appendChild(aHdrLeft);
aHdr.appendChild(badge('Signed', GREEN50, GREEN700));
agree.appendChild(aHdr);

// Parties card
const partiesCard = figma.createFrame(); partiesCard.name = 'Parties';
partiesCard.layoutMode = 'VERTICAL'; partiesCard.resize(358, 1);
partiesCard.primaryAxisSizingMode = 'AUTO'; partiesCard.counterAxisSizingMode = 'FIXED';
partiesCard.fills = [{ type: 'SOLID', color: WHITE }]; partiesCard.cornerRadius = 16;
partiesCard.effects = [SM]; partiesCard.paddingTop = 20; partiesCard.paddingBottom = 20;
partiesCard.paddingLeft = 20; partiesCard.paddingRight = 20; partiesCard.itemSpacing = 12;

partiesCard.appendChild(t('PARTIES', 12, 700, G500));

for (const [role, name, phone, signed] of [['Landlord', 'Ahmad Razif', '012-345 6789', true], ['Tenant', 'Ali bin Ahmad', '012-345 6789', true]]) {
  const pBlock = figma.createFrame();
  pBlock.layoutMode = 'VERTICAL'; pBlock.resize(318, 1);
  pBlock.primaryAxisSizingMode = 'AUTO'; pBlock.counterAxisSizingMode = 'FIXED';
  pBlock.fills = [{ type: 'SOLID', color: { r: 249/255, g: 250/255, b: 251/255 } }];
  pBlock.cornerRadius = 12; pBlock.paddingTop = 12; pBlock.paddingBottom = 12;
  pBlock.paddingLeft = 12; pBlock.paddingRight = 12; pBlock.itemSpacing = 2;
  pBlock.appendChild(t(role, 12, 400, G500));
  pBlock.appendChild(t(name, 14, 600, G800));
  pBlock.appendChild(t(phone, 12, 400, G500));
  if (signed) pBlock.appendChild(t('Signed', 12, 500, GREEN600));
  partiesCard.appendChild(pBlock);
}
agree.appendChild(partiesCard);

// Terms card
const termsCard = figma.createFrame(); termsCard.name = 'Terms';
termsCard.layoutMode = 'VERTICAL'; termsCard.resize(358, 1);
termsCard.primaryAxisSizingMode = 'AUTO'; termsCard.counterAxisSizingMode = 'FIXED';
termsCard.fills = [{ type: 'SOLID', color: WHITE }]; termsCard.cornerRadius = 16;
termsCard.effects = [SM]; termsCard.paddingTop = 20; termsCard.paddingBottom = 20;
termsCard.paddingLeft = 20; termsCard.paddingRight = 20; termsCard.itemSpacing = 12;

termsCard.appendChild(t('TERMS', 12, 700, G500));

const termsGrid = figma.createFrame();
termsGrid.layoutMode = 'HORIZONTAL'; termsGrid.fills = []; termsGrid.itemSpacing = 12;
termsGrid.resize(318, 1); termsGrid.primaryAxisSizingMode = 'FIXED'; termsGrid.counterAxisSizingMode = 'AUTO';
termsGrid.layoutWrap = 'WRAP';

const termItems = [['Start Date', '1 Jan 2026'], ['End Date', 'Monthly'], ['Rent', 'RM850'], ['Deposit', 'RM1,700'], ['Payment Day', '1st'], ['Notice', '30 days']];
for (const [label, value] of termItems) {
  const item = figma.createFrame();
  item.layoutMode = 'VERTICAL'; item.fills = []; item.itemSpacing = 2;
  item.resize(150, 1); item.primaryAxisSizingMode = 'AUTO'; item.counterAxisSizingMode = 'FIXED';
  item.appendChild(t(label, 12, 400, G500));
  item.appendChild(t(value, 14, 500, G800));
  termsGrid.appendChild(item);
}
termsCard.appendChild(termsGrid);
agree.appendChild(termsCard);

// Utilities card
const utilCard = figma.createFrame(); utilCard.name = 'Utilities';
utilCard.layoutMode = 'VERTICAL'; utilCard.resize(358, 1);
utilCard.primaryAxisSizingMode = 'AUTO'; utilCard.counterAxisSizingMode = 'FIXED';
utilCard.fills = [{ type: 'SOLID', color: WHITE }]; utilCard.cornerRadius = 16;
utilCard.effects = [SM]; utilCard.paddingTop = 20; utilCard.paddingBottom = 20;
utilCard.paddingLeft = 20; utilCard.paddingRight = 20; utilCard.itemSpacing = 8;

utilCard.appendChild(t('UTILITIES', 12, 700, G500));
for (const [name, status, active] of [['Electricity', 'Included', true], ['Water', 'Included', true], ['Internet', 'Tenant pays', false]]) {
  const uRow = figma.createFrame();
  uRow.layoutMode = 'HORIZONTAL'; uRow.fills = []; uRow.itemSpacing = 12;
  uRow.resize(318, 1); uRow.primaryAxisSizingMode = 'FIXED'; uRow.counterAxisSizingMode = 'AUTO';
  uRow.primaryAxisAlignItems = 'SPACE_BETWEEN'; uRow.counterAxisAlignItems = 'CENTER';
  uRow.appendChild(t(name, 14, 400, G700));
  uRow.appendChild(t(status, 12, 500, active ? P600 : G500));
  utilCard.appendChild(uRow);
}
agree.appendChild(utilCard);

// Download button
agree.appendChild(btn('Download PDF', 'primary', 358, 48));
agree.x = startX + W + 50; agree.y = 0;

// =====================
// MOVE OUT PAGE
// =====================
const moveOut = figma.createFrame();
moveOut.name = 'Move Out';
moveOut.resize(W, 900);
moveOut.fills = [{ type: 'SOLID', color: SURFACE }];
moveOut.layoutMode = 'VERTICAL'; moveOut.primaryAxisSizingMode = 'AUTO';
moveOut.counterAxisSizingMode = 'FIXED';
moveOut.paddingTop = 16; moveOut.paddingBottom = 24;
moveOut.paddingLeft = 16; moveOut.paddingRight = 16;
moveOut.itemSpacing = 16;

moveOut.appendChild(t('< Back', 14, 500, P600));
moveOut.appendChild(t('Move Out', 20, 700, G800));
moveOut.appendChild(t('Rumah Teres Bangi - Room A1', 14, 400, G500));

// Tenant summary
const moCard = figma.createFrame(); moCard.name = 'Tenant Summary';
moCard.layoutMode = 'VERTICAL'; moCard.resize(358, 1);
moCard.primaryAxisSizingMode = 'AUTO'; moCard.counterAxisSizingMode = 'FIXED';
moCard.fills = [{ type: 'SOLID', color: WHITE }]; moCard.cornerRadius = 16;
moCard.effects = [SM]; moCard.paddingTop = 16; moCard.paddingBottom = 16;
moCard.paddingLeft = 16; moCard.paddingRight = 16; moCard.itemSpacing = 12;

const moTenantRow = figma.createFrame();
moTenantRow.layoutMode = 'HORIZONTAL'; moTenantRow.fills = []; moTenantRow.itemSpacing = 12;
moTenantRow.resize(326, 1); moTenantRow.primaryAxisSizingMode = 'FIXED'; moTenantRow.counterAxisSizingMode = 'AUTO';
moTenantRow.counterAxisAlignItems = 'CENTER';

const moAvatar = figma.createFrame(); moAvatar.resize(40, 40);
moAvatar.fills = [{ type: 'SOLID', color: P100 }]; moAvatar.cornerRadius = 999;
moAvatar.layoutMode = 'HORIZONTAL'; moAvatar.primaryAxisAlignItems = 'CENTER'; moAvatar.counterAxisAlignItems = 'CENTER';
moAvatar.appendChild(t('A', 14, 700, P700));
moTenantRow.appendChild(moAvatar);

const moInfo = figma.createFrame();
moInfo.layoutMode = 'VERTICAL'; moInfo.fills = []; moInfo.itemSpacing = 2;
moInfo.primaryAxisSizingMode = 'AUTO'; moInfo.layoutGrow = 1;
moInfo.appendChild(t('Ali bin Ahmad', 14, 600, G800));
moInfo.appendChild(t('Moved in: 1 Jan 2026', 12, 400, G500));
moTenantRow.appendChild(moInfo);
moCard.appendChild(moTenantRow);

const moStats = figma.createFrame();
moStats.layoutMode = 'HORIZONTAL'; moStats.fills = []; moStats.itemSpacing = 16;
moStats.resize(326, 1); moStats.primaryAxisSizingMode = 'FIXED'; moStats.counterAxisSizingMode = 'AUTO';
moStats.appendChild(t('Rent: RM850/month', 14, 400, G600));
moStats.appendChild(t('Deposit: RM1,700', 14, 400, G600));
moCard.appendChild(moStats);
moveOut.appendChild(moCard);

moveOut.appendChild(inp('Move-out Date', 'Select date', 358));

// Deductions card
const dedCard = figma.createFrame(); dedCard.name = 'Deductions';
dedCard.layoutMode = 'VERTICAL'; dedCard.resize(358, 1);
dedCard.primaryAxisSizingMode = 'AUTO'; dedCard.counterAxisSizingMode = 'FIXED';
dedCard.fills = [{ type: 'SOLID', color: WHITE }]; dedCard.cornerRadius = 16;
dedCard.effects = [SM]; dedCard.paddingTop = 20; dedCard.paddingBottom = 20;
dedCard.paddingLeft = 20; dedCard.paddingRight = 20; dedCard.itemSpacing = 12;

const dedHdr = figma.createFrame();
dedHdr.layoutMode = 'HORIZONTAL'; dedHdr.fills = [];
dedHdr.resize(318, 1); dedHdr.primaryAxisSizingMode = 'FIXED'; dedHdr.counterAxisSizingMode = 'AUTO';
dedHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; dedHdr.counterAxisAlignItems = 'CENTER';
dedHdr.appendChild(t('Deductions', 14, 700, G800));
dedHdr.appendChild(t('+ Add', 14, 500, P600));
dedCard.appendChild(dedHdr);

// Deduction items
const deds = [['Wall repair', 'RM200'], ['Cleaning', 'RM150']];
for (const [reason, amount] of deds) {
  const dRow = figma.createFrame();
  dRow.layoutMode = 'HORIZONTAL'; dRow.fills = []; dRow.itemSpacing = 8;
  dRow.resize(318, 1); dRow.primaryAxisSizingMode = 'FIXED'; dRow.counterAxisSizingMode = 'AUTO';
  dRow.counterAxisAlignItems = 'CENTER';
  const dInputs = figma.createFrame();
  dInputs.layoutMode = 'HORIZONTAL'; dInputs.fills = []; dInputs.itemSpacing = 8;
  dInputs.primaryAxisSizingMode = 'AUTO'; dInputs.layoutGrow = 1;
  dInputs.counterAxisSizingMode = 'AUTO';

  // Reason field
  const rField = figma.createFrame(); rField.layoutMode = 'HORIZONTAL'; rField.resize(180, 40);
  rField.primaryAxisSizingMode = 'FIXED'; rField.counterAxisSizingMode = 'FIXED';
  rField.fills = [{ type: 'SOLID', color: WHITE }]; rField.strokes = [{ type: 'SOLID', color: G200 }];
  rField.strokeWeight = 1; rField.cornerRadius = 8; rField.paddingLeft = 12; rField.counterAxisAlignItems = 'CENTER';
  rField.appendChild(t(reason, 14, 400, G800));
  dInputs.appendChild(rField);

  // Amount field
  const aField = figma.createFrame(); aField.layoutMode = 'HORIZONTAL'; aField.resize(90, 40);
  aField.primaryAxisSizingMode = 'FIXED'; aField.counterAxisSizingMode = 'FIXED';
  aField.fills = [{ type: 'SOLID', color: WHITE }]; aField.strokes = [{ type: 'SOLID', color: G200 }];
  aField.strokeWeight = 1; aField.cornerRadius = 8; aField.paddingLeft = 12; aField.counterAxisAlignItems = 'CENTER';
  aField.appendChild(t(amount, 14, 400, G800));
  dInputs.appendChild(aField);

  dRow.appendChild(dInputs);
  dRow.appendChild(t('X', 14, 400, G400));
  dedCard.appendChild(dRow);
}

// Calculation
const calcDiv = figma.createRectangle();
calcDiv.resize(318, 1); calcDiv.fills = [{ type: 'SOLID', color: G100 }];
dedCard.appendChild(calcDiv);

const calcRows = [
  ['Total Deposit', 'RM1,700', G800, 500],
  ['Total Deductions', '-RM350', RED500, 500],
  ['Refund', 'RM1,350', GREEN600, 700],
];
for (const [label, value, valColor, valWeight] of calcRows) {
  const cRow = figma.createFrame();
  cRow.layoutMode = 'HORIZONTAL'; cRow.fills = [];
  cRow.resize(318, 1); cRow.primaryAxisSizingMode = 'FIXED'; cRow.counterAxisSizingMode = 'AUTO';
  cRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  cRow.appendChild(t(label, label === 'Refund' ? 16 : 14, label === 'Refund' ? 700 : 400, G800));
  cRow.appendChild(t(value, label === 'Refund' ? 16 : 14, valWeight, valColor));
  dedCard.appendChild(cRow);
}
moveOut.appendChild(dedCard);

moveOut.appendChild(btn('Confirm Move-out', 'danger', 358, 48));
moveOut.appendChild(t('This action cannot be undone', 12, 400, G400));

moveOut.x = startX + (W + 50) * 2; moveOut.y = 0;

// =====================
// NOTIFICATION SETTINGS
// =====================
const notif = figma.createFrame();
notif.name = 'Notification Settings';
notif.resize(W, 900);
notif.fills = [{ type: 'SOLID', color: SURFACE }];
notif.layoutMode = 'VERTICAL'; notif.primaryAxisSizingMode = 'AUTO';
notif.counterAxisSizingMode = 'FIXED';
notif.paddingTop = 16; notif.paddingBottom = 24;
notif.paddingLeft = 16; notif.paddingRight = 16;
notif.itemSpacing = 16;

notif.appendChild(t('< Back', 14, 500, P600));

const nHdr = figma.createFrame();
nHdr.layoutMode = 'VERTICAL'; nHdr.fills = []; nHdr.itemSpacing = 4;
nHdr.resize(358, 1); nHdr.primaryAxisSizingMode = 'AUTO'; nHdr.counterAxisSizingMode = 'FIXED';
nHdr.appendChild(t('Notification Settings', 20, 700, G800));
nHdr.appendChild(t('Rumah Teres Bangi', 14, 400, G500));
notif.appendChild(nHdr);

function toggleRow(title, desc, isOn) {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = [];
  row.resize(318, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.paddingTop = 12; row.paddingBottom = 12;
  row.itemSpacing = 12; row.counterAxisAlignItems = 'CENTER';

  // Toggle switch
  const toggle = figma.createFrame(); toggle.resize(40, 24);
  toggle.fills = [{ type: 'SOLID', color: isOn ? P600 : G200 }]; toggle.cornerRadius = 999;
  const thumb = figma.createEllipse(); thumb.resize(16, 16);
  thumb.fills = [{ type: 'SOLID', color: WHITE }];
  thumb.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL' }];
  toggle.appendChild(thumb); thumb.x = isOn ? 20 : 4; thumb.y = 4;

  const info = figma.createFrame();
  info.layoutMode = 'VERTICAL'; info.fills = []; info.itemSpacing = 2;
  info.primaryAxisSizingMode = 'AUTO'; info.layoutGrow = 1;
  info.appendChild(t(title, 14, 500, G800));
  info.appendChild(t(desc, 12, 400, G500, 240));

  row.appendChild(toggle);
  row.appendChild(info);
  return row;
}

// Channels card
const chCard = figma.createFrame(); chCard.name = 'Channels';
chCard.layoutMode = 'VERTICAL'; chCard.resize(358, 1);
chCard.primaryAxisSizingMode = 'AUTO'; chCard.counterAxisSizingMode = 'FIXED';
chCard.fills = [{ type: 'SOLID', color: WHITE }]; chCard.cornerRadius = 16;
chCard.effects = [SM]; chCard.paddingTop = 20; chCard.paddingBottom = 20;
chCard.paddingLeft = 20; chCard.paddingRight = 20; chCard.itemSpacing = 0;

chCard.appendChild(t('CHANNELS', 12, 700, G500));
chCard.appendChild(toggleRow('Email (automated)', 'Send bills, receipts, and reminders', true));
const chDiv = figma.createRectangle(); chDiv.resize(318, 1); chDiv.fills = [{ type: 'SOLID', color: G100 }];
chCard.appendChild(chDiv);
chCard.appendChild(toggleRow('WhatsApp (manual)', 'Show WhatsApp buttons on bills', true));
notif.appendChild(chCard);

// Triggers card
const trCard = figma.createFrame(); trCard.name = 'Triggers';
trCard.layoutMode = 'VERTICAL'; trCard.resize(358, 1);
trCard.primaryAxisSizingMode = 'AUTO'; trCard.counterAxisSizingMode = 'FIXED';
trCard.fills = [{ type: 'SOLID', color: WHITE }]; trCard.cornerRadius = 16;
trCard.effects = [SM]; trCard.paddingTop = 20; trCard.paddingBottom = 20;
trCard.paddingLeft = 20; trCard.paddingRight = 20; trCard.itemSpacing = 0;

trCard.appendChild(t('TRIGGERS', 12, 700, G500));
trCard.appendChild(toggleRow('Bill generated', 'Notify tenant when bill is created', true));
const trDiv1 = figma.createRectangle(); trDiv1.resize(318, 1); trDiv1.fills = [{ type: 'SOLID', color: G100 }];
trCard.appendChild(trDiv1);
trCard.appendChild(toggleRow('Payment received', 'Send receipt after payment', true));
const trDiv2 = figma.createRectangle(); trDiv2.resize(318, 1); trDiv2.fills = [{ type: 'SOLID', color: G100 }];
trCard.appendChild(trDiv2);
trCard.appendChild(toggleRow('Agreement ready', 'Notify when agreement needs signing', false));
notif.appendChild(trCard);

notif.appendChild(btn('Save Settings', 'primary', 358, 48));
notif.x = startX + (W + 50) * 3; notif.y = 0;

figma.notify('Tenants, Agreement View, Move Out, Notifications created!');

})();
