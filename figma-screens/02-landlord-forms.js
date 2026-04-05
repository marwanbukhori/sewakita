// ============================================
// SewaKita - Landlord: Property Form + Tenant Invite Form
// Run on: "Landlord Flow" page
// ============================================

const W = 390;
const WHITE = { r: 1, g: 1, b: 1 };
const SURFACE = { r: 247/255, g: 250/255, b: 252/255 };
const P50 = { r: 240/255, g: 249/255, b: 255/255 };
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
const GREEN50 = { r: 240/255, g: 253/255, b: 244/255 };
const GREEN600 = { r: 22/255, g: 163/255, b: 74/255 };

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

function sel(label, value, w) {
  const g = figma.createFrame(); g.name = label;
  g.layoutMode = 'VERTICAL'; g.itemSpacing = 6; g.fills = [];
  g.resize(w, 1); g.primaryAxisSizingMode = 'AUTO'; g.counterAxisSizingMode = 'FIXED';
  g.appendChild(t(label, 14, 500, G700, w));
  const i = figma.createFrame(); i.layoutMode = 'HORIZONTAL'; i.resize(w, 44);
  i.primaryAxisSizingMode = 'FIXED'; i.counterAxisSizingMode = 'FIXED';
  i.fills = [{ type: 'SOLID', color: WHITE }]; i.strokes = [{ type: 'SOLID', color: G200 }];
  i.strokeWeight = 1; i.cornerRadius = 8; i.paddingLeft = 12; i.paddingRight = 12;
  i.counterAxisAlignItems = 'CENTER'; i.primaryAxisAlignItems = 'SPACE_BETWEEN';
  i.appendChild(t(value, 16, 400, G500));
  i.appendChild(t('v', 12, 400, G400));
  g.appendChild(i); return g;
}

function btn(text, variant, w, h) {
  const b = figma.createFrame(); b.name = text;
  b.layoutMode = 'HORIZONTAL'; b.resize(w, h || 48);
  b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED';
  b.primaryAxisAlignItems = 'CENTER'; b.counterAxisAlignItems = 'CENTER';
  b.cornerRadius = 8; b.itemSpacing = 8;
  if (variant === 'primary') { b.fills = [{ type: 'SOLID', color: P600 }]; b.appendChild(t(text, h === 36 ? 14 : 16, 500, WHITE)); }
  else if (variant === 'secondary') { b.fills = [{ type: 'SOLID', color: WHITE }]; b.strokes = [{ type: 'SOLID', color: P200 }]; b.strokeWeight = 2; b.appendChild(t(text, 14, 500, P600)); }
  else if (variant === 'green') { b.fills = [{ type: 'SOLID', color: GREEN600 }]; b.appendChild(t(text, 14, 500, WHITE)); }
  return b;
}

const existing = figma.currentPage.children;
const startX = existing.length > 0 ? Math.max(...existing.map(n => n.x + n.width)) + 50 : 0;

// =====================
// PROPERTY FORM
// =====================
const form = figma.createFrame();
form.name = 'Property Form';
form.resize(W, 700);
form.fills = [{ type: 'SOLID', color: SURFACE }];
form.layoutMode = 'VERTICAL'; form.primaryAxisSizingMode = 'AUTO';
form.counterAxisSizingMode = 'FIXED';
form.paddingTop = 16; form.paddingBottom = 24;
form.paddingLeft = 16; form.paddingRight = 16;
form.itemSpacing = 16;

form.appendChild(t('< Back', 14, 500, P600));
form.appendChild(t('Add Property', 20, 700, G800));

const fCard = figma.createFrame(); fCard.name = 'Form Card';
fCard.layoutMode = 'VERTICAL'; fCard.resize(358, 1);
fCard.primaryAxisSizingMode = 'AUTO'; fCard.counterAxisSizingMode = 'FIXED';
fCard.fills = [{ type: 'SOLID', color: WHITE }]; fCard.cornerRadius = 24;
fCard.effects = [SM]; fCard.paddingTop = 24; fCard.paddingBottom = 24;
fCard.paddingLeft = 24; fCard.paddingRight = 24; fCard.itemSpacing = 16;

fCard.appendChild(inp('Property Name *', 'e.g. Rumah Teres Bangi', 310));
fCard.appendChild(inp('Address *', 'Full address', 310));
fCard.appendChild(sel('Billing Date', 'Select day (1-28)', 310));

// Helper text
const helper = t('Bills will be generated on this day each month', 12, 400, G500, 310);
fCard.appendChild(helper);

fCard.appendChild(btn('Save', 'primary', 310, 48));
form.appendChild(fCard);
form.x = startX; form.y = 0;

