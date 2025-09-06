import React, { useState, useContext } from 'react';
import { AuthContext } from '../../../App';

const Login = () => {
  const [phone, setPhone] = useState('');
  const { changeAuthType } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    
    // Change to OTP verification screen
    changeAuthType('otp');
  };

  return (
    <div className="py-6">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-cakeBrown">Login to La Patisserie</h2>
          <p className="text-sm text-gray-600 mt-1">Please enter your mobile number</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-cakeBrown">
            Mobile Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <input
              type="tel"
              id="phone"
              placeholder="Enter your 10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-cakePink text-white py-3 px-4 rounded-md hover:bg-cakePink-dark transition-colors shadow-md"
        >
          Send OTP
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={() => changeAuthType('signup')}
              className="text-cakePink font-medium hover:text-cakePink-dark transition-colors"
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
