// import React, { useState, useRef, useEffect, memo } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../../context/AuthContext/AuthContext';
// import { 
//   User, 
//   Settings, 
//   Package, 
//   ShoppingCart, 
//   LogOut, 
//   UserCircle, 
//   Crown,
//   History,
//   AlertCircle,
//   Sparkles,
//   Power
// } from 'lucide-react';

// // Using memo to prevent unnecessary re-renders
// const UserMenu = memo(() => {
//   const { user, logout, toggleAuthPanel, changeAuthType } = useAuth();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);
//   const dropdownRef = useRef(null);
  
//   const isAdmin = user?.role === 'admin';
//   const isProfileIncomplete = user && (!user.name || !user.dob || !user.location);
  
//   // Store previous user data to avoid excessive logging
//   const prevUserRef = useRef({
//     id: user?.uid,
//     name: user?.name,
//     location: user?.location?._id
//   });
  
//   // Debug user information - only when important data changes
//   useEffect(() => {
//     if (user) {
//       const hasImportantChange = 
//         prevUserRef.current.id !== user.uid ||
//         prevUserRef.current.name !== user.name ||
//         prevUserRef.current.location !== user.location?._id;
        
//       if (hasImportantChange) {
//         console.log('UserMenu - User Data Updated:', {
//           name: user.name,
//           dob: user.dob,
//           location: user.location,
//           phone: user.phone,
//           isProfileIncomplete
//         });
        
//         // Update the reference
//         prevUserRef.current = {
//           id: user.uid,
//           name: user.name,
//           location: user.location?._id
//         };
//       }
//     }
//   }, [user]);
  
//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsMenuOpen(false);
//       }
//     };
    
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);
  
//   // Handle logout
//   const handleLogout = async () => {
//     await logout();
//     setIsMenuOpen(false);
//   };
  
//   // Handle profile completion
//   const handleCompleteProfile = () => {
//     setIsMenuOpen(false);
//     changeAuthType('profile');
//     toggleAuthPanel(); // Open the auth panel with profile form
//   };

//   // Toggle menu
//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {/* Main User Button - Clean Light Design */}
//       <button
//         onClick={toggleMenu}
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//         className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200 relative"
//         style={{fontFamily: 'sans-serif'}}
//         aria-expanded={isMenuOpen}
//         aria-haspopup="true"
//       >
//         <User className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
        
//         {/* Profile Status Indicator */}
//         {isProfileIncomplete && (
//           <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//         )}
//       </button>
      
//       {/* Dropdown Menu - Clean Light Design */}
//       {isMenuOpen && (
//         <div className="absolute right-0 mt-3 w-72 z-50">
//           {/* Main Menu Container */}
//           <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100">
            
//             {/* User Info Header - Light Theme */}
//             <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
//                     <UserCircle className="h-5 w-5 text-gray-600" />
//                   </div>
//                   <div>
//                     <h3 className="text-base font-medium text-gray-900">
//                       {user?.name || 'Guest User'}
//                     </h3>
//                     <p className="text-xs text-gray-500 mt-1">
//                       {user?.phone || 'Welcome to La Patisserie'}
//                     </p>
//                   </div>
//                 </div>
                
//                 {/* Status Badge */}
//                 {isAdmin && (
//                   <div className="px-3 py-1.5 bg-white rounded-full flex items-center gap-1.5 border border-gray-200 shadow-sm">
//                     <Crown className="h-3 w-3 text-yellow-600" />
//                     <span className="text-xs font-medium text-gray-700">ADMIN</span>
//                   </div>
//                 )}
//               </div>
                
//               {/* Profile Completion Notice - Light Theme */}
//               {isProfileIncomplete && (
//                 <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
//                   <div className="flex items-center gap-2">
//                     <AlertCircle className="h-4 w-4 text-orange-500" />
//                     <p className="text-xs text-orange-700 font-medium">
//                       Complete your profile for the full experience
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* Menu Items */}
//             <div className="py-3 px-2">
//               {isAdmin ? (
//                 <>
//                   <MenuItem
//                     to="/admin/dashboard"
//                     label="DASHBOARD"
//                     icon={Settings}
//                     onClick={() => setIsMenuOpen(false)}
//                   />
//                   <MenuItem
//                     to="/admin/orders"
//                     label="ORDER MANAGEMENT"
//                     icon={Package}
//                     onClick={() => setIsMenuOpen(false)}
//                   />
//                 </>
//               ) : (
//                 <>
//                   {/* Complete Profile Button */}
//                   {isProfileIncomplete && (
//                     <MenuButton
//                       onClick={handleCompleteProfile}
//                       label="COMPLETE PROFILE"
//                       icon={Sparkles}
//                       priority
//                     />
//                   )}
                  
