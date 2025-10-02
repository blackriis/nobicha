import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default variant', () => {
      render(<Card data-testid="card">Test Card</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
    });

    it('renders with outline variant', () => {
      render(<Card variant="outline" data-testid="card">Test Card</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2');
    });

    it('renders with ghost variant', () => {
      render(<Card variant="ghost" data-testid="card">Test Card</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-0', 'shadow-none');
    });

    it('renders with custom className', () => {
      render(<Card className="custom-class" data-testid="card">Test Card</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('renders as child component when asChild is true', () => {
      render(
        <Card asChild>
          <button data-testid="card-button">Test Button</button>
        </Card>
      );
      
      const button = screen.getByTestId('card-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref} data-testid="card">Test Card</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('data-testid', 'card');
    });
  });

  describe('CardHeader', () => {
    it('renders with correct classes', () => {
      render(<CardHeader data-testid="card-header">Test Header</CardHeader>);
      
      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('renders with custom className', () => {
      render(<CardHeader className="custom-header" data-testid="card-header">Test Header</CardHeader>);
      
      const header = screen.getByTestId('card-header');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref} data-testid="card-header">Test Header</CardHeader>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 with correct classes', () => {
      render(<CardTitle data-testid="card-title">Test Title</CardTitle>);
      
      const title = screen.getByTestId('card-title');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });

    it('renders with custom className', () => {
      render(<CardTitle className="custom-title" data-testid="card-title">Test Title</CardTitle>);
      
      const title = screen.getByTestId('card-title');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(<CardTitle ref={ref} data-testid="card-title">Test Title</CardTitle>);
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('renders as p with correct classes', () => {
      render(<CardDescription data-testid="card-description">Test Description</CardDescription>);
      
      const description = screen.getByTestId('card-description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('renders with custom className', () => {
      render(<CardDescription className="custom-description" data-testid="card-description">Test Description</CardDescription>);
      
      const description = screen.getByTestId('card-description');
      expect(description).toHaveClass('custom-description');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref} data-testid="card-description">Test Description</CardDescription>);
      
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('renders with correct classes', () => {
      render(<CardContent data-testid="card-content">Test Content</CardContent>);
      
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('renders with custom className', () => {
      render(<CardContent className="custom-content" data-testid="card-content">Test Content</CardContent>);
      
      const content = screen.getByTestId('card-content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref} data-testid="card-content">Test Content</CardContent>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders with correct classes', () => {
      render(<CardFooter data-testid="card-footer">Test Footer</CardFooter>);
      
      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('renders with custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="card-footer">Test Footer</CardFooter>);
      
      const footer = screen.getByTestId('card-footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref} data-testid="card-footer">Test Footer</CardFooter>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Card Structure', () => {
    it('renders complete card structure correctly', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test Content</p>
          </CardContent>
          <CardFooter>
            <p>Test Footer</p>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('renders card with only required parts', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent>
            <p>Minimal Content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('minimal-card')).toBeInTheDocument();
      expect(screen.getByText('Minimal Content')).toBeInTheDocument();
    });
  });
});
