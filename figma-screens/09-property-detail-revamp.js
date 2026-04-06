// ============================================
// SewaKita — Property Detail Page Revamp
// Run on: "Landlord Flow" page
// 3 screens: Property Detail, Room Expanded (Occupied), Room Expanded (Vacant)
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
const RED50 = { r: 254/255, g: 242/255, b: 242/255 };
const RED600 = { r: 220/255, g: 38/255, b: 38/255 };

const SC = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.06 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true, blendMode: 'NORMAL' };
const SM = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' };

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
  b.cornerRadius = 999; b.paddingLeft = 8; b.paddingRight = 8;
  b.paddingTop = 3; b.paddingBottom = 3;
  b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
  b.appendChild(txt(text, 11, 600, fg));
  return b;
}

function avatar(letter, size, bg, fg) {
  const a = figma.createFrame();
  a.resize(size, size); a.cornerRadius = size;
  a.fills = [{ type: 'SOLID', color: bg }];
  a.layoutMode = 'HORIZONTAL';
  a.primaryAxisAlignItems = 'CENTER'; a.counterAxisAlignItems = 'CENTER';
  a.primaryAxisSizingMode = 'FIXED'; a.counterAxisSizingMode = 'FIXED';
  a.appendChild(txt(letter, size * 0.4, 700, fg));
  return a;
}

function btn(label, bg, fg, w, outlined) {
  const b = figma.createFrame();
  b.layoutMode = 'HORIZONTAL'; b.itemSpacing = 6;
  b.fills = [{ type: 'SOLID', color: bg }]; b.cornerRadius = 12;
  if (outlined) { b.strokes = [{ type: 'SOLID', color: G300 }]; b.strokeWeight = 1; }
  b.paddingTop = 12; b.paddingBottom = 12; b.paddingLeft = 14; b.paddingRight = 14;
  b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER';
  b.resize(w, 44); b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED';
  b.appendChild(txt(label, 13, 600, fg));
  return b;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// ====================================================================
// SCREEN 1: PROPERTY DETAIL — Hero + Stats + Room Grid
// ====================================================================
const s1 = figma.createFrame();
s1.name = 'Property Detail — Main';
s1.resize(W, 900);
s1.fills = [{ type: 'SOLID', color: SURFACE }];
s1.layoutMode = 'VERTICAL'; s1.primaryAxisSizingMode = 'AUTO';
s1.counterAxisSizingMode = 'FIXED';
s1.paddingBottom = 24; s1.itemSpacing = 16;

// Hero header
const hero = figma.createFrame();
hero.name = 'Property Hero';
hero.resize(W, 1); hero.primaryAxisSizingMode = 'AUTO'; hero.counterAxisSizingMode = 'FIXED';
hero.layoutMode = 'VERTICAL'; hero.itemSpacing = 8;
hero.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
  { color: { ...P600, a: 1 }, position: 0 },
  { color: { ...P700, a: 1 }, position: 0.5 },
  { color: { ...P800, a: 1 }, position: 1 }
], gradientTransform: [[0.8, 0.6, 0], [-0.6, 0.8, 0.3]] }];
hero.paddingTop = 16; hero.paddingBottom = 20;
hero.paddingLeft = 20; hero.paddingRight = 20;

// Back + edit row
const topRow = figma.createFrame();
topRow.layoutMode = 'HORIZONTAL'; topRow.fills = [];
topRow.resize(350, 1); topRow.primaryAxisSizingMode = 'FIXED';
topRow.counterAxisSizingMode = 'AUTO';
topRow.primaryAxisAlignItems = 'SPACE_BETWEEN'; topRow.counterAxisAlignItems = 'CENTER';
topRow.appendChild(txt('← Hartanah', 13, 500, WHITE));
topRow.appendChild(txt('Edit ✎', 12, 500, WHITE));
hero.appendChild(topRow);

