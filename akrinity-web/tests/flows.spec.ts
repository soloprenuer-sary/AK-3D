import { test, expect, type Page } from '@playwright/test';

/**
 * One test per shop flow, each on its own (the visitor journey in user-journey.spec.ts runs the whole trip
 * in one go). Read-only: nothing is ordered, sent or saved on the store. See tests/README.md.
 */

const PRODUCT = '/product/akrinity-164-scale-f1-diecast-car-display-stand';
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1200) < 700;

async function seedCart(page: Page, qty = 1) {
  await page.goto('/cart');
  await page.evaluate(
    (q) =>
      localStorage.setItem(
        'akrinity-cart-v1',
        JSON.stringify([
          {
            key: 'wc-250:single:PLA',
            id: 'wc-250',
            slug: 'akrinity-164-scale-f1-diecast-car-display-stand',
            name: 'Test product',
            mode: 'single',
            qty: q,
            detail: 'PLA+ · white · Medium',
            price: '₹499',
            madeToOrder: false,
          },
        ]),
      ),
    qty,
  );
}

test.describe('Browse and find', () => {
  test('category menu opens and leads to a category page', async ({ page }) => {
    test.skip(
      isPhone(page),
      'The category bar is a desktop control; the phone has its own menu test.',
    );
    await page.goto('/');
    const first = page.locator('nav[aria-label="Product categories"] button').first();
    await first.click();
    const link = page.locator('nav[aria-label="Product categories"] a[href^="/shop/"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/shop\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('phone menu opens with the main links', async ({ page }) => {
    test.skip(!isPhone(page), 'Phone only.');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
    await expect(
      page.locator('#mobile-menu').getByRole('link', { name: /Shop/ }).first(),
    ).toBeVisible();
  });

  test('search with no match says so, search with a match lists products', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search the site' }).click();
    const box = page.getByLabel('Search products');
    await box.fill('zzqxjv');
    await expect(
      page.getByText(/no products|nothing|no results|did not find|couldn.t find/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await box.fill('rack');
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('shop filters and sorting change the list', async ({ page }) => {
    await page.goto('/shop');
    const cards = page.locator('a[href^="/product/"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const before = await cards.count();
    if (isPhone(page)) {
      await page
        .getByRole('button', { name: /filter/i })
        .first()
        .click();
    }
    await page.locator('#sort').selectOption('name');
    await page.waitForTimeout(500);
    expect(await cards.count()).toBe(before);
  });

  test('the shop has a price sort (a normal shop control)', async ({ page }) => {
    await page.goto('/shop');
    if (isPhone(page))
      await page
        .getByRole('button', { name: /filter/i })
        .first()
        .click();
    const options = await page.locator('#sort option').allInnerTexts();
    expect(options.join(' | '), 'no price sort').toMatch(/price/i);
  });

  test('an address that does not exist shows the not-found page with a way home', async ({
    page,
  }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /home|shop/i }).first()).toBeVisible();
  });
});

test.describe('Choose a product', () => {
  test('wishlist keeps a saved product after a reload', async ({ page }) => {
    await page.goto(PRODUCT);
    await page
      .getByRole('button', { name: /to wishlist/i })
      .first()
      .click();
    await page.reload();
    await expect(
      page.getByRole('button', { name: /^Remove .* from wishlist/i }).first(),
    ).toBeVisible();
  });

  test('compare: two products show side by side', async ({ page }) => {
    await page.goto('/shop');
    const compare = page.getByRole('button', { name: /^Compare/ });
    await expect(compare.first()).toBeVisible({ timeout: 20_000 });
    await compare.nth(0).click();
    await compare.nth(1).click();
    await page.goto('/compare');
    await expect(page.locator('table').first()).toBeVisible();
    expect(
      await page.locator('table thead th, table tr:first-child th').count(),
    ).toBeGreaterThanOrEqual(2);
  });

  test('personalised text refuses odd characters', async ({ page }) => {
    await page.goto(PRODUCT);
    const opt = page.getByText(/personalised text/i).first();
    if (await opt.isVisible()) await opt.click();
    const input = page.locator('input[placeholder*="name" i], input[id*="personal" i]').first();
    if (!(await input.count())) test.skip(true, 'This product has no personalised text box.');
    await input.fill('<script>');
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.locator('.err, [role="alert"]').first()).toBeVisible();
  });

  test('the delivery pincode check gives an answer for a good and a bad pincode', async ({
    page,
  }) => {
    await page.goto(PRODUCT);
    await page.getByText('Delivery and bulk prices').click();
    const pin = page.locator('#pin');
    await pin.scrollIntoViewIfNeeded();
    await pin.fill('123');
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText(/6-digit/)).toBeVisible();
    await pin.fill('400001');
    await page.getByRole('button', { name: 'Check' }).click();
    // A real check gives a delivery date for the pincode. The text found tells whether it is real or a placeholder.
    const text = await page.locator('main').innerText();
    expect(text, 'the pincode check does not give a delivery estimate').toMatch(
      /\b\d+\s*(to|-)\s*\d+\s*(working )?days|by (mon|tue|wed|thu|fri|sat|sun)|estimated delivery on/i,
    );
  });

  test('a product with bulk prices shows the price ranges', async ({ page }) => {
    await page.goto('/shop');
    // Find a product that mentions bulk pricing on its page.
    const hrefs = await page
      .locator('a[href^="/product/"]')
      .evaluateAll((as) =>
        [...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute('href')))].slice(0, 8),
      );
    let found = false;
    for (const h of hrefs) {
      await page.goto(h as string);
      if (
        await page
          .getByText(/bulk|buy more|MOQ|and up/i)
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        found = true;
        break;
      }
    }
    test
      .info()
      .annotations.push({
        type: 'note',
        description: found
          ? 'bulk prices shown'
          : 'no product in the first 8 has bulk prices filled in',
      });
    expect(found, 'no bulk price ranges found on the first 8 products').toBe(true);
  });
});

test.describe('Cart and checkout', () => {
  test('cart survives a reload, quantity can drop to remove the line', async ({ page }) => {
    await seedCart(page, 2);
    await page.goto('/cart');
    await page.reload();
    await expect(page.locator('.cart-row')).toHaveCount(1);
    await page.getByRole('button', { name: /^Decrease quantity/ }).click();
    await page.getByRole('button', { name: /^Decrease quantity/ }).click();
    await expect(page.locator('main').getByText('Your cart is empty.')).toBeVisible();
  });

  test('empty cart: checkout shows the empty message, not a broken form', async ({ page }) => {
    await page.goto('/cart');
    await page.evaluate(() => localStorage.removeItem('akrinity-cart-v1'));
    await page.goto('/checkout');
    await expect(page.locator('main').getByText('Your cart is empty.')).toBeVisible();
  });

  test('checkout: a cart over the cash on delivery limit still offers payment, bad GSTIN is refused', async ({
    page,
  }) => {
    await seedCart(page, 10);
    await page.goto('/checkout');
    await expect(page.locator('.order-summary')).not.toContainText('…', { timeout: 25_000 });
    await page.getByText('Business order').click();
    await page.locator('#co-gstin').fill('NOTAGSTIN');
    await page.locator('#co-state').selectOption('MH');
    await page.locator('#co-pincode').fill('400001');
    await page.locator('input[name="terms"]').check();
    await page.getByRole('button', { name: /^(Pay|Place order)/ }).click();
    await expect(page.getByText(/GSTIN should be 15 characters/)).toBeVisible();
  });

  test('checkout: another state changes the GST lines (IGST outside Maharashtra)', async ({
    page,
  }) => {
    await seedCart(page, 1);
    await page.goto('/checkout');
    await expect(page.locator('.order-summary')).not.toContainText('…', { timeout: 25_000 });
    await page.locator('#co-state').selectOption('MH');
    await page.locator('#co-pincode').fill('400001');
    await expect(page.locator('.order-summary')).toContainText(/CGST/, { timeout: 25_000 });
    await page.locator('#co-state').selectOption('DL');
    await page.locator('#co-pincode').fill('110001');
    await expect(page.locator('.order-summary')).toContainText(/IGST/, { timeout: 25_000 });
  });
});

test.describe('Accounts, forms and support', () => {
  test('account page asks a signed-out visitor to sign in', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
  });

  test('sign in refuses an empty form with messages', async ({ page }) => {
    await page.goto('/login');
    await page
      .getByRole('button', { name: /continue|sign in|next/i })
      .first()
      .click();
    await expect(page.locator('.err, [role="alert"]').first()).toBeVisible();
  });

  test('forgot password gives the same answer for an address that has no account', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).first().fill('nobody-here@example.com');
    await page
      .getByRole('button', { name: /send|reset|link/i })
      .first()
      .click();
    await expect(page.getByText(/if (an|that) account|check your email|sent/i).first()).toBeVisible(
      { timeout: 20_000 },
    );
  });

  test('quote form checks the fields before sending', async ({ page }) => {
    await page.goto('/quote');
    await page
      .getByRole('button', { name: /request|send|submit|quote/i })
      .last()
      .click();
    await expect(page.locator('.err, [role="alert"]').first()).toBeVisible();
  });

  test('bulk form checks the fields before sending', async ({ page }) => {
    await page.goto('/business');
    await page.getByRole('button', { name: /bulk quote/i }).click();
    await expect(page.locator('.err, [role="alert"]').first()).toBeVisible();
  });

  test('FAQ answers open and close', async ({ page }) => {
    await page.goto('/faq');
    const first = page.locator('button[aria-expanded], summary').first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(page.locator('[aria-expanded="true"], details[open]').first()).toBeVisible();
  });

  test('no policy or help page still shows [placeholder] text to customers', async ({ page }) => {
    const bad: string[] = [];
    for (const p of [
      '/',
      '/contact',
      '/shipping',
      '/returns',
      '/refunds',
      '/privacy',
      '/terms',
      '/about',
      '/faq',
    ]) {
      await page.goto(p);
      const text = await page.locator('body').innerText();
      const hits = text.match(
        /\[(AMOUNT|X|XX|YOUR GSTIN|WhatsApp number|support email|price)[^\]]*\]/gi,
      );
      if (hits) bad.push(`${p}: ${[...new Set(hits)].join(', ')}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
