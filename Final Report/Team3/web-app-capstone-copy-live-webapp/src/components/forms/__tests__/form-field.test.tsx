import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormField } from '../form-field';

describe('FormField', () => {
  it('renders input with label', () => {
    render(<FormField label="Test Label" name="test" />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders without label when not provided', () => {
    render(<FormField name="test" placeholder="Test placeholder" />);
    
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('displays required asterisk when required prop is true', () => {
    render(<FormField label="Required Field" name="test" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-red-500');
  });

  it('displays error message when error prop is provided', () => {
    render(<FormField label="Test Field" name="test" error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    // Check that the error message container has the correct styling
    const errorElement = screen.getByText('This field is required').closest('div');
    expect(errorElement).toHaveClass('text-red-600');
  });

  it('displays helper text when provided and no error', () => {
    render(<FormField label="Test Field" name="test" helperText="This is helper text" />);
    
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
    expect(screen.getByText('This is helper text')).toHaveClass('text-muted-foreground');
  });

  it('does not display helper text when error is present', () => {
    render(
      <FormField 
        label="Test Field" 
        name="test" 
        error="Error message" 
        helperText="Helper text" 
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('applies error styling to input when error is present', () => {
    render(<FormField label="Test Field" name="test" error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets proper accessibility attributes', () => {
    render(<FormField label="Test Field" name="test" error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'test-error');
  });

  it('sets aria-describedby for helper text', () => {
    render(<FormField label="Test Field" name="test" helperText="Helper text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-helper');
  });

  it('uses id prop for field identification', () => {
    render(<FormField label="Test Field" id="custom-id" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Field');
    
    expect(input).toHaveAttribute('id', 'custom-id');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('falls back to name prop for field identification', () => {
    render(<FormField label="Test Field" name="test-name" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Test Field');
    
    expect(input).toHaveAttribute('id', 'test-name');
    expect(label).toHaveAttribute('for', 'test-name');
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <FormField label="Test Field" name="test" containerClassName="custom-container" />
    );
    
    expect(container.firstChild).toHaveClass('custom-container');
  });

  it('applies custom className to input', () => {
    render(<FormField label="Test Field" name="test" className="custom-input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('forwards all input props', () => {
    const onChange = vi.fn();
    render(
      <FormField 
        label="Test Field" 
        name="test" 
        placeholder="Enter text"
        disabled
        onChange={onChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toBeDisabled();
    
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('supports different input types', () => {
    render(<FormField label="Email Field" name="email" type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('handles ref forwarding', () => {
    const ref = vi.fn();
    render(<FormField label="Test Field" name="test" ref={ref} />);
    
    expect(ref).toHaveBeenCalled();
  });
});