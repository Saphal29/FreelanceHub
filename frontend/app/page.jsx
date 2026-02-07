'use client';
import Link from 'next/link';
import { ArrowRight, Shield, Users, Briefcase, Star, CheckCircle, Zap, Globe, Award, Sparkles, TrendingUp, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="container-modern">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-black text-black tracking-tight">
                  Freelance<span className="text-gradient-gold">Hub</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link 
                href="/login"
                className="nav-link"
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="bg-white">
        <section className="section-padding-modern gradient-hero relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="container-modern text-center relative">
            <div className="mx-auto h-24 w-24 bg-black rounded-3xl flex items-center justify-center mb-12 animate-scale-in shadow-2xl">
              <Sparkles className="h-12 w-12 text-amber-500" />
            </div>
            
            <h1 className="text-hero animate-fade-in mb-8">
              The Future of{' '}
              <span className="text-gradient-gold">
                Freelancing
              </span>
              {' '}is Here
            </h1>
            
            <p className="hero-subtitle animate-slide-up">
              Connect with Nepal's top talent and premium clients. Build extraordinary careers, 
              deliver exceptional projects, and shape the future of work together.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 animate-slide-up">
              <Link 
                href="/register"
                className="btn-primary inline-flex items-center text-lg"
              >
                Start Your Journey
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
              <Link 
                href="/login"
                className="btn-secondary inline-flex items-center text-lg"
              >
                <Shield className="mr-3 h-6 w-6" />
                Sign In Securely
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
              <div className="text-center hover-lift">
                <div className="text-5xl font-black text-black mb-3">1000+</div>
                <div className="text-gray-600 font-semibold text-lg">Elite Freelancers</div>
              </div>
              <div className="text-center hover-lift">
                <div className="text-5xl font-black text-black mb-3">500+</div>
                <div className="text-gray-600 font-semibold text-lg">Premium Clients</div>
              </div>
              <div className="text-center hover-lift">
                <div className="text-5xl font-black text-black mb-3">2000+</div>
                <div className="text-gray-600 font-semibold text-lg">Success Stories</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding-modern bg-white">
          <div className="container-modern">
            <div className="text-center mb-20">
              <h2 className="text-section-title">Choose Your Path to Success</h2>
              <p className="text-body text-xl max-w-3xl mx-auto">
                Whether you're a visionary freelancer or an ambitious business, 
                FreelanceHub provides the premium platform you deserve.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              {/* For Freelancers */}
              <div className="card-premium hover-glow">
                <div className="flex items-center mb-8">
                  <div className="feature-icon">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-black ml-6">For Freelancers</h3>
                </div>
                <p className="text-body mb-8 text-xl">
                  Elevate your career with premium tools, exclusive opportunities, and direct access to high-value clients.
                </p>
                <ul className="space-y-6 mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Premium profile showcase</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Advanced portfolio tools</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Premium rate optimization</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Elite client network</span>
                  </li>
                </ul>
                <Link 
                  href="/register?role=freelancer"
                  className="btn-outline inline-flex items-center text-lg w-full justify-center"
                >
                  Join Elite Freelancers
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </div>

              {/* For Clients */}
              <div className="card-premium hover-glow">
                <div className="flex items-center mb-8">
                  <div className="feature-icon-accent">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-black ml-6">For Clients</h3>
                </div>
                <p className="text-body mb-8 text-xl">
                  Access Nepal's finest talent pool. Premium quality, guaranteed results, exceptional service.
                </p>
                <ul className="space-y-6 mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Verified elite freelancers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Premium project matching</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Secure payment guarantee</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-amber-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg font-medium">Dedicated project success</span>
                  </li>
                </ul>
                <Link 
                  href="/register?role=client"
                  className="btn-secondary inline-flex items-center text-lg w-full justify-center"
                >
                  Hire Premium Talent
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="section-padding-modern bg-gray-50">
          <div className="container-modern">
            <div className="text-center mb-20">
              <h2 className="text-section-title">Why FreelanceHub Leads</h2>
              <p className="text-body text-xl max-w-3xl mx-auto">
                We don't just connect people - we create success stories through innovation, quality, and trust.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="feature-card text-center hover-lift">
                <div className="feature-icon mx-auto">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">Growth Focused</h3>
                <p className="text-body text-lg">
                  Advanced analytics and insights to accelerate your career or business growth exponentially.
                </p>
              </div>

              <div className="feature-card text-center hover-lift">
                <div className="feature-icon mx-auto">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">Bank-Level Security</h3>
                <p className="text-body text-lg">
                  Military-grade encryption and comprehensive verification ensure your data and transactions are bulletproof.
                </p>
              </div>

              <div className="feature-card text-center hover-lift">
                <div className="feature-icon mx-auto">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">Excellence Standard</h3>
                <p className="text-body text-lg">
                  Our rigorous quality system and performance metrics guarantee world-class results every time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="section-padding-modern bg-black text-white">
          <div className="container-modern">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-white mb-6">Success by Numbers</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Real results from real people building extraordinary careers and businesses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-6xl font-black text-amber-500 mb-4">98%</div>
                <div className="text-gray-300 font-semibold text-lg">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-black text-amber-500 mb-4">24h</div>
                <div className="text-gray-300 font-semibold text-lg">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-black text-amber-500 mb-4">₹50L+</div>
                <div className="text-gray-300 font-semibold text-lg">Paid Out</div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-black text-amber-500 mb-4">4.9★</div>
                <div className="text-gray-300 font-semibold text-lg">Avg Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding-modern bg-white">
          <div className="container-modern">
            <div className="text-center gradient-premium rounded-3xl p-16 text-white relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-90"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-5xl font-black mb-6">Ready to Dominate Your Market?</h2>
                <p className="text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
                  Join the elite community of freelancers and clients who choose excellence over ordinary.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link 
                    href="/register"
                    className="inline-flex items-center px-12 py-6 bg-amber-500 text-black font-black text-xl rounded-xl hover:bg-amber-400 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                  >
                    <Sparkles className="mr-3 h-6 w-6" />
                    Start Dominating
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Link>
                  <Link 
                    href="/login"
                    className="inline-flex items-center px-12 py-6 border-2 border-white text-white font-bold text-xl rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    <Shield className="mr-3 h-6 w-6" />
                    Sign In Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container-modern">
          <div className="text-center">
            <h3 className="text-4xl font-black mb-6">
              Freelance<span className="text-amber-500">Hub</span>
            </h3>
            <p className="text-gray-400 mb-8 text-xl">
              Elevating freelance excellence across Nepal and beyond
            </p>
            <div className="flex justify-center space-x-12 mb-12">
              <Link href="/about" className="text-gray-400 hover:text-amber-500 transition-colors text-lg font-semibold">
                About
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-amber-500 transition-colors text-lg font-semibold">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-amber-500 transition-colors text-lg font-semibold">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-amber-500 transition-colors text-lg font-semibold">
                Terms
              </Link>
            </div>
            <div className="pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-lg">
                © 2024 FreelanceHub. Crafted with excellence in Nepal.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}