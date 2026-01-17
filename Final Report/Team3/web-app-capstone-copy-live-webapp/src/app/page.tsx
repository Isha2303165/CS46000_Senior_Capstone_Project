'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Shield, 
  Users, 
  Clock, 
  Heart,
  Smartphone,
  BarChart,
  Calendar,
  Pill,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-full animate-spin"></div>
            <div className="absolute inset-1 bg-white rounded-full"></div>
            <div className="absolute inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo-square.png" alt="Levelup Meds" className="h-10 w-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Levelup Meds
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50/30 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 animate-fadeIn">
            
            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-gray-900">Healthcare</span>
                <span className="block bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Coordination
                </span>
                <span className="block text-gray-900">Made Simple</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The all-in-one platform for caregivers to manage medications, 
                appointments, and communications seamlessly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={() => router.push('/register')}
                className="group bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Start Using Levelup Meds
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/login')}
                className="px-8 py-6 text-lg border-2"
              >
                Sign In to Your Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Caring for someone shouldn't be overwhelming
              </h2>
              <p className="text-lg text-gray-600">
                Managing healthcare for your loved ones involves juggling multiple responsibilities. 
                Levelup Meds brings everything together in one secure, easy-to-use platform.
              </p>
              <ul className="space-y-4">
                {[
                  'Keep track of all medications and schedules',
                  'Coordinate with multiple caregivers effortlessly',
                  'Never miss an appointment or medication',
                  'Maintain complete health records in one place'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl transform rotate-3 opacity-20"></div>
              <Card className="relative bg-white p-8 rounded-3xl shadow-2xl border-0">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Client-Centered Care</h4>
                      <p className="text-sm text-gray-600">Everything revolves around your loved one</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Team Collaboration</h4>
                      <p className="text-sm text-gray-600">Work together with family & professionals</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Secure & Private</h4>
                      <p className="text-sm text-gray-600">Your data is protected and encrypted</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need in one platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed for modern healthcare management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Pill,
                title: 'Medication Management',
                description: 'Track dosages, schedules, and refills with smart reminders',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: Calendar,
                title: 'Appointment Scheduling',
                description: 'Manage all healthcare appointments in one calendar',
                color: 'from-green-500 to-green-600'
              },
              {
                icon: MessageCircle,
                title: 'Team Communication',
                description: 'Secure messaging between caregivers and providers',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: BarChart,
                title: 'Health Insights',
                description: 'Track progress and identify patterns over time',
                color: 'from-orange-500 to-orange-600'
              },
              {
                icon: Smartphone,
                title: 'Mobile Access',
                description: 'Access everything from any device, anywhere',
                color: 'from-pink-500 to-pink-600'
              },
              {
                icon: Shield,
                title: 'Secure Storage',
                description: 'Keep all medical documents safe and organized',
                color: 'from-indigo-500 to-indigo-600'
              }
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="group p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-gray-100"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50/30 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start managing care in minutes
            </h2>
            <p className="text-lg text-gray-600">
              Simple setup, powerful results
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description: 'Sign up with your email and set up your caregiver profile'
              },
              {
                step: '02',
                title: 'Add Your Loved Ones',
                description: 'Create profiles for those you care for with their medical information'
              },
              {
                step: '03',
                title: 'Invite Your Care Team',
                description: 'Add family members and healthcare providers to collaborate'
              },
              {
                step: '04',
                title: 'Start Coordinating',
                description: 'Manage everything from medications to appointments in one place'
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo-square.png" alt="Levelup Meds" className="h-10 w-10" />
                <span className="text-xl font-bold">Levelup Meds</span>
              </div>
              <p className="text-gray-400">
                Simplifying healthcare coordination for families and caregivers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/register" className="text-gray-400 hover:text-white transition-colors">
                    Get Started
                  </a>
                </li>
                <li>
                  <a href="/login" className="text-gray-400 hover:text-white transition-colors">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="https://deluryenterprise.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    HIPAA Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p className="text-sm">
              © 2024 Levelup Meds • © 2025 DeLury Enterprise, LLC • All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}