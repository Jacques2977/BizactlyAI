import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignupCredentials } from '../types/auth';
import { UserSubscription } from '../types/subscription';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('bizactly_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        localStorage.removeItem('bizactly_user');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would be an API call
      // For demo purposes, we'll check against localStorage or use demo credentials
      const savedUsers = JSON.parse(localStorage.getItem('bizactly_users') || '[]');
      const user = savedUsers.find((u: any) => u.email === credentials.email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // In a real app, you'd verify the password hash
      if (user.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }
      
      const { password, ...userWithoutPassword } = user;
      
      setAuthState({
        user: userWithoutPassword,
        isAuthenticated: true,
        isLoading: false,
      });
      
      localStorage.setItem('bizactly_user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const savedUsers = JSON.parse(localStorage.getItem('bizactly_users') || '[]');
      const existingUser = savedUsers.find((u: any) => u.email === credentials.email);
      
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: credentials.name,
        email: credentials.email,
        password: credentials.password, // In real app, this would be hashed
        createdAt: new Date().toISOString(),
      };
      
      // Create default subscription for new user
      const defaultSubscription: UserSubscription = {
        id: Date.now().toString(),
        userId: newUser.id,
        planId: 'free-trial',
        status: 'trialing',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        cancelAtPeriodEnd: false,
        usage: {
          aiChats: 0,
          tools: 0,
          projects: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage (in real app, this would be an API call)
      const updatedUsers = [...savedUsers, newUser];
      localStorage.setItem('bizactly_users', JSON.stringify(updatedUsers));
      localStorage.setItem(`subscription_${newUser.id}`, JSON.stringify(defaultSubscription));
      
      const { password, ...userWithoutPassword } = newUser;
      
      setAuthState({
        user: userWithoutPassword,
        isAuthenticated: true,
        isLoading: false,
      });
      
      localStorage.setItem('bizactly_user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('bizactly_user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};