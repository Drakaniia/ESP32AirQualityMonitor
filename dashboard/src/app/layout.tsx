import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import VideoBackground from '@/components/VideoBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Combustible Gas Monitor',
  description: 'Real-time combustible gas monitoring dashboard for ESP32 MQ-2 sensor',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VideoBackground />
        <AuthProvider>
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}