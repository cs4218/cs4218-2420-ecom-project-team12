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
  await page.getByRole('link', { name: 'Orders' }).click();

  await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Buyer' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'date' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Payment' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();

  await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Not Process' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'CS 4218 Test Account' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'a few seconds ago' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Failed' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '3' })).toBeVisible();

  await expect(page.getByRole('img', {name: 'NUS T-shirt'})).toBeVisible();
  await expect(page.getByText('NUS T-shirt', {exact: true})).toBeVisible();
  await expect(page.getByText('Plain NUS T-shirt for sale')).toBeVisible();
  await expect(page.getByText('Price : 4.99')).toBeVisible();

  

});