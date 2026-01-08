'use client'

import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { store } from '@/store'
import { AuthProvider } from '@/components/providers/AuthProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  )
}
