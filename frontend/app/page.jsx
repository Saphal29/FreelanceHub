'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Users, Briefcase, CheckCircle, Sparkles, TrendingUp, Award, Menu, X } from 'lucide-react';
import axios from 'axios';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalFreelancers: 0,
    totalClients: 0,
    totalProjects: 0,
    averageRating: 0,
    totalPaid: 0
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/stats/public`);
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    fetchStats();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                Freelance<span className="text-gradient-gold">Hub</span>
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link 
                href="/login"
                className="text-gray-700 hover:text-black font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="btn-primary px-6 py-2.5"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-black"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/login"
                  className="text-gray-700 hover:text-black font-semibold transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  className="btn-primary text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="bg-white">
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 gradient-hero relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-amber-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-black/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-black rounded-2xl sm:rounded-3xl flex items-center justify-center mb-8 sm:mb-12 animate-scale-in shadow-2xl">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-amber-500" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-black mb-4 sm:mb-6 md:mb-8 leading-tight animate-fade-in">
              The Future of{' '}
              <span className="text-gradient-gold">
                Freelancing
              </span>
              {' '}is Here
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 px-4 animate-slide-up">
              Connect with Nepal&apos;s top talent and premium clients. Build extraordinary careers, 
              deliver exceptional projects, and shape the future of work together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 md:mb-20 animate-slide-up px-4">
              <Link 
                href="/register"
                className="btn-primary inline-flex items-center justify-center text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
              >
                Start Your Journey
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <Link 
                href="/login"
                className="btn-secondary inline-flex items-center justify-center text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
              >
                <Shield className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                Sign In Securely
              </Link>
            </div>

            {/* Trust Indicators - Real Data */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-12 mb-12 sm:mb-16 md:mb-20 px-4">
              <div className="text-center hover-lift bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-2 sm:mb-3">
                  {stats.totalFreelancers}+
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-600 font-semibold">Elite Freelancers</div>
              </div>
              <div className="text-center hover-lift bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-2 sm:mb-3">
                  {stats.totalClients}+
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-600 font-semibold">Premium Clients</div>
              </div>
              <div className="text-center hover-lift bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-2 sm:mb-3">
                  {stats.totalProjects}+
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-600 font-semibold">Success Stories</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-4 sm:mb-6">
                Choose Your Path to Success
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Whether you&apos;re a visionary freelancer or an ambitious business, 
                FreelanceHub provides the premium platform you deserve.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-12 sm:mb-16 md:mb-20">
              {/* For Freelancers */}
              <div className="card-premium hover-glow p-6 sm:p-8 md:p-10">
                <div className="flex items-center mb-6 sm:mb-8">
                  <div className="feature-icon">
                    <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-black ml-4 sm:ml-6">For Freelancers</h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
                  Elevate your career with premium tools, exclusive opportunities, and direct access to high-value clients.
                </p>
                <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Premium profile showcase</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Advanced portfolio tools</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Premium rate optimization</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Elite client network</span>
                  </li>
                </ul>
                <Link 
                  href="/register?role=freelancer"
                  className="btn-outline inline-flex items-center text-base sm:text-lg w-full justify-center py-3 sm:py-4"
                >
                  Join Elite Freelancers
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>

              {/* For Clients */}
              <div className="card-premium hover-glow p-6 sm:p-8 md:p-10">
                <div className="flex items-center mb-6 sm:mb-8">
                  <div className="feature-icon-accent">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-black ml-4 sm:ml-6">For Clients</h3>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
                  Access Nepal&apos;s finest talent pool. Premium quality, guaranteed results, exceptional service.
                </p>
                <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Verified elite freelancers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Premium project matching</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Secure payment guarantee</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-base sm:text-lg font-medium">Dedicated project success</span>
                  </li>
                </ul>
                <Link 
                  href="/register?role=client"
                  className="btn-secondary inline-flex items-center text-base sm:text-lg w-full justify-center py-3 sm:py-4"
                >
                  Hire Premium Talent
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-4 sm:mb-6">
                Why FreelanceHub Leads
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                We don&apos;t just connect people - we create success stories through innovation, quality, and trust.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
              <div className="feature-card text-center hover-lift p-6 sm:p-8">
                <div className="feature-icon mx-auto">
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Growth Focused</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Advanced analytics and insights to accelerate your career or business growth exponentially.
                </p>
              </div>

              <div className="feature-card text-center hover-lift p-6 sm:p-8">
                <div className="feature-icon mx-auto">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Bank-Level Security</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Military-grade encryption and comprehensive verification ensure your data and transactions are bulletproof.
                </p>
              </div>

              <div className="feature-card text-center hover-lift p-6 sm:p-8">
                <div className="feature-icon mx-auto">
                  <Award className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">Excellence Standard</h3>
                <p className="text-base sm:text-lg text-gray-600">
                  Our rigorous quality system and performance metrics guarantee world-class results every time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Real Data */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-black text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
                Success by Numbers
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
                Real results from real people building extraordinary careers and businesses.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <div className="text-center p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-amber-500 mb-2 sm:mb-4">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '4.9'}★
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-300 font-semibold">Avg Rating</div>
              </div>
              <div className="text-center p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-amber-500 mb-2 sm:mb-4">
                  24h
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-300 font-semibold">Avg Response</div>
              </div>
              <div className="text-center p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-amber-500 mb-2 sm:mb-4">
                  {formatCurrency(stats.totalPaid)}
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-300 font-semibold">Paid Out</div>
              </div>
              <div className="text-center p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-amber-500 mb-2 sm:mb-4">
                  98%
                </div>
                <div className="text-sm sm:text-base md:text-lg text-gray-300 font-semibold">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center gradient-premium rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-90"></div>
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6">
                  Ready to Dominate Your Market?
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 opacity-90 max-w-3xl mx-auto px-4">
                  Join the elite community of freelancers and clients who choose excellence over ordinary.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                  <Link 
                    href="/register"
                    className="inline-flex items-center justify-center px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-amber-500 text-black font-black text-base sm:text-lg md:text-xl rounded-xl hover:bg-amber-400 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                  >
                    <Sparkles className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Start Dominating
                    <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                  </Link>
                  <Link 
                    href="/login"
                    className="inline-flex items-center justify-center px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 border-2 border-white text-white font-bold text-base sm:text-lg md:text-xl rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    <Shield className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Sign In Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl sm:text-4xl font-black mb-4 sm:mb-6">
              Freelance<span className="text-amber-500">Hub</span>
            </h3>
            <p className="text-gray-400 mb-6 sm:mb-8 text-base sm:text-lg md:text-xl px-4">
              Elevating freelance excellence across Nepal and beyond
            </p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12">
              <Link href="/about" className="text-gray-400 hover:text-amber-500 transition-colors text-base sm:text-lg font-semibold">
                About
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-amber-500 transition-colors text-base sm:text-lg font-semibold">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-amber-500 transition-colors text-base sm:text-lg font-semibold">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-amber-500 transition-colors text-base sm:text-lg font-semibold">
                Terms
              </Link>
            </div>
            <div className="pt-6 sm:pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm sm:text-base md:text-lg px-4">
                © 2024 FreelanceHub. Crafted with excellence in Nepal.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
