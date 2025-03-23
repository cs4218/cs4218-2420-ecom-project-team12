import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import HomePage from "./HomePage";
import { CartProvider } from "../context/cart";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");

// Also mock the SearchInput component to avoid the useSearch hook issue
jest.mock("../components/Form/SearchInput", () => {
  return function DummySearchInput() {
    return <div data-testid="search-input">Search Input Mock</div>;
  };
});

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    store,
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helper function to wrap component with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <CartProvider>{component}</CartProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe("HomePage Integration Tests - Cart Functionality", () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();

    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: {
            success: true,
            category: [
              { _id: "cat1", name: "Electronics" },
              { _id: "cat2", name: "Books" },
            ],
          },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({
          data: { total: 3 },
        });
      }
      if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                description: "Test Product 1",
                slug: "product-1",
              },
              {
                _id: "p2",
                name: "Product 2",
                price: 200,
                description: "Test Product 2",
                slug: "product-2",
              },
              {
                _id: "p3",
                name: "Product 3",
                price: 300,
                description: "Test Product 3",
                slug: "product-3",
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  test("should add product to cart when 'ADD TO CART' button is clicked", async () => {
    // Render HomePage with necessary providers
    renderWithProviders(<HomePage />);

    // Wait for products to load
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    // Find 'ADD TO CART' buttons and click the first one
    const addToCartButtons = await screen.findAllByText("ADD TO CART");
    fireEvent.click(addToCartButtons[0]);

    // Check toast notification was triggered
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");

    // Verify item was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Get the stored cart data and check if it contains the product
    const storedCartData = localStorageMock.setItem.mock.calls[0][1];
    const parsedCartData = JSON.parse(storedCartData);

    // Verify the cart contains the correct product
    expect(parsedCartData).toHaveLength(1);
    expect(parsedCartData[0]._id).toBe("p1");
    expect(parsedCartData[0].name).toBe("Product 1");
    expect(parsedCartData[0].price).toBe(100);
  });

  test("should load existing cart items from localStorage on initial render", async () => {
    // Setup existing cart in localStorage
    const existingCart = [
      {
        _id: "p2",
        name: "Product 2",
        price: 200,
        description: "Test Product 2",
        slug: "product-2",
      },
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingCart));

    // Render HomePage
    renderWithProviders(<HomePage />);

    // Wait for products to load
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    // Find 'ADD TO CART' buttons and click the first one (Product 1)
    const addToCartButtons = await screen.findAllByText("ADD TO CART");
    fireEvent.click(addToCartButtons[0]);

    // Get the stored cart data and check if it contains both products
    const storedCartData = localStorageMock.setItem.mock.calls[0][1];
    const parsedCartData = JSON.parse(storedCartData);

    // Verify the cart contains both products (the existing one and the newly added one)
    expect(parsedCartData).toHaveLength(2);
    expect(parsedCartData[0]._id).toBe("p2"); // Existing item
    expect(parsedCartData[1]._id).toBe("p1"); // Newly added item
  });

  test("should persist cart across simulated page reloads", async () => {
    // First render - add a product to cart
    const { unmount } = renderWithProviders(<HomePage />);

    // Wait for products to load
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    // Find 'ADD TO CART' buttons and click the first one (Product 1)
    const addToCartButtons = await screen.findAllByText("ADD TO CART");
    fireEvent.click(addToCartButtons[0]);

    // Explicitly clear localStorage mock calls to start with a clean slate
    localStorageMock.setItem.mockClear();

    // Setup localStorage with only the first product for the "reload"
    const firstCart = [
      {
        _id: "p1",
        name: "Product 1",
        price: 100,
        description: "Test Product 1",
        slug: "product-1",
      },
    ];
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "cart") {
        return JSON.stringify(firstCart);
      }
      return null;
    });

    // Clean up the first render
    unmount();

    // Render again (simulating page reload)
    renderWithProviders(<HomePage />);

    // Wait for products to load again
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1")
    );

    // Add another product (Product 2) to cart
    const newAddToCartButtons = await screen.findAllByText("ADD TO CART");
    fireEvent.click(newAddToCartButtons[1]); // Click the second product this time

    // Get the updated cart data
    const secondStoredCartData = localStorageMock.setItem.mock.calls[0][1];
    const parsedCartData = JSON.parse(secondStoredCartData);

    // Verify the cart contains exactly the two expected products
    expect(parsedCartData).toHaveLength(2);

    // Check that we have the expected products (order matters based on implementation)
    const productIds = parsedCartData.map((item) => item._id);
    expect(productIds).toContain("p1");
    expect(productIds).toContain("p2");
    expect(productIds.filter((id) => id === "p2").length).toBe(1);
  });
});
