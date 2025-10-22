import { render, screen } from '@testing-library/react'
import Page from '../page'
import AuthProvider from '@/components/AuthProvider'

jest.mock('@/components/AuthProvider', () => {
  const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>
  }
  MockedAuthProvider.displayName = 'MockedAuthProvider'
  return MockedAuthProvider
})

describe('Page', () => {
  it('renders a heading', () => {
    render(
      <AuthProvider>
        <Page />
      </AuthProvider>
    )

    const heading = screen.getByText(/schedule page/i)

    expect(heading).toBeInTheDocument()
  })
})
