// ============================================
// SewaKita - Landlord: Properties List + Property Detail
// Run on: "Landlord Flow" page
// ============================================

const FILE_KEY = 'EyDrlhBWOql4KgepoXrgav';
const W = 390;

// Colors
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
const P100 = { r: 224/255, g: 244/255, b: 255/255 };
const P600 = { r: 0/255, g: 144/255, b: 209/255 };
const P700 = { r: 0/255, g: 112/255, b: 163/255 };
const G100 = { r: 243/255, g: 244/255, b: 246/255 };
const G200 = { r: 229/255, g: 231/255, b: 235/255 };
const G300 = { r: 209/255, g: 213/255, b: 219/255 };
const G400 = { r: 156/255, g: 163/255, b: 175/255 };
const G500 = { r: 107/255, g: 114/255, b: 128/255 };
const G700 = { r: 55/255, g: 65/255, b: 81/255 };
const G800 = { r: 31/255, g: 41/255, b: 55/255 };
const GREEN50 = { r: 240/255, g: 253/255, b: 244/255 };
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const GREEN700 = { r: 21/255, g: 128/255, b: 61/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };
const AMBER700 = { r: 180/255, g: 83/255, b: 9/255 };
const RED500 = { r: 239/255, g: 68/255, b: 68/255 };

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

// Find existing frames to position after them
const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// =====================
// PROPERTIES LIST
// =====================
const props = figma.createFrame();
props.name = 'Properties';
props.resize(W, 900);
props.fills = [{ type: 'SOLID', color: SURFACE }];
props.layoutMode = 'VERTICAL'; props.primaryAxisSizingMode = 'AUTO';
props.counterAxisSizingMode = 'FIXED';
props.paddingTop = 16; props.paddingBottom = 24;
props.paddingLeft = 16; props.paddingRight = 16;
props.itemSpacing = 16;

// Header row
const hdr = figma.createFrame();
hdr.layoutMode = 'HORIZONTAL'; hdr.fills = [];
hdr.resize(358, 1); hdr.primaryAxisSizingMode = 'FIXED'; hdr.counterAxisSizingMode = 'AUTO';
hdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; hdr.counterAxisAlignItems = 'CENTER';

const hdrLeft = figma.createFrame();
hdrLeft.layoutMode = 'VERTICAL'; hdrLeft.fills = []; hdrLeft.itemSpacing = 2;
hdrLeft.primaryAxisSizingMode = 'AUTO'; hdrLeft.counterAxisSizingMode = 'AUTO';
hdrLeft.appendChild(t('Properties', 20, 700, G800));
hdrLeft.appendChild(t('3 properties', 12, 400, G500));
hdr.appendChild(hdrLeft);

const addBtn = figma.createFrame();
addBtn.layoutMode = 'HORIZONTAL'; addBtn.resize(70, 36);
addBtn.primaryAxisSizingMode = 'FIXED'; addBtn.counterAxisSizingMode = 'FIXED';
addBtn.primaryAxisAlignItems = 'CENTER'; addBtn.counterAxisAlignItems = 'CENTER';
addBtn.fills = [{ type: 'SOLID', color: P600 }]; addBtn.cornerRadius = 8;
addBtn.itemSpacing = 4;
addBtn.appendChild(t('+ Add', 14, 500, WHITE));
hdr.appendChild(addBtn);
props.appendChild(hdr);

// Property cards
const propData = [
  { name: 'Rumah Teres Bangi', addr: 'Jln 2/4, Seksyen 2, Bangi', rooms: 4, filled: 3, billing: 1 },
  { name: 'Apartment Shah Alam', addr: 'Blok A, Seksyen 7', rooms: 6, filled: 5, billing: 5 },
  { name: 'Rumah Semi-D Kajang', addr: 'Taman Kajang Prima', rooms: 3, filled: 2, billing: 1 },
];

