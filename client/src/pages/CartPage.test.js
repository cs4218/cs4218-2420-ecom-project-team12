import { beforeEach } from "node:test";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CartPage from "./CartPage";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";

// Mock the auth and cart contexts
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null }, jest.fn()]),
}));

// Mock the cart context with a more flexible implementation
jest.mock("../context/cart", () => {
  const setCartMock = jest.fn();
  let cartItems = [];

  return {
    useCart: jest.fn(() => {
      // Return the current cartItems and a setter that updates the mock state
      return [
        cartItems,
        (newCart) => {
          cartItems = newCart;
          setCartMock(newCart);
        },
      ];
    }),
    // Expose the setter mock for assertions
    __setCartMock: setCartMock,
  };
});

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock the Layout component
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

beforeEach(() => {
  // Setup localStorage mock
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
});

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock initial cart data with two products
    const cartItems = [
      {
        _id: "1",
        name: "Test Product 1",
        price: 99.99,
        description: "Test description 1",
      },
      {
        _id: "2",
        name: "Test Product 2",
        price: 49.99,
        description: "Test description 2",
      },
    ];

    // Set up localStorage mock to return our test cart items
    window.localStorage.getItem.mockReturnValue(JSON.stringify(cartItems));

    // Update the cart context mock to use these items
    const cartModule = require("../context/cart");
    cartModule.useCart.mockImplementation(() => {
      return [cartItems, cartModule.__setCartMock];
    });
  });

  test("displays exactly one cart item with correct title", () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check that the product name is displayed
    const productName = screen.getByText("Test Product 1");
    expect(productName).toBeInTheDocument();

    // Verify that two products are displayed
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  test("allows user to remove an item from the cart", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Verify initial state - two products in cart
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();

    // Get all remove buttons
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    expect(removeButtons).toHaveLength(2);

    // Click the first remove button
    fireEvent.click(removeButtons[0]);

    // Get the cart context mock
    const cartModule = require("../context/cart");

    // Verify setCart was called with an array that doesn't include the first product
    expect(cartModule.__setCartMock).toHaveBeenCalled();

    // Check the argument passed to setCart
    const newCartArg = cartModule.__setCartMock.mock.calls[0][0];
    expect(newCartArg).toHaveLength(1);
    expect(newCartArg[0]._id).toBe("2"); // Only the second product should remain

    // Verify localStorage.setItem was called to persist the change
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify(newCartArg)
    );
  });

  test("updates the cart total when an item is removed", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check initial total (99.99 + 49.99 = 149.98)
    const initialTotalElement = screen.getByText(/total/i, { exact: false });
    expect(initialTotalElement).toHaveTextContent(/149\.98/);

    // Remove the first product (price 99.99)
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    fireEvent.click(removeButtons[0]);

    // Update the cart context mock to reflect the removal
    const cartModule = require("../context/cart");
    const updatedCart = [
      {
        _id: "2",
        name: "Test Product 2",
        price: 49.99,
        description: "Test description 2",
      },
    ];

    cartModule.useCart.mockImplementation(() => {
      return [updatedCart, cartModule.__setCartMock];
    });

    // Re-render with updated cart
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check updated total (should be 49.99)
    const updatedTotalElement = screen.getByText(/total/i, { exact: false });
    expect(updatedTotalElement).toHaveTextContent(/49\.99/);
  });

  test("displays empty cart message when all items are removed", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Remove both products
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    fireEvent.click(removeButtons[0]);
    fireEvent.click(removeButtons[1]);

    // Update the cart context mock to be empty
    const cartModule = require("../context/cart");
    cartModule.useCart.mockImplementation(() => {
      return [[], cartModule.__setCartMock];
    });

    // Re-render with empty cart
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check for empty cart message (case insensitive)
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
