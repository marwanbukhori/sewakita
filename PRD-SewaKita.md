# SewaKita — Product Requirements Document (PRD)

**Version:** 0.1 (Exploration Draft)  
**Author:** Marwan  
**Date:** April 2026  
**Status:** Pre-validation

---

## 1. Overview

SewaKita is a lightweight property management tool built for Malaysian independent landlords who rent out individual rooms or units. Whether managing 3 rooms in one house or 60 rooms across 10 properties, it replaces the current workflow of WhatsApp messages, mental arithmetic, and paper notebooks with a simple PWA that handles tenant tracking, rent collection reminders, utility bill splitting, and receipt generation.

---

## 2. Problem Statement

Malaysia has a massive room rental market driven by students, fresh graduates, and working adults in urban areas like KL, Selangor, Penang, and Johor. Facebook groups dedicated to "rumah sewa" and "bilik sewa" collectively have hundreds of thousands of members with 90+ posts per day.

The typical independent landlord owns 1–10+ properties with 3–6 rooms each. Their current management workflow is entirely manual, and the pain scales directly with portfolio size:

- **Rent tracking** is done via WhatsApp messages or memory. Landlords lose track of who has paid, especially across multiple properties.
- **Utility bill splitting** (TNB electricity, water, Unifi/WiFi) requires manual calculation each month, often leading to disputes or landlords absorbing the difference.
- **Receipts and documentation** are rarely generated, creating problems during tax filing (LHDN) or tenant disputes.
- **Tenancy agreement tracking** — expiry dates, deposit records, and deduction history live in scattered documents or not at all.
- **Communication** happens through informal WhatsApp groups with no structure, audit trail, or automation.

### 2.1 Market Size

Malaysia's rental market is substantial and growing. Key data points:

- **1.8–1.9 million** rented housing units nationwide (DOSM 2020 Census), with 23–25% of Malaysian households renting
- **KL + Selangor** account for 30–35% of the rental market — approximately **550,000–650,000 rented units** in this corridor alone
- **Room rentals** (as opposed to whole-unit) make up an estimated 30–40% of urban KL/Selangor rentals, driven by students, migrant workers, and young professionals
- **70–80%** of Malaysian rental properties are owned by individual landlords, not institutional investors
- **Estimated addressable market:** 150,000–250,000 independent room-renting landlords in KL/Selangor; 300,000–400,000 across urban Malaysia (incl. Penang, Johor, Ipoh)
- **Rental demand is growing** as homeownership affordability declines — median house price-to-income ratio exceeds 4.1x nationally and is higher in KL (Bank Negara Malaysia)

*Sources: DOSM Census & Household Income Survey, NAPIC Property Market Reports, Bank Negara Annual Report*

Existing solutions do not serve this segment. Speedhome and PropertyGuru are listing/matchmaking platforms. Enterprise property management tools (Jejakatuan, StayC) target condo JMBs and large developers with pricing and complexity far beyond what independent landlords need — even those with 10+ properties want simplicity, not an enterprise dashboard.

---

## 3. Target Users

### 3.1 Primary: Independent Landlords (All Scales)

SewaKita serves any landlord managing rental rooms or units independently — from a single property to a portfolio of 10+ houses. The product scales with the landlord's portfolio.

**Segment A: Starter Landlords (1–3 properties)**
- Rent out 2–10 rooms total
- Monthly gross rental income: RM2,000–RM10,000
- Pain: manual tracking is annoying but survivable
- Value proposition: convenience, professional receipts, no more mental arithmetic

**Segment B: Portfolio Landlords (4–10+ properties)**
- Rent out 10–60+ rooms across multiple locations
- Monthly gross rental income: RM10,000–RM50,000+
- Pain: manual tracking is unsustainable — missed payments, billing errors, zero visibility across properties
- Value proposition: operational sanity, cross-property dashboard, scaled billing and reminders
- Willingness to pay: significantly higher — this is a business tool, not a nice-to-have

**Segment C: Property Agents / Managers**
- Manage properties on behalf of multiple owners
- Need per-owner reporting and separation
- Phase 2 target — requires multi-owner/agent features

**Common traits across segments:**
- Age range 25–60, smartphone-literate
- Currently manage via WhatsApp + notebook + spreadsheets (or nothing)
- Based in urban Malaysia (KL, Selangor, Penang, Johor, Ipoh)
- Collect RM300–RM1,200/room/month depending on area and room type

### 3.2 Secondary: Tenants