//                   <MenuItem
//                     to="/profile"
//                     label="MY PROFILE"
//                     icon={UserCircle}
//                     onClick={() => setIsMenuOpen(false)}
//                   />
//                   <MenuItem
//                     to="/orders"
//                     label="ORDER HISTORY"
//                     icon={History}
//                     onClick={() => setIsMenuOpen(false)}
//                   />
//                 </>
//               )}
              
//               <MenuItem
//                 to="/cart"
//                 label="SHOPPING BOX"
//                 icon={ShoppingCart}
//                 onClick={() => setIsMenuOpen(false)}
//               />
              
//               {/* Logout Button - Light Clean Styling */}
//               <div className="mt-4 px-2">
//                 <button 
//                   onClick={handleLogout}
//                   className="
//                     w-full px-4 py-3
//                     bg-red-50 text-red-700 text-sm font-medium
//                     rounded-xl border border-red-200
//                     hover:bg-red-100 hover:text-red-800 hover:border-red-300
//                     transition-all duration-300
//                     group relative overflow-hidden
//                     flex items-center justify-center gap-2
//                   "
//                 >
//                   <Power className="h-4 w-4" />
//                   <span className="relative z-10">SIGN OUT</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// // MenuItem Component - Light Clean Design with Icons
// const MenuItem = ({ to, label, onClick, icon: IconComponent }) => (
//   <Link
//     to={to}
//     onClick={onClick}
//     className="
//       flex items-center gap-3 px-4 py-3 mx-2 mb-1
//       text-gray-600 text-sm font-medium
//       hover:text-black hover:bg-gray-50
//       rounded-lg transition-all duration-300
//       group relative overflow-hidden
//       border border-transparent hover:border-gray-200
//     "
//     style={{fontFamily: 'sans-serif'}}
//   >
//     {IconComponent && (
//       <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
//         <IconComponent className="h-4 w-4 text-gray-500 group-hover:text-black transition-colors duration-300" />
//       </div>
//     )}
//     <span className="relative z-10">{label}</span>
//     <div className="absolute left-0 top-0 h-full w-0.5 bg-black transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
//   </Link>
// );

// // MenuButton Component - Light Clean Design with Icons
// const MenuButton = ({ onClick, label, priority = false, icon: IconComponent }) => (
//   <button
//     onClick={onClick}
//     className={`
//       flex items-center gap-3 w-full px-4 py-3 mx-2 mb-2
//       text-sm font-medium text-left
//       rounded-lg transition-all duration-300
//       group relative overflow-hidden
//       ${priority 
//         ? 'bg-black text-white hover:bg-gray-800 border border-gray-200 shadow-sm' 
//         : 'text-gray-600 hover:bg-gray-50 hover:text-black border border-transparent hover:border-gray-200'
//       }
//     `}
//     style={{fontFamily: 'sans-serif'}}
//   >
//     {IconComponent && (
//       <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
//         <IconComponent className={`h-4 w-4 transition-colors duration-300 ${
//           priority ? 'text-white' : 'text-gray-500 group-hover:text-black'
//         }`} />
//       </div>
//     )}
//     <span className="relative z-10">{label}</span>
//     {!priority && (
//       <div className="absolute left-0 top-0 h-full w-0.5 bg-black transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
//     )}
//   </button>
// );

// export default UserMenu;






