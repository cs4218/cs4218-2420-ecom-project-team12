import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchProvider, useSearch } from './search';

// Create a test component that uses the search context
const TestComponent = () => {
  const [values, setSearch] = useSearch();
  
  const handleSearch = () => {
    setSearch({ ...values, keyword: 'test-keyword', results: ['test-result'] });
  };
  
  const clearSearch = () => {
    setSearch({ ...values, keyword: '', results: [] });
  };
  
  return (
    <div>
      <div data-testid="keyword">{values.keyword}</div>
      <div data-testid="results-count">{values.results.length}</div>
      {values.results.length > 0 ? (
        <div data-testid="has-results">Has Results</div>
      ) : (
        <div data-testid="no-results">No Results</div>
      )}
      <button data-testid="search-button" onClick={handleSearch}>Search</button>
      <button data-testid="clear-button" onClick={clearSearch}>Clear</button>
    </div>
  );
};

describe('Search Context', () => {
  // Test 1: Initial state
  test('provides initial search state', () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    // Verify initial state
    expect(screen.getByTestId('keyword')).toHaveTextContent('');
    expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });
  
  // Test 2: Update search state
  test('updates search state when setSearch is called', () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    // Click search button to update state
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Verify updated state
    expect(screen.getByTestId('keyword')).toHaveTextContent('test-keyword');
    expect(screen.getByTestId('results-count')).toHaveTextContent('1');
    expect(screen.getByTestId('has-results')).toBeInTheDocument();
  });
  
  // Test 3: Clear search state
  test('clears search state when clear is called', () => {
    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    // First set search state
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Verify search state is set
    expect(screen.getByTestId('keyword')).toHaveTextContent('test-keyword');
    
    // Clear search state
    fireEvent.click(screen.getByTestId('clear-button'));
    
    // Verify state is cleared
    expect(screen.getByTestId('keyword')).toHaveTextContent('');
    expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });
  
  // Test 4: Multiple components share the same state
  test('shares state between multiple components', () => {
    render(
      <SearchProvider>
        <div>
          <TestComponent data-testid="component-1" />
          <TestComponent data-testid="component-2" />
        </div>
      </SearchProvider>
    );
    
    // Get all search buttons
    const searchButtons = screen.getAllByTestId('search-button');
    
    // Click the first component's search button
    fireEvent.click(searchButtons[0]);
    
    // Verify both components show the updated state
    const keywords = screen.getAllByTestId('keyword');
    const resultsCounts = screen.getAllByTestId('results-count');
    
    expect(keywords[0]).toHaveTextContent('test-keyword');
    expect(keywords[1]).toHaveTextContent('test-keyword');
    expect(resultsCounts[0]).toHaveTextContent('1');
    expect(resultsCounts[1]).toHaveTextContent('1');
  });
  
  // Test 5: Context throws error when used outside provider
  test('throws error when useSearch is used outside of SearchProvider', () => {
    // Suppress error output for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    // Expect render to throw an error
    expect(() => {
      render(<TestComponent />);
    }).toThrow();
    
    // Restore console.error
    console.error = originalError;
  });
  
  // Test 6: Context persists state between renders
  test('persists state between renders', () => {
    const { rerender } = render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    // Update search state
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Verify state is updated
    expect(screen.getByTestId('keyword')).toHaveTextContent('test-keyword');
    
    // Rerender the component
    rerender(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );
    
    // Verify state persists after rerender
    expect(screen.getByTestId('keyword')).toHaveTextContent('test-keyword');
    expect(screen.getByTestId('results-count')).toHaveTextContent('1');
  });
});
