"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

let queryClient: QueryClient | null = null

function getClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // 5 minutes
          staleTime: 5 * 60 * 1000,
          // 10 minutes (called gcTime in v5)
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return queryClient
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
