import React, { useState, useRef, useContext } from 'react';
import { AuthContext } from '../../../App';

const OTPVerify = () => {
  const { changeAuthType } = useContext(AuthContext);
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  
  // Mock phone number for display
  const phone = "1234567890";
  const isNewUser = false;
  
  // Handle OTP input change
  const handleChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus to next input
      if (value && index < 3) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  // Handle key press for backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // Handle paste functionality
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4).split('');
    if (pastedData.length === 4 && pastedData.every(char => /^[0-9]$/.test(char))) {
      setOtp(pastedData);
      inputRefs.current[3].focus();
    }
  };
  
  // Handle OTP verification
  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 4) {
      alert('Please enter a valid 4-digit OTP');
      return;
    }
    
    // Simulate successful login
    window.location.href = '/';
  };
  
  // Handle resend OTP
  const handleResendOtp = () => {
    alert('OTP resend feature would be implemented here');
  };
  
  return (
    <div className="py-6">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-cakeBrown">Verify OTP</h2>
          <p className="text-sm text-gray-600 mt-2">
            We've sent a verification code to {phone && `+91 ${phone.slice(0, 5)}*****`}
          </p>
        </div>
        
        <div className="flex justify-center space-x-4 mb-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : null}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-cakeBrown/30 rounded-md focus:border-cakePink focus:ring-1 focus:ring-cakePink focus:outline-none transition-colors shadow-sm"
              maxLength={1}
              autoFocus={index === 0}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-cakePink text-white py-3 px-4 rounded-md hover:bg-cakePink-dark transition-colors shadow-md"
        >
          Verify OTP
        </button>
        
        <div className="flex justify-between text-sm">
          <button
            type="button"
            onClick={handleResendOtp}
            className="text-cakePink hover:text-cakePink-dark transition-colors"
          >
            Resend OTP
          </button>
          
          <button
            type="button"
            onClick={() => changeAuthType(isNewUser ? 'signup' : 'login')}
            className="text-cakePink font-medium hover:text-cakePink-dark transition-colors"
          >
            Change Number
          </button>
        </div>
      </form>
    </div>
  );
};

export default OTPVerify;
