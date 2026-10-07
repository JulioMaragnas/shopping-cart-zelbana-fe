import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SearchBar Component', () => {
  it('renders correctly with placeholder', () => {
    render(<SearchBar onSearch={() => {}} />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText(/Buscar productos, marcas/i)).toBeInTheDocument();
  });

  it('fetches suggestions when typing and displays the dropdown', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={() => {}} />, { wrapper: createWrapper() });
    
    const input = screen.getByPlaceholderText(/Buscar/i);
    await user.type(input, 'jeep');

    // Wait for the fast debounce (150ms) + msw mock (100ms) = ~250ms
    await waitFor(() => {
      expect(screen.getByText(/wrangler/i)).toBeInTheDocument();
    });
  });

  it('highlights the matched string vs suggested string correctly (bold)', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={() => {}} />, { wrapper: createWrapper() });
    
    const input = screen.getByPlaceholderText(/Buscar/i);
    await user.type(input, 'jeep');

    await waitFor(() => {
      const boldPart = screen.getByText(/wrangler/i);
      expect(boldPart.tagName.toLowerCase()).toBe('strong');
    });
  });

  it('allows keyboard navigation through the suggestions', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={() => {}} />, { wrapper: createWrapper() });
    
    const input = screen.getByPlaceholderText(/Buscar/i);
    await user.type(input, 'jeep');

    await waitFor(() => {
      expect(screen.getByText(/wrangler/i)).toBeInTheDocument();
    });

    // Press ArrowDown to select first item
    await user.keyboard('{ArrowDown}');
    const firstItem = screen.getByTestId('suggestion-item-0');
    expect(firstItem).toHaveAttribute('data-active', 'true');

    // Press ArrowDown again to select second item
    await user.keyboard('{ArrowDown}');
    const secondItem = screen.getByTestId('suggestion-item-1');
    expect(secondItem).toHaveAttribute('data-active', 'true');
    expect(firstItem).toHaveAttribute('data-active', 'false');
    
    // Press Enter to select the active item
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />, { wrapper: createWrapper() });
  });

  it('TC-PLP-2.1.5: synchronizes input value with initialQuery prop and clears when initialQuery becomes empty', () => {
    const Wrapper = createWrapper();
    const { rerender } = render(
      <Wrapper>
        <SearchBar onSearch={() => {}} initialQuery="romero" />
      </Wrapper>
    );

    const input = screen.getByPlaceholderText(/Buscar productos, marcas/i) as HTMLInputElement;
    expect(input.value).toBe('romero');

    rerender(
      <Wrapper>
        <SearchBar onSearch={() => {}} initialQuery="" />
      </Wrapper>
    );

    expect(input.value).toBe('');
  });
});
