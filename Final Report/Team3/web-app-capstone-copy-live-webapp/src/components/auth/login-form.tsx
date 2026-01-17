'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ConfirmSignUpForm } from './confirm-signup-form';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToSignUp?: () => void;
}

export function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const router = useRouter();
  const { signIn, isLoading, error, pendingConfirmation, setPendingConfirmation } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // If there's a pending confirmation from a previous attempt, surface the confirmation UI immediately
  React.useEffect(() => {
    if (pendingConfirmation) {
      setShowConfirmation(true);
    }
  }, [pendingConfirmation]);

  const onSubmit = async (data: LoginFormData) => {
    const result = await signIn(data.email, data.password);
    
    if (result.needsConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    // Check if sign in was successful by checking if user is now authenticated
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  };

  const handleConfirmationComplete = () => {
    setShowConfirmation(false);
    setPendingConfirmation(null);
    // User can now try to sign in again
  };

  const handleBackToLogin = () => {
    setShowConfirmation(false);
    setPendingConfirmation(null);
  };

  // Show confirmation form if user needs to confirm their account
  if (showConfirmation && pendingConfirmation) {
    return (
      <ConfirmSignUpForm
        email={pendingConfirmation}
        onConfirmed={handleConfirmationComplete}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your healthcare tracking account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md" role="alert">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          {onSwitchToSignUp && (
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={onSwitchToSignUp}
              >
                Sign up
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}