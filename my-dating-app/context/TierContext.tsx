// Tier Context
// Manages the user's tier state (Basic vs Elite) and provides tier-gated features

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { User } from '../services/apiContract';

interface TierState {
  currentTier: 'Basic' | 'Elite';
  isElite: boolean;
  features: {
    eliteDirectory: boolean;
    eliteMessaging: boolean;
    advancedAnalytics: boolean;
    premiumProfile: boolean;
    exclusiveEvents: boolean;
  };
}

interface TierAction {
  type: 'SET_TIER' | 'UPDATE_TIER_FROM_USER';
  payload: Partial<TierState>;
}

const initialTierState: TierState = {
  currentTier: 'Basic',
  isElite: false,
  features: {
    eliteDirectory: false,
    eliteMessaging: false,
    advancedAnalytics: false,
    premiumProfile: false,
    exclusiveEvents: false,
  },
};

function tierReducer(state: TierState, action: TierAction): TierState {
  switch (action.type) {
    case 'SET_TIER':
      const isElite = action.payload.currentTier === 'Elite';
      return {
        ...state,
        currentTier: action.payload.currentTier || 'Basic',
        isElite,
        features: {
          ...state.features,
          eliteDirectory: isElite,
          eliteMessaging: isElite,
          advancedAnalytics: isElite,
          premiumProfile: isElite,
          exclusiveEvents: isElite,
        },
      };
    case 'UPDATE_TIER_FROM_USER':
      if (!action.payload?.user) return state;
      return {
        ...state,
        currentTier: action.payload.user.tier || 'Basic',
        isElite: action.payload.user.tier === 'Elite',
      };
    default:
      return state;
  }
}

const TierContext = createContext<{ state: TierState; setTier: (tier: 'Basic' | 'Elite') => void; updateTierFromUser: (user: User) => void } | undefined>(undefined);

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tierReducer, initialTierState);
  const { state: authState } = useAuth();

  const setTier = useCallback((tier: 'Basic' | 'Elite') => {
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
    // If user logs out, reset to Basic
    if (!authState.isAuthenticated) {
      dispatch({ type: 'SET_TIER', payload: { currentTier: 'Basic' } });
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