// Property name + address
hero.appendChild(txt('Taman Mutiara Indah', 22, 700, WHITE));
const addrRow = figma.createFrame();
addrRow.layoutMode = 'HORIZONTAL'; addrRow.fills = []; addrRow.itemSpacing = 6;
addrRow.primaryAxisSizingMode = 'AUTO'; addrRow.counterAxisSizingMode = 'AUTO';
addrRow.counterAxisAlignItems = 'CENTER';
addrRow.appendChild(txt('📍', 12, 400, WHITE));
addrRow.appendChild(txt('No 12, Jalan SS2/64, Petaling Jaya', 12, 400, { r: 1, g: 1, b: 1 }));
hero.appendChild(addrRow);
const billRow = figma.createFrame();
billRow.layoutMode = 'HORIZONTAL'; billRow.fills = []; billRow.itemSpacing = 6;
billRow.primaryAxisSizingMode = 'AUTO'; billRow.counterAxisSizingMode = 'AUTO';
billRow.counterAxisAlignItems = 'CENTER';
billRow.appendChild(txt('📅', 12, 400, WHITE));
const billLabel = txt('Billing day: 1st of month', 12, 400, { r: 1, g: 1, b: 1 });
billLabel.opacity = 0.8;
billRow.appendChild(billLabel);
hero.appendChild(billRow);
s1.appendChild(hero);

// Stat strip — 3 cards
const statsRow = figma.createFrame();
statsRow.layoutMode = 'HORIZONTAL'; statsRow.itemSpacing = 10;
statsRow.fills = []; statsRow.resize(358, 1);
statsRow.primaryAxisSizingMode = 'FIXED'; statsRow.counterAxisSizingMode = 'AUTO';
statsRow.paddingLeft = 16; statsRow.paddingRight = 16;

const mkStat = (label, value, subtext, valueColor) => {
  const s = figma.createFrame();
  s.layoutMode = 'VERTICAL'; s.itemSpacing = 2; s.layoutGrow = 1;
  s.fills = [{ type: 'SOLID', color: WHITE }]; s.cornerRadius = 14; s.effects = [SC];
  s.paddingTop = 12; s.paddingBottom = 12; s.paddingLeft = 12; s.paddingRight = 12;
  s.primaryAxisSizingMode = 'AUTO'; s.counterAxisSizingMode = 'AUTO';
  s.appendChild(txt(label, 10, 500, G500));
  s.appendChild(txt(value, 18, 700, valueColor));
  if (subtext) s.appendChild(txt(subtext, 10, 400, G400));
  return s;
};

statsRow.appendChild(mkStat('Penghunian', '3/5', '60%', P700));
statsRow.appendChild(mkStat('Pendapatan', 'RM2,400', '/bulan', G800));
statsRow.appendChild(mkStat('Kutipan', '100%', 'Bulan ini', GREEN600));
s1.appendChild(statsRow);

// Section header — Rooms
const roomHeader = figma.createFrame();
roomHeader.layoutMode = 'HORIZONTAL'; roomHeader.fills = [];
roomHeader.resize(358, 1); roomHeader.primaryAxisSizingMode = 'FIXED';
roomHeader.counterAxisSizingMode = 'AUTO';
roomHeader.primaryAxisAlignItems = 'SPACE_BETWEEN'; roomHeader.counterAxisAlignItems = 'CENTER';
roomHeader.paddingLeft = 16; roomHeader.paddingRight = 16;
roomHeader.appendChild(txt('Bilik (5)', 13, 700, G800));
roomHeader.appendChild(txt('+ Tambah', 12, 600, P600));
s1.appendChild(roomHeader);

// Room cards — mix of occupied and vacant
const roomsContainer = figma.createFrame();
roomsContainer.layoutMode = 'VERTICAL'; roomsContainer.itemSpacing = 10;
roomsContainer.fills = [];
roomsContainer.resize(358, 1); roomsContainer.primaryAxisSizingMode = 'AUTO';
roomsContainer.counterAxisSizingMode = 'FIXED';
roomsContainer.paddingLeft = 16; roomsContainer.paddingRight = 16;

