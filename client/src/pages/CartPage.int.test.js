import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CartPage from "./CartPage";
import { CartProvider } from "../context/cart";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock Braintree drop-in component
jest.mock("braintree-web-drop-in-react", () => {
  return {
    __esModule: true,
    default: function MockDropIn(props) {
      return (
        <div data-testid="mock-drop-in">
          <button
            data-testid="set-instance-button"
            onClick={() =>
              props.onInstance({
                requestPaymentMethod: () =>
                  Promise.resolve({ nonce: "fake-nonce" }),
              })
            }
          >
            Set Instance
          </button>
        </div>
      );
    },
  };
});

// Mock SearchInput component to avoid hooks issues
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

describe("CartPage Integration Tests - Cart Functionality", () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    mockNavigate.mockClear();

    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/braintree/token")) {
        return Promise.resolve({
          data: { clientToken: "fake-client-token" },
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    axios.post.mockImplementation((url) => {
      if (url.includes("/api/v1/product/braintree/payment")) {
        return Promise.resolve({
          data: { success: true },
        });
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  test("should remove product from cart when 'Remove' button is clicked", async () => {
    // Setup cart with two products
    const initialCart = [
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
    ];
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "cart") {
        return JSON.stringify(initialCart);
      }
      return null;
    });

    // Render CartPage - use await to handle initial async rendering
    await waitFor(() => {
      renderWithProviders(<CartPage />);
    });

    // Wait for elements to be available after initial rendering
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });

    // Verify initial total price (should be $300)
    await waitFor(() => {
      expect(screen.getByText(/Total : \$300\.00/)).toBeInTheDocument();
    });

    // Find and click the first 'Remove' button (for Product 1)
    const removeButtons = await waitFor(() => screen.getAllByText("Remove"));
    await waitFor(() => {
      fireEvent.click(removeButtons[0]);
    });

    // Verify product was removed from UI
    await waitFor(() => {
      expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });

    // Verify localStorage was updated
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    // Get the updated cart data
    const storedCartData = localStorageMock.setItem.mock.calls[0][1];
    const parsedCartData = JSON.parse(storedCartData);

    // Verify the cart contains only Product 2
    expect(parsedCartData).toHaveLength(1);
    expect(parsedCartData[0]._id).toBe("p2");
    expect(parsedCartData[0].name).toBe("Product 2");

    // Verify updated total price (should be $200)
    await waitFor(() => {
      expect(screen.getByText(/Total : \$200\.00/)).toBeInTheDocument();
    });
  });

  test("should clear cart and navigate to orders page after successful payment", async () => {
    // Setup cart with one product and mock auth user
    const initialCart = [
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
        return JSON.stringify(initialCart);
      }
      if (key === "auth") {
        return JSON.stringify({
          user: { name: "Test User", address: "123 Test St" },
          token: "test-token",
        });
      }
      return null;
    });

    // Render CartPage
    await waitFor(() => {
      renderWithProviders(<CartPage />);
    });

    // Verify initial state
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    // Set up payment instance
    const setInstanceButton = await waitFor(() =>
      screen.findByTestId("set-instance-button")
    );

    await waitFor(() => {
      fireEvent.click(setInstanceButton);
    });

    // Find and click payment button
    const paymentButton = await waitFor(() => screen.getByText("Make Payment"));

    await waitFor(() => {
      fireEvent.click(paymentButton);
    });

    // Wait for payment to process
    await waitFor(() => {
      // Verify localStorage.removeItem was called to clear the cart
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("cart");

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith(
        "Payment Completed Successfully "
      );

      // Verify navigation to orders page
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
    });
  });
});
