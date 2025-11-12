// app/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to SmartWhale to track crypto whales',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <LoginForm />
    </div>
  )
}
