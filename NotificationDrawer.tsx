import React, { useState } from 'react';
import { useThanal } from './ThanalContext';
import { Mail, CheckCircle, Bell, X, Calendar, Sparkles, Send, ShieldCheck } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    currentUser,
    systemDate,
    refreshNotifications,
  } = useThanal();

  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
  const [triggerFeedback, setTriggerFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter logs for user role
  const filteredNotifications = notifications.filter((n) => {
    if (!currentUser) return true;
    if (currentUser.role === 'VOLUNTEER') return n.volunteerId === currentUser.id;
    return true;
  });

  const selectedNotification = notifications.find((n) => n.id === selectedNotifId) || filteredNotifications[0];

  const handleRefresh = async () => {
    await refreshNotifications();
    setTriggerFeedback('Email log refreshed.');
    setTimeout(() => setTriggerFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-700" />
              Emails Sent
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Only emails that were really sent appear here · Day-1 window reminders and birthday greetings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              title="Reload the list of sent emails"
            >
              <Send className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {triggerFeedback && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-2.5 text-xs text-green-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
            <span>{triggerFeedback}</span>
          </div>
        )}

        {/* Content Body: Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {/* Left Column: Notification List */}
          <div className="md:col-span-5 overflow-y-auto max-h-[300px] md:max-h-none p-3 space-y-2 bg-stone-50/50">
            <div className="text-[11px] font-medium text-stone-500 px-2 py-1">
              SENT EMAILS ({filteredNotifications.length})
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500">
                No emails have been sent yet. Reminders go out automatically on the first day of each volunteer's window, and birthday wishes on the birthday.
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isSelected = selectedNotification?.id === notif.id;
                const isBday = notif.type === 'BIRTHDAY_WISH';

                return (
                  <button
                    key={notif.id}
                    onClick={() => setSelectedNotifId(notif.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'bg-white border-green-600 shadow-sm'
                        : 'bg-white/80 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-stone-800 truncate">
                        {notif.volunteerName}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {notif.sentAt ? notif.sentAt.split('T')[0] : systemDate}
                      </span>
                    </div>

                    <div className="text-stone-600 truncate font-medium text-[11px] mb-1">
                      {notif.subject}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <span className={isBday ? 'text-amber-700 font-medium' : 'text-green-700 font-medium'}>
                        {isBday ? '🎂 Birthday Greeting' : '🌱 Window Day 1 Reminder'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{notif.year}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Full Email Preview */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-white flex flex-col">
            {selectedNotification ? (
              <div className="border border-stone-200 rounded-lg overflow-hidden flex flex-col">
                {/* Official Letterhead */}
                <div className="bg-green-950 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-green-300 font-medium">
                        NSS / NRPF Kerala State Tree Planting Initiative
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        THANAL Automated Notification Service
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded bg-green-800 flex items-center justify-center text-xs font-mono">
                      NSS
                    </div>
                  </div>
                </div>

                {/* Email Meta */}
                <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 w-16">To:</span>
                    <span className="font-medium text-stone-800">
                      {selectedNotification.volunteerName} &lt;{selectedNotification.recipientEmail}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 w-16">Subject:</span>
                    <span className="font-semibold text-stone-900">
                      {selectedNotification.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 w-16">Timestamp:</span>
                    <span className="text-stone-600 font-mono text-[11px]">
                      {new Date(selectedNotification.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 w-16">Status:</span>
                    <span className="text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Sent
                    </span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-5 text-sm text-stone-800 leading-relaxed whitespace-pre-line font-sans">
                  {selectedNotification.body}
                </div>

                {/* Email Footer */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500">
                  Automated THANAL notification. Each email is sent once per year.
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                Select an email on the left to preview it.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Active System Date: <strong className="text-stone-800 font-mono">{systemDate}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