const mkOccupiedRoom = (roomLabel, rent, tenantName, tenantInitial, phone) => {
  const card = figma.createFrame();
  card.layoutMode = 'HORIZONTAL'; card.itemSpacing = 12;
  card.fills = [{ type: 'SOLID', color: WHITE }]; card.cornerRadius = 16; card.effects = [SC];
  card.paddingTop = 14; card.paddingBottom = 14; card.paddingLeft = 14; card.paddingRight = 14;
  card.resize(358, 1); card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'FIXED';
  card.counterAxisAlignItems = 'CENTER';

  // Green left accent
  const accent = figma.createRectangle();
  accent.resize(3, 48); accent.fills = [{ type: 'SOLID', color: GREEN500 }];
  accent.cornerRadius = 4;
  card.appendChild(accent);

  // Avatar
  card.appendChild(avatar(tenantInitial, 38, P100, P700));

  // Info
  const info = figma.createFrame();
  info.layoutMode = 'VERTICAL'; info.itemSpacing = 2; info.fills = [];
  info.layoutGrow = 1;
  info.primaryAxisSizingMode = 'AUTO'; info.counterAxisSizingMode = 'AUTO';

  const nameRow = figma.createFrame();
  nameRow.layoutMode = 'HORIZONTAL'; nameRow.fills = []; nameRow.itemSpacing = 6;
  nameRow.primaryAxisSizingMode = 'AUTO'; nameRow.counterAxisSizingMode = 'AUTO';
  nameRow.counterAxisAlignItems = 'CENTER';
  nameRow.appendChild(txt(roomLabel, 12, 700, G800));
  nameRow.appendChild(pill('Dihuni', GREEN100, GREEN700));
  info.appendChild(nameRow);

  info.appendChild(txt(tenantName, 13, 500, G700));

  const metaRow = figma.createFrame();
  metaRow.layoutMode = 'HORIZONTAL'; metaRow.fills = []; metaRow.itemSpacing = 8;
  metaRow.primaryAxisSizingMode = 'AUTO'; metaRow.counterAxisSizingMode = 'AUTO';
  metaRow.appendChild(txt(`RM${rent}/bln`, 11, 400, G500));
  metaRow.appendChild(txt(`📱 ${phone}`, 11, 400, G400));
  info.appendChild(metaRow);

  card.appendChild(info);

  // Chevron
  card.appendChild(txt('›', 18, 400, G300));

  return card;
};

