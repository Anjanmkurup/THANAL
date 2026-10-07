import React from 'react';
import { useThanal, displayId } from './ThanalContext';
import { Bell, LogOut, LogIn, UserPlus } from 'lucide-react';
import logo from './logo.png';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenVolRegister: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogin,
  onOpenVolRegister,
  onOpenNotifications,
}) => {
  const { currentUser, logout, notifications } = useThanal();

  // Filter notifications relevant to current user
  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return false;
    if (currentUser.role === 'VOLUNTEER') return n.volunteerId === currentUser.id;
    return true;
  });

  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { id: 'home', label: 'Initiative' },
        { id: 'window_policy', label: '21-Day Window' },
        { id: 'units_public', label: 'NSS Units' },
      ];
    }

    if (currentUser.role === 'VS') {
      return [
        { id: 'unit_overview', label: 'Unit Dashboard' },
        { id: 'volunteer_approvals', label: 'Approvals' },
        { id: 'volunteer_directory', label: 'Volunteers' },
        { id: 'evidence_review', label: 'Planting & Tags' },
        { id: 'drive_setup', label: 'Drive Setup' },
      ];
    }

    if (currentUser.role === 'VOLUNTEER') {
      return [
        { id: 'my_window', label: '21-Day Window' },
        { id: 'plant_tree', label: 'Tree Planting' },
        { id: 'tag_status', label: 'Tag Approval' },
        { id: 'my_history', label: 'History' },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button
          onClick={() => onSelectTab(currentUser ? (currentUser.role === 'VS' ? 'unit_overview' : 'my_window') : 'home')}
          className="flex items-center gap-3 shrink-0 text-left group"
        >
          <img src={logo} alt="THANAL NRPF logo" className="w-11 h-11 rounded-full ring-2 ring-green-700/20 object-cover" />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-green-900 group-hover:text-green-700 transition-colors">THANAL</span>
            <span className="block text-[10px] font-medium text-stone-500 uppercase tracking-wider">An initiative of NRPF</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links (Clean text links with active line indicator, single line) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`transition-colors whitespace-nowrap py-1 relative ${
                  isActive
                    ? 'text-green-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Notification Button */}
          <button
            onClick={onOpenNotifications}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg relative transition-colors"
            title="Emails sent to volunteers"
            aria-label="View Notifications"
          >
            <Bell className="w-5 h-5" />
            {userNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-600 rounded-full" />
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* User Identifier - unboxed metadata */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-900 truncate max-w-[150px]">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {displayId(currentUser)}
                </span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
              <button
                onClick={onOpenVolRegister}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-green-800 hover:bg-green-900 rounded-full transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden overflow-x-auto px-4 py-2 bg-stone-50 border-t border-stone-200 flex items-center gap-4 text-xs font-medium text-stone-600 scrollbar-none">
        {navLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`whitespace-nowrap py-1 ${
                isActive
                  ? 'text-green-800 font-semibold border-b-2 border-green-800'
                  : 'text-stone-600'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
