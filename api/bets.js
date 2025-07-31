const express = require('express');
const router = express.Router();

// In-memory storage (in produzione usare un database)
let bets = [];
let betIdCounter = 1;

// GET /api/bets - Get user's bets
router.get('/', (req, res) => {
  try {
    const userId = req.user?.id;
    const userBets = bets.filter(bet => bet.userId === userId);
    
    res.json({
      success: true,
      bets: userBets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bets'
    });
  }
});

// POST /api/bets - Place a new bet
router.post('/', (req, res) => {
  try {
    const { tips, stake, betType, totalOdds, potentialReturn } = req.body;
    const userId = req.user?.id;
    
    if (!tips || !stake || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const newBet = {
      id: betIdCounter++,
      userId,
      tips,
      stake: parseFloat(stake),
      betType,
      totalOdds: totalOdds ? parseFloat(totalOdds) : null,
      potentialReturn: potentialReturn ? parseFloat(potentialReturn) : null,
      status: 'pending',
      placedAt: new Date().toISOString(),
      settledAt: null,
      actualReturn: null
    };
    
    bets.push(newBet);
    
    res.json({
      success: true,
      bet: newBet,
      message: 'Bet placed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to place bet'
    });
  }
});

// PUT /api/bets/:id/settle - Settle a bet (admin only)
router.put('/:id/settle', (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualReturn } = req.body;
    
    const betIndex = bets.findIndex(bet => bet.id === parseInt(id));
    
    if (betIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }
    
    bets[betIndex] = {
      ...bets[betIndex],
      status,
      actualReturn: actualReturn || 0,
      settledAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      bet: bets[betIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to settle bet'
    });
  }
});

// GET /api/bets/stats - Get betting statistics
router.get('/stats', (req, res) => {
  try {
    const userId = req.user?.id;
    const userBets = bets.filter(bet => bet.userId === userId);
    
    const totalBets = userBets.length;
    const wonBets = userBets.filter(bet => bet.status === 'won').length;
    const lostBets = userBets.filter(bet => bet.status === 'lost').length;
    const pendingBets = userBets.filter(bet => bet.status === 'pending').length;
    
    const totalStaked = userBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturns = userBets
      .filter(bet => bet.status === 'won')
      .reduce((sum, bet) => sum + (bet.actualReturn || 0), 0);
    
    const profit = totalReturns - totalStaked;
    const roi = totalStaked > 0 ? ((profit / totalStaked) * 100) : 0;
    const winRate = totalBets > 0 ? ((wonBets / (wonBets + lostBets)) * 100) : 0;
    
    res.json({
      success: true,
      stats: {
        totalBets,
        wonBets,
        lostBets,
        pendingBets,
        totalStaked: totalStaked.toFixed(2),
        totalReturns: totalReturns.toFixed(2),
        profit: profit.toFixed(2),
        roi: roi.toFixed(2),
        winRate: winRate.toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

module.exports = router;