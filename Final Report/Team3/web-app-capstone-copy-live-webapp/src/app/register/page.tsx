'use client';

import React from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/logo-square.png" alt="Levelup Meds" className="h-12 w-12" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Levelup Meds
            </h1>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
          <p className="text-gray-600 mt-2">
            Start managing healthcare coordination in minutes
          </p>
        </div>

          <RegisterForm />

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}