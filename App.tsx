import React, { useState } from 'react';
import { ThanalProvider, useThanal, displayId } from './ThanalContext';
import { Navbar } from './Navbar';
import { NotificationDrawer } from './NotificationDrawer';
import { LoginModal } from './LoginModal';
import { VolunteerRegistrationModal } from './VolunteerRegistrationModal';
import { VolunteerDashboard } from './VolunteerDashboard';
import { VsDashboard } from './VsDashboard';
import { LandingView } from './LandingView';
import { AlertTriangle, Clock } from 'lucide-react';

const ThanalAppContent: React.FC = () => {
  const { currentUser } = useThanal();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVolRegisterOpen, setIsVolRegisterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Synchronize default tab on role changes
  React.useEffect(() => {
    if (!currentUser) {
      setActiveTab('home');
    } else if (currentUser.status !== 'APPROVED') {
      setActiveTab('pending_status');
    } else if (currentUser.role === 'VS') {
      setActiveTab('unit_overview');
    } else if (currentUser.role === 'VOLUNTEER') {
      setActiveTab('my_window');
    }
  }, [currentUser?.id, currentUser?.status]);

  const renderMainContent = () => {
    // 1. Pending or Suspended User State Handling
    if (currentUser && currentUser.status === 'PENDING') {
      return (
        <div className="max-w-3xl mx-auto py-16 px-4">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-amber-900">
              Registration Under Verification (Pending Approval)
            </h2>
            <p className="text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
              Welcome, <strong>{currentUser.name}</strong> ({displayId(currentUser)}). Your{' '}
              {currentUser.role === 'VS' ? 'Volunteer Secretary' : 'Volunteer'} account has been registered and is currently <strong>PENDING</strong> approval by{' '}
              your Unit Volunteer Secretary.
            </p>
            <div className="pt-2 text-xs text-amber-700">
              Once approved, you will have immediate access to your dashboard.
            </div>
          </div>
        </div>
      );
    }

    if (currentUser && currentUser.status === 'SUSPENDED') {
      return (
        <div className="max-w-3xl mx-auto py-16 px-4">
          <div className="bg-red-50 border border-red-300 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-red-900">
              Account Access Suspended
            </h2>
            <p className="text-sm text-red-800 max-w-lg mx-auto leading-relaxed">
              Your account ({displayId(currentUser)}) has been suspended. Please contact your NSS programme officer.
            </p>
          </div>
        </div>
      );
    }

    // 2. Role-Based Dashboards
    if (currentUser?.role === 'VS') {
      return <VsDashboard activeTab={activeTab} />;
    }

    if (currentUser?.role === 'VOLUNTEER') {
      return <VolunteerDashboard activeSection={activeTab} />;
    }

    // 3. Public Landing View
    return (
      <LandingView
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenVolRegister={() => setIsVolRegisterOpen(true)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-lime-200">
      {/* Top Navigation conforming to Top Bar Contract */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenVolRegister={() => setIsVolRegisterOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {renderMainContent()}
      </main>

      <footer className="bg-green-950 text-green-100 py-8 px-4 sm:px-6 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-sm font-bold text-white">THANAL – Tree Planting &amp; Monitoring System</div>
            <div className="text-green-300 mt-1">An initiative of the NRPF (Natural Resource Protection Force)</div>
          </div>
          <div className="text-green-300">Privacy &amp; Data Safeguarded</div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenVolRegister={() => setIsVolRegisterOpen(true)}
      />

      <VolunteerRegistrationModal
        isOpen={isVolRegisterOpen}
        onClose={() => setIsVolRegisterOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThanalProvider>
      <ThanalAppContent />
    </ThanalProvider>
  );
}
