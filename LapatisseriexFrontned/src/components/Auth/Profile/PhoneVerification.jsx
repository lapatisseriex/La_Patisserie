import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, ShieldCheck, Phone, Timer, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';

const formatTime = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const PhoneVerification = ({ onVerificationSuccess }) => {
  const { user, updateUser, updateProfile, getCurrentUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle'); // idle|sending|sent|verifying|verified|error
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState(null); // timestamp
  const timerRef = useRef(null);

  // Auto-populate phone when user data changes and reset status if verified
  useEffect(() => {
    console.log('PhoneVerification - User data changed:', {
      userPhone: user?.phone,
      phoneVerified: user?.phoneVerified,
      currentPhone: phone,
      currentStatus: status
    });
    
    // Update phone state whenever user.phone changes (including when it becomes available)
    if (user?.phone !== phone) {
      setPhone(user?.phone || '');
    }
    
    // Reset verification status to idle if phone is verified to show verified state
    if (user?.phoneVerified && status !== 'idle') {
      setStatus('idle');
      setMessage('');
      setOtp('');
      setExpiresAt(null);
    }
  }, [user?.phone, user?.phoneVerified, user?.phoneVerifiedAt]);

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
      
      // Get the auth token
      const authToken = localStorage.getItem('authToken');
      
      // Call Twilio API to send OTP with auth token
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/twilio/send-otp`, 
        { phone: phone.trim() },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      
      setStatus('sent');
      setMessage(response?.data?.message || 'OTP sent successfully. Please check your phone.');
      // Set expiry to 3 minutes (180000ms)
      setExpiresAt(Date.now() + 180000);
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.error || err.message || 'Failed to send OTP');
    }
  };

  const onVerify = async () => {
    // Check if already verified to prevent duplicate calls
    if (user?.phoneVerified && user?.phone === phone.trim()) {
      setStatus('verified');
      setMessage('Phone number already verified');
      return;
    }
    
    try {
      setStatus('verifying');
      setMessage('');
      
      // Get the auth token
      const authToken = localStorage.getItem('authToken');
      
      // Call Twilio API to verify OTP with auth token
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/twilio/verify-otp`, 
        {
          phone: phone.trim(),
          otp: otp.trim()
        },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      
      setStatus('verified');
      setMessage(response?.data?.message || 'Phone number verified successfully');
      
      console.log('Phone verification completed successfully - triggering edit mode');
      
      // IMPORTANT: Don't update user state here to avoid conflicts
      // The phone is already verified in the database
      // Trigger edit mode so user can save their profile
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
      
      // When user clicks "Save Profile", the latest data will be fetched and saved
      // This keeps the user in edit mode until they explicitly save
      
      setExpiresAt(null);
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.error || err.message || 'Invalid OTP');
    }
  };

  const phoneValid = useMemo(() => /^\+?[0-9]{10,15}$/.test(phone || ''), [phone]);
  const otpValid = useMemo(() => /^(\d){6}$/.test(otp || ''), [otp]);
  
  // Effect to sync component state with user state changes
  useEffect(() => {
    if (user?.phoneVerified && status !== 'verified') {
      console.log('PhoneVerification - User is verified, updating component status');
      setStatus('verified');
      setPhone(user.phone || '');
    } else if (!user?.phoneVerified && status === 'verified') {
      console.log('PhoneVerification - User verification revoked, resetting component');
      setStatus('idle');
    }
  }, [user?.phoneVerified, user?.phone]);

  // Debug log for render
  console.log('PhoneVerification render - Current state:', {
    userPhoneVerified: user?.phoneVerified,
    userPhone: user?.phone,
    userPhoneVerifiedAt: user?.phoneVerifiedAt,
    componentPhone: phone,
    componentStatus: status,
    renderTimestamp: new Date().toISOString()
  });
  
  return (
    <div className="mt-8 rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center gap-3">
        <ShieldCheck className="text-blue-600" size={22} />
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Phone verification</h4>
          <p className="text-xs sm:text-sm text-gray-600">Verify your phone number to receive order updates and delivery notifications</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-start">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                disabled={status === 'sending' || status === 'verifying' || user?.phoneVerified}
                className={`w-full pl-10 pr-3 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent ${user?.phoneVerified ? 'bg-gray-50 text-gray-700' : ''}`}
              />
            </div>
            {(user?.phoneVerified || status === 'verified') && (
              <div className="mt-2 flex items-start gap-1 flex-col">
                <div className="inline-flex items-center text-green-600 text-sm">
                  <CheckCircle2 size={16} className="mr-1"/> 
                  {status === 'verified' && !user?.phoneVerified 
                    ? 'Verified - Click "Save Profile" to complete' 
                    : `Verified on ${user?.phoneVerifiedAt ? new Date(user.phoneVerifiedAt).toLocaleDateString() : '—'}`}
                </div>
                <div className="text-sm text-gray-700">
                  {status === 'verified' && !user?.phoneVerified 
                    ? <span>Phone number <span className="font-medium">{phone}</span> is verified. Save your profile to complete the process.</span>
                    : <span>Your verified phone number: <span className="font-medium">{user.phone}</span></span>}
                </div>
              </div>
            )}
          </div>
          <div className="flex sm:justify-end items-end">
            {(!user?.phoneVerified && status !== 'verified') && (
              <button
                type="button"
                onClick={onSend}
                disabled={!phoneValid || (!canResend && status === 'sent') || status === 'sending' || status === 'verifying'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white bg-black hover:bg-gray-800 disabled:opacity-60"
              >
                <Send size={16}/> {status === 'sending' ? 'Sending…' : canResend ? 'Send OTP' : 'Resend in ' + formatTime(remaining)}
              </button>
            )}
            {(status === 'verified' && !user?.phoneVerified) && (
              <div className="text-center">
                <div className="inline-flex items-center text-green-600 text-sm font-medium mb-1">
                  <CheckCircle2 size={16} className="mr-1"/> Phone Verified!
                </div>
                <div className="text-xs text-orange-600 font-medium">Profile is now in edit mode - scroll down to "Save Profile"</div>
              </div>
            )}
            {user?.phoneVerified && (
              <div className="px-4 py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-md flex items-center">
                <CheckCircle2 size={16} className="mr-2 text-green-600"/> Verified
              </div>
            )}
          </div>
        </div>

        {status === 'sent' && (
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
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  className="w-full px-3 py-3 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent tracking-widest text-center font-semibold text-lg"
                />
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={!otpValid || remaining <= 0 || status === 'verifying'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
              >
                <ShieldCheck size={16}/> {status === 'verifying' ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            {remaining <= 0 && (
              <div className="mt-2 flex items-center text-amber-700 text-sm">
                <XCircle size={16} className="mr-1"/> The code has expired. Please resend a new OTP.
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`flex items-center gap-2 text-sm ${status === 'error' ? 'text-red-700' : 'text-green-700'}`}>
            {status === 'error' ? <XCircle size={16}/> : <CheckCircle2 size={16}/>} {message}
          </div>
        )}

        {status === 'verified' && (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => { setStatus('idle'); setMessage(''); setOtp(''); setExpiresAt(null); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              <RefreshCcw size={16}/> Verify another number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerification;