import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../../components/ui/Input';

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should render with different types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input value="initial" onChange={handleChange} placeholder="Test" />);
    
    const input = screen.getByPlaceholderText('Test');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        placeholder="Test" 
      />
    );
    
    const input = screen.getByPlaceholderText('Test');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled" />);
    
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
  });

  it('should render with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(
      <Input 
        error="This field is required" 
        placeholder="Test" 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Input className="custom-class" placeholder="Test" />);
    
    const input = screen.getByPlaceholderText('Test');
    expect(input).toHaveClass('custom-class');
  });

  it('should handle keyboard events', () => {
    const handleKeyDown = vi.fn();
    render(<Input onKeyDown={handleKeyDown} placeholder="Test" />);
    
    const input = screen.getByPlaceholderText('Test');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('should be required when required prop is true', () => {
    render(<Input required placeholder="Required" />);
    
    const input = screen.getByPlaceholderText('Required');
    expect(input).toHaveAttribute('required');
  });

  it('should have correct id and name attributes', () => {
    render(<Input id="test-input" name="testName" placeholder="Test" />);
    
    const input = screen.getByPlaceholderText('Test');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'testName');
  });
}); 