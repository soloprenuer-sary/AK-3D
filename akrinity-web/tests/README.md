# Browser tests: a visitor's trip through the shop

`user-journey.spec.ts` plays one visitor, in a real Chrome, on a desktop screen and on a phone screen. It opens pages, clicks, types and checks what appears, then reports what broke.

## What it checks, in order

| #   | Step                   | What it does and checks                                                                                                                                                                                                 |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Home                   | Opens the home page. Heading, logo, cart button and footer are there; the page does not scroll sideways.                                                                                                                |
| 2   | Shop and category      | Opens `/shop`, waits for product cards, opens the first category.                                                                                                                                                       |
| 3   | Search                 | Opens the search box, types "stand", waits for live results, opens the first product.                                                                                                                                   |
| 4   | Product                | Name and price (₹) shown, **Add to cart** works, the header cart count goes to 1.                                                                                                                                       |
| 5   | Wishlist               | Saves the product and finds it on `/wishlist`.                                                                                                                                                                          |
| 6   | Cart                   | The item is listed; pressing + changes the quantity to 2; the checkout button is there.                                                                                                                                 |
| 7   | Checkout               | Waits for the store's totals, fills name, phone, email, address, city, state (Maharashtra) and pincode, checks that GST and payment choices appear, then presses Pay without the terms box and expects a clear message. |
| 8   | Place an order         | **Skipped unless asked** (see below). Places a cash on delivery order.                                                                                                                                                  |
| 9   | Track order            | Looks up an order that does not exist and expects a friendly message.                                                                                                                                                   |
| 10  | Contact                | Presses Send on the empty form and expects field errors.                                                                                                                                                                |
| 11  | Quote and policy pages | `/quote` has the file box; `/privacy`, `/terms`, `/shipping`, `/returns`, `/faq`, `/about` all open with a heading and fit the screen width.                                                                            |
| 12  | Whole trip             | Fails if, at any point, the page threw a script error, the browser console showed an error, or any address on the site itself came back with an error (404, 500, and so on).                                            |

The steps run in one browser, one after the other, so the cart and wishlist from step 4 and 5 are still there in step 6 and 7, like a real visitor. If a step fails, the later steps are skipped (they would only fail for the same reason). The report names the step that broke, and saves a screenshot and a replay file.

`home.spec.ts` is a small extra check of the home page heading and the "Skip to content" link.

## It is safe by default

It reads pages and fills in forms but does **not** place an order, pay, or send a message. Two switches turn that on. Use them only against a test store, never the real shop:

- `E2E_PLACE_ORDER=1` runs step 8 (a cash on delivery order).
- `E2E_SEND_FORMS=1` really sends the contact message in step 10.

Because checkout builds a shopping cart on the store, a normal run leaves a few unused guest carts in WooCommerce. They expire by themselves.

## How to run it

In the `akrinity-web` folder.

The first time on a computer, install the test browser (or point the tests at the Chrome you already have, see below):

```powershell
npx playwright install chromium
```

Test the live site:

```powershell
$env:E2E_BASE_URL = "https://ak-3-d.vercel.app"
npx playwright test
```

Test your own copy (builds the site, starts it on port 3000, then tests it):

```powershell
npx playwright test
```

Only one screen size, or only this file:

```powershell
npx playwright test --project=mobile tests/user-journey.spec.ts
```

Use the Chrome already installed on the computer, if Playwright's own browser is not installed:

```powershell
$env:E2E_BROWSER = "C:/Program Files/Google/Chrome/Application/chrome.exe"
```

Open the last report (pictures of every failure, and a step-by-step replay):

```powershell
npx playwright show-report
```

## Reading the result

- `ok` is a step that passed; `x` is the step that failed, with the reason under it (for example "expected the text _Add to cart_ to be visible"); `-` is a step that was skipped.
- A failure in step 12 lists every script error and broken address seen during the whole trip.
- Two screens run: `desktop` (a wide Chrome window) and `mobile` (a Pixel 7 phone). A step that passes on desktop and fails on mobile points to a phone layout problem.

## What it cannot tell you

- It does not pay. Whether Cashfree takes a real payment, whether the emails arrive, and whether Shiprocket rates appear must be checked by hand with a test order (see `docs/BACKEND_TASK_CHECKOUT.md`, section 8).
- It checks that things work and that nothing crashes, not whether pages look good. Compare the screenshots in the report by eye after a design change.
- If the site's words change (a button renamed), a step can fail even though the shop works: update the text in the test.
