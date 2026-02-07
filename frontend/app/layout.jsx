import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FreelanceHub - Connect Talent with Opportunity',
  description: 'A comprehensive platform connecting talented freelancers with amazing clients. Build your career, grow your business, and create something extraordinary together.',
  keywords: 'freelance, freelancer, client, jobs, projects, remote work',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}