const mkVacantRoom = (roomLabel, rent) => {
  const card = figma.createFrame();
  card.layoutMode = 'HORIZONTAL'; card.itemSpacing = 12;
  card.fills = [{ type: 'SOLID', color: WHITE }];
  card.strokes = [{ type: 'SOLID', color: G200 }]; card.strokeWeight = 1;
  card.dashPattern = [6, 4];
  card.cornerRadius = 16;
  card.paddingTop = 14; card.paddingBottom = 14; card.paddingLeft = 14; card.paddingRight = 14;
  card.resize(358, 1); card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'FIXED';
  card.counterAxisAlignItems = 'CENTER';

  // Gray left accent
  const accent = figma.createRectangle();
  accent.resize(3, 40); accent.fills = [{ type: 'SOLID', color: G300 }];
  accent.cornerRadius = 4;
  card.appendChild(accent);

  // Empty avatar
  const emptyAvatar = figma.createFrame();
  emptyAvatar.resize(38, 38); emptyAvatar.cornerRadius = 38;
  emptyAvatar.fills = [{ type: 'SOLID', color: G100 }];
  emptyAvatar.layoutMode = 'HORIZONTAL';
  emptyAvatar.primaryAxisAlignItems = 'CENTER'; emptyAvatar.counterAxisAlignItems = 'CENTER';
  emptyAvatar.primaryAxisSizingMode = 'FIXED'; emptyAvatar.counterAxisSizingMode = 'FIXED';
  emptyAvatar.appendChild(txt('?', 16, 400, G400));
  card.appendChild(emptyAvatar);

  // Info
  const info = figma.createFrame();
  info.layoutMode = 'VERTICAL'; info.itemSpacing = 2; info.fills = [];
  info.layoutGrow = 1;
  info.primaryAxisSizingMode = 'AUTO'; info.counterAxisSizingMode = 'AUTO';

  const nameRow = figma.createFrame();
  nameRow.layoutMode = 'HORIZONTAL'; nameRow.fills = []; nameRow.itemSpacing = 6;
  nameRow.primaryAxisSizingMode = 'AUTO'; nameRow.counterAxisSizingMode = 'AUTO';
  nameRow.counterAxisAlignItems = 'CENTER';
  nameRow.appendChild(txt(roomLabel, 12, 700, G800));
  nameRow.appendChild(pill('Kosong', G100, G500));
  info.appendChild(nameRow);

  info.appendChild(txt('Tiada penyewa', 13, 400, G400));
  info.appendChild(txt(`RM${rent}/bln`, 11, 400, G500));

  card.appendChild(info);

  // Invite CTA
  const inviteBtn = figma.createFrame();
  inviteBtn.layoutMode = 'HORIZONTAL'; inviteBtn.itemSpacing = 4;
  inviteBtn.fills = [{ type: 'SOLID', color: P50 }]; inviteBtn.cornerRadius = 8;
  inviteBtn.paddingTop = 6; inviteBtn.paddingBottom = 6;
  inviteBtn.paddingLeft = 10; inviteBtn.paddingRight = 10;
  inviteBtn.primaryAxisSizingMode = 'AUTO'; inviteBtn.counterAxisSizingMode = 'AUTO';
  inviteBtn.appendChild(txt('+ Jemput', 11, 600, P600));
  card.appendChild(inviteBtn);

  return card;
};

roomsContainer.appendChild(mkOccupiedRoom('Bilik A', '500', 'Nabila Ahmad', 'N', '012-345 6789'));
roomsContainer.appendChild(mkOccupiedRoom('Bilik B', '550', 'Aiman Razak', 'A', '011-234 5678'));
roomsContainer.appendChild(mkOccupiedRoom('Bilik C', '500', 'Siti Fatimah', 'S', '013-456 7890'));
roomsContainer.appendChild(mkVacantRoom('Bilik D', '500'));
roomsContainer.appendChild(mkVacantRoom('Bilik E', '450'));
s1.appendChild(roomsContainer);

s1.x = startX; s1.y = 0;
figma.currentPage.appendChild(s1);

// ====================================================================
// SCREEN 2: ROOM EXPANDED — Occupied (Bottom Sheet)
// ====================================================================
const s2 = figma.createFrame();
s2.name = 'Room Detail — Occupied';
s2.resize(W, 520);
s2.fills = [{ type: 'SOLID', color: SURFACE }];
s2.layoutMode = 'VERTICAL'; s2.primaryAxisSizingMode = 'AUTO';
s2.counterAxisSizingMode = 'FIXED';
s2.paddingTop = 20; s2.paddingBottom = 24;
s2.paddingLeft = 20; s2.paddingRight = 20;
s2.itemSpacing = 16;

// Sheet handle
const handle = figma.createRectangle();
handle.resize(40, 4); handle.fills = [{ type: 'SOLID', color: G300 }]; handle.cornerRadius = 2;
const handleWrap = figma.createFrame();
handleWrap.layoutMode = 'HORIZONTAL'; handleWrap.fills = [];
handleWrap.resize(350, 4); handleWrap.primaryAxisSizingMode = 'FIXED'; handleWrap.counterAxisSizingMode = 'FIXED';
handleWrap.primaryAxisAlignItems = 'CENTER';
handleWrap.appendChild(handle);
s2.appendChild(handleWrap);

