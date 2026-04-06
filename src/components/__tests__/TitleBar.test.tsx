import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TitleBar from '../../components/TitleBar/TitleBar'
import { useFileStore } from '../../stores/file-store'

describe('TitleBar', () => {
  it('should render the file name', () => {
    useFileStore.setState({ fileName: 'TestFile.svg', isModified: false })
    render(<TitleBar />)
    expect(screen.getByText(/TestFile\.svg/)).toBeInTheDocument()
  })

  it('should show ThinkRender text', () => {
    render(<TitleBar />)
    expect(screen.getByText(/ThinkRender/)).toBeInTheDocument()
  })

  it('should show modified indicator when file is modified', () => {
    useFileStore.setState({ fileName: 'Test', isModified: true })
    render(<TitleBar />)
    expect(screen.getByText('●')).toBeInTheDocument()
  })

  it('should NOT show modified indicator when file is clean', () => {
    useFileStore.setState({ fileName: 'Test', isModified: false })
    render(<TitleBar />)
    expect(screen.queryByText('●')).not.toBeInTheDocument()
  })

  it('should render minimize button', () => {
    render(<TitleBar />)
    expect(screen.getByLabelText('Minimize')).toBeInTheDocument()
  })

  it('should render maximize button', () => {
    render(<TitleBar />)
    expect(screen.getByLabelText('Maximize')).toBeInTheDocument()
  })

  it('should render close button', () => {
    render(<TitleBar />)
    expect(screen.getByLabelText('Close')).toBeInTheDocument()
  })
})
