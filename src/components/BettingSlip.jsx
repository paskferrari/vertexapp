import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const BettingSlip = ({ isOpen, onClose, selectedTips = [], onPlaceBet, onRemoveTip }) => {
  const { t } = useTranslation();
  const [stake, setStake] = useState('');
  const [betType, setBetType] = useState('single'); // single, multiple, system
  const [isPlacing, setIsPlacing] = useState(false);

  // Calculate potential returns
  const calculateReturns = () => {
    if (!stake || selectedTips.length === 0) return { potential: 0, totalOdds: 0 };
    
    const stakeAmount = parseFloat(stake);
    let totalOdds = 1;
    
    if (betType === 'single') {
      // For single bets, show each tip separately
      return selectedTips.map(tip => ({
        tip,
        odds: tip.odds,
        potential: (stakeAmount * tip.odds).toFixed(2),
        profit: (stakeAmount * (tip.odds - 1)).toFixed(2)
      }));
    } else if (betType === 'multiple') {
      // For multiple bets, multiply all odds
      totalOdds = selectedTips.reduce((acc, tip) => acc * tip.odds, 1);
      return {
        totalOdds: totalOdds.toFixed(2),
        potential: (stakeAmount * totalOdds).toFixed(2),
        profit: (stakeAmount * (totalOdds - 1)).toFixed(2)
      };
    }
  };

  const handlePlaceBet = async () => {
    if (!stake || selectedTips.length === 0) return;
    
    setIsPlacing(true);
    
    const betData = {
      tips: selectedTips,
      stake: parseFloat(stake),
      betType,
      totalOdds: betType === 'multiple' ? calculateReturns().totalOdds : null,
      potentialReturn: betType === 'multiple' ? calculateReturns().potential : null,
      timestamp: new Date().toISOString()
    };
    
    try {
      await onPlaceBet(betData);
      setStake('');
      onClose();
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setIsPlacing(false);
    }
  };

  const returns = calculateReturns();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Betting Slip */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-dark-lighter rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Schedina</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto mobile-scroll" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              {/* Selected Tips */}
              <div className="p-4 space-y-3">
                {selectedTips.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Nessun pronostico selezionato</p>
                  </div>
                ) : (
                  selectedTips.map((tip, index) => (
                    <motion.div
                      key={tip.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-dark rounded-xl p-3 border border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">{tip.match}</h4>
                          <p className="text-gray-400 text-xs mt-1">{tip.prediction}</p>
                          <div className="flex items-center mt-2 space-x-3">
                            <span className="text-primary font-semibold">{tip.odds}</span>
                            <span className="text-xs text-gray-500">{tip.sport}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveTip(tip)}
                          className="p-1 rounded-full hover:bg-gray-600 transition-colors ml-2"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              {/* Bet Configuration */}
              {selectedTips.length > 0 && (
                <div className="p-4 border-t border-gray-700">
                  {/* Bet Type Selection */}
                  {selectedTips.length > 1 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tipo Scommessa</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setBetType('single')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            betType === 'single' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          Singole
                        </button>
                        <button
                          onClick={() => setBetType('multiple')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            betType === 'multiple' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          Multipla
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Stake Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Importo (€)</label>
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  {/* Quick Stake Buttons */}
                  <div className="flex space-x-2 mb-4">
                    {[5, 10, 25, 50].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setStake(amount.toString())}
                        className="flex-1 py-2 px-3 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                      >
                        €{amount}
                      </button>
                    ))}
                  </div>
                  
                  {/* Returns Display */}
                  {stake && (
                    <div className="bg-dark rounded-lg p-3 mb-4">
                      {betType === 'single' ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-300">Vincite Potenziali (Singole):</h4>
                          {Array.isArray(returns) && returns.map((ret, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-400">{ret.tip.match}</span>
                              <span className="text-green-400 font-medium">€{ret.potential}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">Quota Totale:</span>
                            <span className="text-white font-semibold">{returns.totalOdds}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">Vincita Potenziale:</span>
                            <span className="text-green-400 font-semibold">€{returns.potential}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Profitto:</span>
                            <span className="text-green-400 font-medium">€{returns.profit}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Place Bet Button */}
            {selectedTips.length > 0 && (
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={handlePlaceBet}
                  disabled={!stake || isPlacing}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    !stake || isPlacing
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                  }`}
                >
                  {isPlacing ? 'Piazzando...' : `Piazza Scommessa${stake ? ` (€${stake})` : ''}`}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BettingSlip;