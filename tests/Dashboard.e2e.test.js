import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  //Login Sequence
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  //Accessing dashboard page
  // Click the account name to open the dropdown
  await page.getByRole('button', { name: 'CS 4218 TEST ACCOUNT' }).click();
  await page.getByRole('link', { name: 'DASHBOARD' }).click();

  await expect(page.locator('h3', { hasText: 'CS 4218 TEST ACCOUNT' })).toBeVisible();
  await expect(page.locator('h3', { hasText: 'cs4218@test.com' })).toBeVisible();
  await expect(page.locator('h3', { hasText: '1 Computing Drive' })).toBeVisible();

  //Test that authenticated user can access protected routes (Dashboard, Profile and Orders)
  //Test that authenticated user stays logged in after page refresh
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();

  await page.getByRole('link', { name: 'Profile' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();

  await page.getByRole('link', { name: 'Orders' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();

});