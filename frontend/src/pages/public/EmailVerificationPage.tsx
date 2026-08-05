import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const EmailVerificationPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(() =>
    token ? 'loading' : 'idle'
  );
  const [message, setMessage] = useState(
    token ? 'Verifying your email address...' : 'Open the verification link from your email to continue.'
  );

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setStatus('loading');
      try {
        const res = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || 'Email verification failed.');
        }
        setStatus('success');
        setMessage(json.message || 'Your email address has been verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Email verification failed.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        {status === 'loading' ? (
          <Loader2 className="w-12 h-12 text-indigo-400 mx-auto animate-spin" />
        ) : status === 'error' ? (
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        ) : (
          <MailCheck className="w-12 h-12 text-indigo-400 mx-auto" />
        )}
        <h1 className="text-2xl font-black text-white">Email Verification</h1>
        <p className="text-xs text-slate-400">{message}</p>
        <Link to="/login">
          <Button variant="glow">Proceed to Sign In</Button>
        </Link>
      </Card>
    </div>
  );
};
