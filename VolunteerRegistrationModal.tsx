import React, { useState, useEffect } from 'react';
import { useThanal } from './ThanalContext';
import { X, CheckCircle, AlertCircle, Sprout, Calendar } from 'lucide-react';
import { calculateThanalWindow } from './thanalWindow';
import { BATCH_OPTIONS } from './batches';

interface VolunteerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const VolunteerRegistrationModal: React.FC<VolunteerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const { units, registerVolunteer, systemDate } = useThanal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('2004-10-20');
  const [unitId, setUnitId] = useState(units[0]?.id || 'GCEK-141');
  const [batch, setBatch] = useState('');
  const [password, setPassword] = useState('password123');
  const [pwLocked, setPwLocked] = useState(true);
  useEffect(() => {
    if (isOpen) {
      setPwLocked(true);
      setPassword('');
    }
  }, [isOpen]);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Auto-generate suggested Volunteer ID
  const handleUnitChange = (selectedUnitId: string) => {
    setUnitId(selectedUnitId);
    // Volunteer ID is generated automatically and is not entered by the volunteer.
  };

  // Preview the 21-day window live as the user chooses DOB
  const previewWindow = dob ? calculateThanalWindow(dob, 2026) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const selectedUnit = units.find((u) => u.id === unitId);
    if (!selectedUnit) {
      setStatusMessage({ type: 'error', text: 'Please select a valid NSS Unit.' });
      return;
    }

    const result = await registerVolunteer({
      id: `THANAL-VOL-${selectedUnit.code}-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      email: email.trim(),
      phone: '',
      dob: dob,
      college: 'Government College of Engineering Kannur',
      unitId: selectedUnit.id,
      unitCode: selectedUnit.code,
      password: password,
      batch,
    });

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-800" />
              NSS Volunteer Registration
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Begins as PENDING · Requires approval from your Unit Volunteer Secretary
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {statusMessage && (
            <div
              className={`p-4 rounded-lg text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{statusMessage.text}</p>
                {statusMessage.type === 'success' && (
                  <p className="mt-1 text-green-700">
                    Switch to your <strong>Unit VS</strong> to approve this registration and begin your 21-day planting window!
                  </p>
                )}
              </div>
            </div>
          )}

          {statusMessage?.type === 'success' ? (
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="w-full py-2.5 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Volunteer Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Sreedhar"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  NSS Unit
                </label>
                <select
                  value={unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code}) · {u.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Batch
                </label>
                <select
                  required
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                >
                  <option value="">Select your batch</option>
                  {BATCH_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Birth & Live 21-Day Window Calculation */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Date of Birth (DOB)</span>
                  <span className="text-[11px] text-green-800 font-normal">
                    Determines 21-Day Window
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                />

                {previewWindow && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 text-[11px] text-stone-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Calculated Window (2026):</span>
                      <span className="font-mono font-medium text-stone-900">
                        {previewWindow.startDate} to {previewWindow.endDate}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      10 days before birthday + Birthday ({previewWindow.birthdayDate}) + 10 days after = 21 Days total.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="volunteer@gcek.ac.in"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="thanal-create-password"
                  autoComplete="new-password"
                  readOnly={pwLocked}
                  onFocus={() => setPwLocked(false)}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Submit Registration (Pending VS Approval)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
