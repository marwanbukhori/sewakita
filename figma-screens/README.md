# SewaKita Figma Screen Scripts

Paste each script into Figma's Plugin Dev Console to generate screens.

**How to use:**
1. Open the Figma file: https://www.figma.com/design/EyDrlhBWOql4KgepoXrgav
2. Go to Plugins > Development > Open Console (or use Quick Actions: Cmd+/)
3. Switch to the correct page in Figma before running each script
4. Paste the script content and press Run

**Run order:**
| # | File | Page | Screens |
|---|------|------|---------|
| 1 | `01-landlord-properties.js` | Landlord Flow | Properties List, Property Detail |
| 2 | `02-landlord-forms.js` | Landlord Flow | Property Form, Tenant Form (Invite) |
| 3 | `03-landlord-bills.js` | Landlord Flow | Bills Page (2 tabs) |
| 4 | `04-landlord-misc.js` | Landlord Flow | Tenants, Agreement View, Move Out, Notifications |
| 5 | `05-tenant-screens.js` | Tenant & Shared | Tenant Dashboard, Bills, Payments, Payment Success |
| 6 | `06-shared-screens.js` | Tenant & Shared | Account, Profile Edit, FAQ, Report, Monthly Report |
| 8 | `08-ocr-smart-templates.js` | Landlord Flow | Smart Entry, Scan Result, Anomaly Warning |

**Note:** Each script is self-contained with all helpers. Just switch to the right page and paste.
