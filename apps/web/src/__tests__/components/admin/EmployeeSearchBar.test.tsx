import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EmployeeSearchBar } from '@/components/admin/EmployeeSearchBar'

describe('EmployeeSearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input correctly', () => {
    render(<EmployeeSearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('ค้นหาพนักงาน...')
    expect(input).toBeInTheDocument()
  })

  it('should display current value', () => {
    render(<EmployeeSearchBar {...defaultProps} value="test search" />)

    const input = screen.getByDisplayValue('test search')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange with debounced value', async () => {
    const onChange = vi.fn()
    render(<EmployeeSearchBar {...defaultProps} onChange={onChange} />)

    const input = screen.getByPlaceholderText('ค้นหาพนักงาน...')
    
    fireEvent.change(input, { target: { value: 'john' } })

    // Wait for debounce (300ms)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('john')
    }, { timeout: 400 })
  })

  it('should debounce multiple rapid changes', async () => {
    const onChange = vi.fn()
    render(<EmployeeSearchBar {...defaultProps} onChange={onChange} />)

    const input = screen.getByPlaceholderText('ค้นหาพนักงาน...')
    
    fireEvent.change(input, { target: { value: 'j' } })
    fireEvent.change(input, { target: { value: 'jo' } })
    fireEvent.change(input, { target: { value: 'joh' } })
    fireEvent.change(input, { target: { value: 'john' } })

    // Wait for debounce
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith('john')
    }, { timeout: 400 })
  })

  it('should show clear button when value is not empty', () => {
    render(<EmployeeSearchBar {...defaultProps} value="test" />)

    const clearButton = screen.getByRole('button')
    expect(clearButton).toBeInTheDocument()
  })

  it('should not show clear button when value is empty', () => {
    render(<EmployeeSearchBar {...defaultProps} value="" />)

    const clearButton = screen.queryByRole('button')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should call onChange with empty string when clear button is clicked', () => {
    const onChange = vi.fn()
    render(<EmployeeSearchBar {...defaultProps} value="test" onChange={onChange} />)

    const clearButton = screen.getByRole('button')
    fireEvent.click(clearButton)

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('should display search icon', () => {
    render(<EmployeeSearchBar {...defaultProps} />)

    const searchIcon = screen.getByTestId('search-icon') || screen.getByRole('img', { hidden: true })
    expect(searchIcon).toBeInTheDocument()
  })
})