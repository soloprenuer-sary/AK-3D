# Hosting and Performance for a Small WooCommerce Store in India (3D model uploads up to 100-300 MB)

Research date: 2026-11-11. Assumed FX rate for conversions: 1 USD = ₹88 (my assumption, not sourced; the live rate may differ by a few rupees). Many web results were affiliate blogs with future-dated or conflicting figures, so only primary vendor pages are treated as firm. Anything not backed by a fetched page is in Inferences or Gaps. Budget frame: total under ₹15,000/yr, hosting ideally ₹6,000-10,000/yr.

## 1. Which concrete options fit the budget (prices, intro vs renewal)

### Takeaway
Hostinger shared WordPress plans are cheapest, but their 48-month promo prices roughly quadruple on renewal, and shared hosting is a weak fit for 100-300 MB uploads. A small VPS (Hostinger KVM 1 at ₹999/mo renewal, AWS Lightsail Mumbai at $7-12/mo, or Vultr High Frequency at about $12/mo) fits the budget. Cloudways does not fit: its entry plan is about ₹14,800/yr before tools.

### Cited Findings
- Hostinger India managed WordPress, 48-month upfront terms. Single ₹69/mo (₹3,312 total, renews ₹289/mo, 10 GB SSD, 1 site, weekly backups). Premium ₹139/mo (₹6,672, renews ₹449/mo, 20 GB SSD, 3 sites). Unlimited ₹199/mo (₹9,552, renews ₹649/mo, 50 GB NVMe, daily backups). Cloud Startup ₹599/mo (₹28,752, renews ₹1,599/mo, 100 GB NVMe). All plans are paid upfront, with a 30-day money-back guarantee; a one-click staging tool is listed generally. — [Hostinger India WordPress hosting](https://www.hostinger.com/in/wordpress-hosting)
- Renewal arithmetic from those figures: Premium ₹449 x 12 = ₹5,388/yr; Unlimited ₹649 x 12 = ₹7,788/yr; Cloud Startup ₹1,599 x 12 = ₹19,188/yr (over budget). The Hostinger page itself does not state the 36/48-month prepay terms beyond the totals above. A third-party affiliate site says renewal runs 2.6x-4.2x the headline rate and gives conflicting Single-plan renewals (₹289 vs ₹399). — [Zoutons (affiliate, indicative only)](https://zoutons.com/news/hostinger-wordpress-hosting-price-india-2026)
- Hostinger KVM VPS India pricing on 24-month terms. KVM 1: 1 vCPU, 4 GB RAM, 50 GB NVMe, 4 TB bandwidth, ₹599/mo (₹14,376 upfront), renews ₹999/mo. KVM 2: 2 vCPU, 8 GB, 100 GB NVMe, ₹779/mo (₹18,696 upfront), renews ₹1,199/mo. KVM 4: ₹1,099/mo, renews ₹2,399/mo. The page lists WordPress, WooCommerce and CloudPanel as available templates/control panels, and an "India" location (Mumbai/Singapore not named on that page). — [Hostinger India VPS](https://www.hostinger.com/in/vps-hosting)
- AWS Lightsail Linux bundles (public IPv4): $5 = 0.5 GB/2 vCPU/20 GB SSD/1 TB; $7 = 1 GB/40 GB/2 TB; $12 = 2 GB/60 GB/3 TB; $24 = 4 GB/80 GB/4 TB. IPv6-only bundles are cheaper ($5 for 1 GB, $10 for 2 GB). Mumbai region bundles include half the data-transfer allowance. A free-tier offer exists but the page gives no details. — [AWS Lightsail pricing](https://aws.amazon.com/lightsail/pricing/)
- Cloudways Flexible plans (US$/mo, listed before a Black Friday discount): Micro 1 GB/1 vCPU/25 GB NVMe $14; Small 2 GB $28; Small+ 2 GB/2 vCPU $37; Medium 4 GB $54. DigitalOcean data centers include Bangalore. Cloudflare Enterprise add-on starts at $4.99/domain/mo; backups are billed at $0.033/GB and can't be turned off on Flexible. Vultr overage is $0.025/GB in Singapore. — [Cloudways pricing](https://www.cloudways.com/en/pricing.php)
- Hetzner Cloud: Singapore has been available since 2024 alongside Germany, Finland and the US. Pages list Regular Performance from €5.49/mo and Cost-Optimized from €5.99/mo, with Cost-Optimized shown under "currently not available". — [Hetzner Cloud](https://www.hetzner.com/cloud/)
- Hetzner raised prices effective 15 June 2026 across regions including Singapore, per a third-party report. — [Northflank blog (secondary)](https://northflank.com/blog/hetzner-cloud-server-price-increases)
- Vultr High Frequency (NVMe): 1 vCPU/2 GB/64 GB at $12/mo; 2 vCPU/4 GB/128 GB at $24/mo; Valebyte lists the 4 GB plan in Bangalore, Delhi NCR and Mumbai. The aggregator marks prices as unverified (checked 14 Jul 2026). Vultr's official page confirms hourly billing and High Frequency plans but blocked my fetch. — [Valebyte India listing (secondary)](https://valebyte.com/en/vps/india/?city=Mumbai&page=3); [Vultr High Frequency](https://www.vultr.com/products/high-frequency-compute/)

### Inferences
- At ₹88/USD: Lightsail $7 = ₹7,392/yr, $12 = ₹12,672/yr, $24 = ₹25,344/yr. Vultr $12 = ₹12,672/yr (plus 18% GST for Indian customers may apply; not verified). Hostinger KVM 1 renewal = ₹11,988/yr; KVM 2 renewal = ₹14,388/yr. Cloudways Micro $14 = about ₹14,784/yr, which alone consumes the whole ₹15,000 budget.
- Realistic budget fits: (a) Hostinger Unlimited/Premium shared (₹2,400-₹7,800/yr); (b) a 2 GB VPS at $7-12/mo (₹7,400-₹12,700/yr); (c) Hostinger KVM 1 (about ₹7,200/yr in year 1 on a 24-month prepay of ₹14,376, then ₹11,988/yr). The upfront 24-month cash outlay on KVM 1 alone is about the whole annual budget, so this is a cash-flow issue even though effective yearly cost is lower.
- Hostinger Cloud Startup, Cloudways, and Kinsta-tier hosts are effectively out of budget once tools are included. Kinsta was not researched; I assume it is well above budget.

### Gaps
- Bluehost India, HostGator India, Rocket.net, E2E Networks, Contabo, Linode/Akamai Mumbai and DigitalOcean Bangalore Droplet prices were not retrieved.
- Hostinger's India data center location (Mumbai vs elsewhere) was not stated on the pages I fetched.
- GST (18%) treatment on each host's displayed price was not confirmed.
- Hetzner's current post-June 2026 exact prices for Singapore were not retrievable from primary pages; third-party figures conflict (CX22/CX23/CPX22 naming differs across sources).

## 2. Real PHP limits (upload_max_filesize, post_max_size, memory_limit, execution time, workers, storage)

### Takeaway
On a self-managed VPS you control every limit (php.ini, nginx/PHP-FPM), so 300 MB uploads are straightforward. On Hostinger shared hosting the only sourced guidance is that limits are "already maximum" and php.ini can't be edited; I could not confirm a hard upload ceiling or PHP worker counts, so verify before buying.

### Cited Findings
- Hostinger's tutorial states shared-hosting limits are already set to the maximum for user convenience and that altering php.ini is not possible. It also suggests values of upload_max_filesize 256M, post_max_size 256M, memory_limit 512M and max_execution_time 180, but these read as recommended values, not confirmed plan defaults. — [Hostinger tutorial on upload_max_filesize](https://www.hostinger.com/tutorials/?p=8078)
- Hostinger support documents setting php_value post_max_size, memory_limit, max_input_time and max_execution_time through .htaccess (local values override master php.ini). — [Hostinger support: PHP values via .htaccess](https://www.hostinger.com/support/4622356-how-to-increase-upload-max-filesize-php-values-via-htaccess-file/)
- Hostinger's WordPress plan page does not state upload limit or PHP worker numbers; it points to a separate article for CPU, RAM and inode limits. The article I fetched covered only inode refreshing. — [Hostinger India WordPress hosting](https://www.hostinger.com/in/wordpress-hosting); [Hostinger support: resource limits](https://www.hostinger.com/support/1583491-what-are-the-php-limits-and-resource-limits-in-hostinger/)
- Storage: Hostinger Single 10 GB SSD, Premium 20 GB SSD, Unlimited 50 GB NVMe, Cloud Startup 100 GB NVMe; Hostinger KVM 1 50 GB NVMe; Lightsail $12 plan 60 GB SSD; Vultr HF 1 vCPU/2 GB 64 GB NVMe. — sources as in section 1.

### Inferences
- 3D files at 100-300 MB each will consume storage fast: 10 GB is about 33-100 files. Plan for 50-100 GB or offload customer uploads to object storage (not researched; see Gaps).
- A 300 MB upload over mobile India networks needs max_execution_time/max_input_time of several minutes and PHP-FPM/nginx client_max_body_size set above 300 MB. On shared plans it is uncertain that the web server layer (LiteSpeed) permits this.
- A VPS also needs tmp-dir space of at least the upload size, and a free-form WooCommerce upload plugin should enforce a file-type allowlist (STL/3MF/STEP) since WordPress blocks these MIME types by default (general knowledge, not sourced).

### Gaps
- No primary source for PHP workers / entry processes on Hostinger, Bluehost India or HostGator India shared plans.
- No primary source for Cloudways default PHP limits (Cloudways lets you change them in the application settings, from my general knowledge, but I did not verify).
- Whether Hostinger or any shared host allows a 300 MB POST in practice (web-server body-size limit, WAF/ModSecurity) is unconfirmed.

## 3. Server location latency to India and CDN options

### Takeaway
Mumbai/Bangalore/Delhi regions exist for DigitalOcean (via Cloudways, Bangalore), Vultr, and Lightsail (Mumbai); Hetzner reaches India only via Singapore. Cloudflare Free/Pro caps proxied request bodies at 100 MB, which breaks 100-300 MB uploads unless the upload path bypasses the proxy. Bunny CDN is cheap for Asia delivery.

### Cited Findings
- Cloudflare's max upload size per plan: Free 100 MB, Pro 100 MB, Business 200 MB, Enterprise up to 5 GB. Workarounds: split the upload, switch the DNS record to DNS-only, or upgrade. — [Cloudflare error 413 docs](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/)
- Bunny CDN: Standard network $0.03/GB in Asia & Oceania and $0.01/GB in Europe/North America, $1/month minimum, 14-day trial without card, Bunny Optimizer $9.50 per website. — [Bunny CDN pricing](https://bunny.net/pricing/cdn/)
- Cloudways: DigitalOcean data centers include Bangalore; Vultr, Linode, AWS and GCP offer 25-30 locations each (individual locations not named on the page). Cloudflare Enterprise add-on from $4.99/domain/mo. — [Cloudways pricing](https://www.cloudways.com/en/pricing.php)
- A Findstack timing test is reported to have found a genuine Bangalore region (BLR1) for DigitalOcean; blr1 is Bangalore and bom1 is Mumbai. — [Findstack](https://findstack.com/resources/best-vps-hosting-india)
- Valebyte lists Vultr High Frequency available in Bangalore, Delhi NCR and Mumbai. — [Valebyte](https://valebyte.com/en/vps/india/?city=Mumbai&page=3)
- Hetzner: Singapore only in Asia, available since 2024. — [Hetzner Cloud](https://www.hetzner.com/cloud/)

### Inferences
- Because Cloudflare Free proxies at most 100 MB per request, a large-model upload form should not sit behind the orange-cloud proxy. Options: put uploads on a DNS-only subdomain (e.g. upload.example.com), use chunked uploads (e.g. resumable/chunked upload plugin), or upload direct to object storage with presigned URLs. Cloudflare Free would still serve the storefront, images and static assets fine.
- Latency ranking for Indian users (general knowledge, not benchmarked here): Mumbai/Bangalore/Delhi servers < Singapore < Europe. A static-asset CDN (Cloudflare Free or Bunny) reduces the difference for images/CSS/JS, but dynamic WooCommerce pages (cart, checkout, account) are not cacheable, so origin location matters for checkout speed. For India-first, choose an India region; Hetzner Singapore is the cheapest non-India fallback.
- Bunny at $0.03/GB: 100 GB of image/asset traffic per month would be about $3 (about ₹264), well within a small budget.

### Gaps
- No measured latency or TTFB numbers from Indian cities to Mumbai vs Singapore vs Europe were found.
- No data on which Indian cities Hostinger shared WordPress serves from.
- Cloudflare Free plan features beyond the upload cap (APO, image resizing, caching rules) were not researched.

## 4. Backups, security, SSL, staging, email deliverability, maintenance effort

### Takeaway
Managed Hostinger plans bundle backups, SSL and staging at low cost; a VPS needs a control panel (CloudPanel is described as free; RunCloud, Ploi and SpinupWP are about $8-12/mo per third-party sources) and a hands-on admin. For email, Brevo's free relay (300/day) or Amazon SES ($0.10 per 1,000) both fit a small store.

### Cited Findings
- Hostinger: Single/Premium free weekly backups; Unlimited daily backups with easy restore; Cloud Startup daily and on-demand; one-click staging tool listed. — [Hostinger India WordPress hosting](https://www.hostinger.com/in/wordpress-hosting)
- Cloudways backups: offsite storage $0.033/GB; Malware Protection add-on from $4/app/mo; Site Manager from $3/app/mo. — [Cloudways pricing](https://www.cloudways.com/en/pricing.php)
- Brevo free plan: SMTP relay with a 300 emails/day limit, counting transactional and marketing mail; works through WP Mail SMTP; a free Brevo for WooCommerce plugin exists. Paid plans start at about $25/mo for 10,000 emails (varies by source). — [Brevo free SMTP server](https://www.brevo.com/en/free-smtp-server/); [Brevo for WooCommerce plugin](https://wordpress.org/plugins/woocommerce-sendinblue-newsletter-subscription/); [WP Mail SMTP review of Brevo](https://wpmailsmtp.com/brevo-review/)
- Amazon SES: $0.10 per 1,000 outbound emails (à la carte), attachments extra at $0.12/GB; the free allowance on the page is $200 credits for new accounts (free plan for 6 months, credits valid 12 months), not a permanent monthly free tier. — [AWS SES pricing](https://aws.amazon.com/ses/pricing/)
- Control panel pricing (third-party, unverified): RunCloud $8-9/mo entry, Ploi about €8/mo, SpinupWP $12/mo entry; one listing tags CloudPanel as free. — [Toolradar RunCloud vs SpinupWP](https://toolradar.com/compare/runcloud-vs-spinupwp); [xCloud alternatives guide](https://xcloud.host/best-runcloud-alternatives/)
- Hostinger's VPS page lists CloudPanel as an available control panel. — [Hostinger India VPS](https://www.hostinger.com/in/vps-hosting)

### Inferences
- A solo developer's maintenance load on an unmanaged VPS includes OS updates, firewall, PHP-FPM tuning, backups and restores; panels like CloudPanel/RunCloud/Ploi reduce this but do not eliminate it. Managed shared hosting minimizes work but limits control over upload limits.
- Cheapest viable email stack for a small store: Brevo free (300/day covers a few hundred orders/day) or SES at $0.10/1,000 (about ₹9 per 1,000 mails). SPF/DKIM/DMARC must be configured on the sending domain either way (general knowledge).
- Panel costs ($8-12/mo, about ₹850-1,050/mo) would add roughly ₹8,500-12,700/yr and could blow the budget; CloudPanel (free) or the Hostinger CloudPanel template is the budget-compatible choice.
- Lightsail snapshots and Hostinger VPS backups are extra/optional (not researched); off-server backups to a second location are advisable.

### Gaps
- Official RunCloud/Ploi/SpinupWP/CloudPanel pricing pages were not fetched (the Brevo pricing page returned no data). Brevo's current free-plan terms were verified only via its free-SMTP marketing page and plugin listings.
- Hostinger's malware scanning, WAF, and free SSL details were not retrieved.
- Indian-specific deliverability issues (e.g. DLT for SMS, Gmail/Yahoo bulk sender rules in 2024-2026) were not researched.

## 5. Recommendation: best 2-3 options ranked

### Takeaway
Ranked: (1) a 2-4 GB Indian-region VPS with CloudPanel (Hostinger KVM 1 or Lightsail Mumbai/Vultr), (2) Hostinger Premium/Unlimited managed WordPress only if upload limits are verified in a trial, (3) Cloudways only if the budget grows. These are my ranking from the sourced prices; none was benchmarked.

### Cited Findings
- Price anchors are listed in section 1 and sourced there. Hostinger and Lightsail both offer money-back or free-trial routes: Hostinger a 30-day money-back guarantee on all plans. — [Hostinger India WordPress hosting](https://www.hostinger.com/in/wordpress-hosting)

### Inferences
1. Self-managed VPS with CloudPanel on a Mumbai/Bangalore region. Candidates: Lightsail Mumbai $12 (2 GB; Mumbai gets half the transfer, 1.5 TB; about ₹12,700/yr) or $7 (1 GB; about ₹7,400/yr, tight for WooCommerce); Vultr High Frequency $12 (about ₹12,700/yr; verify on Vultr's site); Hostinger KVM 1 4 GB (about ₹7,200/yr effective in year 1 on a ₹14,376 24-month prepay, then ₹11,988/yr; confirm the India location in checkout). Pros: any upload size, NVMe, full control, CloudPanel free. Cons: you handle security, updates, backups, email DNS. Fits hosting budget band only for Lightsail $7/Hostinger KVM 1 year-1; others are at the upper edge when adding tools.
2. Hostinger Premium (₹449/mo renewal, 20 GB) or Unlimited (₹649/mo renewal, 50 GB NVMe, daily backups). Pros: lowest cost and effort, bundled backups/staging/LiteSpeed. Cons: promo prices rise 3-4x after the prepaid term, limits on workers and request body size are unconfirmed, 100-300 MB uploads may fail. Test an actual 300 MB upload within the 30-day refund window before committing.
3. Cloudways Flexible Micro/Small on DigitalOcean Bangalore ($14-28/mo, about ₹14,800-29,600/yr). Pros: managed stack, backups and staging, Indian region. Cons: exhausts the budget on its own, backups billed extra.
- Whichever is chosen, keep the upload path off Cloudflare's proxy or use chunked/direct-to-storage uploads, because of the 100 MB cap.

### Gaps
- No independent 2025-2026 benchmark data (TTFB, load tests) for any of these hosts was found; ranking rests on price and control rather than measured speed.
- Contabo, E2E Networks, and Indian VPS hosts (e.g. other local providers) were not evaluated.

## 6. Caching/performance stack and WooCommerce-specific tips

### Takeaway
Little hosting-performance material was fetched in this run. Only the HPOS fact is sourced; the rest of the performance stack below is general-knowledge inference and should be verified by the report writer before being presented as fact.

### Cited Findings
- HPOS was released as stable in WooCommerce 8.2 (October 2023) and is enabled by default for new installations; existing stores must enable it manually. It stores orders in dedicated tables with their own indexes, reducing reads/writes on the posts table, and some third-party extensions may need updates for compatibility (the HPOS option is disabled if an active plugin is incompatible). — [WooCommerce developer docs on HPOS](https://developer.woocommerce.com/docs/features/high-performance-order-storage/)
- Bunny Optimizer costs $9.50 per website for CDN-side image optimization. — [Bunny CDN pricing](https://bunny.net/pricing/cdn/)
- The Hostinger WordPress page mentions LiteSpeed servers and LiteSpeed-based optimization (not tied to plans). — [Hostinger India WordPress hosting](https://www.hostinger.com/in/wordpress-hosting)

### Inferences
- (General knowledge, unverified here) LiteSpeed Cache is free and works best on LiteSpeed/OpenLiteSpeed servers; on nginx VPS stacks (CloudPanel), use FastCGI/page cache plus a plugin such as FlyingPress, WP Super Cache or similar. Object caching with Redis helps logged-in/dynamic WooCommerce pages. Do not full-page-cache cart, checkout or account pages.
- (General knowledge, unverified) Convert product images to WebP/AVIF, lazy-load, use a CDN for static assets, limit plugins, and keep the 3D viewer script loading only on product pages that need it (a front-end loading issue for mobile).
- With HPOS on by default for new installs, a new store should just keep it enabled and choose HPOS-compatible plugins.

### Gaps
- No sourced information on LiteSpeed Cache vs WP Rocket vs FlyingPress, Redis object cache, image optimization plugin pricing, checkout speed tips, or WooCommerce mobile performance in India.
- No sourced information on direct-to-object-storage uploads (e.g. Cloudflare R2, S3 presigned uploads) or chunked upload plugins for STL/3MF/STEP; this is the most important follow-up given the 100 MB Cloudflare cap and WordPress MIME restrictions.
- No data on Indian payment gateway plugin overhead (Razorpay/PayU) on checkout speed.
