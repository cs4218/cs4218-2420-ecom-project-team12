import { describe, test, expect, beforeAll, afterAll } from '@playwright/test';

import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDB from "../config/db";
import userModel from '../models/userModel';
import { createSampleUser } from './generators/sample-user';

describe('Authentication UI Tests', () => {

  const PREFIX = 'http://localhost:3000';
  function path(suffix) {
    if (!suffix.startsWith('/')) suffix = `/${suffix}`;
    return PREFIX + suffix;
  }


  let tempStandardUser = { role: 0 };
  let tempAdminUser = { role: 1 };

  beforeAll(async () => {
    dotenv.config();
    await connectDB();

    tempStandardUser = await createSampleUser(0);
    tempAdminUser = await createSampleUser(1);
  });

  afterAll(async () => {
    await userModel.findByIdAndDelete(tempStandardUser._id);
    await userModel.findByIdAndDelete(tempAdminUser._id);
  });



  describe('Basic Login-Logout Tests', () => {

    test('can navigate to the login page', async ({ page }) => {
      // Navigate to the homepage
      await page.goto(path('/login'));

      // Verify that the login form is displayed
      const pageTitle = await page.title();
      expect(pageTitle).toContain('Login - Ecommerce App');
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    });

    test('can navigate to the login page from the homepage', async ({ page }) => {
      // Navigate to the homepage
      await page.goto(path('/'));

      // Click the login button
      await page.getByRole('link', { name: 'Login' }).click();

      // Verify that the login form is displayed
      const pageTitle = await page.title();
      expect(pageTitle).toContain('Login - Ecommerce App');
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    });

    test('can login with valid credentials', async ({ page }) => {
      // Navigate to the login page
      await page.goto(path('/login'));

      // Credentials
      const name = tempStandardUser.name;
      const username = tempStandardUser.email;
      const password = tempStandardUser.password;

      // Fill the login form
      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(username);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);

      // Submit the login form
      await page.getByRole('button', { name: 'LOGIN' }).click();

      // Verify that the user is logged in.
      await page.waitForURL(path('/'));
      await expect(page.getByRole('navigation')).toContainText(name);

      // Verify that the login is persistent.
      await page.reload();
      await expect(page.getByRole('navigation')).toContainText(name);
    });

    test('can logout after a login', async ({ page }) => {
      // Navigate to the login page
      await page.goto(path('/login'));

      // Credentials
      const name = tempStandardUser.name;
      const username = tempStandardUser.email;
      const password = tempStandardUser.password;

      // Fill the login form
      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(username);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);

      // Submit the login form
      await page.getByRole('button', { name: 'LOGIN' }).click();

      // Verify that the user is logged in
      await page.waitForURL(path('/'));
      await expect(page.getByRole('navigation')).toContainText(name);

      // Navigate to an arbitrary page
      await page.goto(path('/dashboard/user'));

      // Time to log out!
      // Click the logout button
      await page.getByRole('button', { name }).click();
      await page.getByRole('link', { name: 'Logout' }).click();

      // Verify that the navigation no longer contains the user's name
      await expect(page.getByRole('navigation')).not.toContainText(name);

      // Verify that the user is redirected to the homepage
      await page.waitForURL(path('/login'));

      // Verify that user is still logged out after a page reload
      await page.reload();
      await expect(page.getByRole('navigation')).not.toContainText(name);
    });

  });

  describe("Registration Tests", () => {

  });

  describe("Persistence and Permissions Tests", () => {

  });

});

