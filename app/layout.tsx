import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

// Trigger deploy

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: 'Push Notifications SaaS',
  description: 'White-label push notifications platform for small businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </AuthProvider>
  )
}