import React, { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { 
  User, 
  Settings, 
  Package, 
  ShoppingCart, 
  UserCircle, 
  Crown,
  History,
  AlertCircle,
  Sparkles,
  Power
} from 'lucide-react';

const UserMenu = memo(() => {
  const { user, logout, toggleAuthPanel, changeAuthType } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const isAdmin = user?.role === 'admin';
  const isProfileIncomplete = user && (!user.name || !user.dob || !user.location);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };
  
  const handleCompleteProfile = () => {
    setIsMenuOpen(false);
    changeAuthType('profile');
    toggleAuthPanel();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main User Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200 relative rounded-none"
        style={{fontFamily: 'sans-serif'}}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <User className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
        
        {isProfileIncomplete && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 animate-pulse rounded-none" />
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-3 w-72 z-50">
          <div className="bg-white shadow-2xl border border-gray-100 rounded-none overflow-hidden">
            
            {/* User Info Header */}
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 rounded-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white flex items-center justify-center border border-gray-200 shadow-sm rounded-none">
                    <UserCircle className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {user?.name || 'Guest User'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {user?.phone || 'Welcome to La Patisserie'}
                    </p>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="px-3 py-1.5 bg-white flex items-center gap-1.5 border border-gray-200 shadow-sm rounded-none">
                    <Crown className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs font-medium text-gray-700">ADMIN</span>
                  </div>
                )}
              </div>
                
              {isProfileIncomplete && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-none">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-orange-700 font-medium">
                      Complete your profile for the full experience
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Menu Items */}
            <div className="py-3 px-2">
              {isAdmin ? (
                <>
                  <MenuItem
                    to="/admin/dashboard"
                    label="DASHBOARD"
                    icon={Settings}
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <MenuItem
                    to="/admin/orders"
                    label="ORDER MANAGEMENT"
                    icon={Package}
                    onClick={() => setIsMenuOpen(false)}
                  />
                </>
              ) : (
                <>
                  {isProfileIncomplete && (
                    <MenuButton
                      onClick={handleCompleteProfile}
                      label="COMPLETE PROFILE"
                      icon={Sparkles}
                      priority
                    />
                  )}
                  
                  <MenuItem
                    to="/profile"
                    label="MY PROFILE"
                    icon={UserCircle}
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <MenuItem
                    to="/orders"
                    label="ORDER HISTORY"
                    icon={History}
                    onClick={() => setIsMenuOpen(false)}
                  />
                </>
              )}
              
              <MenuItem
                to="/cart"
                label="SHOPPING BOX"
                icon={ShoppingCart}
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Logout Button */}
              <div className="mt-4 px-2">
                <button 
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-3
                    bg-red-50 text-red-700 text-sm font-medium
                    rounded-none border border-red-200
                    hover:bg-red-100 hover:text-red-800 hover:border-red-300
                    transition-all duration-300
                    flex items-center justify-center gap-2
                  "
                >
                  <Power className="h-4 w-4" />
                  <span className="relative z-10">SIGN OUT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// MenuItem Component - sharp corners
const MenuItem = ({ to, label, onClick, icon: IconComponent }) => (
  <Link
    to={to}
    onClick={onClick}
    className="
      flex items-center gap-3 px-4 py-3 mx-2 mb-1
      text-gray-600 text-sm font-medium
      hover:text-black hover:bg-gray-50
      transition-all duration-300
      group relative overflow-hidden
      border border-transparent hover:border-gray-200
      rounded-none
    "
    style={{fontFamily: 'sans-serif'}}
  >
    {IconComponent && (
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        <IconComponent className="h-4 w-4 text-gray-500 group-hover:text-black transition-colors duration-300" />
      </div>
    )}
    <span className="relative z-10">{label}</span>
    <div className="absolute left-0 top-0 h-full w-0.5 bg-black transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
  </Link>
);

// MenuButton Component - sharp corners
const MenuButton = ({ onClick, label, priority = false, icon: IconComponent }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 w-full px-4 py-3 mx-2 mb-2
      text-sm font-medium text-left
      transition-all duration-300
      group relative overflow-hidden
      rounded-none
      ${priority 
        ? 'bg-black text-white hover:bg-gray-800 border border-gray-200 shadow-sm' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-black border border-transparent hover:border-gray-200'
      }
    `}
    style={{fontFamily: 'sans-serif'}}
  >
    {IconComponent && (
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        <IconComponent className={`h-4 w-4 transition-colors duration-300 ${
          priority ? 'text-white' : 'text-gray-500 group-hover:text-black'
        }`} />
      </div>
    )}
    <span className="relative z-10">{label}</span>
    {!priority && (
      <div className="absolute left-0 top-0 h-full w-0.5 bg-black transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
    )}
  </button>
);

export default UserMenu;