for (const p of propData) {
  const card = figma.createFrame();
  card.name = p.name;
  card.layoutMode = 'VERTICAL'; card.fills = [{ type: 'SOLID', color: WHITE }];
  card.cornerRadius = 16; card.effects = [SM];
  card.resize(358, 1); card.primaryAxisSizingMode = 'AUTO'; card.counterAxisSizingMode = 'FIXED';
  card.paddingTop = 16; card.paddingBottom = 16; card.paddingLeft = 16; card.paddingRight = 16;
  card.itemSpacing = 12;

  // Property header
  const pHdr = figma.createFrame();
  pHdr.layoutMode = 'HORIZONTAL'; pHdr.fills = [];
  pHdr.resize(326, 1); pHdr.primaryAxisSizingMode = 'FIXED'; pHdr.counterAxisSizingMode = 'AUTO';
  pHdr.itemSpacing = 12; pHdr.counterAxisAlignItems = 'CENTER';

  const iconBox = figma.createFrame(); iconBox.resize(40, 40);
  iconBox.fills = [{ type: 'SOLID', color: P50 }]; iconBox.cornerRadius = 12;
  iconBox.layoutMode = 'HORIZONTAL'; iconBox.primaryAxisAlignItems = 'CENTER'; iconBox.counterAxisAlignItems = 'CENTER';
  iconBox.appendChild(t('B', 18, 700, P600));
  pHdr.appendChild(iconBox);

  const pInfo = figma.createFrame();
  pInfo.layoutMode = 'VERTICAL'; pInfo.fills = []; pInfo.itemSpacing = 2;
  pInfo.primaryAxisSizingMode = 'AUTO'; pInfo.layoutGrow = 1;
  pInfo.appendChild(t(p.name, 14, 700, G800));
  pInfo.appendChild(t(p.addr, 12, 400, G500, 230));
  pHdr.appendChild(pInfo);
  pHdr.appendChild(t('>', 18, 400, G300));
  card.appendChild(pHdr);

  // Occupancy bar
  const occFrame = figma.createFrame();
  occFrame.layoutMode = 'VERTICAL'; occFrame.fills = [];
  occFrame.resize(326, 1); occFrame.primaryAxisSizingMode = 'AUTO'; occFrame.counterAxisSizingMode = 'FIXED';
  occFrame.itemSpacing = 4;

  const occLabelRow = figma.createFrame();
  occLabelRow.layoutMode = 'HORIZONTAL'; occLabelRow.fills = [];
  occLabelRow.resize(326, 1); occLabelRow.primaryAxisSizingMode = 'FIXED'; occLabelRow.counterAxisSizingMode = 'AUTO';
  occLabelRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  occLabelRow.appendChild(t('Rooms filled', 12, 400, G500));
  occLabelRow.appendChild(t(p.filled + '/' + p.rooms, 12, 700, G700));
  occFrame.appendChild(occLabelRow);

  const barBg = figma.createFrame();
  barBg.resize(326, 8); barBg.fills = [{ type: 'SOLID', color: G100 }]; barBg.cornerRadius = 999;
  const fillW = Math.round(326 * p.filled / p.rooms);
  const barFill = figma.createRectangle();
  barFill.resize(fillW, 8);
  barFill.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
    { color: { r: 60/255, g: 194/255, b: 255/255, a: 1 }, position: 0 },
    { color: { r: 0/255, g: 144/255, b: 209/255, a: 1 }, position: 1 }
  ], gradientTransform: [[1, 0, 0], [0, 1, 0]] }];
  barFill.cornerRadius = 999;
  barBg.appendChild(barFill); barFill.x = 0; barFill.y = 0;
  occFrame.appendChild(barBg);
  card.appendChild(occFrame);

  // Stats row
  const statsRow = figma.createFrame();
  statsRow.layoutMode = 'HORIZONTAL'; statsRow.fills = [];
  statsRow.resize(326, 1); statsRow.primaryAxisSizingMode = 'FIXED'; statsRow.counterAxisSizingMode = 'AUTO';
  statsRow.paddingTop = 12; statsRow.itemSpacing = 12;
  statsRow.primaryAxisAlignItems = 'SPACE_BETWEEN';

  const statsLeft = figma.createFrame();
  statsLeft.layoutMode = 'HORIZONTAL'; statsLeft.fills = []; statsLeft.itemSpacing = 12;
  statsLeft.primaryAxisSizingMode = 'AUTO'; statsLeft.counterAxisSizingMode = 'AUTO';
  statsLeft.appendChild(t(p.rooms + ' rooms', 12, 400, G500));
  statsLeft.appendChild(t(p.filled + ' filled', 12, 400, GREEN600));
  if (p.rooms - p.filled > 0) statsLeft.appendChild(t((p.rooms - p.filled) + ' vacant', 12, 400, AMBER700));
  statsRow.appendChild(statsLeft);
  statsRow.appendChild(t('Day ' + p.billing, 10, 400, G400));
  card.appendChild(statsRow);
  props.appendChild(card);
}

