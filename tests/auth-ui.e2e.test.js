import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from "../config/db";

import { describe, test, expect, beforeAll } from '@playwright/test';

describe('Authentication UI Tests', () => {

  let snapshot;

  beforeAll(async () => {
    dotenv.config();
    await connectDB();

    snapshot = {
      categories: await mongoose.connection.db.collection("categories").find({}).toArray(),
      products: await mongoose.connection.db.collection("products").find({}).toArray(),
      orders: await mongoose.connection.db.collection("orders").find({}).toArray(),
      users: await mongoose.connection.db.collection("users").find({}).toArray(),
    };
  });

  describe('Basic Login-Logout Tests', () => {

    test('can navigate to the login page', async ({ page }) => {
      // Navigate to the homepage
      await page.goto('http://localhost:3000/login');

      // Verify that the login form is displayed
      const pageTitle = await page.title();
      expect(pageTitle).toContain('Login - Ecommerce App');
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    });

    test('can navigate to the login page from the homepage', async ({ page }) => {
      // Navigate to the homepage
      await page.goto('http://localhost:3000/');

      // Click the login button
      await page.getByRole('link', { name: 'Login' }).click();

      // Verify that the login form is displayed
      const pageTitle = await page.title();
      expect(pageTitle).toContain('Login - Ecommerce App');
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    });

    test('can login with valid credentials', async ({ page }) => {
      // Navigate to the login page
      await page.goto('http://localhost:3000/login');

      // Credentials
      const name = 'CS 4218 Test Account'
      const username = 'cs4218@test.com';
      const password = 'cs4218@test.com';

      // Fill the login form
      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(username);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);

      // Submit the login form
      await page.getByRole('button', { name: 'LOGIN' }).click();

      // Verify that the user is logged in.
      await page.waitForURL('http://localhost:3000/');
      await expect(page.getByRole('navigation')).toContainText(name);

      // Verify that the login is persistent.
      await page.reload();
      await expect(page.getByRole('navigation')).toContainText(name);
    });

    test('can logout after a login', async ({ page }) => {
      // Navigate to the login page
      await page.goto('http://localhost:3000/login');

      // Credentials
      const name = 'CS 4218 Test Account'
      const username = 'cs4218@test.com';
      const password = 'cs4218@test.com';

      // Fill the login form
      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(username);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);

      // Submit the login form
      await page.getByRole('button', { name: 'LOGIN' }).click();

      // Navigate to an arbitrary page and reload
      await page.waitForURL('http://localhost:3000/');
      await page.goto('http://localhost:3000/cart');
      await page.reload();

      // Time to log out!
      // Click the logout button
      await page.getByRole('button', { name }).click();
      await page.getByRole('link', { name: 'Logout' }).click();

      // Verify that the navigation no longer contains the user's name
      await expect(page.getByRole('navigation')).not.toContainText(name);

      // Verify that the user is redirected to the homepage
      await page.waitForURL('http://localhost:3000/login');

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

