import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Jumbotron } from './Jumbotron';

describe('Jumbotron Component', () => {
  it('renders correctly', () => {
    render(<Jumbotron />);
    expect(screen.getByText(/Jumbotron carrusel de productos/i)).toBeInTheDocument();
  });
});
