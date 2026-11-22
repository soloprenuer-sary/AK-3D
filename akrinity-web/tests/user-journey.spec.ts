import { test, expect, type Page } from '@playwright/test';

/**
 * One visitor's whole trip through the shop, step by step, in a single browser (so the cart and
 * wishlist carry over from one step to the next):
 *
 *   land on the home page -> open a category -> search -> open a product -> add to cart and
 *   wishlist -> change the quantity in the cart -> checkout (details, state, GST, shipping,
 *   payment choices, validation) -> track an order -> contact, quote and policy pages.
 *
 * It only reads and fills in forms. It never places an order, sends a message or pays, unless you
 * ask for it with these switches (use them only against a test store, never the real one):
 *   E2E_PLACE_ORDER=1   place a cash on delivery order at the end of checkout
 *   E2E_SEND_FORMS=1    really send the contact message
 *
 * Run it: see tests/README.md.
 */

test.describe.configure({ mode: 'serial' });

const PLACE_ORDER = process.env.E2E_PLACE_ORDER === '1';
const SEND_FORMS = process.env.E2E_SEND_FORMS === '1';

/** Console messages that are not the site's fault (browser extensions, ad blockers). */
const IGNORED_ERRORS = [/chrome-extension:/i, /ERR_BLOCKED_BY_CLIENT/i];

let page: Page;
const problems: string[] = [];
let productName = '';
/** True while a step deliberately asks for something that does not exist, so its "not found" is not a problem. */
let expectNotFound = false;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  page = await context.newPage();
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error' || expectNotFound) return;
    const text = m.text();
    if (!IGNORED_ERRORS.some((re) => re.test(text))) problems.push(`console error: ${text}`);
  });
  page.on('response', (r) => {
    const url = r.url();
    // A broken address on the site itself (pictures, scripts, our own API). Other sites are not our concern.
    if (
      !expectNotFound &&
      r.status() >= 400 &&
      url.startsWith(new URL(page.url() || 'http://x').origin)
    ) {
      if (!url.includes('/api/auth/me')) problems.push(`${r.status()} ${url}`);
    }
  });
});

test.afterAll(async () => {
  await page.context().close();
});

/** True when the page does not scroll sideways (a common phone layout bug). */
async function fitsWidth(p: Page): Promise<boolean> {
  return (await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1;
}

test('1. Home page loads with the header, hero and footer', async ({ baseURL }) => {
  await page.goto(baseURL ?? '/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Akrinity home' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Cart,/ })).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  expect(await fitsWidth(page), 'home page scrolls sideways').toBe(true);
});

test('2. Shop and a category list real products', async () => {
  await page.goto('/shop');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const cards = page.locator('a[href^="/product/"]');
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  expect(await cards.count()).toBeGreaterThan(0);

  // First category link in the menu (a row of links under the header on desktop).
  const category = page.locator('a[href^="/shop/"]').first();
  const href = await category.getAttribute('href');
  expect(href, 'no category link found').toBeTruthy();
  await page.goto(href as string);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await fitsWidth(page), 'category page scrolls sideways').toBe(true);
});

test('3. Search finds a product and opens it', async () => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search the site' }).click();
  const box = page
    .getByRole('searchbox', { name: 'Search products' })
    .or(page.getByLabel('Search products'));
  await box.fill('stand');
  const result = page
    .locator('[role="dialog"] a[href^="/product/"], .so a[href^="/product/"]')
    .first();
  await expect(result).toBeVisible({ timeout: 20_000 });
  await result.click();
  await expect(page).toHaveURL(/\/product\//);
});

test('4. Product page shows name, price and options, and adds to cart', async () => {
  const h1 = page.getByRole('heading', { level: 1 }).first();
  await expect(h1).toBeVisible();
  productName = (await h1.innerText()).trim();
  await expect(page.locator('body')).toContainText('₹');
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
  expect(await fitsWidth(page), 'product page scrolls sideways').toBe(true);

  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('status').filter({ hasText: /added to cart/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Cart, 1 item/ })).toBeVisible();
});

