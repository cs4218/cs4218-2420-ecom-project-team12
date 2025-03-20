import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  //Register new account
  await page.goto('http://localhost:3000/register');

  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('testacc');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('testacc@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('testacc@test.com');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('1 test street');
  await page.getByPlaceholder('Enter Your DOB').fill('2000-11-11');
  await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('sports');

  await page.getByRole('button', { name: 'REGISTER' }).click();

  const errorMessage = page.getByText('Already registered, please');
  
  if (errorMessage) {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('testacc@test.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('testacc@test.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();
  }

  await page.getByRole('button', { name: 'testacc' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();

  await page.getByRole('link', { name: 'Profile' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('updatetestacc');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('87654321');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('1 Science Drive');
  
  await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
  await page.getByText('Profile Updated Successfully').click();
  await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('updatetestacc');
  await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toHaveValue('testacc@test.com');
  await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toHaveValue('87654321');
  await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('1 Science Drive');

  //reset acc details back to original details
  await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('testacc');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('12345678');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('1 test street');
  await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
  await page.getByText('Profile Updated Successfully').click();

  //Confirm acc details
  await expect(page.getByRole('textbox', { name: 'Enter Your Name' })).toHaveValue('testacc');
  await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toHaveValue('testacc@test.com');
  await expect(page.getByRole('textbox', { name: 'Enter Your Phone' })).toHaveValue('12345678');
  await expect(page.getByRole('textbox', { name: 'Enter Your Address' })).toHaveValue('1 test street');

  //Logout
  await page.getByRole('button', { name: 'testacc' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});