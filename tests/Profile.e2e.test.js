import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('cs4218@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('cs4218@test.com');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await page.getByRole('button', { name: 'CS 4218 TEST ACCOUNT' }).click();
  await page.getByRole('link', { name: 'DASHBOARD' }).click();

  await page.getByRole('link', { name: 'Profile' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('CS 4218 Test Accounts');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('1 Science Drive');
  
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await page.getByText('Profile Updated Successfully').click();
  await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('CS 4218 Test Accounts');
  await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toHaveValue('cs4218@test.com');
  await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toHaveValue('12345678');
  await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('1 Science Drive');
  
});