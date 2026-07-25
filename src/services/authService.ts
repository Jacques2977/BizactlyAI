export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'starter' | 'pro' | 'enterprise';
}

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

class AuthService {
  private currentUser: User | null = null;

  async login(credentials: AuthCredentials): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user: User = {
      id: '1',
      name: credentials.name || 'Demo User',
      email: credentials.email,
      subscriptionTier: 'free'
    };

    this.currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  }

  async signup(credentials: AuthCredentials): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user: User = {
      id: Math.random().toString(36).substring(7),
      name: credentials.name || 'New User',
      email: credentials.email,
      subscriptionTier: 'free'
    };

    this.currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  updateSubscriptionTier(tier: 'free' | 'starter' | 'pro' | 'enterprise'): void {
    if (this.currentUser) {
      this.currentUser.subscriptionTier = tier;
      localStorage.setItem('user', JSON.stringify(this.currentUser));
    }
  }
}

export const authService = new AuthService();
