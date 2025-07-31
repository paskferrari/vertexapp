import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TipCard = ({ 
  tip, 
  onSave, 
  onFollow, 
  onAddToSlip, 
  isFollowed, 
  showFollowButton = true, 
  isGuest = false,
  isInSlip = false 
}) => {
  const { t } = useTranslation();
  
  const getConfidenceColor = (status) => {
    switch (status) {
      case 'high': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPredictionStatusBadge = (status) => {
    switch (status) {
      case 'won': return { className: 'bg-green-100 text-green-800', text: 'Vinto' };
      case 'lost': return { className: 'bg-red-100 text-red-800', text: 'Perso' };
      case 'pending': return { className: 'bg-yellow-100 text-yellow-800', text: 'In Attesa' };
      default: return { className: 'bg-gray-100 text-gray-800', text: 'Sconosciuto' };
    }
  };

  return (
    <motion.div 
      className="card-mobile overflow-hidden relative"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Mobile-optimized header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium bg-dark-lighter px-2 py-1 rounded-full text-gray-300 capitalize">
            {tip.sport}
          </span>
          {tip.status && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPredictionStatusBadge(tip.status).className}`}>
              {getPredictionStatusBadge(tip.status).text}
            </span>
          )}
        </div>
        {tip.confidence && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(tip.confidence)}`}>
            {tip.confidence.charAt(0).toUpperCase() + tip.confidence.slice(1)}
          </span>
        )}
      </div>

      {/* Match and Prediction - Mobile optimized */}
      <h3 className="font-semibold text-white text-base mb-2 leading-tight">{tip.match || tip.match_name}</h3>
      <div className="relative mb-3">
        <p className={`text-gray-300 text-sm leading-relaxed ${isGuest ? 'filter blur-sm' : ''}`}>
          {tip.prediction || tip.description || 'Pronostico disponibile'}
        </p>
        {isGuest && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              🔒 Accedi per vedere
            </span>
          </div>
        )}
      </div>

      {/* Mobile-optimized odds and details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <span className="text-xs text-gray-400 block">Quota</span>
          <p className={`text-white font-bold text-lg ${isGuest ? 'filter blur-sm' : ''}`}>
            {isGuest ? '?.??' : tip.odds}
          </p>
        </div>
        <div className="text-center">
          <span className="text-xs text-gray-400 block">Potenziale</span>
          <p className={`text-green-400 font-bold text-lg ${isGuest ? 'filter blur-sm' : ''}`}>
            {isGuest ? '??%' : `${((tip.odds - 1) * 100).toFixed(0)}%`}
          </p>
        </div>
      </div>

      {/* Author and Time - Mobile optimized */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
        <span className="truncate">di {tip.author || tip.tipster || tip.created_by}</span>
        <span className="text-right">
          {tip.time || (tip.event_date && new Date(tip.event_date).toLocaleDateString('it-IT'))}
        </span>
      </div>

      {/* Mobile-optimized action buttons */}
      {showFollowButton && (
        <div className="space-y-2">
          {isGuest ? (
            <Link 
              to="/login"
              className="block w-full py-3 rounded-xl font-medium transition-all bg-primary text-white hover:bg-primary/90 text-center active:scale-95"
            >
              Accedi per Seguire
            </Link>
          ) : (
            <>
              <button 
                onClick={() => onFollow ? onFollow(tip) : onSave(tip)}
                disabled={isFollowed}
                className={`w-full py-3 rounded-xl font-medium transition-all active:scale-95 ${
                  isFollowed 
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {isFollowed ? 'Già Seguito' : 'Segui Pronostico'}
              </button>
              
              {/* Add to Betting Slip Button */}
              {onAddToSlip && !isGuest && (
                <button 
                  onClick={() => onAddToSlip(tip)}
                  disabled={isInSlip}
                  className={`w-full py-3 rounded-xl font-medium transition-all active:scale-95 ${
                    isInSlip
                      ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                      : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                  }`}
                >
                  {isInSlip ? '✓ In Schedina' : '+ Aggiungi a Schedina'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TipCard;