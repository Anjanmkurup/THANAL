import React, { useState } from 'react';
import { useThanal } from './ThanalContext';
import { X, ShieldAlert, CheckCircle, UserCheck } from 'lucide-react';

interface VsRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const VsRegistrationModal: React.FC<VsRegistrationModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const { units, registerVs } = useThanal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [unitId, setUnitId] = useState(units[0]?.id || 'GCEK-141');
  const [password, setPassword] = useState('password123');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Auto-generate suggested VS ID when unit changes
  const handleUnitChange = (selectedUnitId: string) => {
    setUnitId(selectedUnitId);
    // VS ID is generated automatically and is not entered by the applicant.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const selectedUnit = units.find((u) => u.id === unitId);
    if (!selectedUnit) {
      setStatusMessage({ type: 'error', text: 'Please select a valid NSS Unit.' });
      return;
    }

    const result = await registerVs({
      id: `THANAL-VS-${selectedUnit.code}-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      email: email.trim(),
      phone: '',
      college: 'Government College of Engineering Kannur',
      unitId: selectedUnit.id,
      unitCode: selectedUnit.code,
      dob,
      password: password,
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
              <UserCheck className="w-5 h-5 text-green-800" />
              Volunteer Secretary (VS) Registration
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Instant access · No approval needed. Volunteers in your unit will need your approval
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
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{statusMessage.text}</p>
                {statusMessage.type === 'success' && (
                  <p className="mt-1 text-green-700">
                    You can now log in with your credentials.
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
                Go to Sign In
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
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Midhun Raj P"
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
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Each unit may register 2–3 Volunteer Secretaries.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Official / College Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vs.unit@gcek.ac.in"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Portal Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Register as VS
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
