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
    <div className="space-y-2">
      <label className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{
        color: '#733857',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '0.02em'
      }}>
        <Phone className="h-3 w-3 sm:h-4 sm:w-4" style={{color: 'rgba(115, 56, 87, 0.6)'}} strokeWidth={1.5} />
        Phone Number {!user?.phoneVerified && <span style={{color: '#733857'}}>*</span>}
      </label>
      <div className="space-y-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              disabled={status === 'sending' || status === 'verifying' || (user?.phoneVerified && !isEditingNumber)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border transition-all duration-300 outline-none ${
                (user?.phoneVerified && !isEditingNumber) || status === 'sending' || status === 'verifying'
                  ? 'border-gray-200 bg-gray-50 text-gray-700' 
                  : 'border-gray-300 focus:border-[#733857] bg-white shadow-sm focus:shadow-md text-black'
              }`}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                borderRadius: '4px'
              }}
            />
          </div>
          {((user?.phoneVerified && !isEditingNumber) || status === 'verified') && (
            <div className="mt-2 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: '#10B981', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> 
                {status === 'verified' && !user?.phoneVerified 
                  ? 'Verified - Click "Save Profile" to complete' 
                  : `Verified on ${user?.phoneVerifiedAt ? new Date(user.phoneVerifiedAt).toLocaleDateString() : '—'}`}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: '#374151', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {status === 'verified' && !user?.phoneVerified 
                  ? <span>Phone number <span className="font-semibold">{phone}</span> is verified. Save your profile to complete the process.</span>
                  : <span>Your verified phone number: <span className="font-semibold">{user.phone}</span></span>}
              </div>
            </div>
          )}
          {isEditingNumber && (
            <div className="mt-2 text-xs sm:text-sm" style={{ color: '#733857', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Enter your new phone number and click "Send OTP" to verify it.
            </div>
          )}
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {((!user?.phoneVerified && status !== 'verified') || isEditingNumber) && (
            <button
              type="button"
              onClick={onSend}
              disabled={!phoneValid || (!canResend && status === 'sent') || status === 'sending' || status === 'verifying'}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 text-white text-sm sm:text-base font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {status === 'sending' ? 'Sending…' : canResend ? 'Send OTP' : 'Resend in ' + formatTime(remaining)}
              </span>
            </button>
          )}
          {(status === 'verified' && !user?.phoneVerified) && (
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold mb-1" style={{ color: '#10B981', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> Phone Verified!
              </div>
              <div className="text-[10px] sm:text-xs font-medium" style={{ color: '#EA580C', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Profile is now in edit mode - scroll down to "Save Profile"
              </div>
            </div>
          )}
          {user?.phoneVerified && !isEditingNumber && (
            <div className="px-4 py-2.5 sm:py-3 border inline-flex items-center gap-1.5 text-sm sm:text-base font-medium" style={{ 
              backgroundColor: 'rgba(240, 253, 244, 0.5)', 
              borderColor: 'rgba(16, 185, 129, 0.2)', 
              color: '#166534',
              borderRadius: '4px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} /> Verified
            </div>
          )}
        </div>

        {status === 'sent' && (
          <div className="border p-4 sm:p-6" style={{ 
            borderColor: 'rgba(190, 24, 93, 0.15)', 
            backgroundColor: 'rgba(253, 242, 248, 0.5)',
            borderRadius: '4px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ color: '#831843' }}>
                <Timer className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} style={{ color: '#BE185D' }}/>
                <span>OTP expires in</span>
              </div>
              <span className="font-mono text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 border" style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: 'rgba(190, 24, 93, 0.2)', 
                color: '#BE185D',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, monospace'
              }}>{formatTime(remaining)}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2" style={{ color: '#831843', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Enter 6-digit code
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  className="w-full px-4 py-3 sm:py-4 border tracking-widest text-center font-bold text-lg sm:text-xl transition-all duration-300 focus:outline-none"
                  style={{ 
                    borderColor: 'rgba(190, 24, 93, 0.2)', 
                    color: '#281c20', 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '4px',
                    fontFamily: 'ui-monospace, monospace'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#BE185D';
                    e.target.style.boxShadow = '0 0 0 3px rgba(190, 24, 93, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(190, 24, 93, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={onVerify}
                disabled={!otpValid || remaining <= 0 || status === 'verifying'}
                className="w-full px-6 py-3 sm:py-3.5 text-white text-sm sm:text-base font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#10B981',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  borderRadius: '4px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.15)';
                }}
              >
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2}/> 
                {status === 'verifying' ? 'Verifying…' : 'Verify Phone'}
              </button>
            </div>
            {remaining <= 0 && (
              <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ color: '#D97706', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <XCircle className="h-4 w-4" strokeWidth={2}/> 
                The code has expired. Please resend a new OTP.
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ 
            color: status === 'error' ? '#B91C1C' : '#059669',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {status === 'error' ? <XCircle className="h-4 w-4" strokeWidth={2}/> : <CheckCircle2 className="h-4 w-4" strokeWidth={2}/>} 
            {message}
          </div>
        )}

        {user?.phoneVerified && !isEditingNumber && (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleChangeNumber}
              className="inline-flex items-center gap-2 px-4 py-2.5 border text-xs sm:text-sm font-medium transition-all duration-300"
              style={{ 
                borderColor: 'rgba(115, 56, 87, 0.2)', 
                color: '#733857',
                backgroundColor: 'transparent',
                borderRadius: '4px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(115, 56, 87, 0.05)';
                e.currentTarget.style.borderColor = '#733857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(115, 56, 87, 0.2)';
              }}
            >
              <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2}/> Change Number
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
              className="inline-flex items-center gap-2 px-4 py-2.5 border text-xs sm:text-sm font-medium transition-all duration-300"
              style={{ 
                borderColor: 'rgba(107, 114, 128, 0.2)', 
                color: '#374151',
                backgroundColor: 'transparent',
                borderRadius: '4px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#9CA3AF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.2)';
              }}
            >
              Cancel
            </button>
          </div>
        )}
    </div>
  );
};

export default PhoneVerification;