const { test, expect } = require("@playwright/test");
import { createSampleUser } from "./generators/sample-user";
import { createSampleProduct } from "./generators/sample-product";
import { createSampleCategory } from "./generators/sample-category";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import dotenv from "dotenv";
import connectDB from "../config/db";

test.describe("Product Price Filter Tests", () => {
  let testUser;
  let testCategory;
  let testProducts = [];
  // Generate unique identifiers for product names
  const timestamp = Date.now();
  const budgetProductName = `Budget Product ${timestamp}`;
  const midRangeProductName = `Mid-Range Product ${timestamp}`;
  const premiumProductName = `Premium Product ${timestamp}`;

  // Setup: Create test data before running tests
  test.beforeAll(async () => {
    // Connect to test database
    dotenv.config();
    await connectDB();

    // Create test user
    testUser = await createSampleUser(0); // Regular user

    // Create test category
    testCategory = await createSampleCategory();

    // Create products with specific prices:
    // 1. Product in the $0-19 range
    const budgetProduct = await createSampleProduct(testCategory._id);
    // Update the product to have specific properties for testing
    budgetProduct.name = budgetProductName;
    budgetProduct.description = "A product within the $0-19 price range";
    budgetProduct.price = 15;
    await productModel.findByIdAndUpdate(budgetProduct._id, budgetProduct);
    testProducts.push(budgetProduct);

    // 2. Products outside the $0-19 range
    const midRangeProduct = await createSampleProduct(testCategory._id);
    // Update the product to have specific properties for testing
    midRangeProduct.name = midRangeProductName;
    midRangeProduct.description = "A product outside the $0-19 price range";
    midRangeProduct.price = 35;
    await productModel.findByIdAndUpdate(midRangeProduct._id, midRangeProduct);
    testProducts.push(midRangeProduct);

    const premiumProduct = await createSampleProduct(testCategory._id);
    // Update the product to have specific properties for testing
    premiumProduct.name = premiumProductName;
    premiumProduct.description =
      "Another product outside the $0-19 price range";
    premiumProduct.price = 75;
    await productModel.findByIdAndUpdate(premiumProduct._id, premiumProduct);
    testProducts.push(premiumProduct);

    console.log(
      "Created test products with IDs:",
      testProducts.map((p) => p._id)
    );
  });

  // Cleanup after tests
  test.afterAll(async () => {
    // Delete test products
    for (const product of testProducts) {
      if (product && product._id) {
        await productModel.findByIdAndDelete(product._id);
      }
    }

    // Delete test category
    if (testCategory && testCategory._id) {
      await categoryModel.findByIdAndDelete(testCategory._id);
    }

    // Delete test user
    if (testUser && testUser._id) {
      await userModel.findByIdAndDelete(testUser._id);
    }
  });

  // Test case: Filter products by price
  test("should filter products by price and handle empty price ranges", async ({
    page,
  }) => {
    // Navigate to homepage
    await page.goto("http://localhost:3000/");

    // Wait for products to load
    await page.waitForSelector(".card");

    // Get initial product count (should be at least 3 from our test data)
    const initialProductCount = await page.locator(".card").count();
    console.log(`Initial product count: ${initialProductCount}`);
    expect(initialProductCount).toBeGreaterThanOrEqual(3);

    // Verify our test products are visible by name
    await expect(page.getByText(budgetProductName)).toBeVisible();
    await expect(page.getByText(midRangeProductName)).toBeVisible();
    await expect(page.getByText(premiumProductName)).toBeVisible();

    // Find the price filter section
    const priceFilterSection = page.getByText("Filter By Price");
    await expect(priceFilterSection).toBeVisible();

    // Part 1: Test filtering with products in range ($0-19)
    console.log("Testing price filter with products in range ($0-19)");

    // Select the first price range ($0-19)
    const firstPriceFilter = page
      .locator('.d-flex.flex-column input[type="radio"]')
      .first();
    await firstPriceFilter.click();

    // Verify our budget product is visible but others are not
    await expect(page.getByText(budgetProductName)).toBeVisible();
    await expect(page.getByText(midRangeProductName)).not.toBeVisible();
    await expect(page.getByText(premiumProductName)).not.toBeVisible();

    // Get all visible product prices
    const productPrices = await page.locator(".card-price").allTextContents();

    // Verify prices are in the expected range
    const maxPrice = 20 - Number.EPSILON;

    for (const priceText of productPrices) {
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
      expect(price).toBeLessThanOrEqual(maxPrice);
      console.log(`Verified product price: ${price} <= ${maxPrice}`);
    }

    // Reset filters by clicking reset button
    const resetButton = page.getByRole("button", { name: "RESET FILTERS" });
    await resetButton.click();

    // Verify filters were reset
    await page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/product/product-list") &&
        response.status() === 200
      );
    });

    // Verify our test products are visible again after reset
    await expect(page.getByText(budgetProductName)).toBeVisible();
    await expect(page.getByText(midRangeProductName)).toBeVisible();
    await expect(page.getByText(premiumProductName)).toBeVisible();

    // Check product count has returned to initial state
    const productsAfterReset = await page.locator(".card").count();
    expect(productsAfterReset).toEqual(initialProductCount);

    // Part 2: Test filtering with no products in range
    console.log("Testing price filter with no products in range");

    // Select a price range that has no products
    // The 5th filter is for products $80-99 (which our test data doesn't have)
    const emptyPriceFilter = page
      .locator('.d-flex.flex-column input[type="radio"]')
      .nth(4);
    await emptyPriceFilter.click();

    // Verify none of our test products are visible
    await expect(page.getByText(budgetProductName)).not.toBeVisible();
    await expect(page.getByText(midRangeProductName)).not.toBeVisible();
    await expect(page.getByText(premiumProductName)).not.toBeVisible();

    // Get filtered product count (should be 0 or very few)
    const filteredProductCount = await page.locator(".card").count();
    console.log(
      `Filtered product count for empty range: ${filteredProductCount}`
    );

    // Reset filters by clicking reset button again
    await resetButton.click();

    // Verify filters were reset
    await page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/product/product-list") &&
        response.status() === 200
      );
    });

    // Verify our test products are visible again after reset
    await expect(page.getByText(budgetProductName)).toBeVisible();
    await expect(page.getByText(midRangeProductName)).toBeVisible();
    await expect(page.getByText(premiumProductName)).toBeVisible();
  });
});
