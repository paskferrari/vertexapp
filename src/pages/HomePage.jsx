import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import TipCard from '../components/TipCard';

const HomePage = () => {
  const { t } = useTranslation();
  const { addTip, selectedTips } = useOutletContext() || {};
  
  const [stats] = useState({
    roi: 12.5,
    winRate: 68,
    totalBets: 45,
    pendingBets: 3,
    weeklyProfit: 250,
  });

  const [featuredTips] = useState([
    {
      id: 1,
      match: 'Inter vs Juventus',
      prediction: 'Over 2.5 Goals',
      odds: 1.85,
      sport: 'football',
      confidence: 'high',
      author: 'Marco Betting',
      time: '15:00',
      status: 'pending'
    },
    {
      id: 2,
      match: 'Lakers vs Warriors',
      prediction: 'Lakers -4.5',
      odds: 1.92,
      sport: 'basketball',
      confidence: 'medium',
      author: 'NBA Expert',
      time: '21:30',
      status: 'pending'
    },
    {
      id: 3,
      match: 'Djokovic vs Nadal',
      prediction: 'Djokovic to Win',
      odds: 1.75,
      sport: 'tennis',
      confidence: 'high',
      author: 'Tennis Pro',
      time: '14:00',
      status: 'pending'
    }
  ]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300
      }
    }
  };

  const handleAddToSlip = (tip) => {
    if (addTip) {
      addTip(tip);
    }
  };

  const isInSlip = (tipId) => {
    return selectedTips?.some(tip => tip.id === tipId) || false;
  };

  return (
    <div className="mobile-container min-h-screen">
      <motion.div
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Mobile-optimized welcome section */}
        <motion.div variants={itemVariants} className="mb-6 pt-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('dashboard.welcome')}</h1>
          <p className="text-gray-400 text-sm md:text-base">{t('dashboard.subtitle')}</p>
        </motion.div>
        
        {/* Mobile-optimized stats grid */}
        <motion.div variants={itemVariants} className="mobile-grid mb-6">
          <div className="card bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <p className="text-gray-400 text-sm">{t('dashboard.roi')}</p>
            <p className="text-xl md:text-2xl font-bold text-white">{stats.roi}%</p>
          </div>
          
          <div className="card bg-gradient-to-br from-green-500/20 to-green-400/10 border border-green-400/20">
            <p className="text-gray-400 text-sm">{t('dashboard.winRate')}</p>
            <p className="text-xl md:text-2xl font-bold text-white">{stats.winRate}%</p>
          </div>
          
          <div className="card bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/20 sm:col-span-2 lg:col-span-1">
            <p className="text-gray-400 text-sm">{t('dashboard.weeklyProfit')}</p>
            <p className="text-xl md:text-2xl font-bold text-white">€{stats.weeklyProfit}</p>
          </div>
        </motion.div>

        {/* Featured Tips Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-white">{t('dashboard.latestTips')}</h2>
            <Link to="/predictions" className="text-primary text-sm hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          
          <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
            {featuredTips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                onAddToSlip={handleAddToSlip}
                isInSlip={isInSlip(tip.id)}
                showFollowButton={true}
              />
            ))}
          </div>
        </motion.div>

        {/* Quick Actions - Mobile optimized */}
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Azioni Rapide</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/wallet"
              className="card text-center hover:bg-slate-700 transition-colors active:scale-95"
            >
              <div className="text-2xl mb-2">💰</div>
              <p className="text-white font-medium">Il Mio Wallet</p>
              <p className="text-gray-400 text-sm">Gestisci scommesse</p>
            </Link>
            
            <Link
              to="/roi"
              className="card text-center hover:bg-slate-700 transition-colors active:scale-95"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="text-white font-medium">ROI Tracker</p>
              <p className="text-gray-400 text-sm">Analizza performance</p>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;