// Room title
const roomTitle = figma.createFrame();
roomTitle.layoutMode = 'HORIZONTAL'; roomTitle.fills = []; roomTitle.itemSpacing = 8;
roomTitle.primaryAxisSizingMode = 'AUTO'; roomTitle.counterAxisSizingMode = 'AUTO';
roomTitle.counterAxisAlignItems = 'CENTER';
roomTitle.appendChild(txt('Bilik A', 18, 700, G800));
roomTitle.appendChild(pill('Dihuni', GREEN100, GREEN700));
s2.appendChild(roomTitle);

// Tenant profile card
const profileCard = figma.createFrame();
profileCard.layoutMode = 'HORIZONTAL'; profileCard.itemSpacing = 14;
profileCard.fills = [{ type: 'SOLID', color: WHITE }]; profileCard.cornerRadius = 16; profileCard.effects = [SM];
profileCard.paddingTop = 16; profileCard.paddingBottom = 16;
profileCard.paddingLeft = 16; profileCard.paddingRight = 16;
profileCard.resize(350, 1); profileCard.primaryAxisSizingMode = 'AUTO'; profileCard.counterAxisSizingMode = 'FIXED';
profileCard.counterAxisAlignItems = 'CENTER';

profileCard.appendChild(avatar('N', 48, P100, P700));

const profileInfo = figma.createFrame();
profileInfo.layoutMode = 'VERTICAL'; profileInfo.itemSpacing = 4; profileInfo.fills = [];
profileInfo.layoutGrow = 1;
profileInfo.primaryAxisSizingMode = 'AUTO'; profileInfo.counterAxisSizingMode = 'AUTO';
profileInfo.appendChild(txt('Nabila Ahmad', 16, 700, G800));
profileInfo.appendChild(txt('📱 012-345 6789', 12, 400, G500));
profileInfo.appendChild(txt('✉ nabila@email.com', 12, 400, G500));
profileCard.appendChild(profileInfo);
s2.appendChild(profileCard);

// Key info grid
const infoGrid = figma.createFrame();
infoGrid.layoutMode = 'HORIZONTAL'; infoGrid.itemSpacing = 8;
infoGrid.fills = []; infoGrid.resize(350, 1);
infoGrid.primaryAxisSizingMode = 'FIXED'; infoGrid.counterAxisSizingMode = 'AUTO';

const mkInfoBlock = (label, value) => {
  const b = figma.createFrame();
  b.layoutMode = 'VERTICAL'; b.itemSpacing = 2;
  b.fills = [{ type: 'SOLID', color: G50 }]; b.cornerRadius = 12;
  b.paddingTop = 10; b.paddingBottom = 10; b.paddingLeft = 12; b.paddingRight = 12;
  b.layoutGrow = 1;
  b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
  b.appendChild(txt(label, 10, 500, G500));
  b.appendChild(txt(value, 13, 700, G800));
  return b;
};
infoGrid.appendChild(mkInfoBlock('Masuk', '15 Jan 2025'));
infoGrid.appendChild(mkInfoBlock('Sewa', 'RM 500/bln'));
infoGrid.appendChild(mkInfoBlock('Deposit', 'RM 1,000'));
s2.appendChild(infoGrid);

// Action buttons
const actions = figma.createFrame();
actions.layoutMode = 'VERTICAL'; actions.itemSpacing = 8;
actions.fills = []; actions.resize(350, 1);
actions.primaryAxisSizingMode = 'AUTO'; actions.counterAxisSizingMode = 'FIXED';

