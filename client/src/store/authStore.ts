import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthChange } from "../lib/auth.js";

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  init: () => {
    return onAuthChange((user) => {
      set({ user, loading: false });
    });
  },
}));