test('5. Wishlist keeps the product', async () => {
  await page
    .getByRole('button', { name: /wishlist|save/i })
    .first()
    .click();
  await page.goto('/wishlist');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('main')).toContainText(productName.slice(0, 20), { ignoreCase: true });
});

test('6. Cart shows the item and the quantity can change', async () => {
  await page.goto('/cart');
  await expect(page.locator('.cart-row').first()).toBeVisible();
  await expect(page.locator('.cart-row').first()).toContainText(productName.slice(0, 20), {
    ignoreCase: true,
  });
  await page
    .getByRole('button', { name: /^Increase quantity/ })
    .first()
    .click();
  await expect(page.locator('.cart-row .qty span').first()).toHaveText('2');
  await expect(page.getByRole('link', { name: 'Go to checkout' })).toBeVisible();
});

test('7. Checkout: totals, state, GST, delivery and payment choices', async () => {
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: /Order summary/i })).toBeVisible();
  // The totals come from the store, so wait for the real numbers to replace the dots.
  await expect(page.locator('.order-summary')).not.toContainText('…', { timeout: 25_000 });
  await expect(page.locator('.order-summary')).toContainText('₹');

  const form = page.getByRole('form', { name: 'Checkout' });
  await form.locator('#co-name').fill('Test Visitor');
  await form.locator('#co-phone').fill('9876543210');
  await form.locator('#co-email').fill('visitor@example.com');
  await form.locator('#co-address1').fill('12 Test Road');
  await form.locator('#co-city').fill('Mumbai');
  await form.locator('#co-state').selectOption('MH');
  await form.locator('#co-pincode').fill('400001');

  // After the address is known the summary must say what GST applies (or that the store has no rate yet).
  await expect(page.locator('.order-summary')).toContainText(/GST|CGST|SGST|IGST/i, {
    timeout: 25_000,
  });
  // At least one payment way is shown.
  await expect(page.locator('.pay-options')).toContainText(/UPI|Cash on delivery/i);

  // Trying to pay without agreeing to the terms must be refused with a message, not an error page.
  await page.getByRole('button', { name: /^(Pay|Place order)/ }).click();
  await expect(page.getByText(/Tick the box to agree/i)).toBeVisible();
  expect(await fitsWidth(page), 'checkout scrolls sideways').toBe(true);
});

test('8. Place a cash on delivery order (only when asked, on a test store)', async () => {
  test.skip(!PLACE_ORDER, 'Set E2E_PLACE_ORDER=1 against a test store to run this step.');
  await page.locator('label.pay-opt:has-text("Cash on delivery") input').check();
  await page.locator('input[name="terms"]').check();
  await page.getByRole('button', { name: /^Place order/ }).click();
  await page.waitForURL(/order-confirmation/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Order/i);
});

test('9. Tracking an order that does not exist gives a clear message', async () => {
  await page.goto('/track-order');
  await page.getByLabel('Order number').fill('999999');
  await page.getByLabel(/Email or phone/).fill('nobody@example.com');
  expectNotFound = true;
  await page.getByRole('button', { name: 'Track order' }).click();
  await expect(page.getByText(/could not find an order|not available|not set up/i)).toBeVisible({
    timeout: 20_000,
  });
  expectNotFound = false;
});

test('10. Contact form checks the fields (and sends only when asked)', async () => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.err').first()).toBeVisible();

  if (SEND_FORMS) {
    await page.getByLabel('Name', { exact: true }).fill('Test Visitor');
    await page.getByLabel(/WhatsApp or phone/).fill('9876543210');
    await page.getByLabel('Message').fill('This is an automatic test message. Please ignore.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('status').filter({ hasText: /Thank you/ })).toBeVisible({
      timeout: 25_000,
    });
  }
});

test('11. Quote page and policy pages open with a heading and no sideways scroll', async () => {
  for (const path of ['/quote', '/privacy', '/terms', '/shipping', '/returns', '/faq', '/about']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }), `${path} has no heading`).toBeVisible();
    expect(await fitsWidth(page), `${path} scrolls sideways`).toBe(true);
  }
  await page.goto('/quote');
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
});

test('12. The whole trip had no script errors and no broken addresses', async () => {
  expect(problems, problems.join('\n')).toEqual([]);
});
