import React, { useState } from 'react';
import { VolunteerUser, PlantingSubmission, TagApprovalStatus } from './types';
import { useThanal, displayId } from './ThanalContext';
import Avatar from './Avatar';
import { calculateThanalWindow, determineActivityStatus } from './thanalWindow';
import { X, Camera, Tag, Calendar, MapPin, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface VolunteerDetailModalProps {
  volunteer: VolunteerUser | null;
  submission?: PlantingSubmission;
  isOpen: boolean;
  onClose: () => void;
}

export const VolunteerDetailModal: React.FC<VolunteerDetailModalProps> = ({
  volunteer,
  submission,
  isOpen,
  onClose,
}) => {
  const { updateTagStatus, approveVolunteer, rejectVolunteer, currentUser, systemDate } = useThanal();

  const [tagStatus, setTagStatus] = useState<TagApprovalStatus>(
    submission?.tagApprovalStatus || 'Pending'
  );
  const [tagNotes, setTagNotes] = useState(submission?.tagNotes || '');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  if (!isOpen || !volunteer) return null;

  const currentYear = new Date().getFullYear();
  const windowInfo = calculateThanalWindow(volunteer.dob, currentYear);
  const currentStatus = determineActivityStatus(windowInfo, submission);

  const handleSaveTag = () => {
    if (submission) {
      updateTagStatus(submission.id, tagStatus, tagNotes);
      setSaveFeedback('Tag approval status updated.');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleApprove = () => {
    if (currentUser) {
      approveVolunteer(volunteer.id, currentUser.id);
    }
  };

  const handleReject = async () => {
    // Rejecting deletes the volunteer completely, so close this window afterwards.
    await rejectVolunteer(volunteer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar userId={volunteer.id} name={volunteer.name} size={48} />
            <div>
              <h3 className="text-base font-bold text-stone-900">{volunteer.name}</h3>
              <div className="text-xs text-stone-500 font-mono mt-0.5">
                ID: {displayId(volunteer)} · Unit: {volunteer.unitCode}{volunteer.batch ? ` · Batch: 20${volunteer.batch}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {saveFeedback && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>{saveFeedback}</span>
            </div>
          )}

          {/* Volunteer Profile & Window Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-lg border border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 block">Date of Birth:</span>
              <strong className="text-stone-800 font-mono">{volunteer.dob}</strong>
            </div>
            <div>
              <span className="text-stone-500 block">21-Day Window:</span>
              <strong className="text-stone-800 font-mono">{windowInfo.startDate} to {windowInfo.endDate}</strong>
            </div>
            <div>
              <span className="text-stone-500 block">Activity Status:</span>
              <strong className="text-green-800">{currentStatus}</strong>
            </div>
            <div>
              <span className="text-stone-500 block">Registration Status:</span>
              <span className={`font-semibold ${volunteer.status === 'APPROVED' ? 'text-green-700' : 'text-amber-700'}`}>
                {volunteer.status}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">Email:</span>
              <span className="text-stone-700 truncate block">{volunteer.email}</span>
            </div>
            <div>
              <span className="text-stone-500 block">Phone:</span>
              <span className="text-stone-700 font-mono">{volunteer.phone}</span>
            </div>
          </div>

          {/* Pending Approval Controls if volunteer is not approved yet */}
          {volunteer.status === 'PENDING' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-3">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                This volunteer is PENDING your unit approval.
              </div>
              <p className="text-amber-800 text-[11px]">
                Approving grants them immediate access to their 21-day planting dashboard and notification scheduling.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Volunteer Registration
                </button>
                <button
                  onClick={handleReject}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Planting Evidence Section */}
          {submission ? (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-green-800" />
                Planting Photo &amp; Pit Verification
              </h4>

              {/* Photo Preview */}
              <div className="aspect-4/3 max-w-md mx-auto bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                <img
                  src={submission.photoUrl}
                  alt="Tree planting evidence"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Tree Details */}
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Species:</span>
                  <strong className="text-stone-900 text-sm">{submission.treeSpecies}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Planting Date:</span>
                  <span className="font-mono text-stone-800">{submission.plantingDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Location:</span>
                  <span className="text-stone-800">{submission.locationName}</span>
                </div>
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-stone-500 block mb-1">Care &amp; Pit Description:</span>
                  <p className="text-stone-700 leading-relaxed bg-white p-2.5 rounded border border-stone-200">
                    {submission.description}
                  </p>
                </div>
              </div>

              {/* VS Tag Status Modification */}
              <div className="bg-white p-4 rounded-lg border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-green-800" />
                  Tree Tag Approval Verification
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  {(['Pending', 'Yes – Approved', 'No – Not Approved'] as TagApprovalStatus[]).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTagStatus(opt)}
                        className={`p-2 text-xs rounded-lg border text-center transition-colors ${
                          tagStatus === opt
                            ? 'bg-green-800 text-white font-semibold border-green-900'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Field Inspection Notes / QR ID
                  </label>
                  <input
                    type="text"
                    value={tagNotes}
                    onChange={(e) => setTagNotes(e.target.value)}
                    placeholder="e.g. Verified by NRPF field team, Tag #NRPF-KL-KNR-0492"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveTag}
                  className="px-4 py-2 bg-green-800 hover:bg-green-900 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Save Tag Verification
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-500">
              No tree planting evidence submitted by this volunteer yet for {currentYear}.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
