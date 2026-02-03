import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingState } from '@/components/ui/Spinner';

/**
 * OAuth Callback Page
 * 
 * This page handles the OAuth redirect after authentication.
 * It extracts the tokens from the URL and sends them to the parent window
 * via postMessage, then closes itself.
 */
const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error');
        if (error) {
          const errorMessage = searchParams.get('message') || 'Authentication failed';
          setStatus('error');
          setMessage(errorMessage);

          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'oauth-error',
                message: errorMessage,
              },
              window.location.origin
            );
          }

          // Close window after delay
          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        // Extract tokens from URL
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (!accessToken || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-success',
              accessToken,
              refreshToken,
            },
            window.location.origin
          );

          setStatus('success');
          setMessage('Authentication successful! Closing window...');

          // Close the popup window
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // No parent window, redirect to dashboard
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        
        setStatus('error');
        setMessage(errorMessage);

        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-error',
              message: errorMessage,
            },
            window.location.origin
          );

          setTimeout(() => {
            window.close();
          }, 3000);
        } else {
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'processing' && (
          <LoadingState message={message} />
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{message}</h3>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication Failed</h3>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
