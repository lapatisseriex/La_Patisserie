// Component to debug user data in development
import React from 'react';

const DebugUserData = ({ user, formData, locations }) => {
  if (import.meta.env.DEV !== true) {
    return null;
  }
  
  return (
    <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs font-mono">
      <h3 className="font-bold mb-2">Debug Data:</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <h4 className="font-semibold">User Data:</h4>
          <pre className="overflow-auto max-h-40">{JSON.stringify(user, null, 2)}</pre>
        </div>
        <div>
          <h4 className="font-semibold">Form Data:</h4>
          <pre className="overflow-auto max-h-40">{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
      <div className="mt-2">
        <h4 className="font-semibold">Available Locations:</h4>
        <pre className="overflow-auto max-h-40">{JSON.stringify(locations, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugUserData;
