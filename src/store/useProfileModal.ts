import { create } from 'zustand';

interface ProfileModalState {
  isOpen: boolean;
  userId: string | null;
  message: string | null;
  open: (userId: string, message?: string) => void;
  close: () => void;
}

export const useProfileModal = create<ProfileModalState>((set) => ({
  isOpen: false,
  userId: null,
  message: null,
  open: (userId, message) => set({ isOpen: true, userId, message: message || null }),
  close: () => set({ isOpen: false, userId: null, message: null }),
}));
