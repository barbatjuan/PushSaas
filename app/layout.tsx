import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'

// Trigger deploy

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: 'Push Notifications SaaS',
  description: 'White-label push notifications platform for small businesses',
}

const ClerkProviderNoSSR = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.ClerkProvider),
  { ssr: false }
)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProviderNoSSR 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProviderNoSSR>
  )
}
