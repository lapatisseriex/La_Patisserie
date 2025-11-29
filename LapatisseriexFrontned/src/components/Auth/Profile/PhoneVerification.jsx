import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, ShieldCheck, Phone, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { auth } from '../../../config/firebase';
import { RecaptchaVerifier, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { toast } from 'react-toastify';

const formatTime = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const PhoneVerification = ({ onVerificationSuccess, lockPhone = false }) => {
  const { user, updateUser, updateProfile, getCurrentUser } = useAuth();
  
  // Initialize phone state by extracting country code if present
  const initializePhone = (userPhone) => {
    if (!userPhone) return { code: '+91', number: '' };
    
    const countryCodes = ['+91'];
    
    for (const code of countryCodes) {
      if (userPhone.startsWith(code)) {
        return {
          code: code,
          number: userPhone.substring(code.length)
        };
      }
    }
    
    // If no country code found, assume it's just the number
    return { code: '+91', number: userPhone.replace(/^\+/, '') };
  };
  
  const initialPhone = initializePhone(user?.phone);
  const [phone, setPhone] = useState(initialPhone.number);
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle'); // idle|sending|sent|verifying|verified|error
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState(null); // timestamp
  const [verificationId, setVerificationId] = useState(null); // Store verification ID instead of confirmation
  const timerRef = useRef(null);

  // Country codes with flags
  const countryCodes = [
    { code: '+91', flag: '🇮🇳', country: 'India' },
  
  ];

  // Cleanup reCAPTCHA on component unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (error) {
          console.error('Error clearing reCAPTCHA on unmount:', error);
        }
        window.recaptchaVerifier = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-populate phone when user data changes and reset status if verified
  useEffect(() => {
    console.log('PhoneVerification - User data changed:', {
      userPhone: user?.phone,
      phoneVerified: user?.phoneVerified,
      currentPhone: phone,
      currentCountryCode: countryCode,
      currentStatus: status
    });
    
    // Update phone state whenever user.phone changes (including when it becomes available)
    if (user?.phone) {
      const fullPhone = user.phone;
      const currentFullPhone = countryCode + phone;
      
      // Only update if the full phone number is different
      if (fullPhone !== currentFullPhone) {
        // Extract country code and phone number
        let extractedCode = '+91'; // default
        let extractedPhone = fullPhone;
        
        // Try to extract country code
        if (fullPhone.startsWith('+91')) {
          extractedCode = '+91';
          extractedPhone = fullPhone.substring(3); // Remove +91
        } else if (fullPhone.startsWith('91') && fullPhone.length > 10) {
          extractedCode = '+91';
          extractedPhone = fullPhone.substring(2); // Remove 91
        } else {
          // No country code, use as is
          extractedPhone = fullPhone.replace(/^\+/, '');
        }
        
        setCountryCode(extractedCode);
        setPhone(extractedPhone);
      }
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

  // Setup Firebase reCAPTCHA
  const setupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error);
        }
        window.recaptchaVerifier = null;
      }

      const container = document.getElementById('recaptcha-container-profile');
      if (!container) {
        throw new Error('reCAPTCHA container not found');
      }

      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        container,
        {
          size: 'invisible',
          callback: (response) => {
            console.log('reCAPTCHA solved successfully', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            setStatus('error');
            setMessage('Verification expired. Please try again.');
            if (window.recaptchaVerifier) {
              try {
                window.recaptchaVerifier.clear();
              } catch (error) {
                console.error('Error clearing expired reCAPTCHA:', error);
              }
              window.recaptchaVerifier = null;
            }
          }
        }
      );

      console.log('reCAPTCHA verifier created successfully');
      return window.recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      setStatus('error');
      setMessage('Error setting up verification. Please try again.');
      return null;
    }
  };

  const onSend = async () => {
    try {
      setStatus('sending');
      setMessage('');
      setOtp('');
      
      // Setup reCAPTCHA
      const recaptchaVerifier = setupRecaptcha();
      
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      // Format phone number - use selected country code
      let formattedPhoneNumber = phone.trim();
      // Remove any leading zeros
      formattedPhoneNumber = formattedPhoneNumber.replace(/^0+/, '');
      // Add country code
      formattedPhoneNumber = countryCode + formattedPhoneNumber;
      
      console.log('Sending verification code to:', formattedPhoneNumber);
      
      // Use PhoneAuthProvider to get verification ID without signing in
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhoneNumber,
        recaptchaVerifier
      );
      
      console.log('Verification code sent successfully');
      setVerificationId(verificationId);
      setStatus('sent');
      setMessage('OTP sent successfully. Please check your phone.');
      toast.success('OTP sent to your phone!');
      // Set expiry to 3 minutes (180000ms)
      setExpiresAt(Date.now() + 180000);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setStatus('error');
      
      // Handle specific Firebase errors
      let errorMessage = 'Failed to send OTP';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format. Please check and try again.';
            break;
          case 'auth/invalid-app-credential':
            errorMessage = 'Verification service error. Please try again.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Please try again later.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later.';
            break;
          default:
            errorMessage = err.message || 'Failed to send OTP';
        }
      }
      
      setMessage(errorMessage);
      toast.error(errorMessage);
      
      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const onVerify = async () => {
    // Check if already verified to prevent duplicate calls
    if (user?.phoneVerified && user?.phone === phone.trim()) {
      setStatus('verified');
      setMessage('Phone number already verified');
      return;
    }
    
    if (!verificationId) {
      setStatus('error');
      setMessage('Please request OTP first');
      return;
    }
    
    try {
      setStatus('verifying');
      setMessage('');
      
      console.log('Verifying OTP code...');
      
      // Create credential from verification ID and OTP
      const credential = PhoneAuthProvider.credential(verificationId, otp.trim());
      
      // Link the phone credential to the current user WITHOUT replacing the session
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await linkWithCredential(currentUser, credential);
          console.log('Phone credential linked to current user');
        } catch (linkError) {
          // Check if phone is already in use by another account
          if (linkError.code === 'auth/credential-already-in-use') {
            console.error('Phone number is already registered to another account');
            setStatus('error');
            setMessage('This phone number is already registered to another account. Please use a different number.');
            toast.error('Phone number already in use by another account');
            return;
          }
          
          // If provider already linked to this user, that's okay
          if (linkError.code === 'auth/provider-already-linked') {
            console.log('Phone already linked to this account');
          } else {
            throw linkError;
          }
        }
      }
      
      console.log('OTP verified successfully with Firebase');
      
      setStatus('verified');
      setMessage('Phone number verified successfully');
      toast.success('Phone number verified successfully!');
      
      console.log('Phone verification completed successfully - triggering edit mode');
      
      // Format phone number for storage
      let formattedPhoneNumber = phone.trim();
      // Remove any leading zeros
      formattedPhoneNumber = formattedPhoneNumber.replace(/^0+/, '');
      // Add country code
      formattedPhoneNumber = countryCode + formattedPhoneNumber;
      
      // Update the user's phone number in the database
      try {
        await updateProfile({ 
          phone: formattedPhoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString()
        });
        
        // Refresh user data to get the latest information
        await getCurrentUser();
        
        console.log('Phone number updated in database successfully');
      } catch (updateError) {
        console.error('Failed to update phone number in database:', updateError);
        
        // Check if it's a duplicate phone error from backend
        if (updateError.response?.data?.error === 'PHONE_ALREADY_IN_USE') {
          setStatus('error');
          setMessage('This phone number is already registered to another account.');
          toast.error('Phone number already in use by another account');
          return;
        }
        
        setStatus('error');
        setMessage('Phone verified but failed to update in database. Please try refreshing the page.');
        toast.error('Failed to update phone in database');
        return;
      }
      
      // Trigger edit mode so user can save their profile
      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
      
      setExpiresAt(null);
      setVerificationId(null);
      
      // Clear reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setStatus('error');
      
      // Handle specific Firebase errors
      let errorMessage = 'Invalid OTP';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-verification-code':
            errorMessage = 'Invalid verification code. Please try again.';
            break;
          case 'auth/code-expired':
            errorMessage = 'Verification code has expired. Please request a new one.';
            break;
          default:
            errorMessage = err.message || 'Invalid OTP';
        }
      }
      
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const phoneValid = useMemo(() => {
    // Check if phone number has 10 digits (without country code)
    const phoneDigits = phone.replace(/\D/g, '');
    return phoneDigits.length >= 10 && phoneDigits.length <= 15;
  }, [phone]);
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
    <div className="space-y-2 max-w-full overflow-visible">
      <label className="text-xs sm:text-sm font-semibold flex items-center gap-2 relative z-10" style={{
        color: '#733857',
        letterSpacing: '0.02em'
      }}>
        <Phone className="h-3 w-3 sm:h-4 sm:w-4" style={{color: 'rgba(115, 56, 87, 0.6)'}} strokeWidth={1.5} />
        Phone Number {!user?.phoneVerified && <span style={{color: '#733857'}}>*</span>}
      </label>
      <div className="space-y-3 sm:space-y-4 max-w-full">
        <div className="w-full max-w-full">
          <div className="relative flex gap-1.5 sm:gap-2 w-full max-w-full overflow-visible z-0">
            {/* Country Code Selector */}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={lockPhone || status === 'sending' || status === 'verifying' || user?.phoneVerified}
              className={`flex-shrink-0 px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base border-2 transition-all duration-300 outline-none ${
                lockPhone || user?.phoneVerified || status === 'sending' || status === 'verifying'
                  ? 'border-gray-200 bg-gray-50 text-gray-700' 
                  : 'border-gray-300 focus:border-[#733857] bg-white text-black'
              }`}
              style={{
                borderRadius: '4px',
                minWidth: '75px',
                maxWidth: '85px',
                width: '85px',
                cursor: user?.phoneVerified ? 'not-allowed' : 'pointer',
                boxShadow: 'none'
              }}
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            
            {/* Phone Number Input */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                // Only allow digits
                const value = e.target.value.replace(/\D/g, '');
                setPhone(value);
              }}
              placeholder="Enter phone number"
              disabled={lockPhone || status === 'sending' || status === 'verifying' || user?.phoneVerified}
              className={`flex-1 min-w-0 px-2 sm:px-2.5 md:px-3 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base border-2 transition-all duration-300 outline-none ${
                lockPhone || user?.phoneVerified || status === 'sending' || status === 'verifying'
                  ? 'border-gray-200 bg-gray-50 text-gray-700' 
                  : 'border-gray-300 focus:border-[#733857] bg-white text-black'
              }`}
              style={{
                borderRadius: '4px',
                width: '100%',
                maxWidth: '100%',
                boxShadow: 'none'
              }}
            />
          </div>
          {(user?.phoneVerified || status === 'verified') && (
            <div className="mt-2 space-y-1">
             
            
            </div>
          )}
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!user?.phoneVerified && status !== 'verified' && (
            <button
              type="button"
              onClick={onSend}
              disabled={!phoneValid || (!canResend && status === 'sent') || status === 'sending' || status === 'verifying'}
              className="w-full sm:w-auto sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 text-white text-xs sm:text-sm md:text-base font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#733857',
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
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold mb-1" style={{ color: '#10B981'}}>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2} /> Phone Verified!
              </div>
              <div className="text-[10px] sm:text-xs font-medium" style={{ color: '#EA580C'}}>
                Profile is now in edit mode - scroll down to "Save Profile"
              </div>
            </div>
          )}
         
        </div>

        {status === 'sent' && (
          <div className="border p-3 sm:p-4 md:p-6" style={{ 
            borderColor: 'rgba(190, 24, 93, 0.15)', 
            backgroundColor: 'rgba(253, 242, 248, 0.5)',
            borderRadius: '4px'}}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium" style={{ color: '#831843' }}>
                <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" strokeWidth={2} style={{ color: '#BE185D' }}/>
                <span>OTP expires in</span>
              </div>
              <span className="font-mono text-xs sm:text-sm md:text-base px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border" style={{ 
                backgroundColor: '#FFFFFF', 
                borderColor: 'rgba(190, 24, 93, 0.2)', 
                color: '#BE185D',
                borderRadius: '4px'}}>{formatTime(remaining)}</span>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#831843'}}>
                  Enter 6-digit code
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-4 border tracking-widest text-center font-bold text-base sm:text-lg md:text-xl transition-all duration-300 focus:outline-none"
                  style={{ 
                    borderColor: 'rgba(190, 24, 93, 0.2)', 
                    color: '#281c20', 
                    backgroundColor: '#FFFFFF',
                    borderRadius: '4px'}}
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
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 md:py-3.5 text-white text-xs sm:text-sm md:text-base font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 sm:gap-2"
                style={{ 
                  backgroundColor: '#10B981',
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
              <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ color: '#D97706'}}>
                <XCircle className="h-4 w-4" strokeWidth={2}/> 
                The code has expired. Please resend a new OTP.
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ 
            color: status === 'error' ? '#B91C1C' : '#059669'}}>
            {status === 'error' ? <XCircle className="h-4 w-4" strokeWidth={2}/> : <CheckCircle2 className="h-4 w-4" strokeWidth={2}/>} 
            {message}
          </div>
        )}
        
        {/* Hidden reCAPTCHA container for Firebase phone verification */}
        <div id="recaptcha-container-profile"></div>
    </div>
  );
};

export default PhoneVerification;