- Students, fresh grads, working adults
- Primarily Malay, Chinese, Indian — multilingual (BM + English)
- Expect WhatsApp-based communication
- Want clarity on what they owe and proof of payment

---

## 4. Product Vision

**One-liner:** The simplest way for Malaysian landlords to manage rooms, collect rent, and split bills — whether you have 3 rooms or 30.

### 4.1 Design Principles

1. **WhatsApp-native** — Don't fight user behavior. WhatsApp is the communication layer. SewaKita generates the messages; WhatsApp delivers them.
2. **Phone-first** — The landlord manages everything from their phone. No desktop required.
3. **Malay-first, bilingual** — Primary UI in Bahasa Malaysia with English toggle. All generated messages in BM by default.
4. **Zero onboarding friction** — Landlord should add their first property and tenant within 2 minutes of signing up.
5. **Offline-capable** — PWA with service worker caching for read access offline and queued writes synced on reconnect. Full local-first with conflict resolution in Phase 2. Architecture designed to upgrade without rewrites.

---

## 5. Features — MVP (Phase 1)

### 5.1 Property & Room Management

**Description:** Landlord registers their properties and defines rooms within each property.

**Requirements:**
- Add property with name, address, and optional photo
- Add rooms within a property with label (e.g., "Bilik A", "Room 2"), monthly rent amount
- Edit or deactivate rooms (not delete — preserve history)
- Dashboard showing all properties and room occupancy at a glance

### 5.2 Tenant Management

**Description:** Landlord adds tenants and assigns them to rooms with tenancy details. Tenants are both records managed by the landlord AND users who can log in to view their own data.

**Requirements:**
- Add tenant with name, phone number (required), email (required for login), IC number (optional), emergency contact (optional)
- Assign tenant to a room with move-in date, agreed rent, deposit amount, and tenancy end date
- Record deposit paid (amount + date)
- Track deposit deductions with itemized breakdown and optional photo evidence (disclaimer: record-keeping tool, not legal advice)
- Mark tenant as moved out with move-out date and deposit deduction summary
- View tenant history per room (past and current)
- Tenant can log in via magic link or Google Sign-In to access their own data (see Section 5.7)

### 5.3 Monthly Billing & Utility Splitting

**Description:** Each month, the system generates a bill per tenant combining rent + their share of utilities.

**Requirements:**
- Landlord inputs monthly utility readings/amounts per property: TNB (electricity), water (SYABAS/SAJ/etc.), internet (Unifi/Maxis/etc.)
- Configurable split method per utility:
  - **By sub-meter reading (default)** — landlord enters kWh per room from individual meters. This is the dominant method among Malaysian landlords and should be the primary UI flow.
  - **Equal split** across occupied rooms
  - **Fixed amount** per room (e.g., RM80/month flat)
  - **Landlord absorbs** (excluded from tenant bill — common for water at RM10–20/room)
