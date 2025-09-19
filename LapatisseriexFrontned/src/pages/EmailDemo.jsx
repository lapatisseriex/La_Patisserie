import React from 'react';
import EmailVerification from '../components/Auth/EmailVerification';
import { useAuth } from '../context/AuthContext/AuthContext';

const EmailDemo = () => {
  const { user } = useAuth();
  const [email, setEmail] = React.useState(user?.email || '');
  const [isVerified, setIsVerified] = React.useState(user?.isEmailVerified || false);

  const handleVerificationSuccess = (verifiedEmail) => {
    console.log('Email verification successful:', verifiedEmail);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4">
      <h2 className="text-2xl font-bold mb-4">Email Management</h2>
      <p className="mb-6 text-gray-600">
        Verify your email address to receive order updates and special offers.
      </p>
      
      <EmailVerification
        email={email}
        setEmail={setEmail}
        isVerified={isVerified}
        setIsVerified={setIsVerified}
        onVerificationSuccess={handleVerificationSuccess}
        showChangeEmail={true}
      />
    </div>
  );
};

export default EmailDemo;