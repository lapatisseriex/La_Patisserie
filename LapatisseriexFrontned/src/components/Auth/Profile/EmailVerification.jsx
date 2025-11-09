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
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{
        color: '#733857',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '0.02em'
      }}>
        <Mail className="h-3 w-3 sm:h-4 sm:w-4" style={{color: 'rgba(115, 56, 87, 0.6)'}} strokeWidth={1.5} />
        Email Address {!isFirebaseVerified && <span style={{color: '#733857'}}>*</span>}
      </label>
      <div className="space-y-4"  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {isFirebaseVerified ? (
          // Show verified status for Firebase-verified emails
          <div>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled={true}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none border-gray-200 bg-gray-50 text-gray-700"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: '#10B981', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> 
              Verified via {user?.email?.includes('@gmail.com') ? 'Google' : 'Firebase Auth'} on {user?.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'login'}
            </div>
          </div>
        ) : (
          // Original OTP verification UI for non-Firebase verified emails
          <>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={status==='sending' || status==='verifying'}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none ${
                    isEditMode 
                      ? 'border-gray-300 focus:border-[#733857] bg-white shadow-sm focus:shadow-md' 
                      : 'border-gray-200 bg-gray-50'
                  } ${(status==='sending' || status==='verifying') ? 'opacity-60' : ''}`}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    borderRadius: '4px'
                  }}
                />
              </div>
              {status === 'verified' && !user?.emailVerified && (
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: '#10B981', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> 
                  Verified on {new Date().toLocaleDateString()}
                </div>
              )}
              <button
                type="button"
                onClick={onSend}
                disabled={!emailValid || (!canResend && status==='sent') || status==='sending' || status==='verifying'}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-white text-sm sm:text-base font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#733857',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  borderRadius: '4px',
                  boxShadow: '0 2px 6px rgba(115, 56, 87, 0.15)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#5a2b43';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(115, 56, 87, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#733857';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(115, 56, 87, 0.15)';
                }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} />
                  {status==='sending' ? 'Sending…' : canResend ? 'Send OTP' : 'Resend in ' + formatTime(remaining)}
                </span>
              </button>
            </div>

            {status==='sent' && (
              <div className="p-4 sm:p-5 border transition-all duration-300" style={{ 
                borderColor: 'rgba(115, 56, 87, 0.2)', 
                backgroundColor: 'rgba(255, 251, 252, 0.5)',
                borderRadius: '4px'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2" style={{ color: '#733857', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <Timer className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
                    <span className="text-xs sm:text-sm font-semibold">OTP expires in</span>
                  </div>
                  <span className="font-mono text-xs sm:text-sm px-3 py-1.5 border font-semibold" style={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: 'rgba(115, 56, 87, 0.2)', 
                    color: '#733857',
                    borderRadius: '4px'
                  }}>{formatTime(remaining)}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 block" style={{ color: '#733857', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Enter 6-digit code
                    </label>
                    <input
                      value={otp}
                      onChange={(e)=>setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="••••••"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border tracking-widest text-center font-bold text-base sm:text-lg transition-all duration-300 outline-none focus:border-[#733857] focus:shadow-md"
                      style={{ 
                        borderColor: 'rgba(115, 56, 87, 0.3)', 
                        color: '#281c20', 
                        backgroundColor: '#FFFFFF',
                        borderRadius: '4px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onVerify}
                    disabled={!otpValid || remaining<=0 || status==='verifying'}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-white text-sm sm:text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: '#10B981',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      borderRadius: '4px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = '#059669';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#10B981';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.2)';
                    }}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
                      {status==='verifying' ? 'Verifying…' : 'Verify'}
                    </span>
                  </button>
                </div>
                {remaining<=0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: '#D97706', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> 
                    The code has expired. Please resend a new OTP.
                  </div>
                )}
              </div>
            )}

            {message && (
              <div className={`flex items-center gap-1.5 text-xs sm:text-sm`} style={{ color: status==='error' ? '#B91C1C' : '#059669', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {status==='error' ? <XCircle className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> : <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} />} {message}
              </div>
            )}

            {status==='verified' && (
              <div className="p-4 sm:p-5 border transition-all duration-300" style={{ 
                backgroundColor: 'rgba(240, 253, 244, 0.8)', 
                borderColor: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '4px'
              }}>
                <div className="flex items-center gap-2 text-sm sm:text-base mb-3" style={{ color: '#166534', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} /> 
                  <span className="font-semibold">Email verification completed successfully!</span>
                </div>
                <button
                  type="button"
                  onClick={()=>{ setStatus('idle'); setMessage(''); setOtp(''); setExpiresAt(null);} }
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border text-xs sm:text-sm font-medium transition-all duration-300"
                  style={{ 
                    borderColor: 'rgba(16, 185, 129, 0.3)', 
                    color: '#166534',
                    borderRadius: '4px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(220, 252, 231, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> 
                  Verify another email
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
