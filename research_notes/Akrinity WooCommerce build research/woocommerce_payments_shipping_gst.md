# WooCommerce commerce stack for an Indian store: payments, COD, shipping, GST invoicing (as of Nov 2026)

Method note: WebSearch returns summarised snippets; where possible I fetched primary pages (razorpay.com/pricing, wordpress.org plugin pages, shiprocket.in/pricing, cashfree.com, woocommerce.com). Most GST and logistics material is from secondary blogs; no official CBIC/GST Council notification text was retrieved. Items marked UNVERIFIED are flagged for the report writer. Plugin install counts and dates were read from wordpress.org pages in Nov 2026.

## 1. Razorpay for WooCommerce and payment-gateway alternatives

### Takeaway
Razorpay is the default fit: the official plugin is free (100,000+ installs, updated Nov 2026), standard domestic fee is 2% + 18% GST (~2.36%) with no setup/AMC, and international cards are up to 3% + GST. Cashfree (1.95%) and Easebuzz (claimed ~1.5%) are marginally cheaper on paper, but their WooCommerce plugins and published rates were less verifiable. The plugin has a weak review score (2.5/5) and recent security fixes, so keep it updated.

### Cited Findings
**Razorpay fees**
- Domestic platform fee is 2% per successful transaction for UPI, RuPay debit, Visa/Mastercard/Amex/Diners, netbanking (72+ banks), wallets, Pay Later and EMI; corporate/business credit cards 2.15%; 18% GST is charged on the fee. — [Razorpay pricing](https://razorpay.com/pricing/)
- UPI and RuPay debit are labelled "Zero MDR" yet still carry the 2% Razorpay platform fee on the rate card (the page itself is slightly ambiguous; confirm in dashboard). — [Razorpay pricing](https://razorpay.com/pricing/)
- International cards: up to 3% + 18% GST per successful transaction. International bank transfers via virtual multi-currency accounts: 1% + GST, 0% FX markup. — [Razorpay pricing](https://razorpay.com/pricing/)
- Setup fee, AMC, refund processing fee and integration/support fee are all Rs 0. — [Razorpay pricing](https://razorpay.com/pricing/)
- Settlement is T+1 by default; instant settlement is an optional paid add-on (price not on the page). — [Razorpay pricing](https://razorpay.com/pricing/)
- Instant Refund costs Rs 7.99 (up to Rs 1,000), Rs 11.99 (Rs 1,000-25,000), Rs 14.99 (above Rs 25,000). — [Razorpay pricing](https://razorpay.com/pricing/)
- Bajaj Finance EMI platform charges range 6% (3 months) to 13.5% (12 months) on top. — [Razorpay pricing](https://razorpay.com/pricing/)
- Razorpay promo (secondary source, one Razorpay-linked summary): merchants who complete KYC and activate on or after 1 July 2026 get zero platform fee on first Rs 5,00,000 domestic volume for 90 days. Not on the pricing page I fetched; confirm before relying on it. — [Razorpay blog via search summary](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/)

**Razorpay WooCommerce plugin**
- Plugin "Razorpay for WooCommerce": 100,000+ active installs, version 4.8.9, last modified 4 Nov 2026, tested with WordPress 7.1.0. Supports cards, UPI, netbanking, wallets, EMI, pay later; refunds from within WooCommerce; native multi-currency; sandbox and live modes switched by API key; webhooks; Affordability widget; Magic Checkout. — [WordPress.org plugin page](https://wordpress.org/plugins/woo-razorpay/)
- HPOS compatibility was added in 4.5.4 (HPOS-related fix in 4.7.5); Checkout Blocks support in 4.6.1; Cart Blocks in 4.7.7. The page does not state HPOS support for the current version in plain words. — [WordPress.org plugin page](https://wordpress.org/plugins/woo-razorpay/)
- Security: 4.8.9 fixed an unauthenticated order-value disclosure and a SQL injection in webhook storage; 4.8.8 and 4.8.4 fixed IDOR issues in Magic Checkout endpoints (shipping-info, prepayCODOrder). — [WordPress.org plugin page](https://wordpress.org/plugins/woo-razorpay/)
- Rating 2.5/5 across 24 reviews; recent reviews report payment-status sync and performance problems; 0 of 2 support threads resolved in last two months. — [WordPress.org plugin page](https://wordpress.org/plugins/woo-razorpay/)

**KYC**
- Sole proprietor documents: proprietor PAN, government ID (Aadhaar), business proof (Shop & Establishment / Udyam), bank proof with name matching PAN, GST certificate or non-enrolment declaration, address proof; a newer Razorpay guide says current checklist asks for two business proofs. — [Razorpay documents guide](https://razorpay.com/blog/documents-required-for-payment-gateway)
- Razorpay states unregistered businesses/sole proprietors can provide personal bank account details; activation depends on banking-partner approval. — [Razorpay activation support](https://razorpay.com/docs/payments/account-activation-support)
- Sources conflict on whether GST registration is mandatory for a very small proprietorship (some say optional with a "no GST" option). — [Razorpay documents guide](https://razorpay.com/blog/documents-required-for-payment-gateway)

**Test mode**
- Sandbox vs production mode is selected by which API keys are entered in the plugin (test keys give test mode). — [WordPress.org plugin page](https://wordpress.org/plugins/woo-razorpay/)

**Partial / advance payments (custom jobs)**
- Razorpay Payment Links support partial payments: customer can pay the balance against the same link; API param `accept_partial=true` and `first_min_partial_amount` (default 100 subunits = Rs 1) sets minimum first payment. Can be enabled in dashboard or by editing an issued link. — [Razorpay docs: Partial Payments](https://razorpay.com/docs/payments/payment-links/partial-payments/)
- A US-facing Razorpay FAQ says links cannot be paid partially; contradicted by current docs (likely outdated). Fees for partial-payment links: not found. — [Razorpay US payment links](https://razorpay.com/us/payment-links)
- Razorpay no-code tools (Payment Pages/Buttons) are priced 0.2% + gateway fees; Smart Collect 1% or Rs 10 per transaction whichever is lower. — [Razorpay pricing](https://razorpay.com/pricing/)
- WooCommerce deposit plugins on woocommerce.com: PH Deposits and Partial Payments listed at ~$99 (shown with "Save 20%", struck-through $198); Flexi Deposits ~$119 (struck-through $238); billing period unclear in snippets (check). — [PH Deposits](https://woocommerce.com/products/ph-deposits-and-partial-payments/), [Flexi Deposits](https://woocommerce.com/products/flexi-deposits/)
- Free option: "Disable payment method / COD fees / Partial payment" plugin offers a basic partial payment in the free version; multiple/conditional rules are Pro. — [WordPress.org plugin page](https://wordpress.org/plugins/disable-payment-method-for-woocommerce/)

**Alternatives**
- Cashfree: platform fee 1.95% (2.0% also shown) domestic, Amex 2.95%; international Visa/MC 2.99%; EMI cards 1.5-2.2%; next-day (T+1) settlement, instant settlement at 0.30% + GST; AMC only for premium services (amount not given); festive offer waives platform fee on first Rs 20L GMV for eligible new merchants. — [Cashfree pricing](https://www.cashfree.com/payment-gateway-charges/)
- Third-party: Cashfree AMC Rs 4,999 reported by one 2026 guide (conflicts with Cashfree page, which gives no amount); PayU ~2% + GST domestic (3% Amex/Diners/EMI), setup fee Rs 2,000-7,000 reported in a competitor's 2025 guide; PhonePe PG pricing largely custom, cards ~2%, settlement T+1-T+2; Easebuzz claims ~1.5% average, no setup fee (third-party range 1.5-1.75%). — [search-summary of 2026 comparisons](https://www.refrens.com/grow/best-payment-gateway-roi-india-2026/), [Easebuzz explainer](https://easebuzz.in/explainers/payments/how-businesses-select-payment-gateway/)

### Inferences
- Effective cost on a Rs 1,000 order via Razorpay is about Rs 23.6 (2% + GST). Gateway difference vs Cashfree/Easebuzz is only ~0.1-0.5 percentage points; at small volume that is under Rs 50 per Rs 10,000, so integration quality matters more than rate.
- For advance + balance custom jobs, the lowest-cost path is: take advance via normal WooCommerce checkout, send a Razorpay Payment Link (partial payments enabled) for the balance, then mark the Woo order paid manually. This avoids a Rs ~8,000-10,000/yr deposit plugin. A free deposit plugin (Disable payment method free tier) may suffice for simple percentage advances.
- Because plugin vulnerabilities were fixed in 2026 (some in Magic Checkout), do not enable Magic Checkout unless needed and keep auto-updates on.

### Gaps
- Official Razorpay settlement time for new accounts (often a risk-based T+2 to T+3 for first transactions) not confirmed from a primary source.
- Official PayU, PhonePe PG and Easebuzz rate cards were not fetched; numbers come from third-party blogs.
- WooCommerce plugin pages for Cashfree, PayU, Easebuzz (installs, last update, HPOS) not checked.
- Razorpay payment-link fee (whether standard gateway rate applies) not confirmed.

## 2. Cash on Delivery: restriction, advance, RTO, fraud

### Takeaway
COD RTO runs roughly 22-38% versus 1.5-5% for prepaid, so for made-to-order/personalized items COD should be disabled or replaced with a partial-prepaid ("partial COD") model. Free plugin "Disable payment method / COD fees / Partial payment" covers category, postcode, cart-total restrictions, COD fees and basic partial payment, HPOS-compatible.

### Cited Findings
**RTO data**
- ClickPost FY2026 D2C network: COD RTO 37.51% vs prepaid 5.28%; Meesho FY25 prospectus: 22.3% of COD vs 2.7% of prepaid orders undelivered; Qikink (print-on-demand seller base): COD 30.1% vs prepaid 1.5%. — [search summary of ClickPost/Meesho/Qikink data](https://www.clickpost.ai/blog/ecommerce-rto-statistics-india), [Qikink](https://qikink.com/blog/best-payment-gateways-india/)
- Razorpay and ShipPrime cite COD 25-30% (up to 40% in fashion/footwear) vs prepaid 2-3%; Shipmozo cites COD 28-35%, prepaid 4-8%. Fashion has highest COD RTO band (21-32%) in ClickPost data. — [Razorpay COD blog](https://razorpay.com/blog/cash-on-delivery/), [Shipmozo](https://www.shipmozo.com/blog/cod-fraud-in-indian-e-commerce)
- There is no official benchmark; figures are vendor/platform data and measure different things. — [ClickPost](https://www.clickpost.ai/blog/ecommerce-rto-statistics-india)
- Amazon India sellers' guides promote "COD suppression" for high-RTO pincodes/customers as an RTO mitigation. — [Amazon Smart Commerce](https://smartcommerce.amazon.in/blog/cod-suppression-for-rto--reduce-returns-and-increase-seller-profits)

**Plugins**
- Disable payment method / COD fees / Advance COD or Partial payment (PiWeb): 4,000+ installs, last updated 20 Oct 2026, tested to WordPress 7.1.4, HPOS compatible (free and Pro). Free: disable payment methods by product, category, country, state, city, postcode (billing/shipping), cart total, coupon, shipping method, user role; COD fees by country/zone/postcode/user role; basic partial payment; email/IP blacklist. Pro adds unlimited rules, conditional partial rules, product exclusions. Pro price not shown. — [WordPress.org plugin page](https://wordpress.org/plugins/disable-payment-method-for-woocommerce/)
- Partial COD for WooCommerce (WP Swings, woocommerce.com): global advance as fixed amount or % of cart; category-wise advance distribution; postcode field disables partial COD for listed pincodes; HPOS compatible; version 2.0.9; price and billing period not displayed on the page. — [WooCommerce.com](https://woocommerce.com/products/partial-cod-for-woocommerce/)
- Controlled COD Restriction (free) allows COD only for specific product categories; other free/paid options include Woo Smart COD Pro (paid tier with partial advance and location restriction). — [Controlled COD Restriction readme](https://cdn.jsdelivr.net/wp/controlled-cod-restriction/trunk/readme.txt), [WooSmartCOD](https://woosmartcod.com/)
- Razorpay plugin changelog references a prepayCODOrder endpoint (Razorpay Magic Checkout COD prepay flow). — [WordPress.org plugin page](https://wordpress.org/plugins/woo-razorpay/)

### Inferences
- For personalized/3D-printed made-to-order items, RTO leaves unsaleable inventory plus wasted print time, so policy should be: no COD for any made-to-order category; COD (if at all) only for stocked catalogue items, low order value, and serviceable low-RTO pincodes, with a 20-30% advance.
- Charging a COD handling fee (supported in free tier) plus requiring an advance both filter low-intent buyers.

### Gaps
- No India-specific RTO data for personalised/made-to-order or gifting categories was found.
- Pro pricing for the PiWeb plugin and Partial COD billing period not found.
- COD fraud mitigation specifics (OTP/WhatsApp verification plugins) not researched beyond the generic mentions.

## 3. Shipping: Shiprocket vs Delhivery vs others

### Takeaway
Shiprocket has a free official WooCommerce plugin (10,000+ installs) with product-page pincode check, white-label tracking and rates from Rs 23 per 500 g; its Lite plan is free. Delhivery rates are available through its own dashboard/plugins and PluginHive; a Rs 2 per shipment surface surcharge applies from 1 Sep 2026 per one source. Published 500 g rates and COD fees from third parties conflict, so pull the rate card from your own account.

### Cited Findings
**Shiprocket**
- Plugin "Shiprocket": 10,000+ installs, v2.0.9, last modified 20 May 2026, tested to WP 6.9.11; features: pincode serviceability check on product page (added v1.0.3), white-labelled tracking pages with status sync to WooCommerce, COD and prepaid, real-time rates/EDD at checkout, zone-wise and fallback flat rates, insurance up to Rs 5,000, discounted rates "starting from Rs 23/500 g"; HPOS not mentioned; a reviewer says rates are "on the higher side." — [WordPress.org Shiprocket plugin](https://wordpress.org/plugins/shiprocket/)
- Shiprocket says its WooCommerce integration is free. — [Shiprocket WooCommerce page](https://shiprocket.in/woocommerce-shipping)
- Plans: Lite free (avg shipment cost Rs 45, up to 5 orders/month); Business Rs 199/month (avg Rs 41, 5-50 orders); Advanced Rs 499/month (avg Rs 39); Pro Rs 799/month (avg Rs 36). Per-500 g rate card and COD charge not published on the page. — [Shiprocket pricing](https://shiprocket.in/pricing)
- Weight discrepancy: seller has about 7 days to accept or dispute; if no action, auto-accepted and extra freight is deducted from wallet; disputes resolve in 5-7 working days (SOP); re-escalate within 2 working days of rejection. A separate Shiprocket blog mentions a shorter 4-day window (conflict). — [Shiprocket weight dispute manager](https://www.shiprocket.in/knowledgebase/weight-dispute-manager), [Shiprocket blog](https://www.shiprocket.in/blog/effective-weight-dispute-management/)
- Shiprocket offers paid "Instant COD" to selected sellers; COD remittance cycle not confirmed (an older internal note says remittance blocked if wallet negative by more than Rs 100). — [Search summary of Shiprocket SOP notes](https://sites.google.com/shiprocket.com/sop-shiprocket/weight-discrepancy)

**Delhivery**
- Delhivery's help page directs sellers to the in-dashboard rate card (Information Center > Rate Card); no public per-500 g rate published. — [Delhivery help](https://help.delhivery.com/docs/rate-card)
- PluginHive reports a flat network surcharge of +Rs 2 per shipment on surface shipments from 1 Sep 2026, roughly 5-10% increase for parcels over 500 g. — [PluginHive](https://www.pluginhive.com/delhivery-shipping-charges-hike-for-woocommerce/)
- ClickPost lists Delhivery COD fee as Rs 35 flat or 1.5% of order value, whichever is higher, with base rates excluding fuel surcharge and 18% GST (third-party). — [ClickPost Delhivery calculator](https://www.clickpost.ai/delhivery-shipping-rate-calculator)
- Delhivery WooCommerce plugin options exist (PluginHive paid plugin; wordpress.org "delhivery-logistics-courier"); official plugin metrics not fetched. — [PluginHive](https://www.pluginhive.com/delhivery-integration-with-woocommerce/)
- Reviews mention weight discrepancies and wallet deductions on Delhivery (low app rating). — [Shopify app listing](https://apps.shopify.com/delhivery-2)

**Others**
- Alternatives named across sources: Shipway, Pickrr (Shiprocket-owned), iThink Logistics, NimbusPost, ClickPost, Shipmozo, India Post; I did not fetch their rate cards. — [ClickPost list](https://www.clickpost.ai/blog/top-10-best-shipping-platforms-for-ecommerce), [ShipPrime](https://shipprime.live/resources/blogs/11-best-shiprocket-alternatives-in-2026-for-d2c-brands)
- Conflicting 500 g Delhi price claims: one competitor blog says Delhivery Rs 45-50 and Shiprocket adds 20-30% markup; another aggregator lists Shiprocket Lite at Rs 26 per 500 g Zone A. Both are interested parties. — [OrderPilot comparison](https://orderpilot-sois.web.app/blog/delhivery-vs-shiprocket-multi-courier-strategy/), [iCarry](https://www.icarry.in/pages/blog/shiprocket-alternatives.html)

**International (later)**
- Shiprocket X routes via carriers incl. India Post (air parcel up to 2 kg, 36+ countries on some lanes); Shiprocket says international courier charges run Rs 2,000-5,000 per parcel; a third-party example puts 1 kg India-USA express (UPS/FedEx) at about Rs 2,950-3,300. India Post is cheap but 15-20+ day transit with weak tracking (commentary). — [Shiprocket X India Post](https://www.shiprocket.in/x/srx-india-post/), [Shiprocket blog](https://shiprocket.in/blog/international-courier-services-charges/amp), [Xindus](https://www.xindus.net/knowledge-center/10-best-shipping-partners-from-india-to-usa-(2025-reviews)), [Echai](https://echai.ventures/d2c/d2c-international-logistics/india-post-vs-modern-couriers-speed-cost)

### Inferences
- Start with Shiprocket's free plugin + Lite plan (no fixed cost), compare 2-3 couriers per parcel in the panel, and upgrade only past ~5 orders/month if the Rs 4-6 per shipment saving beats the Rs 199 fee (break-even roughly 33-50 shipments/month).
- Weight disputes are a risk for 3D-printed parcels: declare packed weight/dimensions accurately, weigh and photograph each packed parcel, and act inside the 7-day window.
- NDR handling: Shiprocket panel supports NDR actions (re-attempt/RTO); specifics not verified.

### Gaps
- Current official 0.5 kg rate card and COD fee for Shiprocket; official Delhivery 0.5 kg rates; Pickrr, Shipway, iThink, NimbusPost rate structures; ClickPost pricing.
- NDR workflow details and fees; COD remittance timings; India Post domestic parcel rates.
- HPOS status of Shiprocket plugin (not stated).
- DHL/FedEx India export rates for 0.5 kg.

## 4. GST: registration, rates, HSN/SAC, invoicing plugins

### Takeaway
A goods seller shipping inter-state needs regular GST registration regardless of turnover (composition is unavailable for inter-state or e-commerce-portal sales). On own-website sales there is no TCS. E-invoicing applies only above Rs 5 crore turnover (B2B). Rates: services 18%; plastic articles (HSN 3926) commonly 18% but sources conflict. 3D-printed goods have no dedicated HSN; classify by the article and material.

### Cited Findings
**Registration and composition**
- Composition scheme for goods: turnover limit Rs 1.5 crore (Rs 75 lakh in NE states/Himachal); rate 1% (0.5% CGST + 0.5% SGST) for manufacturers/traders; dealers cannot make inter-state supplies or sell via e-commerce portals. — [ClearTax composition](https://cleartax.in/s/gst-composition-scheme)
- Inter-state supply of goods requires registration regardless of turnover (Section 24); the Rs 40 lakh goods threshold applies only to exclusive intra-state goods suppliers; Notification 10/2017-IT's exemption covers inter-state services up to Rs 20 lakh only. — [TaxGuru](https://taxguru.in/goods-and-service-tax/gst-registration-exemption-upto-%E2%82%B940-lakhs-riders.html), [GST Council flyer](https://www.gstcouncil.gov.in/sites/default/files/e-version-gst-flyers/Registration_under_GST_Law_new.pdf)
- Own-website sales do not trigger Section 52 TCS (TCS applies only to marketplace/ECO supplies); ECO TCS rate is 0.5% since 10 Jul 2024 (Notification 15/2024-CT), cut from 1%; some 2026 articles still cite 1%. — [Tally on marketplace vs D2C](https://tallysolutions.com/gst/gst-for-e-commerce-sellers-marketplace-vs-d2c-explained/), [TaxGuru](https://taxguru.in/?p=1057283)
- Inter-state sale: IGST charged; intra-state: CGST + SGST (split equally). — [Plugin listing for Indian GST Invoice Suite describing the auto-split](https://ja.wordpress.org/plugins/indian-gst-invoice-suite/)

**E-invoicing**
- Threshold remains Rs 5 crore aggregate annual turnover for B2B/export/SEZ supplies (Notification 10/2023-CT, from 1 Aug 2023); B2C excluded; a cut to Rs 2 crore discussed but not notified as of June 2026. A "1 April 2026" claim in one article lacks notification support. — [Tally e-invoicing 2026](https://tallysolutions.com/business-guides/e-invoicing-compliance-rules-in-2026/), [StartupTalky](https://startuptalky.com/e-invoice-limit-gst-india-guide/)

**HSN/SAC and rates**
- 3D printing as a service: most sources say SAC 9989 (manufacturing services on physical inputs owned by others) at 18%; one gives SAC 998347 (disputed); another places it under testing/analysis (inconsistent). No CBIC/AAR source found. — [Sigmatechnik](https://www.sigmatechnik.com/3d-printing-services/demystifying-the-3d-printing-service-sac-code-a-comprehensive-guide), [Gimbooks 9988](https://www.gimbooks.com/blog/manufacturing-services-hsn-code-9988-and-gst-rates)
- Heading 8485 covers additive-manufacturing machines (printers/parts), not printed articles; GST on 8485 items reported at 18% (parts possibly 5%/18%). — [Busy HSN 8485](https://busy.in/hsn/hsn-84851000/), [Incorpx](https://www.incorpx.io/hsn-codes/heading-8485)
- Plastic articles HSN 3926: most sources 18% post 22 Sep 2025; one table lists 9% (conflict). Non-electronic toys (9503) 5% from 22 Sep 2025; electronic/mechanical toys 18%. — [Gimbooks 3926](https://www.gimbooks.com/blog/hsn-code-3926-other-plastics-materials-gst-rate/), [Busy toys](https://busy.in/gst-rates/toys/), [Disytax](https://disytax.com/?p=10541)

**GST invoice plugins**
- PDF Invoices & Packing Slips for WooCommerce (WP Overnight): 300,000+ installs, v5.16.6, last modified 22 Oct 2026, tested to WP 7.1.4; free: PDF/XML invoices, packing slips, sequential numbers, bulk generation, templates; Pro (paid): credit notes, proforma invoices; no GST/India-specific features (VAT/EU only); prices not on page; HPOS not explicitly stated. — [WordPress.org](https://wordpress.org/plugins/woocommerce-pdf-invoices-packing-slips/)
- Indian GST Invoice Suite (WP.org): free core GST PDF invoices with GSTIN, HSN/SAC, CGST/SGST/IGST auto-split; packing slip addon free; Order List/Delivery Note/Model Number addons Pro; shipping labels paid; only 30+ installs, last modified 14 Feb 2026, warns untested with last 3 WordPress major versions; HPOS, credit note and e-invoice not mentioned. — [WordPress.org](https://wordpress.org/plugins/indian-gst-invoice-suite/)
- Others: WebPlanex GST Invoice India (needs API access), GST Invoice for WooCommerce (woo-gst; PDF GST invoices are PRO). — [WebPlanex](https://uz.wordpress.org/plugins/webplanex-gst-invoice-india/), [woo-gst readme](https://cdn.jsdelivr.net/wp/plugins/woo-gst/trunk/readme.txt)

### Inferences
- Because the store ships inter-state, regular GST registration (not composition) is needed from the first outside-state sale; at that point invoices must show GSTIN, HSN/SAC, tax split. Do not treat the Rs 40 lakh threshold as relevant. (Possible exceptions for specific supplies, e.g. handicrafts under a separate notification, are not confirmed here.)
- E-invoicing (IRP) is irrelevant until turnover exceeds Rs 5 crore; B2C invoices need only a compliant tax invoice (or bill of supply).
- 3D-printed physical goods are classified by what the article is and its material (e.g. 3926 plastic articles, or Chapter 95 for toys/figurines), not by the printing method; choose the HSN that matches each product, and confirm with a CA. The custom design service (modelling/design work) is a separate service supply, usually SAC under 9983 at 18%; when bundled with a printed good as a single order, composite/mixed-supply rules (Section 8) decide the rate, so itemise the design fee separately on the invoice. These points are my reasoning from GST principles, not sourced.
- Plugin choice: WP Overnight free plugin has strong maintenance but lacks GST fields natively; Indian GST Invoice Suite has GST fields but is barely used and not updated recently. Test both on staging.

### Gaps
- No official CBIC/GST Council notification text fetched; HSN for 3D-printed goods and SAC for design services not confirmed from a primary source.
- Pricing of GST add-ons for WP Overnight and other paid GST plugins not found.
- Whether credit notes (needed for refunds) are available in the free GST plugins; HPOS status of GST plugins.

## 5. Core WooCommerce plugins, HPOS and 2026 pricing

### Takeaway
HPOS is stable and default for new installs, so any plugin must declare HPOS compatibility; the payments, COD and invoice plugins above mostly state or imply it, but check each via WooCommerce > Settings > Advanced > Features. Personalization add-ons cost roughly $69-79/year for the paid leaders.

### Cited Findings
- HPOS: marked stable in WooCommerce 8.2 (Oct 2023), enabled by default on new stores; incompatible active plugins disable the HPOS option; compatibility checked at WooCommerce > Settings > Advanced > Features; legacy post storage remains selectable (compatibility/sync mode keeps both in sync). — [WooCommerce developer docs](https://developer.woocommerce.com/docs/features/high-performance-order-storage/)
- WooCommerce Product Add-Ons (official extension) is listed at about $79/year in one 2026 comparison; supports text fields, dropdowns, file uploads, flat/percentage pricing; Advanced Product Fields (Studio Wombat) about $69/year. — [Acowebs 2026 comparison](https://acowebs.com/?p=417788), [PluginHive roundup](https://www.pluginhive.com/best-woocommerce-product-addons-plugins/)
- YITH WooCommerce Product Add-Ons has a free wordpress.org version (changelog entry 20 Jul 2026); no pricing found for YITH Request a Quote. — [WordPress.org YITH](https://jv.wordpress.org/plugins/?p=48473)
- Deposit plugins on woocommerce.com about $99-$119/year (see section 1). — [PH Deposits](https://woocommerce.com/products/ph-deposits-and-partial-payments/)

### Inferences
- Free tiers (YITH/other add-ons free versions) may handle a "personalization text" field; quantity-based bulk pricing and quote-request plugins were not priced here and should be tested for HPOS before purchase.
- Prices are in USD; at roughly Rs 85-90 per USD (my assumption), a single $79 plugin is about Rs 6,700-7,100, which would consume close to half the Rs 15,000 budget.

### Gaps
- No verified 2026 prices for quantity-based bulk-pricing plugins, quote-request plugins (YITH Request a Quote, free "Request a Quote" plugins), or order-status customization plugins.
- Free add-on plugin install counts/HPOS flags not checked.

## 6. Minimal-cost stack vs Rs 15,000/year budget

### Takeaway
A workable stack is almost entirely free plugins; the main costs are hosting and domain, leaving headroom for one paid plugin if needed.

### Cited Findings
- Hosting (secondary, affiliate-style sources, disagree): Hostinger entry plan promo about Rs 69/month on a 48-month term, renewing about Rs 289/month (about Rs 3,468/year); Business tier renewal Rs 449-649/month; Bluehost Basic renewal about Rs 349-599/month. Shared plans may be tight for WooCommerce at higher order volume. — [Zoutons](https://zoutons.com/news/hostinger-wordpress-hosting-price-india-2026), [BestHostingIndia](https://besthostingindia.vercel.app/blog/wordpress-hosting-plans-india)
- Free pieces: Razorpay for WooCommerce, Shiprocket plugin (+ Lite plan), PDF Invoices & Packing Slips (free), Indian GST Invoice Suite (free core), Disable payment method/COD fees/partial payment (free tier). — [WP.org Razorpay](https://wordpress.org/plugins/woo-razorpay/), [WP.org Shiprocket](https://wordpress.org/plugins/shiprocket/), [WP.org PiWeb](https://wordpress.org/plugins/disable-payment-method-for-woocommerce/)

### Inferences
Proposed stack (annual, indicative):
- Hosting: about Rs 3,500-7,800/yr (Hostinger Premium/Business renewal range) — WooCommerce itself and the theme: free.
- Domain: not researched (typically under Rs 1,500; unverified).
- Payments: Razorpay plugin free; Rs 0 fixed, ~2.36% per transaction.
- COD/advance: free tier of Disable payment method plugin (category/pincode/cart-total rules, COD fee, partial payment); upgrade to Pro (price unknown) only if rules multiply.
- Shipping: Shiprocket plugin free + Lite plan (Rs 0); Business plan Rs 199/month (Rs 2,388/year) only above ~35-50 shipments/month.
- Invoicing: PDF Invoices & Packing Slips free + GST fields via a free GST plugin or custom template tweaks; no e-invoicing needed.
- Personalization/quote: free add-on tier first; a paid add-on (~$69-79/year, about Rs 6,000-7,000) is the main optional spend.
- Balance payments: Razorpay payment links with partial payments enabled (no plugin cost).
- Rough total: about Rs 4,000-8,000 baseline, Rs 10,000-15,000 with one paid personalization plugin and the Shiprocket Business plan, within budget but without much margin if a deposits plugin (~$99-119) is also bought.

### Gaps
- Domain registration price, SSL (usually free on host), backup/security plugin costs, and transactional email costs not researched.
- Any fixed GST-related professional fees (CA for filings) are outside the Rs 15,000 tools budget and not researched.
