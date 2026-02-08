"use client";

import { create } from 'zustand';

interface CreditsStore {
  credits: number;
  setCredits: (credits: number) => void;
  decrementCredits: (amount?: number) => void;
  addCredits: (amount: number) => void;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  // Default value - in production this would come from the API/database
  credits: 100,

  setCredits: (credits: number) => {
    set({ credits });
  },

  decrementCredits: (amount: number = 1) => {
    set((state) => ({
      credits: Math.max(0, state.credits - amount),
    }));
  },

  addCredits: (amount: number) => {
    set((state) => ({
      credits: state.credits + amount,
    }));
  },
}));
