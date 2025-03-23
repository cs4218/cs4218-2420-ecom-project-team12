import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import axios from "axios";

// Mock the useCart hook
jest.mock("../context/cart", () => ({
  useCart: () => {
    return [[], jest.fn()]; // Return empty cart array and mock setter function
  },
}));

// Mock axios
jest.mock("axios");

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "test-product" }),
  useNavigate: () => jest.fn(),
}));

// Mock Layout component
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

const mockProduct = {
  _id: "1",
  name: "Test Product",
  description: "Test Description",
  price: 99.99,
  category: { name: "Test Category" },
  slug: "test-product",
};

describe("ProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads and displays product details", async () => {
    // Mock the API calls
    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          products: [],
        },
      });

    await act(async () => {
      render(
        <BrowserRouter>
          <ProductDetails />
        </BrowserRouter>
      );
    });

    // Wait for and verify product details
    await waitFor(() => {
      expect(
        screen.getByText(`Name : ${mockProduct.name}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Description : ${mockProduct.description}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Category : ${mockProduct.category.name}`)
      ).toBeInTheDocument();
      expect(screen.getByText(/\$99.99/)).toBeInTheDocument();
    });

    // Verify API calls
    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/get-product/test-product`
    );
  });

  test("handles API errors gracefully", async () => {
    // Mock API error
    axios.get.mockRejectedValue(new Error("API Error"));

    await act(async () => {
      render(
        <BrowserRouter>
          <ProductDetails />
        </BrowserRouter>
      );
    });

    // Component should still render without crashing
    expect(screen.getByText("Product Details")).toBeInTheDocument();
  });

  test("loads and displays similar products", async () => {
    const similarProducts = [
      {
        _id: "2",
        name: "Similar Product",
        description: "Similar Description",
        price: 89.99,
        slug: "similar-product",
      },
    ];

    // Mock successful API responses
    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          products: similarProducts,
        },
      });

    await act(async () => {
      render(
        <BrowserRouter>
          <ProductDetails />
        </BrowserRouter>
      );
    });

    // Wait for and verify similar products
    await waitFor(() => {
      expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
      expect(screen.getByText("Similar Product")).toBeInTheDocument();
      expect(screen.getByText(/\$89.99/)).toBeInTheDocument();
    });
  });

  test("handles empty similar products", async () => {
    // Mock API responses
    axios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          products: [],
        },
      });

    await act(async () => {
      render(
        <BrowserRouter>
          <ProductDetails />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("No Similar Products found")).toBeInTheDocument();
    });
  });
});
