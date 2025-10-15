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

  // Check if user already has Firebase-verified email
  const isFirebaseVerified = user?.emailVerified;

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
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        return;
      }

      setStatus('sending');
      setMessage('');
      setOtp('');
      const resp = await emailService.sendOtp(email.trim());
      setStatus('sent');
      setMessage(resp?.message || 'OTP sent. Please check your inbox.');
      setExpiresAt(Date.now() + 120000); // 2 minutes
    } catch (err) {
      setStatus('error');
      // Check for authentication errors
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setMessage('Session expired. Please log in again to continue.');
      } else {
        setMessage(err?.response?.data?.message || err.message || 'Failed to send OTP');
      }
    }
  };

  const onVerify = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        return;
      }

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
      // Check for authentication errors
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setMessage('Session expired. Please log in again to continue.');
      } else {
        setMessage(err?.response?.data?.message || err.message || 'Invalid OTP');
      }
    }
  };

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''), [email]);
  const otpValid = useMemo(() => /^(\d){6}$/.test(otp || ''), [otp]);

  return (
    <div className="mt-8 border border-gray-200 overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3" style={{ backgroundColor: '#F3E8FF' }}>
        <div className="p-2 border border-purple-300" style={{ backgroundColor: '#FAF5FF' }}>
          <ShieldCheck size={22} style={{ color: '#7C3AED' }} />
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-semibold" style={{ color: '#281c20' }}>Email verification</h4>
          <p className="text-xs sm:text-sm" style={{ color: '#6B7280' }}>
            {isFirebaseVerified 
              ? "Your email is verified and secure" 
              : "Add and verify your email to receive order updates and offers"
            }
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4" style={{ backgroundColor: '#FDFCFF' }}>
        {isFirebaseVerified ? (
          // Show verified status for Firebase-verified emails
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-start">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1" style={{ color: '#7C3AED', display: 'block' }}>Email address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type="email"
                    value={email}
                    disabled={true}
                    className="w-full pl-10 pr-3 py-3 border"
                    style={{ backgroundColor: '#F9FAFB', color: '#281c20', borderColor: '#D1D5DB' }}
                  />
                </div>
                <div className="mt-2 inline-flex items-center text-sm" style={{ color: '#10B981' }}>
                  <CheckCircle2 size={16} className="mr-1"/> 
                  Verified via {user?.email?.includes('@gmail.com') ? 'Google' : 'Firebase Auth'} on {user?.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'login'}
                </div>
              </div>
            </div>
           
          </div>
        ) : (
          // Original OTP verification UI for non-Firebase verified emails
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-start">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1" style={{ color: '#7C3AED', display: 'block' }}>Email address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={status==='sending' || status==='verifying'}
                    className="w-full pl-10 pr-3 py-3 border disabled:opacity-60"
                    style={{ 
                      borderColor: '#C4B5FD',
                      color: '#281c20',
                      backgroundColor: status==='sending' || status==='verifying' ? '#F9FAFB' : '#FFFFFF'
                    }}
                  />
                </div>
                {status === 'verified' && !user?.emailVerified && (
                  <div className="mt-2 inline-flex items-center text-sm" style={{ color: '#10B981' }}>
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-white disabled:opacity-60 transition-colors"
                  style={{ backgroundColor: '#7C3AED' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#6D28D9')}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C3AED'}
                >
                  <Send size={16}/> {status==='sending' ? 'Sending…' : canResend ? 'Send OTP' : 'Resend in ' + formatTime(remaining)}
                </button>
              </div>
            </div>

            {status==='sent' && (
              <div className="border p-4" style={{ borderColor: '#D8B4FE', backgroundColor: '#FAF5FF' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2" style={{ color: '#6B21A8' }}>
                    <Timer size={18} style={{ color: '#9333EA' }}/>
                    <span className="text-sm font-medium">OTP expires in</span>
                  </div>
                  <span className="font-mono text-sm px-3 py-1 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#C4B5FD', color: '#7C3AED' }}>{formatTime(remaining)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1" style={{ color: '#7C3AED', display: 'block' }}>Enter 6-digit code</label>
                    <input
                      value={otp}
                      onChange={(e)=>setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="••••••"
                      className="w-full px-3 py-3 border tracking-widest text-center font-semibold text-lg"
                      style={{ borderColor: '#C4B5FD', color: '#281c20', backgroundColor: '#FFFFFF' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onVerify}
                    disabled={!otpValid || remaining<=0 || status==='verifying'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-white disabled:opacity-60 transition-colors"
                    style={{ backgroundColor: '#10B981' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#059669')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                  >
                    <ShieldCheck size={16}/> {status==='verifying' ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
                {remaining<=0 && (
                  <div className="mt-2 flex items-center text-sm" style={{ color: '#D97706' }}>
                    <XCircle size={16} className="mr-1"/> The code has expired. Please resend a new OTP.
                  </div>
                )}
              </div>
            )}

            {message && (
              <div className={`flex items-center gap-2 text-sm`} style={{ color: status==='error' ? '#B91C1C' : '#059669' }}>
                {status==='error' ? <XCircle size={16}/> : <CheckCircle2 size={16}/>} {message}
              </div>
            )}

            {status==='verified' && (
              <div className="p-4 border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#166534' }}>
                  <CheckCircle2 size={16}/> Email verification completed successfully!
                </div>
                <button
                  type="button"
                  onClick={()=>{ setStatus('idle'); setMessage(''); setOtp(''); setExpiresAt(null);} }
                  className="inline-flex items-center gap-2 px-3 py-2 border text-sm transition-colors"
                  style={{ borderColor: '#86EFAC', color: '#166534' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DCFCE7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <RefreshCcw size={16}/> Verify another email
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
