// ============================================
// SewaKita - Tenant: Dashboard, Bills, Payments, Payment Success
// Run on: "Tenant & Shared" page
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
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };
const GREEN700 = { r: 21/255, g: 128/255, b: 61/255 };
const AMBER50 = { r: 255/255, g: 251/255, b: 235/255 };
const AMBER600 = { r: 217/255, g: 119/255, b: 6/255 };
const AMBER700 = { r: 180/255, g: 83/255, b: 9/255 };
const AMBER800 = { r: 146/255, g: 64/255, b: 14/255 };
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
  b.cornerRadius = 999; b.paddingLeft = 12; b.paddingRight = 12;
  b.paddingTop = 4; b.paddingBottom = 4;
  b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
  b.appendChild(t(text, 14, 500, fg));
  return b;
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
// TENANT DASHBOARD
// =====================
const dash = figma.createFrame();
dash.name = 'Tenant Dashboard';
dash.resize(W, 1100);
dash.fills = [{ type: 'SOLID', color: SURFACE }];
dash.layoutMode = 'VERTICAL'; dash.primaryAxisSizingMode = 'AUTO';
dash.counterAxisSizingMode = 'FIXED';
dash.paddingTop = 16; dash.paddingBottom = 24;
dash.paddingLeft = 16; dash.paddingRight = 16;
dash.itemSpacing = 16;

// Greeting
const greet = figma.createFrame();
greet.layoutMode = 'VERTICAL'; greet.fills = []; greet.itemSpacing = 4;
greet.resize(358, 1); greet.primaryAxisSizingMode = 'AUTO'; greet.counterAxisSizingMode = 'FIXED';
greet.appendChild(t('Welcome', 14, 400, G500));
greet.appendChild(t('Ali bin Ahmad', 20, 700, G800));
dash.appendChild(greet);

// Outstanding warning
const warnCard = figma.createFrame(); warnCard.name = 'Outstanding Warning';
warnCard.layoutMode = 'HORIZONTAL'; warnCard.resize(358, 1);
warnCard.primaryAxisSizingMode = 'FIXED'; warnCard.counterAxisSizingMode = 'AUTO';
warnCard.fills = [{ type: 'SOLID', color: AMBER50 }]; warnCard.cornerRadius = 16;
warnCard.effects = [SC]; warnCard.strokes = [{ type: 'SOLID', color: { r: 253/255, g: 230/255, b: 138/255 } }]; warnCard.strokeWeight = 1;
warnCard.paddingTop = 16; warnCard.paddingBottom = 16;
warnCard.paddingLeft = 16; warnCard.paddingRight = 16;
warnCard.itemSpacing = 12; warnCard.counterAxisAlignItems = 'CENTER';
warnCard.appendChild(t('!', 16, 700, AMBER600));
const warnInfo = figma.createFrame();
warnInfo.layoutMode = 'VERTICAL'; warnInfo.fills = []; warnInfo.itemSpacing = 2;
warnInfo.primaryAxisSizingMode = 'AUTO'; warnInfo.layoutGrow = 1;
warnInfo.appendChild(t('Outstanding: RM1,200', 14, 600, AMBER800));
warnInfo.appendChild(t('From 2 months', 12, 400, AMBER600));
warnCard.appendChild(warnInfo);
dash.appendChild(warnCard);

// Hero Bill Card
const heroBill = figma.createFrame(); heroBill.name = 'Current Bill';
heroBill.resize(358, 1); heroBill.primaryAxisSizingMode = 'AUTO'; heroBill.counterAxisSizingMode = 'FIXED';
heroBill.layoutMode = 'VERTICAL';
heroBill.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [
  { color: { ...P600, a: 1 }, position: 0 },
  { color: { ...P700, a: 1 }, position: 0.5 },
  { color: { ...P800, a: 1 }, position: 1 }
], gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]] }];
heroBill.cornerRadius = 16; heroBill.effects = [SM];
heroBill.paddingTop = 20; heroBill.paddingBottom = 20;
heroBill.paddingLeft = 20; heroBill.paddingRight = 20;
heroBill.itemSpacing = 16;