- Auto-generate monthly bill per tenant: base rent + utility share = total due
- Display bill breakdown clearly (tenant sees exactly what they're paying for)
- Bill history per tenant and per property

**Billing Edge Cases:**
- **Mid-month move-in:** prorated first month (rent × remaining days ÷ total days in month)
- **Configurable billing date** per property (not hardcoded to 1st of the month — some landlords bill on 15th, etc.)
- **Utility bill input decoupled from rent due date** — landlord enters TNB/SYABAS bill when it arrives; system calculates and applies the split to the relevant billing period

### 5.4 Payment Tracking

**Description:** Landlord records when tenants pay and tracks outstanding amounts.

**Requirements:**
- Mark tenant as "paid" for a given month with payment date and method (cash, bank transfer, DuitNow, etc.)
- Support partial payments
- Outstanding balance tracker per tenant
- Monthly summary: total expected vs. total received per property
- Visual indicators for overdue payments (>7 days past due date)

### 5.5 WhatsApp Reminders & Receipts

**Description:** Generate pre-formatted WhatsApp messages for billing, reminders, and receipts.

**Requirements:**
- Generate monthly bill message per tenant with full breakdown, ready to send via WhatsApp deep link (`https://wa.me/60xxxxxxx?text=...`)
- Generate payment reminder message for overdue tenants
- Generate payment receipt/acknowledgment message after landlord marks paid
- All messages in Bahasa Malaysia by default with English option
- Landlord can preview and edit message before sending
- One-tap send (opens WhatsApp with pre-filled message)

### 5.6 Authentication & Data

**Description:** Simple, zero-cost auth for both landlords and tenants, with PDPA-compliant data handling.

**Requirements:**
- Sign up / login via **magic link (email)** through Supabase or **Google Sign-In** — zero cost per authentication
- Both landlords and tenants authenticate through the same system with role-based access
- Future upgrade path: WhatsApp OTP (~RM0.19/auth) or SMS OTP (~RM0.10–0.40/auth) when revenue supports it
- Data stored in Supabase (cloud) with PWA service worker cache for offline read access
- Data export (CSV) for tax/record purposes

**PDPA Compliance (Personal Data Protection Act 2010):**
- Data processing notice and consent flow during signup — clearly explain what data is collected and why
- Privacy policy in Bahasa Malaysia (accessible within the app)
- IC number collection is clearly optional with stated purpose ("for tenancy record-keeping only")
- Cross-border data transfer notice (data hosted in Singapore region)
- Purpose limitation — tenant data used only for rental management, never shared with third parties

### 5.7 Tenant Portal

**Description:** Tenants can log in to view their bills, payment history, and tenancy details — reducing "berapa saya kena bayar bulan ni?" WhatsApp messages.

**Requirements:**
- Tenant login via magic link (email) or Google Sign-In — no password needed
- View current month's bill with full breakdown (rent + utility share)
- View bill history and payment history
- View outstanding balance
- View tenancy details (move-in date, agreed rent, deposit amount, tenancy end date)
- In-app notifications alongside WhatsApp messages
- UI structured to support future online payment integration (FPX/DuitNow in Phase 2)
- Tenant can only see their own data — no access to other tenants or landlord-level information

---

## 6. Features — Phase 2 (Post-Validation)

These features are scoped but NOT built until Phase 1 is validated with real users.

### 6.1 Tenancy Agreement Generator
- Pre-filled tenancy agreement template (BM) based on property/tenant/room data
- PDF generation with landlord and tenant details
- Digital signature via simple OTP confirmation (not legally binding but useful as record)

### 6.2 LHDN Tax Summary
- Annual rental income summary per property
- Deductible expense tracking (maintenance, repairs, quit rent, assessment tax)
- Export formatted for Schedule E (Form BE) rental income declaration

### 6.3 Maintenance Request Tracking
- Tenant submits maintenance request via a shared link (no login required)
- Landlord receives WhatsApp notification
- Track status: reported → in progress → resolved
- Photo upload for before/after

### 6.4 Online Payment Integration
- FPX or DuitNow QR integration for direct rent payment
- Auto-reconciliation when payment received
- Likely via Billplz, Toyyib, or Stripe MY

### 6.5 Multi-Language Support
- Full UI in BM, English, and Mandarin
- Generated messages in tenant's preferred language

---

## 7. Technical Architecture (Proposed)

### 7.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite (PWA) | Fast, offline-capable, no app store needed |
| Backend | Supabase | Auth, DB, real-time, storage, RLS — minimal infra management. Free tier: 50K MAU, 500MB DB |
| Hosting | DigitalOcean or Fly.io | Low-cost, SG region for Malaysian latency |
| Auth | Supabase magic link / Google Sign-In (MVP) | Zero cost per authentication for both landlord and tenant |
| Auth (Phase 2) | WhatsApp OTP via 360dialog | ~RM0.19/auth, for users who prefer phone-based login |
| WhatsApp | `wa.me` deep links (MVP) | Zero cost, no API approval needed |
| WhatsApp (Phase 2) | WhatsApp Business API via 360dialog | Automated sends, but requires approval + cost |
| PDF Generation | React-PDF or server-side Puppeteer | Receipts, agreements |

### 7.2 Data Model (Simplified)

```
User (Supabase Auth)
├── id (auth_id), email, role (landlord/tenant), last_login
│
Landlord (extends User)
├── id, auth_id, name, phone, email
│
├── Property[]
│   ├── id, name, address, photo_url, billing_date (day of month)
│   │
│   ├── Room[]
│   │   ├── id, label, rent_amount, status (occupied/vacant)
│   │   │
│   │   └── Tenancy[]
│   │       ├── id, tenant_id, move_in, move_out, deposit, agreed_rent
│   │       ├── deposit_deductions (JSON: [{item, amount, photo_url}])
│   │       └── status (active/ended)
│   │
│   └── UtilityBill[]
│       ├── id, month, type (electric/water/internet)
│       ├── total_amount, split_method
│       ├── per_room_readings (JSON, for sub-meter: [{room_id, kwh}])
│       └── per_room_amount (computed)
│
├── Tenant[] (extends User)
│   ├── id, auth_id, name, phone, email, ic_number
│   └── emergency_contact
│
└── MonthlyBill[]
    ├── id, tenant_id, room_id, month
    ├── rent_amount, utility_breakdown (JSON)
    ├── total_due, total_paid
    ├── status (pending/partial/paid/overdue)
    └── Payment[]
        ├── id, amount, date, method
        └── receipt_sent (boolean)
```

*Note: Landlord and Tenant share the Supabase Auth table (`User`) with role-based access. Row-Level Security (RLS) policies ensure tenants can only read their own data, and landlords can only access their own properties/tenants.*

### 7.3 Key Technical Decisions

- **PWA over native app** — No app store review process, instant updates, works on any phone. Malaysian smartphone penetration is high and Chrome/Safari PWA support is sufficient.
- **Offline-capable with sync** — Service worker caching for read access offline, queued writes synced on reconnect. Full local-first with conflict resolution in Phase 2.
- **WhatsApp deep links for MVP** — Avoids the cost and complexity of WhatsApp Business API. Landlord taps a button, WhatsApp opens with pre-filled message, landlord hits send. Good enough for validation.
- **Tenant has an account** — Tenants log in via magic link or Google Sign-In to view bills, payment history, and tenancy details. Reduces WhatsApp back-and-forth and gives tenants transparency.
- **Supabase as single backend** — Auth, database, real-time subscriptions, and file storage in one platform. Free tier covers early growth (50K MAU). Standard Postgres underneath — portable if needed.

### 7.4 Scalability Considerations

- **Row-Level Security (RLS)** — Supabase RLS policies enforce data isolation from day one. Landlords see only their properties; tenants see only their data.
- **Schema for scale** — Indexes on `property_id`, `tenant_id`, and `month` columns to support portfolio landlords with 60+ rooms across 10+ properties.
- **API pagination & filtering** — All list endpoints support pagination and filtering to handle growing datasets gracefully.
- **PWA performance** — Lazy loading for property/room views, virtual lists for long tenant/bill lists.
- **Separation of concerns** — Billing logic, notification logic, and auth handled as independent modules. Allows upgrading any layer (e.g., adding WhatsApp Business API) without touching others.

---

## 8. Monetization

### 8.1 Pricing Model

| Tier | Price | Includes |
|------|-------|----------|
| Free | RM0 | 1 property, up to 3 rooms, basic billing |
| Pro | RM39/month | Up to 5 properties, unlimited rooms, utility splitting, receipt generation, payment tracking |
| Business | RM79/month | Unlimited properties & rooms, cross-property dashboard, tax summary, agreement generator |
| Business+ (Phase 2) | RM149/month | Multi-owner/agent support, maintenance tracking, tenant portal, priority support |

Pricing scales with the landlord's portfolio — a landlord managing 10 houses at RM79/month is paying less than RM8/property while collecting RM30,000+/month in rent. The ROI is obvious.

### 8.2 Revenue Projections (Conservative)

Assuming launch in KL/Selangor area:
- Target: 100 paying landlords within 6 months (mix of Pro + Business)
- Average revenue per landlord: RM50/month (blended)
- Monthly recurring revenue at 6 months: RM5,000
- Monthly recurring revenue at 12 months (300 landlords): RM15,000
- Portfolio landlords (Segment B) are the high-value accounts — 20% of users but 50%+ of revenue

### 8.3 Alternative/Supplementary Revenue

- **Featured listing for tukang/service providers** — Landlords frequently need plumbers, electricians, aircon servicing. A referral marketplace within the app creates a natural second revenue stream.
- **Financial product partnerships** — Tenant deposit insurance, landlord property insurance referrals.

---

## 9. Go-To-Market Strategy

### 9.1 Validation Phase (Month 1)

1. Join 5–10 "rumah sewa" and community Facebook groups (KL, Selangor, Putrajaya)
2. Observe and document "mencari" patterns and landlord pain points for 1–2 weeks
3. Identify and interview 10 landlords directly — ask how they manage rent, bills, receipts today
4. Build clickable prototype or very minimal MVP (1 property, billing, WhatsApp message generation)
5. Offer to 5 landlords for free in exchange for feedback

### 9.2 Launch Phase (Month 2–3)

1. Post in Facebook groups when relevant ("I built a free tool for landlords to track rent...") — not spam, respond to actual pain points
2. Create short TikTok/Reels demos in BM showing the bill splitting and WhatsApp reminder flow
3. Target admin partnerships — community group admins often are or know landlords
4. Word-of-mouth: if the tool saves 2 hours/month, landlords will tell other landlords

### 9.3 Growth Phase (Month 4–12)

1. SEO: target "cara urus rumah sewa", "template perjanjian sewa", "kira bil elektrik bilik sewa"
2. Content marketing in BM: guides on landlord tax obligations, tenancy rights, utility splitting best practices
3. Expand to Penang, Johor, Ipoh groups
4. Referral program: landlord gets 1 month free for every new paying landlord referred

---

## 10. Success Metrics

### 10.1 Validation Success (Go/No-Go for Build)

- 8 out of 10 interviewed landlords confirm they would use/pay for this
- At least 3 landlords actively use the MVP prototype for 1 billing cycle

### 10.2 Product Metrics (Post-Launch)

| Metric | Target (6 months) |
|--------|-------------------|
| Registered landlords | 500 |
| Paying landlords (Pro) | 100 |
| Monthly active landlords | 300 |
| Bills generated per month | 1,000+ |
| WhatsApp messages sent via app | 2,000+ |
| Churn rate (monthly) | < 5% |

### 10.3 North Star Metric

**Bills generated per month** — This indicates real, recurring usage. A landlord who generates bills monthly is retained.

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Landlords too resistant to change from WhatsApp | High | Don't replace WhatsApp — augment it. The app generates; WhatsApp delivers. |
| Low willingness to pay RM29/month | Medium | Free tier is genuinely useful. Pro conversion driven by utility splitting + multi-property which are clear time-savers. |
| WhatsApp API costs if scaling automated sends | Medium | MVP uses free deep links. Only move to API when volume justifies it. |
| Competitor enters market | Low | Speed to market + community trust is the moat. Big players won't target this niche. |
| Data privacy concerns (tenant IC numbers, financial data) | Medium | IC is optional. All data encrypted at rest. Clear privacy policy in BM. PDPA compliance. |
| Scope creep into full property management | High | Hard scope boundary: we serve independent landlords managing rooms/units. No condo JMB management, no developer-scale tools. Complexity grows via portfolio size, not feature bloat. |

---

## 12. Open Questions

1. **Naming** — "SewaKita" is a working title. Need to validate it doesn't conflict with existing brands and resonates with target users.
2. **OTP provider** — SMS OTP costs ~RM0.15–0.30/SMS. At scale this adds up. WhatsApp OTP via Business API may be cheaper but adds complexity.
3. **Utility sub-metering** — How common is sub-metering in Malaysian room rentals vs. simple equal split? This affects how complex the splitting UI needs to be.
4. **Deposit management** — Should the app track deposit deductions formally, or is this too legally sensitive for a simple tool?
5. **Market size** — Need to quantify: how many small-scale landlords exist in KL/Selangor? NAPIC or DOSM data may help.
6. **Regulatory** — Any licensing requirements for property management tools in Malaysia? Likely none at this scale but worth confirming.

---

## Appendix A: Competitive Landscape

| Product | What It Does | Why It Doesn't Serve Our User |
|---------|-------------|-------------------------------|
| Speedhome | Tenant-landlord matching, zero deposit | Listing platform, not management tool |
| PropertyGuru | Property listing & search | Discovery, not operations |
| Jejakatuan | Condo/strata management | Built for JMBs, not individual landlords |
| StayC | Property management for managers | Enterprise pricing, over-featured for independent landlords |
| Curlec/Billplz | Payment collection | Payment rail only, no property context |
| Excel/Google Sheets | Manual tracking | No automation, no WhatsApp integration, error-prone |
| WhatsApp Groups | Communication | No structure, no billing, no history, no accountability |

---

## Appendix B: User Stories (MVP)

1. As a landlord, I want to add my properties and rooms so I can see all my rentals in one place.
2. As a landlord, I want to add tenants to rooms so I can track who is staying where.
3. As a landlord, I want to input my monthly utility bills and have them split automatically across tenants so I don't have to calculate manually.
4. As a landlord, I want to generate a WhatsApp message with the monthly bill breakdown so I can send it to each tenant with one tap.
5. As a landlord, I want to mark tenants as paid so I can track who still owes me.
6. As a landlord, I want to send a payment reminder via WhatsApp to overdue tenants so I don't have to craft the message myself.
7. As a landlord, I want to see a monthly summary of expected vs. received rent so I know my collection status at a glance.
8. As a landlord, I want to record deposit amounts per tenant so I have a clear record when they move out.
9. As a landlord, I want to export my rental income data so I can use it for LHDN tax filing.
10. As a tenant, I want to receive a clear bill breakdown via WhatsApp so I know exactly what I'm paying for.
