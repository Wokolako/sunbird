'use client';

import { useEffect } from 'react';

export default function AuthCallbackPage() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
      window.close();
    } else {
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-sunbird-light">
      <div className="text-center">
        <h1 className="text-2xl font-serif text-sunbird-green mb-4">Authenticating...</h1>
        <p className="text-[#6b6b6b]">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
}
