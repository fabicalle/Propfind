'use client';

import { useAppStore } from '@/store/useAppStore';
import { useSessionStore } from '@/store/useSessionStore';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileModal } from '@/components/ProfileModal';
import { useProfileModal } from '@/store/useProfileModal';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const analyticsConsent = useSessionStore((state) => state.analyticsConsent);
  const profileModal = useProfileModal();

  return (
    <div className="relative min-h-screen bg-app text-content-primary">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      <ProfileModal
        isOpen={profileModal.isOpen}
        onClose={profileModal.close}
        userId={profileModal.userId || ''}
        subtitle={profileModal.message || undefined}
      />
    </div>
  );
}