props.x = startX; props.y = 0;

// =====================
// PROPERTY DETAIL
// =====================
const detail = figma.createFrame();
detail.name = 'Property Detail';
detail.resize(W, 1200);
detail.fills = [{ type: 'SOLID', color: SURFACE }];
detail.layoutMode = 'VERTICAL'; detail.primaryAxisSizingMode = 'AUTO';
detail.counterAxisSizingMode = 'FIXED';
detail.paddingTop = 16; detail.paddingBottom = 24;
detail.paddingLeft = 16; detail.paddingRight = 16;
detail.itemSpacing = 16;

// Back
detail.appendChild(t('< All properties', 14, 500, P600));

// Header
const dHdr = figma.createFrame();
dHdr.layoutMode = 'HORIZONTAL'; dHdr.fills = [];
dHdr.resize(358, 1); dHdr.primaryAxisSizingMode = 'FIXED'; dHdr.counterAxisSizingMode = 'AUTO';
dHdr.primaryAxisAlignItems = 'SPACE_BETWEEN';

const dHdrLeft = figma.createFrame();
dHdrLeft.layoutMode = 'VERTICAL'; dHdrLeft.fills = []; dHdrLeft.itemSpacing = 2;
dHdrLeft.primaryAxisSizingMode = 'AUTO'; dHdrLeft.counterAxisSizingMode = 'AUTO';
dHdrLeft.appendChild(t('Rumah Teres Bangi', 20, 700, G800));
dHdrLeft.appendChild(t('Jln 2/4, Seksyen 2, Bangi', 14, 400, G500));
dHdrLeft.appendChild(t('Billing day: 1', 12, 400, G400));
dHdr.appendChild(dHdrLeft);
dHdr.appendChild(t('Edit', 14, 500, P600));
detail.appendChild(dHdr);

// Rooms header
const rmHdr = figma.createFrame();
rmHdr.layoutMode = 'HORIZONTAL'; rmHdr.fills = [];
rmHdr.resize(358, 1); rmHdr.primaryAxisSizingMode = 'FIXED'; rmHdr.counterAxisSizingMode = 'AUTO';
rmHdr.primaryAxisAlignItems = 'SPACE_BETWEEN'; rmHdr.counterAxisAlignItems = 'CENTER';
rmHdr.appendChild(t('ROOMS (4)', 12, 700, G800));
rmHdr.appendChild(t('+ Add', 14, 500, P600));
detail.appendChild(rmHdr);

// Room cards
const rooms = [
  { label: 'Room A1', rent: 850, status: 'occupied', tenant: 'Ali bin Ahmad', phone: '012-345 6789' },
  { label: 'Room A2', rent: 750, status: 'occupied', tenant: 'Siti Aminah', phone: '013-987 6543' },
  { label: 'Room B1', rent: 800, status: 'vacant', tenant: null },
  { label: 'Room B2', rent: 650, status: 'occupied', tenant: 'Farid Hakim', phone: '019-222 3344' },
];

