import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import BettingSlip from './BettingSlip';
import { useBettingSlip } from '../hooks/useBettingSlip';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    selectedTips,
    isSlipOpen,
    setIsSlipOpen,
    addTip,
    removeTip,
    clearSlip,
    placeBet
  } = useBettingSlip();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white relative">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="mobile-safe-area">
        <Outlet context={{ addTip, selectedTips }} />
      </main>
      
      <BottomNavigation selectedTipsCount={selectedTips.length} onOpenSlip={() => setIsSlipOpen(true)} />
      
      <BettingSlip
        isOpen={isSlipOpen}
        onClose={() => setIsSlipOpen(false)}
        selectedTips={selectedTips}
        onPlaceBet={placeBet}
        onRemoveTip={removeTip}
      />
    </div>
  );
};

export default Layout;