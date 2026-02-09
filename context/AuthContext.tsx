
import { createContext } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  pendingProfileUser: { id: string; email: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  completeProfile: (details: Partial<User>) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  clearPending: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  pendingProfileUser: null,
  login: async () => false,
  completeProfile: async () => {},
  logout: () => {},
  updateUser: () => {},
  clearPending: () => {},
});
