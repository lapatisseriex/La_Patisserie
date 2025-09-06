import React from 'react';
import { useAuth } from '../context/AuthContext/AuthContext';
import Profile from '../components/Auth/Profile/Profile';

const ProfilePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center">
        <h2 className="text-xl font-medium text-gray-700 mb-2">Please log in to view your profile</h2>
        <p className="text-gray-500">You need to be logged in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-cakeBrown mb-6">Your Profile</h1>
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
