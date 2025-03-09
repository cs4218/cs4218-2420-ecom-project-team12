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
import axios from "axios";
import { success as toastSuccess } from "react-hot-toast";

// Mock the auth context
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null }, jest.fn()]),
}));
import { useAuth } from "../context/auth";

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

// Mock braintree-web-drop-in-react
jest.mock("braintree-web-drop-in-react", () => ({
  __esModule: true,
  default: function BraintreeDropIn(props) {
    // Call onInstance with a mock that resolves a fake nonce
    setTimeout(() => {
      props.onInstance({
        requestPaymentMethod: jest.fn(() =>
          Promise.resolve({ nonce: "fake-nonce" })
        ),
      });
    }, 0);
    return <div data-testid="braintree-dropin">Braintree DropIn</div>;
  },
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock navigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

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
  // Reset mockSetCart to be a plain mock without implementation
  mockSetCart.mockImplementation(() => {});

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

    // Wait for token fetch
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

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

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

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

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

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
    const { unmount } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Check initial total price (99.99 + 49.99 = 149.98)
    const initialTotalElement = screen.getByText(/Total : \$/);
    expect(initialTotalElement).toHaveTextContent("$149.98");

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

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Check that the total has been updated to only include the remaining item
    const updatedTotalElement = screen.getByText(/Total : \$/);
    expect(updatedTotalElement).toHaveTextContent("$49.99");
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

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

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

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    const totalElement = screen.getByText(/Total : \$/);
    expect(totalElement).toHaveTextContent("$149.98");
  });

  test("displays empty cart message when cart is empty", async () => {
    // Set the mock cart to empty
    mockCartItems = [];

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Check for empty cart message
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  test("payment button is disabled when user has no address", async () => {
    // Mock auth user without address
    useAuth.mockReturnValue([
      { user: { name: "Test User" }, token: "test-token" },
      jest.fn(),
    ]);

    // Mock the API response to provide a client token
    axios.get.mockResolvedValueOnce({
      data: { clientToken: "fake-client-token" },
    });

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Wait for the token fetch and clientToken state update
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Now wait for the Braintree dropin to be visible
    const dropinContainer = await waitFor(() =>
      screen.getByTestId("braintree-dropin")
    );
    expect(dropinContainer).toBeInTheDocument();

    // Now check the payment button is disabled
    const paymentButton = screen.getByRole("button", { name: /Make Payment/i });
    expect(paymentButton).toBeDisabled();
  });

  test("completes checkout process successfully", async () => {
    // Mock auth user with address
    useAuth.mockReturnValue([
      {
        user: { name: "Test User", address: "123 Test St" },
        token: "test-token",
      },
      jest.fn(),
    ]);

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Wait for button to be enabled (braintree instance to be set)
    const paymentButton = await waitFor(() => {
      const button = screen.getByRole("button", { name: /Make Payment/i });
      expect(button).not.toBeDisabled();
      return button;
    });

    // Click payment button
    fireEvent.click(paymentButton);

    // Verify API was called with correct parameters
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        {
          nonce: "fake-nonce",
          cart: mockCartItems,
        }
      );
    });

    // Verify cart was cleared
    expect(mockSetCart).toHaveBeenCalledWith([]);

    // Verify localStorage was cleared
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("cart");

    // Verify navigation to orders page
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");

    // Verify success toast was shown
    expect(require("react-hot-toast").success).toHaveBeenCalledWith(
      "Payment Completed Successfully "
    );
  });

  test("shows loading state during payment processing", async () => {
    // Mock auth user with address
    useAuth.mockReturnValue([
      {
        user: { name: "Test User", address: "123 Test St" },
        token: "test-token",
      },
      jest.fn(),
    ]);

    // Delay the axios.post response to test loading state
    axios.post.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ data: {} }), 100);
      });
    });

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Wait for button to be enabled
    const paymentButton = await waitFor(() => {
      const button = screen.getByRole("button", { name: /Make Payment/i });
      expect(button).not.toBeDisabled();
      return button;
    });

    // Click payment button
    fireEvent.click(paymentButton);

    // Verify button shows loading state
    expect(screen.getByText("Processing ....")).toBeInTheDocument();
  });

  test("handles payment errors gracefully", async () => {
    // Mock auth user with address
    useAuth.mockReturnValue([
      {
        user: { name: "Test User", address: "123 Test St" },
        token: "test-token",
      },
      jest.fn(),
    ]);

    // Mock API to return an error
    axios.post.mockRejectedValueOnce(new Error("Payment failed"));

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Wait for button to be enabled
    const paymentButton = await waitFor(() => {
      const button = screen.getByRole("button", { name: /Make Payment/i });
      expect(button).not.toBeDisabled();
      return button;
    });

    // Click payment button
    fireEvent.click(paymentButton);

    // Wait for error handling
    await waitFor(() => {
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      // Verify loading state is reset
      expect(screen.getByText("Make Payment")).toBeInTheDocument();
    });

    // Clean up spy
    consoleSpy.mockRestore();
  });
});