// =====================
// TENANT INVITE FORM
// =====================
const invite = figma.createFrame();
invite.name = 'Invite Tenant';
invite.resize(W, 1100);
invite.fills = [{ type: 'SOLID', color: SURFACE }];
invite.layoutMode = 'VERTICAL'; invite.primaryAxisSizingMode = 'AUTO';
invite.counterAxisSizingMode = 'FIXED';
invite.paddingTop = 16; invite.paddingBottom = 24;
invite.paddingLeft = 16; invite.paddingRight = 16;
invite.itemSpacing = 16;

invite.appendChild(t('< Back', 14, 500, P600));
invite.appendChild(t('Invite Tenant', 20, 700, G800));
invite.appendChild(t('Create an invite link for your new tenant', 14, 400, G500, 358));

// Tenancy details card
const tCard = figma.createFrame(); tCard.name = 'Tenancy Details';
tCard.layoutMode = 'VERTICAL'; tCard.resize(358, 1);
tCard.primaryAxisSizingMode = 'AUTO'; tCard.counterAxisSizingMode = 'FIXED';
tCard.fills = [{ type: 'SOLID', color: WHITE }]; tCard.cornerRadius = 16;
tCard.effects = [SM]; tCard.paddingTop = 20; tCard.paddingBottom = 20;
tCard.paddingLeft = 20; tCard.paddingRight = 20; tCard.itemSpacing = 16;

tCard.appendChild(t('TENANCY DETAILS', 12, 700, G500));
tCard.appendChild(sel('Property *', 'Select property', 318));
tCard.appendChild(sel('Room *', 'Select room', 318));

// 2-col: Rent + Deposit
const row1 = figma.createFrame();
row1.layoutMode = 'HORIZONTAL'; row1.fills = []; row1.itemSpacing = 12;
row1.resize(318, 1); row1.primaryAxisSizingMode = 'FIXED'; row1.counterAxisSizingMode = 'AUTO';
row1.appendChild(inp('Rent (RM) *', '850', 153));
row1.appendChild(inp('Deposit (RM)', '1700', 153));
tCard.appendChild(row1);

tCard.appendChild(inp('Move-in Date', 'Select date', 318));
tCard.appendChild(inp('Email (optional)', 'tenant@email.com', 318));

const emailHelper = t('Used to send bills and receipts', 12, 400, G500, 318);
tCard.appendChild(emailHelper);

invite.appendChild(tCard);

// Agreement toggle card
const agreeCard = figma.createFrame(); agreeCard.name = 'Agreement Toggle';
agreeCard.layoutMode = 'VERTICAL'; agreeCard.resize(358, 1);
agreeCard.primaryAxisSizingMode = 'AUTO'; agreeCard.counterAxisSizingMode = 'FIXED';
agreeCard.fills = [{ type: 'SOLID', color: WHITE }]; agreeCard.cornerRadius = 16;
agreeCard.strokes = [{ type: 'SOLID', color: G200 }]; agreeCard.strokeWeight = 1;

const toggleRow = figma.createFrame();
toggleRow.layoutMode = 'HORIZONTAL'; toggleRow.fills = [];
toggleRow.resize(358, 1); toggleRow.primaryAxisSizingMode = 'FIXED'; toggleRow.counterAxisSizingMode = 'AUTO';
toggleRow.paddingTop = 16; toggleRow.paddingBottom = 16;
toggleRow.paddingLeft = 20; toggleRow.paddingRight = 20;
toggleRow.itemSpacing = 12; toggleRow.counterAxisAlignItems = 'CENTER';

// Checkbox
const checkbox = figma.createFrame(); checkbox.resize(20, 20);
checkbox.fills = []; checkbox.strokes = [{ type: 'SOLID', color: G300 }];
checkbox.strokeWeight = 2; checkbox.cornerRadius = 4;

const toggleInfo = figma.createFrame();
toggleInfo.layoutMode = 'VERTICAL'; toggleInfo.fills = []; toggleInfo.itemSpacing = 2;
toggleInfo.primaryAxisSizingMode = 'AUTO'; toggleInfo.layoutGrow = 1;
toggleInfo.appendChild(t('Include Rental Agreement', 14, 600, G800));
toggleInfo.appendChild(t('Auto-generate a rental agreement PDF', 12, 400, G500, 260));

toggleRow.appendChild(checkbox);
toggleRow.appendChild(toggleInfo);
agreeCard.appendChild(toggleRow);
invite.appendChild(agreeCard);

// Submit button
invite.appendChild(btn('Create Invite Link', 'primary', 358, 48));

invite.x = startX + W + 50; invite.y = 0;

// =====================
// INVITE SUCCESS
// =====================
const success = figma.createFrame();
success.name = 'Invite Success';
success.resize(W, 750);
success.fills = [{ type: 'SOLID', color: SURFACE }];
success.layoutMode = 'VERTICAL'; success.primaryAxisSizingMode = 'AUTO';
success.counterAxisSizingMode = 'FIXED';
success.paddingTop = 16; success.paddingBottom = 24;
success.paddingLeft = 16; success.paddingRight = 16;
success.itemSpacing = 16;
success.counterAxisAlignItems = 'CENTER';

