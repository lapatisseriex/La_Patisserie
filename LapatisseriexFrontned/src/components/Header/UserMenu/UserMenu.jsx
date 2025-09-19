




import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { User } from 'lucide-react';

const UserMenu = memo(() => {
  const { user } = useAuth();
  
  const isProfileIncomplete = user && (!user.name || !user.dob || !user.location);

  return (
    <Link 
      to="/profile" 
      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200 relative rounded-none"
      style={{fontFamily: 'sans-serif'}}
      aria-label="My Account"
    >
      <User className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
      
      {isProfileIncomplete && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 animate-pulse rounded-none" />
      )}
    </Link>
  );
});

export default UserMenu;
