import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNavigation = ({ selectedTipsCount = 0, onOpenSlip }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-lighter shadow-lg z-30 border-t border-gray-700">
      <div className="flex justify-around items-center h-16 px-2">
        <Link 
          to="/home" 
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/home' ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/dashboard' ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        
        {/* Betting Slip Button */}
        <button 
          onClick={onOpenSlip}
          className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-primary transition-colors relative"
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {selectedTipsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {selectedTipsCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Schedina</span>
        </button>
        
        <Link 
          to="/wallet" 
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/wallet' ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-xs mt-1">Wallet</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/profile' ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;