import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ProductDetails from './ProductDetails';

// Mock useCart hook - following the pattern from CartPage.test.js
const mockSetCart = jest.fn();
let mockCartItems = [];
jest.mock("../context/cart", () => ({
  useCart: () => [mockCartItems, mockSetCart]
}));

// Mock modules
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ slug: 'main-product' }),
  useNavigate: () => mockNavigate
}));

// Mock Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock axios with proper structure
jest.mock('axios', () => ({
  get: jest.fn(),
  create: jest.fn()
}));

const axios = require('axios');

describe('Product Details Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCartItems = []; // Reset cart items before each test
  });

  test('integrates product details with related products', async () => {
    const mockProduct = {
      _id: '1',
      name: 'Main Product',
      description: 'Test Description',
      price: 99.99,
      category: { 
        _id: 'cat1',
        name: 'Electronics' 
      },
      slug: 'main-product',
      quantity: 10
    };

    const mockRelatedProducts = [
      {
        _id: '2',
        name: 'Related Product 1',
        price: 89.99,
        category: { name: 'Electronics' },
        slug: 'related-product-1',
        description: 'Related product 1 description',
        quantity: 5
      },
      {
        _id: '3',
        name: 'Related Product 2',
        price: 79.99,
        category: { name: 'Electronics' },
        slug: 'related-product-2',
        description: 'Related product 2 description',
        quantity: 8
      }
    ];

    // Mock API responses
    axios.get
      .mockResolvedValueOnce({ 
        data: { success: true, product: mockProduct }
      })
      .mockResolvedValueOnce({ 
        data: { success: true, products: mockRelatedProducts }
      });

    render(
      <BrowserRouter>
        <ProductDetails />
      </BrowserRouter>
    );

    // Updated assertions to be more flexible
    await waitFor(() => {
      // Check for product details using partial matches
      expect(screen.getByText(/Main Product/)).toBeInTheDocument();
      expect(screen.getByText(/Test Description/)).toBeInTheDocument();
      expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
      expect(screen.getByText(/Electronics/)).toBeInTheDocument();
    });

    // Verify related products section
    await waitFor(() => {
      expect(screen.getByText('Similar Products ➡️')).toBeInTheDocument();
      expect(screen.getByText('Related Product 1')).toBeInTheDocument();
      expect(screen.getByText('Related Product 2')).toBeInTheDocument();
      expect(screen.getByText('$89.99')).toBeInTheDocument();
      expect(screen.getByText('$79.99')).toBeInTheDocument();
    });

    // Verify API calls with correct endpoints
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, '/api/v1/product/get-product/main-product');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/api/v1/product/related-product/1/cat1');
  });

  test('handles missing related products gracefully', async () => {
    const mockProduct = {
      _id: '1',
      name: 'Unique Product',
      description: 'No related items',
      price: 149.99,
      category: { name: 'Unique Category' },
      slug: 'unique-product',
      quantity: 1
    };

    axios.get
      .mockResolvedValueOnce({ 
        data: { success: true, product: mockProduct }
      })
      .mockResolvedValueOnce({ 
        data: { success: true, products: [] }
      });

    await act(async () => {
      render(
        <BrowserRouter>
          <ProductDetails />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('No Similar Products found')).toBeInTheDocument();
    });
  });
}); 