// Success icon
const successIcon = figma.createFrame(); successIcon.resize(64, 64);
successIcon.fills = [{ type: 'SOLID', color: GREEN50 }]; successIcon.cornerRadius = 999;
successIcon.layoutMode = 'HORIZONTAL'; successIcon.primaryAxisAlignItems = 'CENTER'; successIcon.counterAxisAlignItems = 'CENTER';
successIcon.appendChild(t('✓', 28, 700, GREEN600));
success.appendChild(successIcon);

success.appendChild(t('Invite Created!', 20, 700, G800));
success.appendChild(t('Share link for Rumah Teres Bangi - Room B1', 14, 400, G500));

// Share card
const shareCard = figma.createFrame(); shareCard.name = 'Share Card';
shareCard.layoutMode = 'VERTICAL'; shareCard.resize(358, 1);
shareCard.primaryAxisSizingMode = 'AUTO'; shareCard.counterAxisSizingMode = 'FIXED';
shareCard.fills = [{ type: 'SOLID', color: WHITE }]; shareCard.cornerRadius = 16;
shareCard.effects = [SM]; shareCard.paddingTop = 20; shareCard.paddingBottom = 20;
shareCard.paddingLeft = 20; shareCard.paddingRight = 20; shareCard.itemSpacing = 16;

// Link display
const linkBox = figma.createFrame();
linkBox.layoutMode = 'HORIZONTAL'; linkBox.resize(318, 44);
linkBox.primaryAxisSizingMode = 'FIXED'; linkBox.counterAxisSizingMode = 'FIXED';
linkBox.fills = [{ type: 'SOLID', color: { r: 249/255, g: 250/255, b: 251/255 } }];
linkBox.cornerRadius = 12; linkBox.paddingLeft = 12; linkBox.paddingRight = 12;
linkBox.counterAxisAlignItems = 'CENTER'; linkBox.itemSpacing = 8;
linkBox.appendChild(t('sewakita.app/invite/abc123...', 12, 400, G600, 280));
shareCard.appendChild(linkBox);

// Button row
const btnRow = figma.createFrame();
btnRow.layoutMode = 'HORIZONTAL'; btnRow.fills = []; btnRow.itemSpacing = 12;
btnRow.resize(318, 44); btnRow.primaryAxisSizingMode = 'FIXED'; btnRow.counterAxisSizingMode = 'FIXED';
const copyBtn = btn('Copy Link', 'secondary', 1, 44);
copyBtn.layoutGrow = 1;
const waBtn = btn('WhatsApp', 'green', 1, 44);
waBtn.layoutGrow = 1;
btnRow.appendChild(copyBtn);
btnRow.appendChild(waBtn);
shareCard.appendChild(btnRow);
success.appendChild(shareCard);

// Details card
const detailsCard = figma.createFrame(); detailsCard.name = 'Details Card';
detailsCard.layoutMode = 'VERTICAL'; detailsCard.resize(358, 1);
detailsCard.primaryAxisSizingMode = 'AUTO'; detailsCard.counterAxisSizingMode = 'FIXED';
detailsCard.fills = [{ type: 'SOLID', color: WHITE }]; detailsCard.cornerRadius = 16;
detailsCard.strokes = [{ type: 'SOLID', color: G200 }]; detailsCard.strokeWeight = 1;
detailsCard.paddingTop = 16; detailsCard.paddingBottom = 16;
detailsCard.paddingLeft = 16; detailsCard.paddingRight = 16;
detailsCard.itemSpacing = 8;

detailsCard.appendChild(t('DETAILS', 12, 700, G500));
const pairs = [['Property', 'Rumah Teres Bangi'], ['Room', 'Room B1'], ['Rent', 'RM800/month'], ['Deposit', 'RM1,600'], ['Move-in', '1 May 2026']];
for (const [k, v] of pairs) {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL'; row.fills = [];
  row.resize(326, 1); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.appendChild(t(k, 14, 400, G500));
  row.appendChild(t(v, 14, 500, G800));
  detailsCard.appendChild(row);
}
detailsCard.appendChild(t('Expires in 7 days', 12, 400, G400));
success.appendChild(detailsCard);

// Bottom buttons
const botRow = figma.createFrame();
botRow.layoutMode = 'HORIZONTAL'; botRow.fills = []; botRow.itemSpacing = 12;
botRow.resize(358, 48); botRow.primaryAxisSizingMode = 'FIXED'; botRow.counterAxisSizingMode = 'FIXED';
const againBtn = btn('Invite Again', 'secondary', 1, 48);
againBtn.layoutGrow = 1;
const doneBtn = btn('Done', 'primary', 1, 48);
doneBtn.layoutGrow = 1;
botRow.appendChild(againBtn);
botRow.appendChild(doneBtn);
success.appendChild(botRow);

success.x = startX + (W + 50) * 2; success.y = 0;

figma.notify('Property Form + Tenant Invite (form + success) created!');
