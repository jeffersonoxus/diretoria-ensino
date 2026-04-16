import Link from 'next/link'
import { createClient } from '@/lib/supabase/middleware'
import { AuthStatus } from '@/components/AuthStatus'
import { 
  BookOpen, 
  Users, 
  Target, 
  Clock, 
  Heart, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  Star,
  BookMarked,
  Brain,
  CalendarCheck
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // This page is a landing page for the DIEN (Diretoria de Ensino) platform
  // It showcases educational sectors and provides access to login/registration
  // The full content has been simplified - only auth options remain visible

  return (
    <div className="min-h-screen">
      {/* Hero Section - Platform Introduction */}
      <section className="relative bg-linear-to-br from-[#7114dd] via-[#7114dd] to-[#a94dff] text-white overflow-hidden">
        {/* Decorative background pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#a94dff] to-[#7114dd]" />
        
        {/* Navigation with Auth Options */}
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">DIEN</h1>
          </div>
          <div>
            {user ? (
              <Link
                href="/dien"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full hover:bg-white/30 transition-all border border-white/30"
              >
                Access Dashboard
              </Link>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  className="bg-[#ffa301] text-[#7114dd] px-6 py-2.5 rounded-full hover:bg-[#ffa301]/90 transition-all font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6">
              <span className="block">Diretoria de Ensino</span>
              <span className="block bg-linear-to-r from-[#ffa301] to-[#24cffd] bg-clip-text text-transparent">
                Innovation & Excellence
              </span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-white/90 mb-12">
              Educational management platform for specialized sectors, continuous training,
              and commitment to student development.
            </p>
            {!user && (
              <Link
                href="/cadastro"
                className="inline-flex items-center space-x-2 bg-[#ffa301] text-[#7114dd] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#ffa301]/90 transition-all transform hover:scale-105"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Simplified CTA Section - Main Auth Options */}
      <section className="py-20 bg-linear-to-r from-[#7114dd] to-[#a94dff] text-white relative overflow-hidden">
        {/* Decorative background pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Join the Educational Transformation
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Access the DIEN platform and contribute to inclusive, innovative, quality education
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center space-x-2 bg-white text-[#7114dd] px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/90 transition-all transform hover:scale-105"
              >
                <span>Login</span>
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center space-x-2 bg-[#ffa301] text-[#7114dd] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#ffa301]/90 transition-all transform hover:scale-105"
              >
                <span>Sign Up</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Auth Status Component */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AuthStatus />
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-[#ffa301]" />
                <span className="text-lg font-bold">DIEN</span>
              </div>
              <p className="text-gray-400 text-sm">
                Educational Management Platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Access</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/cadastro" className="hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Dashboard</li>
                <li>Educational Sectors</li>
                <li>Reports</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Terms of Use</li>
                <li>Privacy Policy</li>
                <li>LGPD</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 DIEN - Educational Management Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}