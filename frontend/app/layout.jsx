import { Fraunces, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ClientProviders } from './ClientProviders'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata = {
  title: 'FreelanceHub — Nepal’s Editorial Freelance Ledger | Nantio',
  description: 'A two-sided freelance marketplace for Nepal. Designed like an open ledger written in real time. Transparent escrow, recorded proposals, direct local payment.',
  keywords: 'freelance hub, nepal freelancers, nantio, ledger, escrow, nepal tech jobs, freelance marketplace',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[var(--paper)] text-[var(--ink)]" suppressHydrationWarning={true}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}