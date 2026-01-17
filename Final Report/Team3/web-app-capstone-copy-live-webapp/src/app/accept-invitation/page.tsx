'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useInvitations } from '../../hooks/use-invitations';
import { useAuthStore } from '../../lib/stores/auth-store';
import type { CaregiverInvitation } from '../../types';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const { validateInvitationToken, acceptInvitation, loading, error } = useInvitations();
  const { user, isAuthenticated } = useAuthStore();
  
  const [invitation, setInvitation] = useState<CaregiverInvitation | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError('No invitation token provided');
      return;
    }

    const validateToken = async () => {
      try {
        const validInvitation = await validateInvitationToken(token);
        if (validInvitation) {
          setInvitation(validInvitation);
        } else {
          setValidationError('Invalid or expired invitation token');
        }
      } catch (err) {
        setValidationError('Failed to validate invitation');
      }
    };

    validateToken();
  }, [token, validateInvitationToken]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) {
      return;
    }

    setAccepting(true);
    try {
      const success = await acceptInvitation({
        token: invitation.token,
        userId: user.id,
      });

      if (success) {
        setAccepted(true);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    router.push('/login');
  };

  const handleRegister = () => {
    // Store the current URL to redirect back after registration
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    router.push('/register');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'secondary';
      case 'emergency':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!token || validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {validationError || 'This invitation link is not valid.'}
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              Invitation Accepted!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <p className="text-gray-600">
              You have successfully joined the caregiver for{' '}
              <strong>
                {invitation?.client?.firstName} {invitation?.client?.lastName}
              </strong>
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              caregiver Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>{invitation.inviter?.firstName} {invitation.inviter?.lastName}</strong>{' '}
                  has invited you to join the caregiver for:
                </p>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {invitation.client?.firstName} {invitation.client?.lastName}
                  </span>
                  <Badge variant={getRoleBadgeVariant(invitation.role)}>
                    {invitation.role} caregiver
                  </Badge>
                </div>
                {invitation.personalMessage && (
                  <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                    <p className="text-sm italic">"{invitation.personalMessage}"</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-center space-y-3">
              <p className="text-gray-600">
                To accept this invitation, please log in or create an account.
              </p>
              
              <div className="space-y-2">
                <Button onClick={handleLogin} className="w-full">
                  Log In
                </Button>
                <Button onClick={handleRegister} variant="outline" className="w-full">
                  Create Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Accept caregiver Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>{invitation.inviter?.firstName} {invitation.inviter?.lastName}</strong>{' '}
                has invited you to join the caregiver for:
              </p>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {invitation.client?.firstName} {invitation.client?.lastName}
                </span>
                <Badge variant={getRoleBadgeVariant(invitation.role)}>
                  {invitation.role} caregiver
                </Badge>
              </div>
              {invitation.personalMessage && (
                <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                  <p className="text-sm italic">"{invitation.personalMessage}"</p>
                </div>
              )}
              {invitation.permissions && invitation.permissions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Your permissions will include:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {invitation.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
              disabled={accepting}
            >
              Decline
            </Button>
            <Button
              onClick={handleAcceptInvitation}
              className="flex-1"
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By accepting this invitation, you agree to help coordinate care for this client
            and maintain the confidentiality of their health information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading invitation...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}