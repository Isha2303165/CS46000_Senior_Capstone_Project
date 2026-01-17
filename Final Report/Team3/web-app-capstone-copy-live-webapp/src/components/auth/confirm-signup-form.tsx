'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loader2, CheckCircle, Mail } from 'lucide-react';

const confirmSchema = z.object({
  confirmationCode: z.string().min(6, 'Confirmation code must be at least 6 characters'),
});

type ConfirmFormData = z.infer<typeof confirmSchema>;

interface ConfirmSignUpFormProps {
  email: string;
  onConfirmed?: () => void;
  onBackToLogin?: () => void;
}

export function ConfirmSignUpForm({ email, onConfirmed, onBackToLogin }: ConfirmSignUpFormProps) {
  const { confirmSignUp, resendConfirmationCode, isLoading, error } = useAuthStore();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
  });

  const onSubmit = async (data: ConfirmFormData) => {
    await confirmSignUp(email, data.confirmationCode);
    
    // Check if confirmation was successful
    const { error: authError } = useAuthStore.getState();
    if (!authError) {
      setIsConfirmed(true);
      setTimeout(() => {
        onConfirmed?.();
      }, 2000);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    await resendConfirmationCode(email);
    setIsResending(false);
  };

  if (isConfirmed) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Account confirmed!</CardTitle>
          <CardDescription className="text-center">
            Your account has been successfully confirmed. You can now sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Redirecting you to sign in...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Confirm your email</CardTitle>
        <CardDescription className="text-center">
          We sent a confirmation code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmationCode">Confirmation code</Label>
            <Input
              id="confirmationCode"
              placeholder="Enter 6-digit code"
              {...register('confirmationCode')}
              aria-invalid={errors.confirmationCode ? 'true' : 'false'}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            {errors.confirmationCode && (
              <p className="text-sm text-red-600" role="alert">
                {errors.confirmationCode.message}
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
                Confirming...
              </>
            ) : (
              'Confirm account'
            )}
          </Button>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={isResending || isLoading}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend confirmation code'
              )}
            </Button>

            {onBackToLogin && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBackToLogin}
              >
                Back to sign in
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}