const mkAction = (emoji, label, desc, isDestructive) => {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.itemSpacing = 12;
  row.fills = [{ type: 'SOLID', color: WHITE }]; row.cornerRadius = 14;
  row.strokes = [{ type: 'SOLID', color: isDestructive ? RED50 : G100 }]; row.strokeWeight = 1;
  row.paddingTop = 14; row.paddingBottom = 14; row.paddingLeft = 14; row.paddingRight = 14;
  row.resize(350, 1); row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'FIXED';
  row.counterAxisAlignItems = 'CENTER';

  const iconWrap = figma.createFrame();
  iconWrap.resize(36, 36); iconWrap.cornerRadius = 10;
  iconWrap.fills = [{ type: 'SOLID', color: isDestructive ? RED50 : P50 }];
  iconWrap.layoutMode = 'HORIZONTAL';
  iconWrap.primaryAxisAlignItems = 'CENTER'; iconWrap.counterAxisAlignItems = 'CENTER';
  iconWrap.primaryAxisSizingMode = 'FIXED'; iconWrap.counterAxisSizingMode = 'FIXED';
  iconWrap.appendChild(txt(emoji, 16, 400, isDestructive ? RED600 : P600));
  row.appendChild(iconWrap);

  const labelCol = figma.createFrame();
  labelCol.layoutMode = 'VERTICAL'; labelCol.itemSpacing = 1; labelCol.fills = [];
  labelCol.layoutGrow = 1;
  labelCol.primaryAxisSizingMode = 'AUTO'; labelCol.counterAxisSizingMode = 'AUTO';
  labelCol.appendChild(txt(label, 13, 600, isDestructive ? RED600 : G800));
  labelCol.appendChild(txt(desc, 11, 400, G400));
  row.appendChild(labelCol);

  row.appendChild(txt('›', 16, 400, G300));
  return row;
};

actions.appendChild(mkAction('📋', 'Lihat Bil', 'Bil bulanan penyewa ini', false));
actions.appendChild(mkAction('📄', 'Perjanjian Sewa', 'Lihat atau buat perjanjian', false));
actions.appendChild(mkAction('💬', 'WhatsApp', 'Hubungi penyewa', false));
actions.appendChild(mkAction('🚪', 'Pindah Keluar', 'Proses pindah keluar', true));
s2.appendChild(actions);

s2.x = startX + W + 40; s2.y = 0;
figma.currentPage.appendChild(s2);

// ====================================================================
// SCREEN 3: ROOM EXPANDED — Vacant (with pending invite)
// ====================================================================
const s3 = figma.createFrame();
s3.name = 'Room Detail — Vacant';
s3.resize(W, 420);
s3.fills = [{ type: 'SOLID', color: SURFACE }];
s3.layoutMode = 'VERTICAL'; s3.primaryAxisSizingMode = 'AUTO';
s3.counterAxisSizingMode = 'FIXED';
s3.paddingTop = 20; s3.paddingBottom = 24;
s3.paddingLeft = 20; s3.paddingRight = 20;
s3.itemSpacing = 16;

// Handle
const handle3 = figma.createRectangle();
handle3.resize(40, 4); handle3.fills = [{ type: 'SOLID', color: G300 }]; handle3.cornerRadius = 2;
const handleWrap3 = figma.createFrame();
handleWrap3.layoutMode = 'HORIZONTAL'; handleWrap3.fills = [];
handleWrap3.resize(350, 4); handleWrap3.primaryAxisSizingMode = 'FIXED'; handleWrap3.counterAxisSizingMode = 'FIXED';
handleWrap3.primaryAxisAlignItems = 'CENTER';
handleWrap3.appendChild(handle3);
s3.appendChild(handleWrap3);

// Room title
const roomTitle3 = figma.createFrame();
roomTitle3.layoutMode = 'HORIZONTAL'; roomTitle3.fills = []; roomTitle3.itemSpacing = 8;
roomTitle3.primaryAxisSizingMode = 'AUTO'; roomTitle3.counterAxisSizingMode = 'AUTO';
roomTitle3.counterAxisAlignItems = 'CENTER';
roomTitle3.appendChild(txt('Bilik D', 18, 700, G800));
roomTitle3.appendChild(pill('Kosong', G100, G500));
s3.appendChild(roomTitle3);

// Room info
const roomInfo3 = figma.createFrame();
roomInfo3.layoutMode = 'HORIZONTAL'; roomInfo3.itemSpacing = 8; roomInfo3.fills = [];
roomInfo3.resize(350, 1); roomInfo3.primaryAxisSizingMode = 'FIXED'; roomInfo3.counterAxisSizingMode = 'AUTO';
roomInfo3.appendChild(mkInfoBlock('Sewa', 'RM 500/bln'));
roomInfo3.appendChild(mkInfoBlock('Status', 'Menunggu'));
s3.appendChild(roomInfo3);