for (const rm of rooms) {
  const rc = figma.createFrame();
  rc.name = rm.label;
  rc.layoutMode = 'VERTICAL'; rc.fills = [{ type: 'SOLID', color: WHITE }];
  rc.cornerRadius = 16; rc.effects = [SC];
  rc.resize(358, 1); rc.primaryAxisSizingMode = 'AUTO'; rc.counterAxisSizingMode = 'FIXED';
  rc.paddingTop = 16; rc.paddingBottom = 16; rc.paddingLeft = 16; rc.paddingRight = 16;
  rc.itemSpacing = 12;

  // Room header row
  const rmRow = figma.createFrame();
  rmRow.layoutMode = 'HORIZONTAL'; rmRow.fills = [];
  rmRow.resize(326, 1); rmRow.primaryAxisSizingMode = 'FIXED'; rmRow.counterAxisSizingMode = 'AUTO';
  rmRow.primaryAxisAlignItems = 'SPACE_BETWEEN'; rmRow.counterAxisAlignItems = 'CENTER';

  const rmInfo = figma.createFrame();
  rmInfo.layoutMode = 'VERTICAL'; rmInfo.fills = []; rmInfo.itemSpacing = 2;
  rmInfo.primaryAxisSizingMode = 'AUTO'; rmInfo.counterAxisSizingMode = 'AUTO';
  rmInfo.appendChild(t(rm.label, 14, 600, G800));
  rmInfo.appendChild(t('RM' + rm.rent + '/month', 14, 400, G500));
  rmRow.appendChild(rmInfo);

  const rmRight = figma.createFrame();
  rmRight.layoutMode = 'HORIZONTAL'; rmRight.fills = []; rmRight.itemSpacing = 8;
  rmRight.primaryAxisSizingMode = 'AUTO'; rmRight.counterAxisSizingMode = 'AUTO';
  rmRight.counterAxisAlignItems = 'CENTER';
  rmRight.appendChild(badge(
    rm.status === 'occupied' ? 'Berisi' : 'Kosong',
    rm.status === 'occupied' ? GREEN50 : AMBER50,
    rm.status === 'occupied' ? GREEN700 : AMBER700
  ));
  rmRow.appendChild(rmRight);
  rc.appendChild(rmRow);

  // Divider
  const div = figma.createRectangle();
  div.resize(326, 1); div.fills = [{ type: 'SOLID', color: G100 }];
  rc.appendChild(div);

  if (rm.status === 'occupied' && rm.tenant) {
    // Tenant info
    const tenantRow = figma.createFrame();
    tenantRow.layoutMode = 'HORIZONTAL'; tenantRow.fills = []; tenantRow.itemSpacing = 12;
    tenantRow.resize(326, 1); tenantRow.primaryAxisSizingMode = 'FIXED'; tenantRow.counterAxisSizingMode = 'AUTO';
    tenantRow.counterAxisAlignItems = 'CENTER';

    const avatar = figma.createFrame(); avatar.resize(36, 36);
    avatar.fills = [{ type: 'SOLID', color: P100 }]; avatar.cornerRadius = 999;
    avatar.layoutMode = 'HORIZONTAL'; avatar.primaryAxisAlignItems = 'CENTER'; avatar.counterAxisAlignItems = 'CENTER';
    avatar.appendChild(t(rm.tenant[0], 14, 700, P700));
    tenantRow.appendChild(avatar);

    const tInfo = figma.createFrame();
    tInfo.layoutMode = 'VERTICAL'; tInfo.fills = []; tInfo.itemSpacing = 2;
    tInfo.primaryAxisSizingMode = 'AUTO'; tInfo.layoutGrow = 1;
    tInfo.appendChild(t(rm.tenant, 14, 600, G800));
    tInfo.appendChild(t(rm.phone, 12, 400, G500));
    tenantRow.appendChild(tInfo);
    rc.appendChild(tenantRow);

    // Action buttons
    const actRow = figma.createFrame();
    actRow.layoutMode = 'HORIZONTAL'; actRow.fills = []; actRow.itemSpacing = 8;
    actRow.resize(326, 1); actRow.primaryAxisSizingMode = 'FIXED'; actRow.counterAxisSizingMode = 'AUTO';
    for (const [label, color] of [['View Bills', P600], ['Move Out', RED500]]) {
      const ab = figma.createFrame();
      ab.layoutMode = 'HORIZONTAL'; ab.resize(1, 36); ab.layoutGrow = 1;
      ab.primaryAxisSizingMode = 'FIXED'; ab.counterAxisSizingMode = 'FIXED';
      ab.primaryAxisAlignItems = 'CENTER'; ab.counterAxisAlignItems = 'CENTER';
      ab.fills = []; ab.cornerRadius = 8;
      ab.appendChild(t(label, 14, 500, color));
      actRow.appendChild(ab);
    }
    rc.appendChild(actRow);
  } else {
    const inviteBtn = figma.createFrame();
    inviteBtn.layoutMode = 'HORIZONTAL'; inviteBtn.resize(326, 36);
    inviteBtn.primaryAxisSizingMode = 'FIXED'; inviteBtn.counterAxisSizingMode = 'FIXED';
    inviteBtn.primaryAxisAlignItems = 'CENTER'; inviteBtn.counterAxisAlignItems = 'CENTER';
    inviteBtn.fills = []; inviteBtn.cornerRadius = 8;
    inviteBtn.appendChild(t('+ Invite Tenant', 14, 500, P600));
    rc.appendChild(inviteBtn);
  }
  detail.appendChild(rc);
}

detail.x = startX + W + 50; detail.y = 0;

figma.notify('Properties + Property Detail created!');
