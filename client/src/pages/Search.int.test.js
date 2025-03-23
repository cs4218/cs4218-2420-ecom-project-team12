import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SearchInput from '../components/Form/SearchInput';
import Search from './Search';
import { SearchProvider } from '../context/search';

// Mock modules
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ search: '?keyword=test' }),
  useNavigate: () => mockNavigate
}));

// Mock Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  create: jest.fn()
}));

// Mock search context with proper initial state
const mockSetValues = jest.fn();
const mockSearchContext = {
  keyword: '',
  results: []
};

jest.mock('../context/search', () => ({
  SearchProvider: ({ children }) => children,
  useSearch: () => [mockSearchContext, mockSetValues]
}));

// Mock cart context
const mockSetCart = jest.fn();
let mockCart = [];

jest.mock('../context/cart', () => ({
  useCart: () => [mockCart, mockSetCart]
}));

// Simple mock for toast - don't try to mock the internal implementation
jest.mock('react-hot-toast', () => ({
  // Just return a dummy function that does nothing
  toast: { success: jest.fn() },
  success: jest.fn(),
  error: jest.fn()
}));

describe('Search Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock contexts
    mockSearchContext.keyword = '';
    mockSearchContext.results = [];
    mockCart = [];
    // Clear localStorage
    localStorage.clear();
  });

  test('integrates search input with results display', async () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Test Product', 
        price: 99.99,
        description: 'This is a test product description',
        slug: 'test-product'
      },
      { 
        _id: '2', 
        name: 'Another Product', 
        price: 149.99,
        description: 'This is another test product description',
        slug: 'another-product'
      }
    ];

    // Update mock context with results
    mockSearchContext.results = mockResults;
    mockSearchContext.keyword = 'test';

    render(
      <BrowserRouter>
        <SearchProvider>
          <SearchInput />
          <Search />
        </SearchProvider>
      </BrowserRouter>
    );

    // Get search input and perform search
    const searchInput = screen.getByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.submit(searchInput.closest('form'));
    });

    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
    });
  });

  test('handles empty search results', async () => {
    // Set empty results in mock context
    mockSearchContext.results = [];
    mockSearchContext.keyword = 'nonexistent';

    render(
      <BrowserRouter>
        <SearchProvider>
          <SearchInput />
          <Search />
        </SearchProvider>
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      fireEvent.submit(searchInput.closest('form'));
    });

    await waitFor(() => {
      expect(screen.getByText(/No Products Found/i)).toBeInTheDocument();
    });
  });

  test('navigates to product details when clicking More Details button', async () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Test Product', 
        price: 99.99,
        description: 'This is a test product description',
        slug: 'test-product'
      }
    ];

    mockSearchContext.results = mockResults;
    mockSearchContext.keyword = 'test';

    render(
      <BrowserRouter>
        <SearchProvider>
          <Search />
        </SearchProvider>
      </BrowserRouter>
    );

    // Find and click More Details button
    const moreDetailsButton = screen.getByText('More Details');
    fireEvent.click(moreDetailsButton);

    // Verify navigation to product details page
    expect(mockNavigate).toHaveBeenCalledWith('/product/test-product');
  });

  test('has ADD TO CART buttons rendered correctly', async () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Test Product', 
        price: 99.99,
        description: 'This is a test product description',
        slug: 'test-product'
      }
    ];

    mockSearchContext.results = mockResults;
    mockSearchContext.keyword = 'test';

    render(
      <BrowserRouter>
        <SearchProvider>
          <Search />
        </SearchProvider>
      </BrowserRouter>
    );

    // Verify ADD TO CART button is rendered
    const addToCartButton = screen.getByText('ADD TO CART');
    expect(addToCartButton).toBeInTheDocument();
    expect(addToCartButton).toHaveClass('btn-dark');
  });

  test('displays product images correctly', async () => {
    const mockResults = [
      { 
        _id: '1', 
        name: 'Test Product', 
        price: 99.99,
        description: 'This is a test product description',
        slug: 'test-product'
      }
    ];

    mockSearchContext.results = mockResults;
    mockSearchContext.keyword = 'test';

    render(
      <BrowserRouter>
        <SearchProvider>
          <Search />
        </SearchProvider>
      </BrowserRouter>
    );

    // Verify product image
    const productImage = screen.getByAltText('Test Product');
    expect(productImage).toBeInTheDocument();
    expect(productImage.src).toContain('/api/v1/product/product-photo/1');
  });
}); 