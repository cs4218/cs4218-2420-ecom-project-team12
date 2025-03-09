import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import CartPage from "./CartPage";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

// Mock the auth context
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null }, jest.fn()]),
}));

// Create a mock cart context with a proper implementation
const mockSetCart = jest.fn();
let mockCartItems = [
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

// Mock the cart context
jest.mock("../context/cart", () => ({
  useCart: () => {
    return [mockCartItems, mockSetCart];
  },
}));

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { clientToken: "fake-token" } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Mock the Layout component
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// Setup localStorage mock
beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });

  // Reset mocks
  jest.clearAllMocks();
  mockSetCart.mockClear();

  // Reset cart items before each test
  mockCartItems = [
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
});

// Clean up after each test
afterEach(cleanup);

describe("CartPage", () => {
  test("displays cart items with correct titles", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check for product names
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();

    // Verify that two products are displayed by checking for Remove buttons
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  test("allows user to remove an item from the cart", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Get all remove buttons
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    expect(removeButtons).toHaveLength(2);

    // Click the first remove button
    fireEvent.click(removeButtons[0]);

    // Verify setCart was called
    expect(mockSetCart).toHaveBeenCalled();

    // Get the argument passed to setCart
    const newCart = mockSetCart.mock.calls[0][0];
    expect(newCart).toHaveLength(1);
    expect(newCart[0]._id).toBe("2"); // Only the second product should remain
  });

  test("removes the correct item when multiple items exist", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Verify both products are initially displayed
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product 2")).toBeInTheDocument();

    // Get all remove buttons
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });

    // Click the second remove button
    fireEvent.click(removeButtons[1]);

    // Check that setCart was called with the correct cart (only first item remaining)
    expect(mockSetCart).toHaveBeenCalled();

    // Extract the argument passed to setCart
    const newCart = mockSetCart.mock.calls[0][0];
    expect(newCart).toHaveLength(1);
    expect(newCart[0]._id).toBe("1"); // Only the first product should remain
  });

  test("updates the total price when an item is removed", async () => {
    // Render with initial cart items
    const { unmount } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check initial total price (99.99 + 49.99 = 149.98)
    const initialTotalElement = screen.getByText(/Total : \$/);
    expect(initialTotalElement.textContent).toContain("$149.98");

    // Unmount the component
    unmount();

    // Update mockCartItems to simulate the state after removing an item
    mockCartItems = [
      {
        _id: "2",
        name: "Test Product 2",
        price: 49.99,
        description: "Test description 2",
      },
    ];

    // Re-render with the updated cart
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check that the total has been updated to only include the remaining item
    const updatedTotalElement = screen.getByText(/Total : \$/);
    expect(updatedTotalElement.textContent).toContain("$49.99");
  });

  test("removes all items when the last item is removed", async () => {
    // Set up a cart with only one item
    mockCartItems = [
      {
        _id: "1",
        name: "Test Product 1",
        price: 99.99,
        description: "Test description 1",
      },
    ];

    // Update the mockSetCart implementation to actually update mockCartItems
    mockSetCart.mockImplementation((newCart) => {
      mockCartItems = newCart;
    });

    const { rerender } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Verify only one product is displayed
    expect(screen.getByText("Test Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Product 2")).not.toBeInTheDocument();

    // Remove the only item
    const removeButton = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeButton);

    // Verify setCart was called with an empty array
    expect(mockSetCart).toHaveBeenCalledWith([]);

    // Force a re-render with the updated mockCartItems
    rerender(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check for empty cart message
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  test("displays the correct total price", async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Find the total element by its more specific text
    const totalElement = screen.getByText(/Total : \$/);
    expect(totalElement.textContent).toContain("$149.98");
  });

  test("displays empty cart message when cart is empty", async () => {
    // Set the mock cart to empty
    mockCartItems = [];

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Check for empty cart message
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });
});
