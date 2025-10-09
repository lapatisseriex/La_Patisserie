import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, ShieldCheck, Mail, Timer, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { emailService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';

const formatTime = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const EmailVerification = () => {
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle'); // idle|sending|sent|verifying|verified|error
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState(null); // timestamp
  const timerRef = useRef(null);

  // Auto-populate email when user data changes
  useEffect(() => {
    if (user?.email && email !== user.email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  const remaining = useMemo(() => (expiresAt ? expiresAt - Date.now() : 0), [expiresAt]);

  useEffect(() => {
    if (!expiresAt) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // trigger updates
      if (expiresAt - Date.now() <= 0) {
        clearInterval(timerRef.current);
      }
    }, 500);
    return () => clearInterval(timerRef.current);
  }, [expiresAt]);

  const canResend = !expiresAt || remaining <= 0;

  const onSend = async () => {
    try {
      setStatus('sending');
      setMessage('');
      setOtp('');
      const resp = await emailService.sendOtp(email.trim());
      setStatus('sent');
      setMessage(resp?.message || 'OTP sent. Please check your inbox.');
      setExpiresAt(Date.now() + 120000); // 2 minutes
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.message || err.message || 'Failed to send OTP');
    }
  };

  const onVerify = async () => {
    try {
      setStatus('verifying');
      setMessage('');
      const resp = await emailService.verifyOtp(email.trim(), otp.trim());
      setStatus('verified');
      setMessage(resp?.message || 'Email verified successfully');
      
      // Update user in context with backend response data
      const verificationData = {
        email: email.trim(),
        emailVerified: true,
        emailVerifiedAt: resp?.user?.emailVerifiedAt || new Date().toISOString(),
      };
      
      // If backend returns user data, use it, otherwise use local data
      if (resp?.user) {
        updateUser({
          ...resp.user,
          emailVerified: resp.user.emailVerified || true,
          emailVerifiedAt: resp.user.emailVerifiedAt || new Date().toISOString()
        });
      } else {
        updateUser(verificationData);
      }
      
      setExpiresAt(null);
      
      // Clear form after successful verification
      setTimeout(() => {
        setOtp('');
        setStatus('idle');
      }, 3000);
      
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.message || err.message || 'Invalid OTP');
    }
  };

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''), [email]);
  const otpValid = useMemo(() => /^(\d){6}$/.test(otp || ''), [otp]);

  return (
    <div className="mt-8 rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 flex items-center gap-3">
        <ShieldCheck className="text-pink-600" size={22} />
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Email verification</h4>
          <p className="text-xs sm:text-sm text-gray-600">Add and verify your email to receive order updates and offers</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-start">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status==='sending' || status==='verifying'}
                className="w-full pl-10 pr-3 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50"
              />
            </div>
            {user?.emailVerified && (
              <div className="mt-2 inline-flex items-center text-green-600 text-sm">
                <CheckCircle2 size={16} className="mr-1"/> 
                Verified on {user?.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            )}
            {status === 'verified' && !user?.emailVerified && (
              <div className="mt-2 inline-flex items-center text-green-600 text-sm">
                <CheckCircle2 size={16} className="mr-1"/> 
                Verified on {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex sm:justify-end items-end">
            <button
              type="button"
              onClick={onSend}
              disabled={!emailValid || (!canResend && status==='sent') || status==='sending' || status==='verifying'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white bg-black hover:bg-gray-800 disabled:opacity-60"
            >
              <Send size={16}/> {status==='sending' ? 'Sending…' : canResend ? 'Send OTP' : 'Resend in ' + formatTime(remaining)}
            </button>
          </div>
        </div>

        {status==='sent' && (
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Timer size={18} className="text-gray-500"/>
                <span className="text-sm">OTP expires in</span>
              </div>
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border">{formatTime(remaining)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit code</label>
                <input
                  value={otp}
                  onChange={(e)=>setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  className="w-full px-3 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent tracking-widest text-center font-semibold text-lg"
                />
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={!otpValid || remaining<=0 || status==='verifying'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
              >
                <ShieldCheck size={16}/> {status==='verifying' ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            {remaining<=0 && (
              <div className="mt-2 flex items-center text-amber-700 text-sm">
                <XCircle size={16} className="mr-1"/> The code has expired. Please resend a new OTP.
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`flex items-center gap-2 text-sm ${status==='error' ? 'text-red-700' : 'text-green-700'}`}>
            {status==='error' ? <XCircle size={16}/> : <CheckCircle2 size={16}/>} {message}
          </div>
        )}

        {status==='verified' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 text-sm mb-2">
              <CheckCircle2 size={16}/> Email verification completed successfully!
            </div>
            <button
              type="button"
              onClick={()=>{ setStatus('idle'); setMessage(''); setOtp(''); setExpiresAt(null);} }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-green-300 hover:bg-green-100 text-green-700 text-sm"
            >
              <RefreshCcw size={16}/> Verify another email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
