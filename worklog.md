# TDC — Timar Dental Center | Project Worklog

## Project Brief
Clone of dentlyworks.com (dental CAD design outsourcing site) for **TDC (Timar Dental Center)**.
- Bilingual: Persian (RTL, default) + English (LTR switch, client-side)
- Single route `/` — all views (modals, admin panel, lab dashboard) rendered as overlays/views on one page
- Dark theme + orange accent, modern smooth design
- Portfolio (Case Vault): admin uploads images + downloadable work files (up to 200MB), free download for all visitors
- Lab panel: register/login, submit cases (upload scan files), track status, messages
- Admin panel: manage portfolio, services/pricing (Toman), ALL site texts, contact info, cases status, inquiries
- Admin credentials: tdctimar@gmail.com / timar1234 (role ADMIN)
- Contact: 09107586343, 09186606709, tdctimar@gmail.com, instagram.com/timar_dental, t.me/Timar_Dental
- Customer club infrastructure prepared (points, referralCode fields) — feature added later

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Project analysis, dentlyworks.com research, requirements gathering

Work Log:
- Analyzed dentlyworks.com via page_reader + agent-browser screenshots
- Identified sections: announcement bar, floating pill nav, dark hero with stats, 4-step process, services (3 categories), comparison slider, pricing cards + calculator + rate-card email form, Case Vault (filterable portfolio), FAQ accordion, Talk To Us (call booking + inquiry form), CTA, footer, modals (login, upload case with tooth chart, policies, QC checklist)
- Brand colors on original: dark teal/emerald + orange CTAs + mint accents → TDC version: dark + orange
- Gathered user requirements (see Project Brief)

Stage Summary:
- Full spec confirmed with user. Starting implementation: DB schema, auth, APIs, bilingual frontend, admin panel, lab dashboard.

---
Task ID: 2
Agent: image-generation subagent
Task: Generate 8 branded dental CAD images for TDC website

Work Log:
- Created directories public/images/portfolio and public/images/site via mkdir -p
- Generated all 8 images via `z-ai image` CLI (one attempt each, no failures), consistent brand style: dark charcoal studio background + warm orange rim lighting + premium 3D dental CAD renders, no text/watermarks/logos:
  1. portfolio/zirconia-crowns.png — three full-contour zirconia crowns (1152x864) ✔
  2. portfolio/screw-retained-crown.png — screw-retained implant crown w/ titanium base (1152x864) ✔
  3. portfolio/zirconia-bridge.png — 3-unit zirconia bridge, multi-unit connectors (1152x864) ✔
  4. portfolio/digital-denture.png — complete digital denture, lower arch w/ pink gingiva (1152x864) ✔
  5. portfolio/smile-design.png — veneer smile design overlay w/ measurement grid (1152x864) ✔
  6. portfolio/full-arch.png — All-on-X hybrid prosthesis w/ titanium bar (1152x864) ✔
  7. site/abutment.png — custom titanium abutment macro render (1152x864) ✔
  8. site/scan-wireframe.png — upper jaw glowing orange wireframe mesh scan (1344x768) ✔
- Verification: `file` showed CLI saved JPEG data under .png extension → re-encoded all 8 to true PNG via Python PIL; re-verified with `file` (all "PNG image data", correct dimensions) and `stat` (all non-zero)

Stage Summary:
- All 8 images READY in /home/z/my-project/public/images/{portfolio,site}/ as valid PNGs:
  - zirconia-crowns.png 538657 B | screw-retained-crown.png 244957 B | zirconia-bridge.png 585330 B | digital-denture.png 550452 B | smile-design.png 598101 B | full-arch.png 760745 B | abutment.png 658519 B | scan-wireframe.png 969822 B
- Failures: none. No other project files modified. Images ready for Task implementation (Case Vault portfolio + site sections).

---
Task ID: 3-4
Agent: main (Z.ai Code)
Task: Database schema + seed + full backend APIs

