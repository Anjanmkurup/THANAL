import React, { useState } from 'react';
import { useThanal, displayId } from './ThanalContext';
import ProfilePhoto from './ProfilePhoto';
import { VolunteerUser, TagApprovalStatus } from './types';
import {
  calculateThanalWindow,
  determineActivityStatus,
  formatRangeDisplay,
  parseDate,
} from './thanalWindow';
import {
  Sprout,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  MapPin,
  Tag,
  ExternalLink,
  Info,
  Check,
  FolderSync,
  History,
} from 'lucide-react';

// Shrink phone photos before upload (max 1600px, JPEG) so Drive uploads stay fast.
const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image.'));
    };
    img.src = url;
  });

interface VolunteerDashboardProps {
  activeSection?: string;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ activeSection: activeSectionProp = 'my_window' }) => {
  const activeSection = ['my_window', 'plant_tree', 'tag_status', 'my_history'].includes(activeSectionProp)
    ? activeSectionProp
    : 'my_window';
  const {
    currentUser,
    submissions,
    submitPlanting,
    updateTagStatus,
    systemDate,
    units,
    notifications,
  } = useThanal();

  const volunteer = currentUser as VolunteerUser;

  // Form states
  const [treeSpecies, setTreeSpecies] = useState('Neem (Azadirachta indica)');
  const [customSpecies, setCustomSpecies] = useState('');
  const [plantingDate, setPlantingDate] = useState(systemDate);
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [tagStatus, setTagStatus] = useState<TagApprovalStatus>('Pending');
  const [tagNotes, setTagNotes] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!volunteer || volunteer.role !== 'VOLUNTEER') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-stone-500">Please sign in as a Volunteer to view this dashboard.</p>
      </div>
    );
  }

  const currentYear = parseDate(systemDate).getFullYear();
  const refDate = parseDate(systemDate);

  // Calculate annual 21-day window
  const windowInfo = calculateThanalWindow(volunteer.dob, currentYear, refDate);

  // Only true if the mail job really sent the Day-1 email for this year
  const startEmailSent = notifications.some(
    (n) =>
      n.volunteerId === volunteer.id &&
      n.year === currentYear &&
      n.type === 'WINDOW_START_REMINDER'
  );

  // Find submission for current year
  const currentSubmission = submissions.find(
    (s) => s.volunteerId === volunteer.id && s.year === currentYear
  );

  // Find all historical submissions for this volunteer
  const historySubmissions = submissions.filter(
    (s) => s.volunteerId === volunteer.id
  ).sort((a, b) => b.year - a.year);

  // Determine current activity status
  const currentStatus = determineActivityStatus(windowInfo, currentSubmission);

  // Find user unit
  const userUnit = units.find((u) => u.id === volunteer.unitId);

  // Handle Planting Submission
  const handlePlantingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setSubmissionFeedback('Mandatory evidence missing: Please upload a photo showing yourself personally planting the sapling in the excavated pit.');
      setTimeout(() => setSubmissionFeedback(null), 5000);
      return;
    }

    const finalSpecies = treeSpecies === 'Other' ? customSpecies : treeSpecies;

    setIsUploading(true);
    setSubmissionFeedback('Uploading photo to your unit’s Google Drive…');
    const result = await submitPlanting({
      volunteerId: volunteer.id,
      treeSpecies: finalSpecies,
      plantingDate,
      locationName,
      description,
      photoUrl,
      photoFileName: photoFileName || 'planting_photo.jpg',
      tagApprovalStatus: tagStatus,
      tagNotes,
    });
    setIsUploading(false);

    setSubmissionFeedback(result.message);
    setTimeout(() => setSubmissionFeedback(null), result.success ? 5000 : 9000);
  };

  // Handle direct tag status update
  const handleTagStatusChange = (newStatus: TagApprovalStatus) => {
    setTagStatus(newStatus);
    if (currentSubmission) {
      updateTagStatus(currentSubmission.id, newStatus, tagNotes);
    }
  };

  // Status visual indicator helper (Unboxed text with subtle accents as per frontend design)
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Completed',
          color: 'text-green-700 bg-green-50 border-green-200',
          desc: 'All 4 requirements fulfilled. Congratulations on completing your THANAL pledge!',
        };
      case 'TAG_APPROVAL_PENDING':
        return {
          label: 'Tag Approval Pending',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          desc: 'Planting evidence submitted. Awaiting physical tree-tag approval from the field team.',
        };
      case 'PLANTING_SUBMITTED':
        return {
          label: 'Planting Submitted',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          desc: 'Planting details recorded. Update your tree tag verification once approved.',
        };
      case 'ACTIVE':
        return {
          label: 'Active Window',
          color: 'text-green-800 bg-green-100 border-green-300',
          desc: 'Your 21-day THANAL window is currently open! Please plant your sapling and upload evidence.',
        };
      case 'UPCOMING':
        return {
          label: 'Upcoming Window',
          color: 'text-stone-700 bg-stone-100 border-stone-200',
          desc: `Your 21-day window opens on ${windowInfo.startDate} (${windowInfo.daysUntilWindowStarts} days away).`,
        };
      case 'WINDOW_CLOSED':
        return {
          label: 'Window Closed',
          color: 'text-red-700 bg-red-50 border-red-200',
          desc: 'Your 21-day window has concluded for this cycle without completion.',
        };
      default:
        return {
          label: status,
          color: 'text-stone-700 bg-stone-100 border-stone-200',
          desc: '',
        };
    }
  };

  const statusMeta = getStatusDisplay(currentStatus);

  // Check 4 mandatory completion criteria
  const isCriteria1Met = Boolean(currentSubmission?.submittedAt);
  const isCriteria2Met = Boolean(currentSubmission?.photoUrl);
  const isCriteria3Met = Boolean(currentSubmission?.treeSpecies && currentSubmission?.plantingDate);
  const isCriteria4Met = currentSubmission?.tagApprovalStatus === 'Yes – Approved';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Identity Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <ProfilePhoto size={84} />
        <div>
          <div className="text-xs text-stone-500 font-medium">
            National Service Scheme · {userUnit?.name || volunteer.unitCode}
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mt-0.5">
            {volunteer.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
            <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-800">
              ID: {displayId(volunteer)}
            </span>
            <span aria-hidden="true">·</span>
            <span>DOB: <strong>{volunteer.dob}</strong></span>
            <span aria-hidden="true">·</span>
            <span>College: {volunteer.college}</span>
          </div>
        </div>
        </div>

        {/* Current Status Pill-Free Block */}
        <div className={`p-4 rounded-2xl border ${statusMeta.color} max-w-sm text-right md:text-left`}>
          <div className="text-[11px] uppercase tracking-wider font-semibold opacity-80">
            Current THANAL Status
          </div>
          <div className="text-lg font-bold mt-0.5">
            {statusMeta.label}
          </div>
          <div className="text-xs mt-1 leading-snug opacity-90">
            {statusMeta.desc}
          </div>
        </div>
      </div>

      {activeSection === 'my_window' && (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-800" />
              Annual 21-Day Activity Window ({currentYear})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              10 days before birthday + Birthday + 10 days after birthday = 21 Days total
            </p>
          </div>

          <div className="text-xs font-mono text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
            Window Range: <strong className="text-stone-900">{formatRangeDisplay(windowInfo.startDate, windowInfo.endDate)}</strong>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {/* Start Milestone */}
            <div className={`p-4 rounded-lg border ${windowInfo.startDate === systemDate ? 'border-green-600 bg-green-50/50' : 'border-stone-200 bg-stone-50/50'}`}>
              <div className="text-xs text-stone-500 font-medium">Window Opens (Day 1)</div>
              <div className="text-base font-bold text-stone-900 font-mono mt-1">
                {windowInfo.startDate}
              </div>
              <div className={`text-[11px] mt-1 ${startEmailSent ? 'text-green-700' : 'text-stone-500'}`}>
                {startEmailSent ? '📧 Reminder email sent' : '📧 Reminder email will be sent on this day'}
              </div>
            </div>

            {/* Birthday Milestone */}
            <div className={`p-4 rounded-lg border ${windowInfo.isTodayBirthday ? 'border-green-600 bg-green-50' : 'border-stone-200 bg-stone-50/50'}`}>
              <div className="text-xs text-stone-500 font-medium">Your Birthday (Center Day)</div>
              <div className="text-base font-bold text-green-900 font-mono mt-1">
                {windowInfo.birthdayDate}
              </div>
              <div className="text-[11px] text-amber-700 mt-1">
                🎂 Automated birthday greetings sent
              </div>
            </div>

            {/* End Milestone */}
            <div className={`p-4 rounded-lg border ${windowInfo.endDate === systemDate ? 'border-red-400 bg-red-50' : 'border-stone-200 bg-stone-50/50'}`}>
              <div className="text-xs text-stone-500 font-medium">Window Closes (Day 21)</div>
              <div className="text-base font-bold text-stone-900 font-mono mt-1">
                {windowInfo.endDate}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Deadline for planting &amp; evidence
              </div>
            </div>
          </div>

          {/* Progress Bar & Day Counter */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">
                Window Progress: {windowInfo.dayNumberInWindow ? `Day ${windowInfo.dayNumberInWindow} of 21` : (windowInfo.isWindowUpcoming ? 'Not Started' : 'Concluded')}
              </span>
              <span className="font-mono text-stone-600 tabular-nums">
                {windowInfo.isWindowActive
                  ? `${windowInfo.daysRemaining} days remaining`
                  : windowInfo.isWindowUpcoming
                  ? `Starts in ${windowInfo.daysUntilWindowStarts} days`
                  : 'Window closed'}
              </span>
            </div>

            {/* Progress track */}
            <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  currentStatus === 'COMPLETED'
                    ? 'bg-green-600'
                    : windowInfo.isWindowActive
                    ? 'bg-green-700'
                    : 'bg-stone-400'
                }`}
                style={{
                  width: windowInfo.dayNumberInWindow
                    ? `${(windowInfo.dayNumberInWindow / 21) * 100}%`
                    : windowInfo.isWindowPast
                    ? '100%'
                    : '0%',
                }}
              />
            </div>

            {/* 4 Completion Invariants Required By Policy */}
            <div className="pt-3 border-t border-stone-200">
              <div className="text-xs font-semibold text-stone-800 mb-2">
                Mandatory Completion Criteria (All 4 Required):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className={`p-2.5 rounded border flex items-center gap-2 ${isCriteria1Met ? 'bg-green-50 border-green-200 text-green-900' : 'bg-white border-stone-200 text-stone-500'}`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCriteria1Met ? 'text-green-700' : 'text-stone-300'}`} />
                  <span>1. Planting submitted</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center gap-2 ${isCriteria2Met ? 'bg-green-50 border-green-200 text-green-900' : 'bg-white border-stone-200 text-stone-500'}`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCriteria2Met ? 'text-green-700' : 'text-stone-300'}`} />
                  <span>2. Photo uploaded</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center gap-2 ${isCriteria3Met ? 'bg-green-50 border-green-200 text-green-900' : 'bg-white border-stone-200 text-stone-500'}`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCriteria3Met ? 'text-green-700' : 'text-stone-300'}`} />
                  <span>3. Tree details entered</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center gap-2 ${isCriteria4Met ? 'bg-green-50 border-green-200 text-green-900' : 'bg-white border-stone-200 text-stone-500'}`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCriteria4Met ? 'text-green-700' : 'text-stone-300'}`} />
                  <span>4. Tag status = Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TWO COLUMN WORKSPACE: Left = Tree Planting Form, Right = Tag Verification & Drive Path */}
      {(activeSection === 'plant_tree' || activeSection === 'tag_status') && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tree Planting Submission Form */}
        <div className={`${activeSection === 'plant_tree' ? 'lg:col-span-8 lg:col-start-3' : 'hidden'} bg-white border border-stone-200 rounded-2xl p-6 shadow-sm`}>
          <div className="pb-4 border-b border-stone-200 mb-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-800" />
              Tree Planting Submission ({currentYear})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Submit your planting details and mandatory photograph showing yourself and the planting pit.
            </p>
          </div>

          {submissionFeedback && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-700 shrink-0" />
              <span>{submissionFeedback}</span>
            </div>
          )}

          <form onSubmit={handlePlantingSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tree / Sapling Species Name
              </label>
              <select
                value={treeSpecies}
                onChange={(e) => setTreeSpecies(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
              >
                <option value="Neem (Azadirachta indica)">Neem (Azadirachta indica)</option>
                <option value="Mahogany (Swietenia macrophylla)">Mahogany (Swietenia macrophylla)</option>
                <option value="Kanikkonna (Cassia fistula)">Kanikkonna / Golden Shower (Cassia fistula)</option>
                <option value="Mango (Mangifera indica)">Mango (Mangifera indica)</option>
                <option value="Jackfruit (Artocarpus heterophyllus)">Jackfruit (Artocarpus heterophyllus)</option>
                <option value="Teak (Tectona grandis)">Teak (Tectona grandis)</option>
                <option value="Amla / Indian Gooseberry (Phyllanthus emblica)">Amla (Phyllanthus emblica)</option>
                <option value="Other">Other Species (Specify below)</option>
              </select>
            </div>

            {treeSpecies === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Specify Botanical / Local Name
                </label>
                <input
                  type="text"
                  required
                  value={customSpecies}
                  onChange={(e) => setCustomSpecies(e.target.value)}
                  placeholder="e.g. Tamarind, Banyan, etc."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Planting Date
                </label>
                <input
                  type="date"
                  required
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  Planting Location
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Campus Botanical Quad, Pit #3"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pit Preparation &amp; Care Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe pit size, soil mixture, organic fertilizers, tree guard, watering plan..."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            {/* Mandatory Planting Photo Upload */}
            <div className="border border-stone-300 rounded-2xl p-4 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-green-800" />
                  Mandatory Planting Photo Evidence
                </label>
                <span className="text-[11px] text-red-600 font-medium">Required</span>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  Evidence Quality Guidelines:
                </div>
                <p className="text-[11px] leading-relaxed">
                  The photo must clearly show the <strong>volunteer personally planting the sapling</strong> and the <strong>planting pit</strong>. Photos showing only a sapling without the volunteer or without pit details will be rejected by your VS.
                </p>
              </div>

              {/* Photo Preview Container with CSS Fallback */}
              <div className="aspect-4/3 max-w-sm mx-auto bg-stone-200 rounded-lg overflow-hidden border border-stone-300 relative flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Volunteer planting evidence preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-stone-500 text-xs">
                    <Camera className="w-8 h-8 mx-auto mb-1 text-stone-400" />
                    No photo uploaded yet
                  </div>
                )}
              </div>

              {/* Upload control & Sample Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="cursor-pointer px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-stone-300">
                  <Upload className="w-3.5 h-3.5" />
                  Choose File...
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFileName(file.name);
                        compressImage(file)
                          .then(setPhotoUrl)
                          .catch(() => setSubmissionFeedback('Could not read that image. Please choose another photo.'));
                      }
                    }}
                  />
                </label>

                <div className="text-[11px] text-stone-500 font-mono">
                  {photoFileName}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 px-4 bg-green-800 hover:bg-green-900 disabled:opacity-60 disabled:cursor-wait text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Sprout className="w-4 h-4" />
                {isUploading ? 'Uploading to Drive…' : currentSubmission ? 'Update Planting Submission' : 'Submit Planting Evidence'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Tree Tag Approval Status & Google Drive Structure */}
        <div className={`${activeSection === 'tag_status' ? 'lg:col-span-8 lg:col-start-3' : 'hidden'} space-y-6`}>
          {/* Tree Tag Approval Widget */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-800" />
                Tree Tag Approval Status
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Physical tag approval is conducted outside the website by the field verification team.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                <label className="block text-xs font-bold text-stone-900 mb-2">
                  “Has your tree tag been approved?”
                </label>

                <div className="space-y-2">
                  {(['Pending', 'Yes – Approved', 'No – Not Approved'] as TagApprovalStatus[]).map(
                    (option) => {
                      const isSelected = (currentSubmission ? currentSubmission.tagApprovalStatus : tagStatus) === option;
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-white border-green-700 text-stone-900 font-semibold shadow-sm'
                              : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tagApproval"
                            value={option}
                            checked={isSelected}
                            onChange={() => handleTagStatusChange(option)}
                            className="text-green-700 focus:ring-green-700"
                          />
                          <span>{option}</span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Tag Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tag Number / Field Inspection Notes (Optional)
                </label>
                <input
                  type="text"
                  value={currentSubmission?.tagNotes || tagNotes}
                  onChange={(e) => {
                    setTagNotes(e.target.value);
                    if (currentSubmission) {
                      updateTagStatus(
                        currentSubmission.id,
                        currentSubmission.tagApprovalStatus,
                        e.target.value
                      );
                    }
                  }}
                  placeholder="e.g. Tag #NRPF-KL-KNR-0492"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <div className="font-semibold text-stone-800">
                  Automatic Completion Rule:
                </div>
                <p>
                  Setting tag status to <strong>“Yes – Approved”</strong> with your planting photo and tree details automatically marks your THANAL activity as <strong>COMPLETED</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Google Drive Unit Photo Storage Path */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <FolderSync className="w-4 h-4 text-green-800" />
                Google Drive Storage Routing
              </h3>
              <span className="text-[10px] text-amber-700 font-medium">
                Drive: Not Connected
              </span>
            </div>

            <p className="text-xs text-stone-500 mb-3">
              Target cloud directory path formatted according to THANAL unit repository structure:
            </p>

            <div className="p-3 bg-stone-900 text-stone-200 rounded-lg font-mono text-[11px] break-all select-all">
              THANAL / {volunteer.unitCode} / {displayId(volunteer)}_{volunteer.name} / {currentYear} / {photoFileName}
            </div>

            <div className="mt-3 text-[11px] text-stone-500">
              When Google Drive OAuth is connected by the administrator, submitted photos sync directly to your unit&apos;s folder.
            </div>
          </div>
        </div>
      </div>

      )}

      {/* ACTIVITY HISTORY SECTION */}
      {activeSection === 'my_history' && (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5 text-green-800" />
            Volunteer Activity History
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {historySubmissions.length} Annual Record(s)
          </span>
        </div>

        {historySubmissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            No past planting records found. Submit your first planting above!
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {historySubmissions.map((sub) => (
              <div key={sub.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    <img
                      src={sub.photoUrl}
                      alt={sub.treeSpecies}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900">{sub.treeSpecies}</h4>
                      <span className="text-xs font-mono font-medium text-green-800 bg-green-50 px-2 py-0.5 rounded">
                        Year {sub.year}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>Planted: {sub.plantingDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>Location: {sub.locationName}</span>
                    </div>
                    {sub.tagNotes && (
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        Tag notes: {sub.tagNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-1">
                  <div className="text-xs font-semibold text-stone-800">
                    Tag: {sub.tagApprovalStatus}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    Ref: {String(sub.id).slice(0, 8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
