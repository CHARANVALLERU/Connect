// Authentication Context
// Manages user authentication state, tier management, and login/logout flows

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { engineAdapter } from '../services/engineAdapter';
import { AuthResponse, User } from '../services/apiContract';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

interface AuthAction {
  type: 'LOGIN_REQUEST' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'UPDATE_USER';
  payload?: any;
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS': {
      const auth = action.payload as AuthResponse;
      return {
        ...state,
        user: auth?.user ?? null,
        isAuthenticated: Boolean(auth?.user),
        isLoading: false,
        token: auth?.token || state.token,
        error: null,
      };
    }
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload as string };
    case 'LOGOUT':
      return initialAuthState;
    case 'UPDATE_USER':
      return { ...state, user: action.payload as User };
    default:
      return state;
  }
}

const AuthContext = createContext<{ state: AuthState; login: (email: string, password: string) => Promise<boolean>; logout: () => void; updateUser: (user: User) => void } | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_REQUEST' });
    try {
      const response = await engineAdapter.login(email, password);
      if (response.success) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
        return true;
      } else {
        const errMsg = response.error || 'Login failed';
        dispatch({ type: 'LOGIN_FAILURE', payload: errMsg });
        throw new Error(errMsg);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Network error';
      dispatch({ type: 'LOGIN_FAILURE', payload: errMsg });
      throw new Error(errMsg);
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    // AsyncStorage.removeItem('auth_token');
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    ...context,
    user: context.state.user,
    isAuthenticated: context.state.isAuthenticated,
    isLoading: context.state.isLoading,
    error: context.state.error,
    signup: async (email: string, password: string, name?: string) => {
      return context.login(email, password);
    },
  };
}

// Export auth state for convenience
export const selectAuthState = (state: AuthState) => state;
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;