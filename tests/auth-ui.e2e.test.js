import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@playwright/test';

import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDB from "../config/db";

import userModel from '../models/userModel';
import productModel from '../models/productModel';
import categoryModel from '../models/categoryModel';
import orderModel from '../models/orderModel';

import { createSampleUser, generateSampleUserProps } from './generators/sample-user';
import { createSampleCategory } from './generators/sample-category';
import { createSampleProduct } from './generators/sample-product';
import { createSampleOrder } from './generators/sample-order';
import { pickRandomItem } from './generators/utils';

describe('Authentication UI Tests', () => {

  const PREFIX = 'http://localhost:3000';
  function path(suffix) {
    if (!suffix.startsWith('/')) suffix = `/${suffix}`;
    return PREFIX + suffix;
  }


  let tempStandardUser = { role: 0 };
  let tempAdminUser = { role: 1 };

  let sampleCategories = [];
  let sampleProducts = [];
  let sampleOrders = [];

  beforeAll(async () => {
    dotenv.config();
    await connectDB();

    tempStandardUser = await createSampleUser(0);
    tempAdminUser = await createSampleUser(1);

    for (let i = 0; i < 2; i++) {
      sampleCategories.push(await createSampleCategory());
    }

    for (let i = 0; i < 3; i++) {
      sampleProducts.push(await createSampleProduct(pickRandomItem(sampleCategories)._id));
    }

    for (let i = 0; i < 2; i++) {
      sampleOrders.push(await createSampleOrder(tempStandardUser._id, [pickRandomItem(sampleProducts)._id]));
    }
  });

  afterAll(async () => {
    for (let o of sampleOrders) {
      await orderModel.findByIdAndDelete(o._id);
    }
    for (let p of sampleProducts) {
      await productModel.findByIdAndDelete(p._id);
    }
    for (let c of sampleCategories) {
      await categoryModel.findByIdAndDelete(c._id);
    }

    await userModel.findByIdAndDelete(tempStandardUser._id);
    await userModel.findByIdAndDelete(tempAdminUser._id);
  });



  describe('Basic Login-Logout Tests', () => {

    test('can navigate to the login page', async ({ page }) => {
      // Navigate to the homepage
      await page.goto(path('/login'));

      // Verify that the login form is displayed
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
      expect(await page.title()).toContain('Login - Ecommerce App');
    });

    test('can navigate to the login page from the homepage', async ({ page }) => {
      // Navigate to the homepage
      await page.goto(path('/'));

      // Click the login button
      await page.getByRole('link', { name: 'Login' }).click();

      // Verify that the login form is displayed
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
      expect(await page.title()).toContain('Login - Ecommerce App');
    });

    test('can login with valid credentials', async ({ page }) => {
      // Navigate to the login page
      await page.goto(path('/login'));
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();

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
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();

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

    let sampleData;

    beforeAll(async () => {
      sampleData = generateSampleUserProps();
    });

    afterAll(async () => {
      if (sampleData.email) await userModel.deleteOne({ email: sampleData.email });
    });

    test('can navigate to the registration page', async ({ page }) => {
      // Navigate to the homepage
      await page.goto(path('/register'));

      // Verify that the registration form is displayed
      await expect(page.getByRole('heading', { name: 'REGISTER FORM' })).toBeVisible();
      expect(await page.title()).toContain('Register - Ecommerce App');
    });

    test('can navigate to the registration page from the homepage', async ({ page }) => {
      // Navigate to the homepage
      await page.goto(path('/'));

      // Click the register button
      await page.getByRole('link', { name: 'Register' }).click();

      // Verify that the registration form is displayed
      await expect(page.getByRole('heading', { name: 'REGISTER FORM' })).toBeVisible();
      expect(await page.title()).toContain('Register - Ecommerce App');
    });

    test('can register a new user and log in to said account', async ({ page }) => {
      // Navigate to the registration page
      await page.goto(path('/register'));
      await expect(page.getByRole('heading', { name: 'REGISTER FORM' })).toBeVisible();

      // Fill the registration form
      await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Name' }).fill(sampleData.name);
      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(sampleData.email);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(sampleData.password);
      await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill(sampleData.phone);
      await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Address' }).fill(sampleData.address);
      await page.getByPlaceholder('Enter Your DOB').fill('2000-11-11'); // TODO: This appears to be currently unused and should be removed.
      await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).click();
      await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill(sampleData.answer);

      // Submit the registration form
      await page.getByRole('button', { name: 'REGISTER' }).click();

      // Verify that the user is registered
      await expect(page.getByText(/registered successfully/i)).toBeVisible();

      await page.goto(path('/login'));
      await page.waitForURL(path('/login'));

      expect(await page.title()).toContain('Login - Ecommerce App');
      await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();

      // Fill the login form
      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(sampleData.email);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(sampleData.password);

      // Submit the login from
      await page.getByRole('button', { name: 'LOGIN' }).click();

      // Verify that the user can login
      await page.waitForURL(path('/'));
      await expect(page.getByRole('navigation')).toContainText(sampleData.name);
    });
  });

  describe("Page Permissions Tests", () => {

    async function login(page, user) {
      // Navigate to the login page
      await page.goto(path('/login'));

      // Credentials
      const name = user.name;
      const username = user.email;
      const password = user.password;

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
    }

    test('can log in to a standard account and browse account-restricted pages', async ({ page }) => {
      await login(page, tempStandardUser);

      // Attempt navigation to account-restricted pages
      await page.getByRole('button', { name: tempStandardUser.name }).click();

      await page.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page.getByText(tempStandardUser.email)).toBeVisible();

      await page.getByRole('link', { name: 'Profile' }).click();
      await expect(page.getByText('User Profile')).toBeVisible();

      await page.getByRole('link', { name: 'Orders' }).click();
      for (let o of sampleOrders.filter(o => o.user == tempStandardUser._id)) {
        await expect(page.getByText(sampleProducts.filter(p => p._id == o.products[0])[0])).toBeVisible();
      }

      await page.getByRole('link', { name: 'Home' }).click();

      // Still logged in
      await expect(page.getByRole('navigation')).toContainText(tempStandardUser.name);
    });

    test('cannot access admin-restricted pages with a standard account', async ({ page }) => {
      await login(page, tempStandardUser);

      // Attempt navigation to admin-restricted pages
      await page.goto(path('/dashboard/admin'));
      await expect(page.getByText(/redirecting to/i)).toBeVisible();
      await page.waitForTimeout(3000);
      await page.waitForURL(path('/'));

      await page.goto(path('/dashboard/admin/orders'));
      await expect(page.getByText(/redirecting to/i)).toBeVisible();
      await page.waitForTimeout(3000);
      await page.waitForURL(path('/'));

      // Still logged in
      await expect(page.getByRole('navigation')).toContainText(tempStandardUser.name);
    });

    test('can log in to an admin account and browse admin-restricted pages', async ({ page }) => {
      await login(page, tempAdminUser);

      // Attempt navigation to admin-restricted pages
      await page.getByRole('button', { name: tempAdminUser.name }).click();

      await page.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page.getByText(tempAdminUser.email)).toBeVisible();

      await page.getByRole('link', { name: 'Create Category' }).click();
      await page.getByRole('link', { name: 'Create Product' }).click();

      await page.getByRole('link', { name: 'Products' }).click();
      await expect(page.getByText(sampleProducts[0].name)).toBeVisible();

      await page.getByRole('link', { name: 'Orders' }).click();
      await expect(page.getByText('All Orders#StatusBuyer')).toBeVisible();
      let productsExpectedInOrders = sampleProducts.filter(p => sampleOrders.some(o => o.products.includes(p._id)));
      for (let p of productsExpectedInOrders) {
        expect(await page.getByText('All Orders#StatusBuyer').textContent()).toContain(p.name);
      }

      await page.getByRole('link', { name: 'Home' }).click();

      // Still logged in
      await expect(page.getByRole('navigation')).toContainText(tempAdminUser.name);
    });

  });

  describe("Login Expiry Handling Tests", () => {

    let sampleTimedToken;
    let sampleInvalidToken;

    async function injectToken(page, token) {
      await page.evaluate(token => {
        const data = JSON.parse(localStorage.getItem('auth'));
        data.token = token;
        localStorage.setItem('auth', JSON.stringify(data));
      }, token);
    }

    beforeEach(async ({ page }) => {
      await page.goto(path('/login'));

      const name = tempStandardUser.name;
      const username = tempStandardUser.email;
      const password = tempStandardUser.password;

      await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(username);
      await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
      await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(password);

      await page.getByRole('button', { name: 'LOGIN' }).click();

      await page.waitForURL(path('/'));
      await expect(page.getByRole('navigation')).toContainText(name);

      sampleTimedToken = JWT.sign({ id: tempStandardUser._id }, process.env.JWT_SECRET, { expiresIn: '5s' });
      sampleInvalidToken = JWT.sign({ id: tempStandardUser._id }, process.env.JWT_SECRET, { expiresIn: '-1d' });
    });

    test('when fresh-loading an access-restricted page with an invalid token, the user is redirected and logged out', async ({ page }) => {

      // Inject a timed token
      await injectToken(page, sampleInvalidToken);
      await page.reload();
      await expect(page.getByRole('navigation')).toContainText(tempStandardUser.name); // User at homepage, which is public. The check doesn't trigger yet.
      await page.waitForTimeout(1000);

      // Attempt navigation to a freshly loaded account-restricted page
      await page.goto(path('/dashboard/user'));

      // Check if the user is correctly redirected
      await expect(page.getByText(/redirecting to/i)).toBeVisible();
      await page.waitForTimeout(3000);

      // Verify that we now are on the login page and the user is logged out
      await page.waitForURL(path('/login'));
      await expect(page.getByRole('navigation')).not.toContainText(tempStandardUser.name);
    });

    test('when the user is browsing pages and token expires midway, the user is redirected and logged out', async ({ page }) => {

      // Inject a timed token
      await injectToken(page, sampleTimedToken);
      await page.reload();
      await expect(page.getByRole('navigation')).toContainText(tempStandardUser.name); // User at homepage, which is public. The check doesn't trigger yet.
      await page.waitForTimeout(1000);

      // Do miscellaneous actions that don't require authentication
      const startTime = Date.now();

      let product;
      function getProductDescription() {
        let x =
          product.name +
          product.price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }) +
          product.description;

        if (x.length > 30) {
          x = x.substring(0, 30);
        }
        return x;
      }

      product = pickRandomItem(sampleProducts);
      while (!page.getByText(getProductDescription()).isVisible()) {
        await page.getByText('Loadmore').click();
        await page.waitForTimeout(500);
      }

      await page.getByText(getProductDescription()).getByText('More Details').click();
      await page.getByRole('button', { name: 'ADD TO CART' }).click();
      await page.getByRole('link', { name: 'Cart' }).click();
      await page.getByRole('navigation').getByText('Home').click();
      await expect(page.getByText('All Products')).toBeVisible();

      product = pickRandomItem(sampleProducts);

      while (!page.getByText(getProductDescription()).isVisible()) {
        await page.getByText('Loadmore').click();
        await page.waitForTimeout(500);
      }

      await expect(page.getByText(getProductDescription())).toBeVisible();
      await page.getByText(getProductDescription()).getByText('ADD TO CART').click();

      let category;
      category = pickRandomItem(sampleCategories);
      await page.getByRole('link', { name: 'Categories' }).click();
      await page.getByRole('link', { name: 'All Categories' }).click();
      await expect(page.getByRole('link', { name: category.name })).toBeVisible();
      await page.getByRole('link', { name: category.name }).click();

      product = sampleProducts.filter(p => p.category === category._id)[0];
      if (product) {
        await expect(page.getByText(getProductDescription())).toBeVisible();
        await page.getByText(getProductDescription()).getByText('More Details').click();
        await page.getByRole('button', { name: 'ADD TO CART' }).click();
      }

      await page.getByRole('button', { name: tempStandardUser.name }).click();
      await page.getByRole('link', { name: 'Dashboard' }).click();

      await expect(page.getByText(tempStandardUser.email)).toBeVisible();
      await page.getByRole('link', { name: 'Orders' }).click();
      await page.getByRole('link', { name: 'Profile' }).click();

      await page.getByRole('link', { name: 'Categories' }).click();
      await page.getByRole('link', { name: 'All Categories' }).click();

      await page.getByRole('link', { name: 'Cart' }).click();
      await expect(page.getByRole('navigation')).toContainText(tempStandardUser.name);

      // Wait for the token to expire (5s)
      await page.waitForTimeout((() => {
        const endTime = Date.now();
        const delta = endTime - startTime;
        const waitTime = 5000 - delta;
        return Math.max(waitTime + 100, 100);
      })());

      // Attempt navigation to a account-restricted page
      await page.getByRole('button', { name: tempStandardUser.name }).click();
      await page.getByRole('link', { name: 'Dashboard' }).click();

      // Check if the user is correctly redirected
      await expect(page.getByText(/redirecting to/i)).toBeVisible();
      await page.waitForTimeout(3000);

      // Verify that we now are on the login page and the user is logged out
      await page.waitForURL(path('/login'));
      await expect(page.getByRole('navigation')).not.toContainText(tempStandardUser.name);

      // Navigating around is still remains logged out
      await page.getByRole('link', { name: 'Home' }).click();
      await expect(page.getByRole('navigation')).not.toContainText(tempStandardUser.name);
    });

  });

});