// Pending invite chip
const inviteChip = figma.createFrame();
inviteChip.layoutMode = 'HORIZONTAL'; inviteChip.itemSpacing = 10;
inviteChip.fills = [{ type: 'SOLID', color: AMBER50 }];
inviteChip.strokes = [{ type: 'SOLID', color: AMBER100 }]; inviteChip.strokeWeight = 1;
inviteChip.cornerRadius = 14;
inviteChip.paddingTop = 12; inviteChip.paddingBottom = 12;
inviteChip.paddingLeft = 14; inviteChip.paddingRight = 14;
inviteChip.resize(350, 1); inviteChip.primaryAxisSizingMode = 'AUTO'; inviteChip.counterAxisSizingMode = 'FIXED';
inviteChip.counterAxisAlignItems = 'CENTER';

inviteChip.appendChild(txt('⏳', 16, 400, AMBER600));
const inviteInfo = figma.createFrame();
inviteInfo.layoutMode = 'VERTICAL'; inviteInfo.itemSpacing = 2; inviteInfo.fills = [];
inviteInfo.layoutGrow = 1;
inviteInfo.primaryAxisSizingMode = 'AUTO'; inviteInfo.counterAxisSizingMode = 'AUTO';
inviteInfo.appendChild(txt('Jemputan dihantar', 12, 600, AMBER600));
inviteInfo.appendChild(txt('ali@email.com · Tamat 15 Apr', 11, 400, AMBER500));
inviteInfo.appendChild(inviteInfo);
const revokeBtn = figma.createFrame();
revokeBtn.layoutMode = 'HORIZONTAL';
revokeBtn.fills = [{ type: 'SOLID', color: WHITE }]; revokeBtn.cornerRadius = 8;
revokeBtn.paddingTop = 4; revokeBtn.paddingBottom = 4;
revokeBtn.paddingLeft = 8; revokeBtn.paddingRight = 8;
revokeBtn.primaryAxisSizingMode = 'AUTO'; revokeBtn.counterAxisSizingMode = 'AUTO';
revokeBtn.appendChild(txt('Batal', 11, 500, AMBER600));
inviteChip.appendChild(revokeBtn);
s3.appendChild(inviteChip);

// Empty state illustration
const emptyState = figma.createFrame();
emptyState.layoutMode = 'VERTICAL'; emptyState.itemSpacing = 8;
emptyState.fills = [{ type: 'SOLID', color: WHITE }]; emptyState.cornerRadius = 16;
emptyState.paddingTop = 24; emptyState.paddingBottom = 24;
emptyState.paddingLeft = 20; emptyState.paddingRight = 20;
emptyState.resize(350, 1); emptyState.primaryAxisSizingMode = 'AUTO'; emptyState.counterAxisSizingMode = 'FIXED';
emptyState.counterAxisAlignItems = 'CENTER';
emptyState.effects = [SC];

emptyState.appendChild(txt('🏠', 36, 400, G400));
const emptyTitle = txt('Bilik ini kosong', 14, 600, G700);
emptyTitle.textAlignHorizontal = 'CENTER';
emptyState.appendChild(emptyTitle);
const emptyDesc = txt('Jemput penyewa baru untuk mengisi bilik ini.', 12, 400, G500, 300);
emptyDesc.textAlignHorizontal = 'CENTER';
emptyState.appendChild(emptyDesc);
s3.appendChild(emptyState);

// Invite CTA
s3.appendChild(btn('+ Jemput Penyewa Baru', P600, WHITE, 350, false));

s3.x = startX + (W + 40) * 2; s3.y = 0;
figma.currentPage.appendChild(s3);

figma.viewport.scrollAndZoomIntoView([s1, s2, s3]);
console.log('✓ Created 3 Property Detail screens');
