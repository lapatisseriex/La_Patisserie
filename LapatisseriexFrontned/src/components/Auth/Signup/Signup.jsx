import React, { useState, useContext } from 'react';
import { AuthContext } from '../../../App';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const { changeAuthType } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone field, only allow digits
    if (name === 'phone') {
      setFormData({
        ...formData,
        [name]: value.replace(/\D/g, '')
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    
    // Change to OTP verification screen
    changeAuthType('otp');
  };

  return (
    <div className="py-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-cakeBrown">Create an Account</h2>
          <p className="text-sm text-gray-600 mt-1">Join La Patisserie for delicious treats</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-cakeBrown">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors"
            />
          </div>
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
              name="phone"
              placeholder="Enter your 10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              required
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-cakeBrown">
            Email Address (Optional)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              className="w-full border-2 border-cakeBrown/30 pl-10 py-3 px-4 rounded-md focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink transition-colors"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-cakePink text-white py-3 px-4 rounded-md hover:bg-cakePink-dark transition-colors shadow-md"
        >
          Sign Up
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account? {' '}
            <button 
              type="button" 
              onClick={() => changeAuthType('login')}
              className="text-cakePink font-medium hover:text-cakePink-dark transition-colors"
            >
              Login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
