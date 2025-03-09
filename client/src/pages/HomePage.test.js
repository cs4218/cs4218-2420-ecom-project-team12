import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import HomePage from "./HomePage";
import { useCart } from "../context/cart";
import "@testing-library/jest-dom";

// Mock axios, toast, and other dependencies
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock useCart hook
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Mock Layout component
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock sample data
const mockProducts = [
  {
    _id: "prod1",
    name: "Test Product 1",
    description: "Description for product 1",
    price: 99.99,
    category: { _id: "cat1", name: "Category 1" },
    slug: "test-product-1",
    quantity: 10,
  },
  {
    _id: "prod2",
    name: "Test Product 2",
    description: "Description for product 2",
    price: 149.99,
    category: { _id: "cat2", name: "Category 2" },
    slug: "test-product-2",
    quantity: 5,
  },
];

const mockCategories = [
  { _id: "cat1", name: "Category 1", slug: "category-1" },
  { _id: "cat2", name: "Category 2", slug: "category-2" },
];

describe("HomePage Component", () => {
  // Setup default mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cart state and setter
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Mock successful API responses
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { success: true, total: 4 } }); // Total of 4 products (2 shown, 2 more available)
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: { success: true, products: mockProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  // Test Case 1: Loading and displaying products
  test("loads and displays products correctly", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Verify that products are loaded and displayed
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();

    // Verify price formatting
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("$149.99")).toBeInTheDocument();

    // Verify product description is truncated
    expect(
      screen.getByText("Description for product 1...")
    ).toBeInTheDocument();
  });

  // Test Case 2: Category filter functionality
  test("filters products by category correctly", async () => {
    // Mock the filter API call
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        products: [mockProducts[0]], // Only return the first product for the filtered result
      },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Get the first category checkbox
    const categoryCheckbox = screen
      .getByText("Category 1")
      .closest("label")
      .querySelector("input");

    // Check the checkbox
    await act(async () => {
      fireEvent.click(categoryCheckbox);
    });

    // Verify filter API is called with correct parameters
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: ["cat1"],
      radio: [],
    });

    // After filtering, only product 1 should be visible
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    });
  });

  // Test Case 3: Price range filter
  test("filters products by price range correctly", async () => {
    // Mock the filter API call with product filtered by price
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        products: [mockProducts[0]], // Only first product matches the price filter
      },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Find first price range radio button
    const priceRadio = screen.getAllByRole("radio")[0];

    // Select the price range
    await act(async () => {
      fireEvent.click(priceRadio);
    });

    // Verify filter API is called with correct price range
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: [],
          radio: [0, 19],
        }
      );
    });

    // After filtering, only product 1 should be visible
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    });
  });

  // Test Case 4: Adding products to cart
  test("adds products to cart correctly", async () => {
    const mockCart = [];
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([mockCart, mockSetCart]);

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Find the first "ADD TO CART" button and click it
    const addToCartButtons = screen.getAllByText("ADD TO CART");
    await act(async () => {
      fireEvent.click(addToCartButtons[0]);
    });

    // Verify product was added to cart
    expect(mockSetCart).toHaveBeenCalledWith([mockProducts[0]]);

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockProducts[0]])
    );

    // Verify toast notification was shown
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  // Test Case 5: Load more functionality
  test("loads more products when clicking load more button", async () => {
    // Additional products to load on load more click
    const additionalProducts = [
      {
        _id: "prod3",
        name: "Test Product 3",
        description: "Description for product 3",
        price: 199.99,
        category: { _id: "cat1", name: "Category 1" },
        slug: "test-product-3",
        quantity: 8,
      },
      {
        _id: "prod4",
        name: "Test Product 4",
        description: "Description for product 4",
        price: 249.99,
        category: { _id: "cat2", name: "Category 2" },
        slug: "test-product-4",
        quantity: 3,
      },
    ];

    // Set up proper mock sequencing for the API calls
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { success: true, total: 4 } });
      } else if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({
          data: { success: true, products: mockProducts },
        });
      } else if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.resolve({
          data: { success: true, products: additionalProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Wait for initial products to be displayed
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });

    // Find and click the load more button
    const loadMoreButton = screen.getByText(/Loadmore/i).closest("button");

    // Make the loading state visible temporarily during the load more action
    axios.get.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        // Simulate a brief delay to show loading state
        setTimeout(() => {
          resolve({ data: { success: true, products: additionalProducts } });
        }, 100);
      });
    });

    await act(async () => {
      fireEvent.click(loadMoreButton);
    });

    // Verify loading state is shown
    expect(screen.getByText("Loading ...")).toBeInTheDocument();

    // Wait for additional products to be loaded
    await waitFor(
      () => {
        expect(screen.getByText("Test Product 3")).toBeInTheDocument();
        expect(screen.getByText("Test Product 4")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  // Test Case 6: Error handling during product loading
  test("handles API errors gracefully", async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    console.error = jest.fn(); // Suppress console errors

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Verify component doesn't crash and still shows the main structure
    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  // Test Case 7: Reset filters functionality
  test("resets filters when clicking reset button", async () => {
    // Mock window.location.reload
    const originalLocation = window.location;
    delete window.location;
    window.location = { reload: jest.fn() };

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Find and click the reset filter button
    const resetButton = screen.getByText("RESET FILTERS");
    await act(async () => {
      fireEvent.click(resetButton);
    });

    // Verify page reload is called
    expect(window.location.reload).toHaveBeenCalled();

    // Restore original location
    window.location = originalLocation;
  });

  // Test empty result after filtering
  test("handles empty results after filtering", async () => {
    // Mock empty result when filtering
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        products: [], // No products match the filter
      },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Apply a filter
    const categoryCheckbox = screen
      .getByText("Category 1")
      .closest("label")
      .querySelector("input");
    await act(async () => {
      fireEvent.click(categoryCheckbox);
    });

    // Verify no products are displayed
    await waitFor(() => {
      expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    });
  });

  // Test failure in getAllCategory API call
  test("handles failed category API call", async () => {
    // Reset mocks to test initialization error
    jest.clearAllMocks();

    // Mock category API error
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.reject(new Error("Category API Error"));
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({ data: { success: true, total: 4 } });
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: { success: true, products: mockProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Component should still render products even if categories fail to load
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });
  });

  // Test failure in getTotal API call
  test("handles failed product count API call", async () => {
    // Reset mocks to test initialization error
    jest.clearAllMocks();

    // Mock product count API error
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      } else if (url.includes("/api/v1/product/product-count")) {
        return Promise.reject(new Error("Product count API Error"));
      } else if (url.includes("/api/v1/product/product-list")) {
        return Promise.resolve({
          data: { success: true, products: mockProducts },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Products should still load even if count API fails
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    });

    // Load more button should not appear (since total is 0)
    expect(screen.queryByText(/Loadmore/i)).not.toBeInTheDocument();
  });

  test("removes category filter when unchecking", async () => {
    // 1) First render: default "product-list" API call
    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Verify both products are shown initially
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();

    // 2) Check "Category 1" => mock the filtered API response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        // Only product 1 matches the filter
        products: [mockProducts[0]],
      },
    });
    const categoryCheckbox = screen
      .getByText("Category 1")
      .closest("label")
      .querySelector("input");

    // Check the box
    await act(async () => {
      fireEvent.click(categoryCheckbox);
    });

    // Verify only Product 1 is rendered
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    });

    // 3) Uncheck "Category 1"
    //   The HomePage code checks if `checked` is empty;
    //   if so, it calls getAllProducts() again,
    //   which we already mock for default products.
    //   So we just ensure we see both products again.
    axios.get.mockResolvedValueOnce({
      data: { success: true, products: mockProducts },
    });
    await act(async () => {
      fireEvent.click(categoryCheckbox); // uncheck
    });

    // Wait for all products to return
    await waitFor(() => {
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });
  });

  // Test Case: Price range filter with no matching products
  test("handles empty results when price range filter returns no products", async () => {
    // Mock the filter API call that returns empty products for a price range
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        products: [], // No products match the price filter
      },
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );
    });

    // Find first price range radio button
    const priceRadio = screen.getAllByRole("radio")[0];

    // Select the price range
    await act(async () => {
      fireEvent.click(priceRadio);
    });

    // Verify filter API is called with correct price range
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: [],
          radio: [0, 19], // Assuming first radio option is [0, 19]
        }
      );
    });

    // After filtering, no products should be visible
    await waitFor(() => {
      expect(screen.queryByText("Test Product 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();
    });
  });
});
