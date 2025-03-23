import React from 'react';
import { render, waitFor, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import CategoryProduct from './CategoryProduct';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ slug: 'electronics' }),
  useNavigate: () => jest.fn()
}));

// Mock Layout component
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

// Simple axios mock
const mockGet = jest.fn();
jest.mock('axios', () => ({
  get: (...args) => mockGet(...args)
}));

describe('Category Navigation Integration', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  test('renders category component', async () => {
    // Mock API responses
    mockGet
      .mockResolvedValueOnce({ 
        data: { 
          success: true,
          category: {
            _id: 'cat1',
            name: 'Electronics',
            slug: 'electronics'
          }
        }
      })
      .mockResolvedValueOnce({ 
        data: { 
          success: true,
          products: []
        }
      });

    let container;
    
    // Use act to handle state updates
    await act(async () => {
      const renderResult = render(
        <BrowserRouter>
          <CategoryProduct />
        </BrowserRouter>
      );
      container = renderResult.container;
    });

    // Very basic test - just check that the component renders
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  test('renders with empty results', async () => {
    // Mock API responses
    mockGet
      .mockResolvedValueOnce({ 
        data: { 
          success: true,
          category: {
            _id: 'cat2',
            name: 'Empty Category',
            slug: 'empty'
          }
        }
      })
      .mockResolvedValueOnce({ 
        data: { 
          success: true,
          products: []
        }
      });

    let container;
    
    // Use act to handle state updates
    await act(async () => {
      const renderResult = render(
        <BrowserRouter>
          <CategoryProduct />
        </BrowserRouter>
      );
      container = renderResult.container;
    });

    // Very basic test - just check that the component renders
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  test('integrates category selection with product filtering', async () => {
    mockGet
      .mockResolvedValueOnce({ 
        data: { 
          success: true,
          category: {
            _id: 'cat1',
            name: 'Electronics',
            slug: 'electronics'
          }
        }
      })
      .mockResolvedValueOnce({ 
        data: { 
          success: true,
          products: [
            {
              _id: 'prod1',
              name: 'Laptop',
              price: 999.99,
              category: { name: 'Electronics' }
            }
          ]
        }
      });

    await act(async () => {
      render(
        <BrowserRouter>
          <CategoryProduct />
        </BrowserRouter>
      );
    });

    // Verify category and filtered products integration
    await waitFor(() => {
      expect(screen.getByText(/Electronics/i)).toBeInTheDocument();
      expect(screen.getByText(/Laptop/i)).toBeInTheDocument();
      expect(screen.getByText(/\$999\.99/i)).toBeInTheDocument();
    });
  });
}); 