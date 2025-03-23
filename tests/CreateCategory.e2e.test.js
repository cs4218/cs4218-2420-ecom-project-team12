import { test, expect } from '@playwright/test';

const URL_BASE = 'http://localhost:3000';
const URL_LOGIN = URL_BASE + '/login';
const URL_CREATE_CATEGORY = URL_BASE + '/dashboard/admin/create-category';

const EMAIL_ADMIN = 'jfadmin@mail.com';
const PASSWORD_ADMIN = 'jfadmin';
const EMAIL_USER = 'cs4218@test.com';
const PASSWORD_USER = 'cs4218@test.com';
const CATEGORY_ONE = 'test123';
const CATEGORY_TWO = 'test124';

test('When accessing page, When not logged in, Then redirects user', async ({ page }) => {
  await page.goto(URL_CREATE_CATEGORY);

  await expect(page.getByRole('heading', { name: 'redirecting to you in 3 second' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'redirecting to you in 3 second' })).toBeHidden();
  await expect(page).toHaveURL(URL_BASE);
});

test('When accessing page, When not an admin, Then redirects user', async ({ page }) => {
  await login(page, EMAIL_USER, PASSWORD_USER);
  await page.goto(URL_CREATE_CATEGORY);

  await expect(page.getByRole('heading', { name: 'redirecting to you in 3 second' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'redirecting to you in 3 second' })).toBeHidden();
  await expect(page).toHaveURL(URL_BASE);
});

test('When accessing page, When as an admin, Then run full test', async ({ page }) => {
  await login(page, EMAIL_ADMIN, PASSWORD_ADMIN);
  await page.goto(URL_CREATE_CATEGORY);

  //Ensure page is loaded
  await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeVisible();

  //CREATE
  await page.getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('textbox', { name: 'Enter new category' }).fill(CATEGORY_ONE);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('status')).toContainText(CATEGORY_ONE + ' is created');
  await expect(page.getByRole('cell', { name: CATEGORY_ONE })).toBeVisible

  //UPDATE
  await page.getByRole('row', { name: CATEGORY_ONE + ' Edit Delete' }).getByRole('button').first().click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' }).fill(CATEGORY_TWO);
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('main')).toContainText(CATEGORY_TWO + ' is updated');
  await expect(page.getByRole('cell', { name: CATEGORY_ONE })).toBeHidden();
  await expect(page.getByRole('cell', { name: CATEGORY_TWO })).toBeVisible();

  //DELETE
  await page.getByRole('row', { name: CATEGORY_TWO + ' Edit Delete' }).getByRole('button').nth(1).click();
  await expect(page.getByText('category is deleted')).toBeVisible();
  await expect(page.getByRole('cell', { name: CATEGORY_TWO })).toBeHidden();
});

async function login(page, email, password) {
  await page.goto(URL_LOGIN);
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page).toHaveURL(URL_BASE);
}