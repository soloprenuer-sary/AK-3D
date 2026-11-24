# Akrinity project

Headless WooCommerce store for Akrinity (3D printing, Mumbai). Read `docs/PROJECT_CONTEXT.md` first, then `docs/BRAND_GUIDELINE.md` and `docs/WEBSITE_GUIDELINE.md`.

Rules for this project:
- Do not start development, install plugins or change the local WordPress site without the user's explicit confirmation. Planning and design drafts are fine.
- Backend is stock WordPress + WooCommerce with no custom backend code (one approved personalization snippet only if plugins fail). All custom code is in the frontend (React/Next.js).
- Follow the design canvas (https://claude.ai/artifact/WcmpoCedMZH5GvyVEXiMJX) and the brand tokens exactly; do not invent a new look.
- Never copy Amazon text or reviews; never point Amazon buyers to the site; keep site prices at or below Amazon.
- Do not store secrets, keys or customer files in the repo. Do not record local database credentials in docs.
- Mark uncertain facts as VERIFY, and legal or tax items as LAWYER/CA.
- Update `docs/PROJECT_CONTEXT.md` (decision log and open items) whenever a decision is made.

## Who does what (owner instruction, 2026-11-25)
- This session is both the **frontend and the backend team**. Do the WordPress work yourself (mu-plugins in `wordpress/mu-plugins/`, wp-config, WP-CLI) over SSH with the saved shortcut `akrinity-server` (SSH key `~/.ssh/id_akrinity_server`; server details are not stored in the repo). Do not wait for, or hand work to, the separate "Ak-3d backend" session. If it sends a message, read it, but the owner decides.
- Drive tests end to end yourself: submit through the website (Playwright with Chrome), change statuses with WP-CLI `wp eval`, read the request History. Do not ask the owner to upload files or log in again.
- Back up a server file before changing an existing one (`~/backups`), keep new code in the repo copy too, and never delete test records without asking.