heroBill.appendChild(t('Bil April 2026', 14, 500, P200));
heroBill.appendChild(t('RM935', 30, 700, WHITE));

// Breakdown sub-card
const breakdown = figma.createFrame();
breakdown.layoutMode = 'VERTICAL'; breakdown.resize(318, 1);
breakdown.primaryAxisSizingMode = 'AUTO'; breakdown.counterAxisSizingMode = 'FIXED';
breakdown.fills = [{ type: 'SOLID', color: WHITE, opacity: 0.15 }];
breakdown.cornerRadius = 12; breakdown.paddingTop = 12; breakdown.paddingBottom = 12;
breakdown.paddingLeft = 12; breakdown.paddingRight = 12; breakdown.itemSpacing = 6;

const lineItems = [['Room Rent', 'RM850'], ['Electricity', 'RM40'], ['Water', 'RM15'], ['Internet', 'RM30']];
for (const [label, amount] of lineItems) {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = [];
  row.resize(294, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.appendChild(t(label, 14, 400, WHITE));
  row.appendChild(t(amount, 14, 500, WHITE));
  breakdown.appendChild(row);
}
heroBill.appendChild(breakdown);

heroBill.appendChild(badge('Belum Bayar', G100, G600));
dash.appendChild(heroBill);

// Tenancy Info Card
const tenCard = figma.createFrame(); tenCard.name = 'Tenancy Info';
tenCard.layoutMode = 'VERTICAL'; tenCard.resize(358, 1);
tenCard.primaryAxisSizingMode = 'AUTO'; tenCard.counterAxisSizingMode = 'FIXED';
tenCard.fills = [{ type: 'SOLID', color: WHITE }]; tenCard.cornerRadius = 16;
tenCard.effects = [SM]; tenCard.paddingTop = 16; tenCard.paddingBottom = 16;
tenCard.paddingLeft = 16; tenCard.paddingRight = 16; tenCard.itemSpacing = 12;

const tenTop = figma.createFrame();
tenTop.layoutMode = 'HORIZONTAL'; tenTop.fills = []; tenTop.itemSpacing = 12;
tenTop.resize(326, 1); tenTop.primaryAxisSizingMode = 'FIXED'; tenTop.counterAxisSizingMode = 'AUTO';
tenTop.counterAxisAlignItems = 'CENTER';

const homeIcon = figma.createFrame(); homeIcon.resize(36, 36);
homeIcon.fills = [{ type: 'SOLID', color: P50 }]; homeIcon.cornerRadius = 999;
homeIcon.layoutMode = 'HORIZONTAL'; homeIcon.primaryAxisAlignItems = 'CENTER'; homeIcon.counterAxisAlignItems = 'CENTER';
homeIcon.appendChild(t('H', 14, 700, P600));
tenTop.appendChild(homeIcon);

const tenInfo = figma.createFrame();
tenInfo.layoutMode = 'VERTICAL'; tenInfo.fills = []; tenInfo.itemSpacing = 2;
tenInfo.primaryAxisSizingMode = 'AUTO'; tenInfo.layoutGrow = 1;
tenInfo.appendChild(t('Rumah Teres Bangi', 14, 600, G900));
tenInfo.appendChild(t('Room A1 - RM850/bulan', 12, 400, G500));
tenTop.appendChild(tenInfo);
tenCard.appendChild(tenTop);

// Divider + meta
const tenDiv = figma.createRectangle();
tenDiv.resize(326, 1); tenDiv.fills = [{ type: 'SOLID', color: G100 }];
tenCard.appendChild(tenDiv);

const tenMeta = figma.createFrame();
tenMeta.layoutMode = 'HORIZONTAL'; tenMeta.fills = []; tenMeta.itemSpacing = 16;
tenMeta.resize(326, 1); tenMeta.primaryAxisSizingMode = 'FIXED'; tenMeta.counterAxisSizingMode = 'AUTO';
tenMeta.appendChild(t('Deposit: RM1,700', 12, 400, G500));
tenMeta.appendChild(t('Since: 01 Jan 2026', 12, 400, G500));
tenMeta.appendChild(t('View Agreement', 12, 700, P600));
tenCard.appendChild(tenMeta);
dash.appendChild(tenCard);

// WhatsApp Contact button
const waBtn = figma.createFrame(); waBtn.name = 'Contact Landlord';
waBtn.layoutMode = 'HORIZONTAL'; waBtn.resize(358, 48);
waBtn.primaryAxisSizingMode = 'FIXED'; waBtn.counterAxisSizingMode = 'FIXED';
waBtn.primaryAxisAlignItems = 'CENTER'; waBtn.counterAxisAlignItems = 'CENTER';
waBtn.fills = [{ type: 'SOLID', color: GREEN600 }]; waBtn.cornerRadius = 12;
waBtn.itemSpacing = 8;
waBtn.appendChild(t('Contact Landlord', 14, 600, WHITE));
dash.appendChild(waBtn);

// Recent Payments
dash.appendChild(t('PAYMENT HISTORY', 12, 700, G800));

const payCard = figma.createFrame(); payCard.name = 'Recent Payments';
payCard.layoutMode = 'VERTICAL'; payCard.resize(358, 1);
payCard.primaryAxisSizingMode = 'AUTO'; payCard.counterAxisSizingMode = 'FIXED';
payCard.fills = [{ type: 'SOLID', color: WHITE }]; payCard.cornerRadius = 16;
payCard.effects = [SM];

const payments = [['15 Mar 2026', 'Bank Transfer', '+RM850'], ['15 Feb 2026', 'DuitNow', '+RM850'], ['14 Jan 2026', 'Cash', '+RM850']];
for (let i = 0; i < payments.length; i++) {
  const [date, method, amount] = payments[i];
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = [];
  row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.paddingTop = 12; row.paddingBottom = 12; row.paddingLeft = 16; row.paddingRight = 16;
  row.primaryAxisAlignItems = 'SPACE_BETWEEN'; row.counterAxisAlignItems = 'CENTER';
  if (i > 0) { row.strokes = [{ type: 'SOLID', color: G100 }]; row.strokesIncludedInLayout = false; row.strokeTopWeight = 1; row.strokeBottomWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; }

  const pInfo = figma.createFrame();
  pInfo.layoutMode = 'VERTICAL'; pInfo.fills = []; pInfo.itemSpacing = 2;
  pInfo.primaryAxisSizingMode = 'AUTO'; pInfo.counterAxisSizingMode = 'AUTO';
  pInfo.appendChild(t(date, 14, 400, G900));
  pInfo.appendChild(t(method, 12, 400, G400));
  row.appendChild(pInfo);
  row.appendChild(t(amount, 14, 600, GREEN600));
  payCard.appendChild(row);
}
dash.appendChild(payCard);

dash.x = startX; dash.y = 0;

// =====================
// TENANT BILLS
// =====================
const tBills = figma.createFrame();
tBills.name = 'Tenant Bills';
tBills.resize(W, 900);
tBills.fills = [{ type: 'SOLID', color: SURFACE }];
tBills.layoutMode = 'VERTICAL'; tBills.primaryAxisSizingMode = 'AUTO';
tBills.counterAxisSizingMode = 'FIXED';
tBills.paddingTop = 16; tBills.paddingBottom = 24;
tBills.paddingLeft = 16; tBills.paddingRight = 16;
tBills.itemSpacing = 16;

tBills.appendChild(t('Bills', 20, 700, G800));

// Month groups
const billMonths = [
  { month: 'APRIL 2026', bills: [{ label: 'Rent & Utilities', amount: 'RM935', status: 'Belum Bayar', bg: G100, fg: G600 }] },
  { month: 'MARCH 2026', bills: [{ label: 'Rent & Utilities', amount: 'RM920', status: 'Selesai', bg: GREEN50, fg: GREEN700 }] },
  { month: 'FEBRUARY 2026', bills: [{ label: 'Rent & Utilities', amount: 'RM910', status: 'Selesai', bg: GREEN50, fg: GREEN700 }] },
];

for (const mg of billMonths) {
  tBills.appendChild(t(mg.month, 12, 700, G800));

  const mCard = figma.createFrame();
  mCard.layoutMode = 'VERTICAL'; mCard.resize(358, 1);
  mCard.primaryAxisSizingMode = 'AUTO'; mCard.counterAxisSizingMode = 'FIXED';
  mCard.fills = [{ type: 'SOLID', color: WHITE }]; mCard.cornerRadius = 16; mCard.effects = [SM];

  for (const bill of mg.bills) {
    const row = figma.createFrame();
    row.layoutMode = 'HORIZONTAL'; row.fills = [];
    row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
    row.paddingTop = 12; row.paddingBottom = 12; row.paddingLeft = 16; row.paddingRight = 16;
    row.itemSpacing = 8; row.counterAxisAlignItems = 'CENTER';

    const bInfo = figma.createFrame();
    bInfo.layoutMode = 'VERTICAL'; bInfo.fills = []; bInfo.itemSpacing = 2;
    bInfo.primaryAxisSizingMode = 'AUTO'; bInfo.layoutGrow = 1;
    bInfo.appendChild(t(bill.label, 14, 500, G900));
    row.appendChild(bInfo);

    row.appendChild(t(bill.amount, 14, 700, G900));
    row.appendChild(badgeSm(bill.status, bill.bg, bill.fg));
    row.appendChild(t('v', 14, 400, G400));
    mCard.appendChild(row);
  }
  tBills.appendChild(mCard);
}

// Expanded bill detail (for first one)
const expDetail = figma.createFrame(); expDetail.name = 'Bill Expanded';
expDetail.layoutMode = 'VERTICAL'; expDetail.resize(358, 1);
expDetail.primaryAxisSizingMode = 'AUTO'; expDetail.counterAxisSizingMode = 'FIXED';
expDetail.fills = [{ type: 'SOLID', color: G50 }]; expDetail.cornerRadius = 8;
expDetail.paddingTop = 12; expDetail.paddingBottom = 12;
expDetail.paddingLeft = 12; expDetail.paddingRight = 12; expDetail.itemSpacing = 6;

const expItems = [['Room Rent', 'RM850'], ['Electricity', 'RM40'], ['Water', 'RM15'], ['Internet', 'RM30']];
for (const [label, amount] of expItems) {
  const eRow = figma.createFrame();
  eRow.layoutMode = 'HORIZONTAL'; eRow.fills = [];
  eRow.resize(334, 1); eRow.primaryAxisSizingMode = 'FIXED'; eRow.counterAxisSizingMode = 'AUTO';
  eRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  eRow.appendChild(t(label, 14, 400, G500));
  eRow.appendChild(t(amount, 14, 400, G800));
  expDetail.appendChild(eRow);
}
const expDiv = figma.createRectangle(); expDiv.resize(334, 1); expDiv.fills = [{ type: 'SOLID', color: G200 }];
expDetail.appendChild(expDiv);
const totalRow = figma.createFrame();
totalRow.layoutMode = 'HORIZONTAL'; totalRow.fills = [];
totalRow.resize(334, 1); totalRow.primaryAxisSizingMode = 'FIXED'; totalRow.counterAxisSizingMode = 'AUTO';
totalRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
totalRow.appendChild(t('Total', 14, 700, G800));
totalRow.appendChild(t('RM935', 14, 700, G800));
expDetail.appendChild(totalRow);
tBills.appendChild(expDetail);

// Pay Now button
const payNow = figma.createFrame(); payNow.name = 'Pay Now';
payNow.layoutMode = 'HORIZONTAL'; payNow.resize(358, 44);
payNow.primaryAxisSizingMode = 'FIXED'; payNow.counterAxisSizingMode = 'FIXED';
payNow.primaryAxisAlignItems = 'CENTER'; payNow.counterAxisAlignItems = 'CENTER';
payNow.fills = [{ type: 'SOLID', color: P600 }]; payNow.cornerRadius = 8; payNow.itemSpacing = 8;
payNow.appendChild(t('Pay Now - RM935', 14, 500, WHITE));
tBills.appendChild(payNow);

tBills.x = startX + W + 50; tBills.y = 0;

// =====================
// TENANT PAYMENTS
// =====================
const tPay = figma.createFrame();
tPay.name = 'Tenant Payments';
tPay.resize(W, 700);
tPay.fills = [{ type: 'SOLID', color: SURFACE }];
tPay.layoutMode = 'VERTICAL'; tPay.primaryAxisSizingMode = 'AUTO';
tPay.counterAxisSizingMode = 'FIXED';
tPay.paddingTop = 16; tPay.paddingBottom = 24;
tPay.paddingLeft = 16; tPay.paddingRight = 16;
tPay.itemSpacing = 16;

tPay.appendChild(t('Payments', 20, 700, G800));
tPay.appendChild(t('MARCH 2026', 12, 700, G800));

const payList = figma.createFrame(); payList.name = 'Payment List';
payList.layoutMode = 'VERTICAL'; payList.resize(358, 1);
payList.primaryAxisSizingMode = 'AUTO'; payList.counterAxisSizingMode = 'FIXED';
payList.fills = [{ type: 'SOLID', color: WHITE }]; payList.cornerRadius = 16; payList.effects = [SM];

const payItems = [['15 Mar 2026', 'Bank Transfer', '+RM850'], ['3 Mar 2026', 'DuitNow', '+RM70']];
for (let i = 0; i < payItems.length; i++) {
  const [date, method, amount] = payItems[i];
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = [];
  row.resize(358, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.paddingTop = 12; row.paddingBottom = 12; row.paddingLeft = 16; row.paddingRight = 16;
  row.primaryAxisAlignItems = 'SPACE_BETWEEN'; row.counterAxisAlignItems = 'CENTER';
  if (i > 0) { row.strokes = [{ type: 'SOLID', color: G100 }]; row.strokesIncludedInLayout = false; row.strokeTopWeight = 1; row.strokeBottomWeight = 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; }
  const pInfo = figma.createFrame();
  pInfo.layoutMode = 'VERTICAL'; pInfo.fills = []; pInfo.itemSpacing = 2;
  pInfo.primaryAxisSizingMode = 'AUTO'; pInfo.counterAxisSizingMode = 'AUTO';
  pInfo.appendChild(t(date, 14, 400, G900));
  pInfo.appendChild(t(method, 12, 400, G400));
  row.appendChild(pInfo);
  row.appendChild(t(amount, 14, 600, GREEN600));
  payList.appendChild(row);
}
tPay.appendChild(payList);

tPay.appendChild(t('FEBRUARY 2026', 12, 700, G800));
const payList2 = figma.createFrame(); payList2.layoutMode = 'VERTICAL'; payList2.resize(358, 1);
payList2.primaryAxisSizingMode = 'AUTO'; payList2.counterAxisSizingMode = 'FIXED';
payList2.fills = [{ type: 'SOLID', color: WHITE }]; payList2.cornerRadius = 16; payList2.effects = [SM];
const row2 = figma.createFrame();
row2.layoutMode = 'HORIZONTAL'; row2.fills = [];
row2.resize(358, 1); row2.primaryAxisSizingMode = 'FIXED'; row2.counterAxisSizingMode = 'AUTO';
row2.paddingTop = 12; row2.paddingBottom = 12; row2.paddingLeft = 16; row2.paddingRight = 16;
row2.primaryAxisAlignItems = 'SPACE_BETWEEN'; row2.counterAxisAlignItems = 'CENTER';
const p2Info = figma.createFrame();
p2Info.layoutMode = 'VERTICAL'; p2Info.fills = []; p2Info.itemSpacing = 2;
p2Info.primaryAxisSizingMode = 'AUTO'; p2Info.counterAxisSizingMode = 'AUTO';
p2Info.appendChild(t('14 Feb 2026', 14, 400, G900));
p2Info.appendChild(t('DuitNow', 12, 400, G400));
row2.appendChild(p2Info);
row2.appendChild(t('+RM850', 14, 600, GREEN600));
payList2.appendChild(row2);
tPay.appendChild(payList2);

tPay.x = startX + (W + 50) * 2; tPay.y = 0;

// =====================
// PAYMENT SUCCESS
// =====================
const paySuccess = figma.createFrame();
paySuccess.name = 'Payment Success';
paySuccess.resize(W, 700);
paySuccess.fills = [{ type: 'SOLID', color: SURFACE }];
paySuccess.layoutMode = 'VERTICAL'; paySuccess.primaryAxisSizingMode = 'AUTO';
paySuccess.counterAxisSizingMode = 'FIXED'; paySuccess.counterAxisAlignItems = 'CENTER';
paySuccess.paddingTop = 80; paySuccess.paddingBottom = 24;
paySuccess.paddingLeft = 16; paySuccess.paddingRight = 16;
paySuccess.itemSpacing = 8;

// Success icon
const sIcon = figma.createFrame(); sIcon.resize(80, 80);
sIcon.fills = [{ type: 'SOLID', color: GREEN50 }]; sIcon.cornerRadius = 999;
sIcon.layoutMode = 'HORIZONTAL'; sIcon.primaryAxisAlignItems = 'CENTER'; sIcon.counterAxisAlignItems = 'CENTER';
sIcon.appendChild(t('✓', 40, 700, GREEN600));
paySuccess.appendChild(sIcon);

const spFrame = figma.createFrame(); spFrame.resize(10, 16); spFrame.fills = [];
paySuccess.appendChild(spFrame);
paySuccess.appendChild(t('Payment Successful!', 24, 700, G800));
const spFrame2 = figma.createFrame(); spFrame2.resize(10, 4); spFrame2.fills = [];
paySuccess.appendChild(spFrame2);
paySuccess.appendChild(t('Your payment has been recorded successfully.', 14, 400, G500, 300));

// Next steps card
const spFrame3 = figma.createFrame(); spFrame3.resize(10, 16); spFrame3.fills = [];
paySuccess.appendChild(spFrame3);

const nsCard = figma.createFrame(); nsCard.name = 'Next Steps';
nsCard.layoutMode = 'VERTICAL'; nsCard.resize(358, 1);
nsCard.primaryAxisSizingMode = 'AUTO'; nsCard.counterAxisSizingMode = 'FIXED';
nsCard.fills = [{ type: 'SOLID', color: WHITE }]; nsCard.cornerRadius = 16;
nsCard.strokes = [{ type: 'SOLID', color: G200 }]; nsCard.strokeWeight = 1;
nsCard.paddingTop = 16; nsCard.paddingBottom = 16;
nsCard.paddingLeft = 16; nsCard.paddingRight = 16; nsCard.itemSpacing = 6;

nsCard.appendChild(t('What happens next?', 12, 400, G500));
nsCard.appendChild(t('1. Your landlord will be notified', 14, 400, G700, 326));
nsCard.appendChild(t('2. A receipt will be sent to your email', 14, 400, G700, 326));
nsCard.appendChild(t('3. Your bill status will be updated', 14, 400, G700, 326));
paySuccess.appendChild(nsCard);

const spFrame4 = figma.createFrame(); spFrame4.resize(10, 16); spFrame4.fills = [];
paySuccess.appendChild(spFrame4);

const backBtn = figma.createFrame(); backBtn.name = 'Back to Dashboard';
backBtn.layoutMode = 'HORIZONTAL'; backBtn.resize(358, 48);
backBtn.primaryAxisSizingMode = 'FIXED'; backBtn.counterAxisSizingMode = 'FIXED';
backBtn.primaryAxisAlignItems = 'CENTER'; backBtn.counterAxisAlignItems = 'CENTER';
backBtn.fills = [{ type: 'SOLID', color: P600 }]; backBtn.cornerRadius = 8;
backBtn.appendChild(t('Back to Dashboard', 16, 500, WHITE));
paySuccess.appendChild(backBtn);

paySuccess.x = startX + (W + 50) * 3; paySuccess.y = 0;

figma.notify('Tenant screens created: Dashboard, Bills, Payments, Payment Success!');

})();