Work Log:
- Defined Prisma schema: User (ADMIN/LAB + points/referralCode for future customer club), PortfolioItem (images + downloadable files), Service (Toman pricing), SiteSetting (all editable texts), Case + CaseMessage, Inquiry, Subscriber
- db:push successful, Prisma client generated
- Seed script (prisma/seed.ts): admin tdctimar@gmail.com/timar1234, demo lab lab@demo.ir/lab1234, ~90 site settings (fa/en), 10 services with Toman prices, 7 portfolio items w/ placeholder sample files
- Auth: custom JWT (jose) in httpOnly cookie + bcryptjs — src/lib/auth.ts (getSessionUser, requireAdmin, requireUser)
- Upload: streaming PUT /api/upload?kind=&name= → public/uploads/<subdir> (200MB max, ext whitelist) — src/lib/upload.ts
- Download: GET /api/download?p=&item= streams attachment + increments portfolio downloads
- APIs: /api/site (public bundle), auth (register/login/logout/me PATCH), /api/cases (POST), /api/cases/mine, /api/cases/[id]/messages (GET/POST), admin: portfolio CRUD, services CRUD, settings PUT, cases GET + [id] PATCH/DELETE, inquiries GET + [id] PATCH/DELETE, stats

Stage Summary:
- Backend complete. All data (texts, pricing, contact) editable via settings API. Next: bilingual frontend.

---
Task ID: 5-9
Agent: main (Z.ai Code)
Task: Bilingual frontend + modals + admin panel + lab dashboard + full browser verification

Work Log:
- Built globals.css theme (dark #0a0c0f + orange #f97316 brand, custom scrollbar, glass, grid, animations), layout.tsx (Vazirmatn + Space Grotesk, fa/rtl default, SEO metadata)
- store.ts (zustand): lang fa/en with dir switching + localStorage, user session, site data, overlay router (auth/portfolio/policy/admin/lab)
- i18n.ts: all UI chrome strings fa/en, category labels, formatters (Toman fa-IR/en-US, bytes, dates)
- Sections: Nav (floating glass pill, lang switcher, mobile menu), Hero (live case-manager mockup cycling statuses, stats, gradient CTA), Process (interactive 4 steps), Services (3 groups from DB), WhoDesigns (drag/keyboard comparison slider + abutment image), Pricing (category cards + live calculator + rate-card subscribe), CaseVault (filter chips w/ counts, cards w/ badge + direct download button + detail modal w/ gallery & file list), FAQ accordion, TalkToUs (call card + inquiry form + contact chips), CtaBand, Footer (quick links, policies modals, contacts, social)
- Modals: AuthModal (login/register tabs, error mapping), PortfolioModal (gallery + downloads + CTA), PolicyModal (terms/privacy/refund from settings)
- AdminPanel (full-screen overlay, 7 tabs): stats dashboard, cases (status select + detail dialog), portfolio CRUD (FileDrop images+files, publish toggle), services inline editing (price/turnaround/category/unit/active), inquiries (read/delete), site texts CMS (all fa/en fields + FAQ editor + process editor + hero stats editor), subscribers
- LabDashboard: new case (service select w/ price hint + FileDrop scan uploads), my cases (status timeline + final files download), profile (edit + password + referral code/points placeholder for customer club)
- CaseDetail shared dialog: case info, case files, delivery files (admin upload), message thread both ways
- FileDrop: XHR streaming upload w/ real progress %, 200MB support, drag&drop, uploaded list w/ remove
- Fixes during verification: dialog z-index 50→90 (above panels), AdminTexts initial values loading, mobile menu opacity, dialog a11y title, portfolio modal empty state, lab tab data attributes
- Verified via agent-browser: admin login (tdctimar@gmail.com/timar1234), lab registration (rezai.lab@test.ir), real STL upload (134B), case submit TDC-9753, status RECEIVED→IN_DESIGN→DELIVERED, admin message delivered to lab, delivery file uploaded & downloadable (200B), portfolio download API 200, inquiries + subscribe APIs OK, EN/LTR switch, mobile 390px responsive, comparison slider real-mouse drag, footer sticky bottom, zero console errors, lint clean

Stage Summary:
- COMPLETE: dentlyworks-style one-page site for TDC — bilingual fa/en, dark+orange, portfolio w/ free downloads (200MB), full admin CMS, lab portal with case pipeline (CRM-ready data), customer-club infrastructure (points/referral) ready for future feature.
