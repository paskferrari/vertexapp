import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import BettingSlip from './BettingSlip';
import { useBettingSlip } from '../hooks/useBettingSlip';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();  // Rimuovi logout da qui
  const {
    selectedTips,
    isSlipOpen,
    setIsSlipOpen,
    addTip,
    removeTip,
    clearSlip,
    placeBet
  } = useBettingSlip();

  // Rimuovi handleLogout da qui

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white relative">
      <Header />  {/* Rimuovi le props user e onLogout */}
      
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