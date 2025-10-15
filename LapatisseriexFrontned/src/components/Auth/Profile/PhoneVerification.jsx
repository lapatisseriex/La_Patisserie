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
  const [isEditingNumber, setIsEditingNumber] = useState(false); // New state for editing mode
  const timerRef = useRef(null);

  // Auto-populate phone when user data changes and reset status if verified
  useEffect(() => {
    console.log('PhoneVerification - User data changed:', {
      userPhone: user?.phone,
      phoneVerified: user?.phoneVerified,
      currentPhone: phone,
      currentStatus: status,
      isEditingNumber
    });
    
    // Update phone state whenever user.phone changes (including when it becomes available)
    // But only if we're not currently editing a new number
    if (user?.phone !== phone && !isEditingNumber) {
      setPhone(user?.phone || '');
    }
    
    // Reset verification status to idle if phone is verified to show verified state
    if (user?.phoneVerified && status !== 'idle' && !isEditingNumber) {
      setStatus('idle');
      setMessage('');
      setOtp('');
      setExpiresAt(null);
    }
  }, [user?.phone, user?.phoneVerified, user?.phoneVerifiedAt, isEditingNumber]);

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
      
      // Check if user is authenticated
      if (!authToken) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        return;
      }
      
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
      // Check for authentication errors
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setMessage('Session expired. Please log in again to continue.');
      } else {
        setMessage(err?.response?.data?.error || err.message || 'Failed to send OTP');
      }
    }
  };

  const onVerify = async () => {
    // Check if already verified to prevent duplicate calls (only if same number)
    if (user?.phoneVerified && user?.phone === phone.trim() && !isEditingNumber) {
      setStatus('verified');
      setMessage('Phone number already verified');
      return;
    }
    
    try {
      setStatus('verifying');
      setMessage('');
      
      // Get the auth token
      const authToken = localStorage.getItem('authToken');
      
      // Check if user is authenticated
      if (!authToken) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        return;
      }
      
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
      
      // Update the user's phone number in the database
      try {
        await updateProfile({ 
          phone: phone.trim(),
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString()
        });
        
        // Refresh user data to get the latest information
        await getCurrentUser();
        
        // Reset editing state
        setIsEditingNumber(false);
        
        console.log('Phone number updated in database successfully');
      } catch (updateError) {
        console.error('Failed to update phone number in database:', updateError);
        setMessage('Phone verified but failed to update in database. Please try refreshing the page.');
      }
      
      // IMPORTANT: Don't update user state here to avoid conflicts
      // The phone is already verified in the database
      // Trigger edit mode so user can save their profile
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
      
      setExpiresAt(null);
    } catch (err) {
      setStatus('error');
      // Check for authentication errors
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setMessage('Session expired. Please log in again to continue.');
      } else {
        setMessage(err?.response?.data?.error || err.message || 'Invalid OTP');
      }
    }
  };

  const phoneValid = useMemo(() => /^\+?[0-9]{10,15}$/.test(phone || ''), [phone]);
  const otpValid = useMemo(() => /^(\d){6}$/.test(otp || ''), [otp]);
  
  // Function to handle changing the phone number
  const handleChangeNumber = () => {
    setIsEditingNumber(true);
    setStatus('idle');
    setMessage('');
    setOtp('');
    setExpiresAt(null);
    setPhone(''); // Clear the current phone number to allow entering a new one
  };
  
  // Effect to sync component state with user state changes
  useEffect(() => {
    if (user?.phoneVerified && status !== 'verified' && !isEditingNumber) {
      console.log('PhoneVerification - User is verified, updating component status');
      setStatus('verified');
      setPhone(user.phone || '');
    } else if (!user?.phoneVerified && status === 'verified' && !isEditingNumber) {
      console.log('PhoneVerification - User verification revoked, resetting component');
      setStatus('idle');
    }
  }, [user?.phoneVerified, user?.phone, isEditingNumber]);

  // Debug log for render
  console.log('PhoneVerification render - Current state:', {
    userPhoneVerified: user?.phoneVerified,
    userPhone: user?.phone,
    userPhoneVerifiedAt: user?.phoneVerifiedAt,
    componentPhone: phone,
    componentStatus: status,
    isEditingNumber,
    renderTimestamp: new Date().toISOString()
  });
  
  return (
    <div className="mt-8 border border-gray-200 overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center gap-3" style={{ backgroundColor: '#DBEAFE' }}>
        <div className="p-2 border border-blue-300" style={{ backgroundColor: '#EFF6FF' }}>
          <ShieldCheck size={22} style={{ color: '#2563EB' }} />
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-semibold" style={{ color: '#281c20' }}>Phone verification</h4>
          <p className="text-xs sm:text-sm" style={{ color: '#6B7280' }}>Verify your phone number to receive order updates and delivery notifications</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4" style={{ backgroundColor: '#F0F9FF' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-start">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1" style={{ color: '#2563EB', display: 'block' }}>Phone number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                disabled={status === 'sending' || status === 'verifying' || (user?.phoneVerified && !isEditingNumber)}
                className="w-full pl-10 pr-3 py-3 border"
                style={{ 
                  borderColor: '#93C5FD',
                  color: '#281c20',
                  backgroundColor: (user?.phoneVerified && !isEditingNumber) || status === 'sending' || status === 'verifying' ? '#F9FAFB' : '#FFFFFF'
                }}
              />
            </div>
            {((user?.phoneVerified && !isEditingNumber) || status === 'verified') && (
              <div className="mt-2 flex items-start gap-1 flex-col">
                <div className="inline-flex items-center text-sm" style={{ color: '#10B981' }}>
                  <CheckCircle2 size={16} className="mr-1"/> 
                  {status === 'verified' && !user?.phoneVerified 
                    ? 'Verified - Click "Save Profile" to complete' 
                    : `Verified on ${user?.phoneVerifiedAt ? new Date(user.phoneVerifiedAt).toLocaleDateString() : '—'}`}
                </div>
                <div className="text-sm" style={{ color: '#374151' }}>
                  {status === 'verified' && !user?.phoneVerified 
                    ? <span>Phone number <span className="font-medium">{phone}</span> is verified. Save your profile to complete the process.</span>
                    : <span>Your verified phone number: <span className="font-medium">{user.phone}</span></span>}
                </div>
              </div>
            )}
            {isEditingNumber && (
              <div className="mt-2 text-sm" style={{ color: '#2563EB' }}>
                Enter your new phone number and click "Send OTP" to verify it.
              </div>
            )}
          </div>
          <div className="flex sm:justify-end items-end">
            {((!user?.phoneVerified && status !== 'verified') || isEditingNumber) && (
              <button
                type="button"
                onClick={onSend}
                disabled={!phoneValid || (!canResend && status === 'sent') || status === 'sending' || status === 'verifying'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: '#2563EB' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              >
                <Send size={16}/> {status === 'sending' ? 'Sending…' : canResend ? 'Send OTP' : 'Resend in ' + formatTime(remaining)}
              </button>
            )}
            {(status === 'verified' && !user?.phoneVerified) && (
              <div className="text-center">
                <div className="inline-flex items-center text-sm font-medium mb-1" style={{ color: '#10B981' }}>
                  <CheckCircle2 size={16} className="mr-1"/> Phone Verified!
                </div>
                <div className="text-xs font-medium" style={{ color: '#EA580C' }}>Profile is now in edit mode - scroll down to "Save Profile"</div>
              </div>
            )}
            {user?.phoneVerified && !isEditingNumber && (
              <div className="px-4 py-3 border flex items-center" style={{ backgroundColor: '#F0F9FF', borderColor: '#93C5FD', color: '#1E40AF' }}>
                <CheckCircle2 size={16} className="mr-2" style={{ color: '#10B981' }}/> Verified
              </div>
            )}
          </div>
        </div>

        {status === 'sent' && (
          <div className="border p-4" style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2" style={{ color: '#1E40AF' }}>
                <Timer size={18} style={{ color: '#3B82F6' }}/>
                <span className="text-sm font-medium">OTP expires in</span>
              </div>
              <span className="font-mono text-sm px-3 py-1 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#93C5FD', color: '#2563EB' }}>{formatTime(remaining)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1" style={{ color: '#2563EB', display: 'block' }}>Enter 6-digit code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  className="w-full px-3 py-3 border tracking-widest text-center font-semibold text-lg"
                  style={{ borderColor: '#93C5FD', color: '#281c20', backgroundColor: '#FFFFFF' }}
                />
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={!otpValid || remaining <= 0 || status === 'verifying'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: '#10B981' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
              >
                <ShieldCheck size={16}/> {status === 'verifying' ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            {remaining <= 0 && (
              <div className="mt-2 flex items-center text-sm" style={{ color: '#D97706' }}>
                <XCircle size={16} className="mr-1"/> The code has expired. Please resend a new OTP.
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 text-sm" style={{ color: status === 'error' ? '#B91C1C' : '#059669' }}>
            {status === 'error' ? <XCircle size={16}/> : <CheckCircle2 size={16}/>} {message}
          </div>
        )}

        {user?.phoneVerified && !isEditingNumber && (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleChangeNumber}
              className="inline-flex items-center gap-2 px-3 py-2 border transition-colors"
              style={{ borderColor: '#93C5FD', color: '#2563EB' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RefreshCcw size={16}/> Change Number
            </button>
          </div>
        )}

        {isEditingNumber && (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditingNumber(false);
                setPhone(user?.phone || '');
                setStatus('idle');
                setMessage('');
                setOtp('');
                setExpiresAt(null);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 border transition-colors"
              style={{ borderColor: '#D1D5DB', color: '#374151' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerification;