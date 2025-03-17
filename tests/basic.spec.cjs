const { describe, test, expect } = require('@playwright/test');

describe('Basic Tests', () => {
  test('can navigate to the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000/');

    // Verify that the homepage is loaded successfully
    const pageTitle = await page.title();
    expect(pageTitle).toContain('ALL Products - Best offers');
  })
});

