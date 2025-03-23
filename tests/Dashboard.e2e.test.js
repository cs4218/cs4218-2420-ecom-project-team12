import { test, expect, beforeAll, afterAll } from '@playwright/test';
import { createSampleUser } from './generators/sample-user';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';   

dotenv.config();

beforeAll(async () => {
  await connectDB(); 
});

afterAll(async () => {
  await mongoose.connection.close();
});

test('test', async ({ page }) => {

  const sampleUser = await createSampleUser();
  //Login Sequence
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(sampleUser.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(sampleUser.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  //Accessing dashboard page
  // Click the account name to open the dropdown
  await page.getByRole('button', { name: sampleUser.name }).click();
  await page.getByRole('link', { name: 'DASHBOARD' }).click();

  await expect(page.locator('h3', { hasText: sampleUser.name })).toBeVisible();
  await expect(page.locator('h3', { hasText: sampleUser.email })).toBeVisible();
  await expect(page.locator('h3', { hasText: sampleUser.address })).toBeVisible();

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