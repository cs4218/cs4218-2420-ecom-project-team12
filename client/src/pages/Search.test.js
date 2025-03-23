import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
const axios = require('axios');
import Search from './Search';
import { toast } from 'react-hot-toast';

// Mock axios differently
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock dependencies
jest.mock('react-hot-toast');

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock search context
const mockSetValues = jest.fn();
let mockSearchValues = {
  keyword: '',
  results: []
};

jest.mock('../context/search', () => ({
  useSearch: () => [mockSearchValues, mockSetValues]
}));

// Mock cart context
const mockSetCart = jest.fn();
let mockCart = [];

jest.mock('../context/cart', () => ({
  useCart: () => [mockCart, mockSetCart]
}));

// Mock search results data
const mockSearchResults = [
  {
    _id: '1',
    name: 'Test Product 1',
    description: 'Test Description 1',
    price: 99.99,
    category: { name: 'Test Category' },
    slug: 'test-product-1'
  },
  {
    _id: '2',
    name: 'Test Product 2',
    description: 'Test Description 2',
    price: 149.99,
    category: { name: 'Test Category' },
    slug: 'test-product-2'
  }
];

describe('Search Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockSetCart.mockClear();
    toast.success.mockClear();
    localStorage.clear();
  });

  test('displays search results correctly', async () => {
    // Set up mock search results
    mockSearchValues = {
      keyword: 'test',
      results: mockSearchResults
    };

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    // Verify search results count
    expect(screen.getByText(`Found ${mockSearchResults.length}`)).toBeInTheDocument();

    // Verify product cards are displayed
    mockSearchResults.forEach(product => {
      expect(screen.getByText(product.name)).toBeInTheDocument();
      expect(screen.getByText(`${product.description.substring(0, 30)}...`)).toBeInTheDocument();
      expect(screen.getByText(`$ ${product.price}`)).toBeInTheDocument();
    });
  });

  test('displays "No Products Found" when no results', () => {
    // Set up mock empty results
    mockSearchValues = {
      keyword: 'test',
      results: []
    };

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    expect(screen.getByText('No Products Found')).toBeInTheDocument();
  });

  test('navigates to product details when clicking More Details', async () => {
    mockSearchValues = {
      keyword: 'test',
      results: [mockSearchResults[0]]
    };

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    // Click More Details button
    const moreDetailsBtn = screen.getByText('More Details');
    fireEvent.click(moreDetailsBtn);

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith(`/product/${mockSearchResults[0].slug}`);
  });

  test('adds product to cart when clicking ADD TO CART', async () => {
    mockSearchValues = {
      keyword: 'test',
      results: [mockSearchResults[0]]
    };

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    // Click ADD TO CART button
    const addToCartBtn = screen.getByText('ADD TO CART');
    fireEvent.click(addToCartBtn);

    // Verify cart context was updated
    expect(mockSetCart).toHaveBeenCalledWith([mockSearchResults[0]]);
    
    // Verify localStorage was updated
    const cartInStorage = JSON.parse(localStorage.getItem('cart'));
    expect(cartInStorage).toEqual([mockSearchResults[0]]);
    
    // Verify toast notification
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });

  test('handles multiple products in cart', async () => {
    // Set up existing cart with one product
    mockCart = [mockSearchResults[0]];
    mockSearchValues = {
      keyword: 'test',
      results: [mockSearchResults[1]] // Show different product in search
    };

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    // Click ADD TO CART button for second product
    const addToCartBtn = screen.getByText('ADD TO CART');
    fireEvent.click(addToCartBtn);

    // Verify cart context was updated with both products
    expect(mockSetCart).toHaveBeenCalledWith([mockSearchResults[0], mockSearchResults[1]]);
    
    // Verify localStorage was updated with both products
    const cartInStorage = JSON.parse(localStorage.getItem('cart'));
    expect(cartInStorage).toEqual([mockSearchResults[0], mockSearchResults[1]]);
  });

  test('displays product images correctly', () => {
    mockSearchValues = {
      keyword: 'test',
      results: [mockSearchResults[0]]
    };

    render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );

    // Verify product image
    const productImage = screen.getByAltText(mockSearchResults[0].name);
    expect(productImage).toBeInTheDocument();
    expect(productImage.src).toContain(`/api/v1/product/product-photo/${mockSearchResults[0]._id}`);
  });
});