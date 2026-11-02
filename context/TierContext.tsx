// Tier Context
// Manages the user's tier state (Basic vs Elite) and provides tier-gated features

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { User } from '../services/apiContract';

export type TierType = 'Premium' | 'Elite';

interface TierState {
  currentTier: TierType;
  isElite: boolean;
  features: {
    eliteDirectory: boolean;
    eliteMessaging: boolean;
    invisibleBoards: boolean;
    ghostMode: boolean;
    globalDiscovery: boolean;
    advancedAnalytics: boolean;
  };
}

interface TierAction {
  type: 'SET_TIER' | 'UPDATE_TIER_FROM_USER';
  payload: { currentTier?: TierType; user?: User };
}

const initialTierState: TierState = {
  currentTier: 'Premium',
  isElite: false,
  features: {
    eliteDirectory: false,
    eliteMessaging: false,
    invisibleBoards: false,
    ghostMode: false,
    globalDiscovery: false,
    advancedAnalytics: false,
  },
};

function tierReducer(state: TierState, action: TierAction): TierState {
  switch (action.type) {
    case 'SET_TIER':
      const isElite = action.payload.currentTier === 'Elite';
      return {
        ...state,
        currentTier: action.payload.currentTier || 'Premium',
        isElite,
        features: {
          eliteDirectory: isElite,
          eliteMessaging: isElite,
          invisibleBoards: isElite,
          ghostMode: isElite,
          globalDiscovery: isElite,
          advancedAnalytics: isElite,
        },
      };
    case 'UPDATE_TIER_FROM_USER':
      if (!action.payload?.user) return state;
      const userIsElite = action.payload.user.tier === 'Elite';
      return {
        ...state,
        currentTier: action.payload.user.tier || 'Premium',
        isElite: userIsElite,
        features: {
          eliteDirectory: userIsElite,
          eliteMessaging: userIsElite,
          invisibleBoards: userIsElite,
          ghostMode: userIsElite,
          globalDiscovery: userIsElite,
          advancedAnalytics: userIsElite,
        },
      };
    default:
      return state;
  }
}

const TierContext = createContext<{ 
  state: TierState; 
  setTier: (tier: TierType) => void; 
  updateTierFromUser: (user: User) => void 
} | undefined>(undefined);

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tierReducer, initialTierState);
  const { state: authState } = useAuth();

  const setTier = useCallback((tier: TierType) => {
    dispatch({ type: 'SET_TIER', payload: { currentTier: tier } });
  }, []);

  const updateTierFromUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_TIER_FROM_USER', payload: { user } });
  }, []);

  // Sync tier with auth user when auth state changes
  useEffect(() => {
    if (authState.user) {
      updateTierFromUser(authState.user);
    }
    // If user logs out, reset to Premium
    if (!authState.isAuthenticated) {
      dispatch({ type: 'SET_TIER', payload: { currentTier: 'Premium' } });
    }
  }, [authState.user, authState.isAuthenticated, updateTierFromUser]);

  return (
    <TierContext.Provider value={{ state, setTier, updateTierFromUser }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}

// Export selectors
export const selectTier = (state: TierState) => state.currentTier;
export const selectIsElite = (state: TierState) => state.isElite;
export const selectEliteFeatures = (state: TierState) => state.features;