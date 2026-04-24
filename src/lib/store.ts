import { create } from "zustand";

type AuthState = {
  userId: string | null;
  walletAddress: string | null;
  setAuth: (userId: string, walletAddress: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  walletAddress: null,
  setAuth: (userId, walletAddress) => set({ userId, walletAddress }),
  clear: () => set({ userId: null, walletAddress: null }),
}));
