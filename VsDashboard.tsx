import React, { useState } from 'react';
import { useThanal, displayId } from './ThanalContext';
import { VSUser, VolunteerUser, VolunteerActivityStatus } from './types';
import { calculateThanalWindow, determineActivityStatus, parseDate } from './thanalWindow';
import { VolunteerDetailModal } from './VolunteerDetailModal';
import { DriveSetupPanel } from './DriveSetupPanel';
import ProfilePhoto from './ProfilePhoto';
import Avatar from './Avatar';
import {
  Users,
  Sprout,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  UserCheck,
  AlertCircle,
  Building,
  Tag,
  Calendar,
} from 'lucide-react';

interface VsDashboardProps {
  activeTab?: string;
}

export const VsDashboard: React.FC<VsDashboardProps> = ({ activeTab = 'unit_overview' }) => {
  const tab = ['unit_overview', 'volunteer_approvals', 'volunteer_directory', 'evidence_review', 'drive_setup'].includes(activeTab)
    ? activeTab
    : 'unit_overview';
  const {
    currentUser,
    volunteers,
    submissions,
    units,
    approveVolunteer,
    rejectVolunteer,
    systemDate,
    driveSettings,
  } = useThanal();

  const vs = currentUser as VSUser;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  if (!vs || vs.role !== 'VS') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-stone-500">Please sign in as an approved Volunteer Secretary.</p>
      </div>
    );
  }

  // VS sees ONLY their unit! (Strict prompt security requirement)
  const unitVolunteers = volunteers.filter((v) => v.unitId === vs.unitId);
  const unitSubmissions = submissions.filter((s) => s.unitId === vs.unitId);
  const assignedUnit = units.find((u) => u.id === vs.unitId);

  const currentYear = parseDate(systemDate).getFullYear();
  const refDate = parseDate(systemDate);

  // Compute status for each volunteer in this unit
  const volunteersWithStatus = unitVolunteers.map((vol) => {
    const windowInfo = calculateThanalWindow(vol.dob, currentYear, refDate);
    const sub = unitSubmissions.find((s) => s.volunteerId === vol.id && s.year === currentYear);
    const activityStatus = determineActivityStatus(windowInfo, sub);
    return {
      volunteer: vol,
      windowInfo,
      submission: sub,
      activityStatus,
    };
  });

  // Calculate Required Dashboard Statistics
  // 1. Total Volunteers
  // 2. Upcoming
  // 3. Active
  // 4. Planting Submitted
  // 5. Tag Pending
  // 6. Completed
  // 7. Window Closed
  const totalVolunteers = unitVolunteers.length;
  const countUpcoming = volunteersWithStatus.filter((v) => v.activityStatus === 'UPCOMING').length;
  const countActive = volunteersWithStatus.filter((v) => v.activityStatus === 'ACTIVE').length;
  const countPlantingSubmitted = volunteersWithStatus.filter(
    (v) => v.activityStatus === 'PLANTING_SUBMITTED'
  ).length;
  const countTagPending = volunteersWithStatus.filter(
    (v) => v.activityStatus === 'TAG_APPROVAL_PENDING'
  ).length;
  const countCompleted = volunteersWithStatus.filter(
    (v) => v.activityStatus === 'COMPLETED'
  ).length;
  const countWindowClosed = volunteersWithStatus.filter(
    (v) => v.activityStatus === 'WINDOW_CLOSED'
  ).length;
  const countPendingRegistrations = unitVolunteers.filter((v) => v.status === 'PENDING').length;

  // Filtered List for Table
  const filteredVolunteers = volunteersWithStatus.filter(({ volunteer, activityStatus, submission }) => {
    if (tab === 'evidence_review' && !submission) return false;
    const matchesSearch =
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING_REGISTRATION') return volunteer.status === 'PENDING';
    return activityStatus === statusFilter;
  });

  const handleOpenDetail = (vol: VolunteerUser) => {
    setSelectedVolunteer(vol);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: VolunteerActivityStatus, regStatus: string) => {
    if (regStatus === 'PENDING') {
      return <span className="text-amber-700 font-semibold">Pending Approval</span>;
    }
    switch (status) {
      case 'COMPLETED':
        return <span className="text-green-700 font-semibold">Completed</span>;
      case 'TAG_APPROVAL_PENDING':
        return <span className="text-amber-700 font-semibold">Tag Pending</span>;
      case 'PLANTING_SUBMITTED':
        return <span className="text-blue-700 font-semibold">Planting Submitted</span>;
      case 'ACTIVE':
        return <span className="text-green-800 font-bold">Active Window</span>;
      case 'UPCOMING':
        return <span className="text-stone-600 font-medium">Upcoming</span>;
      case 'WINDOW_CLOSED':
        return <span className="text-red-700 font-medium">Window Closed</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Unit Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <ProfilePhoto size={84} />
        <div>
          <div className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
            <Building className="w-4 h-4 text-green-800" />
            Unit Portal · Restricted to Unit Jurisdiction
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">
            {assignedUnit?.name || vs.unitCode}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-stone-600">
            <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-800">
              Unit Code: {vs.unitCode}
            </span>
            <span aria-hidden="true">·</span>
            <span>Logged in as: <strong>{vs.name}</strong> ({displayId(vs)})</span>
            <span aria-hidden="true">·</span>
            <span>College: {vs.college}</span>
          </div>
        </div>
        </div>
      </div>

      {tab === 'unit_overview' && !driveSettings && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
          <strong>Connect your unit&apos;s Google Drive.</strong> Volunteers can&apos;t upload planting photos until you
          finish the <strong>Drive Setup</strong> tab.
        </div>
      )}

      {tab === 'drive_setup' && <DriveSetupPanel />}

      {tab === 'unit_overview' && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600">
            Unit Statistics &amp; Monitoring ({currentYear})
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            Evaluated on {systemDate}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 1. Total Volunteers */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] text-stone-500 font-medium">Total Volunteers</div>
            <div className="text-2xl font-bold text-stone-900 font-mono mt-1 tabular-nums">
              {totalVolunteers}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              {countPendingRegistrations} pending approval
            </div>
          </div>

          {/* 2. Upcoming */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] text-stone-500 font-medium">Upcoming</div>
            <div className="text-2xl font-bold text-stone-700 font-mono mt-1 tabular-nums">
              {countUpcoming}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Window not reached
            </div>
          </div>

          {/* 3. Active */}
          <div className="bg-white p-4 rounded-2xl border border-green-200 bg-green-50/30 shadow-sm">
            <div className="text-[11px] text-green-800 font-medium">Active Window</div>
            <div className="text-2xl font-bold text-green-900 font-mono mt-1 tabular-nums">
              {countActive}
            </div>
            <div className="text-[10px] text-green-700 mt-1">
              Currently inside 21 days
            </div>
          </div>

          {/* 4. Planting Submitted */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] text-blue-700 font-medium">Planting Submitted</div>
            <div className="text-2xl font-bold text-blue-900 font-mono mt-1 tabular-nums">
              {countPlantingSubmitted}
            </div>
            <div className="text-[10px] text-blue-600 mt-1">
              Photo &amp; pit uploaded
            </div>
          </div>

          {/* 5. Tag Pending */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
            <div className="text-[11px] text-amber-800 font-medium">Tag Pending</div>
            <div className="text-2xl font-bold text-amber-900 font-mono mt-1 tabular-nums">
              {countTagPending}
            </div>
            <div className="text-[10px] text-amber-700 mt-1">
              Needs tag verification
            </div>
          </div>

          {/* 6. Completed */}
          <div className="bg-white p-4 rounded-2xl border border-green-300 bg-green-50 shadow-sm">
            <div className="text-[11px] text-green-900 font-bold">Completed</div>
            <div className="text-2xl font-bold text-green-800 font-mono mt-1 tabular-nums">
              {countCompleted}
            </div>
            <div className="text-[10px] text-green-700 mt-1">
              All 4 criteria satisfied
            </div>
          </div>

          {/* 7. Window Closed */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="text-[11px] text-red-700 font-medium">Window Closed</div>
            <div className="text-2xl font-bold text-stone-700 font-mono mt-1 tabular-nums">
              {countWindowClosed}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              21 days elapsed
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PENDING VOLUNTEER APPROVAL QUEUE (If any) */}
      {(tab === 'unit_overview' || tab === 'volunteer_approvals') && countPendingRegistrations > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Pending Volunteer Registrations Awaiting Your Unit Approval ({countPendingRegistrations})
            </h3>
          </div>

          <div className="divide-y divide-amber-200/60 bg-white rounded-lg border border-amber-200">
            {unitVolunteers
              .filter((v) => v.status === 'PENDING')
              .map((pVol) => (
                <div key={pVol.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Avatar userId={pVol.id} name={pVol.name} size={40} />
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">{pVol.name}</div>
                      <div className="text-stone-500 font-mono text-[11px]">
                        {displayId(pVol)} · DOB: {pVol.dob} · {pVol.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveVolunteer(pVol.id, vs.id)}
                      className="px-3 py-1.5 bg-green-800 hover:bg-green-900 text-white rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => rejectVolunteer(pVol.id)}
                      className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === 'volunteer_approvals' && countPendingRegistrations === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-sm text-center">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-stone-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-stone-500">
            New volunteer registrations for your unit will appear here. This list refreshes every 20 seconds.
          </p>
        </div>
      )}

      {/* VOLUNTEER DIRECTORY & MONITORING TABLE */}
      {(tab === 'volunteer_directory' || tab === 'evidence_review') && (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search volunteers by name or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
            />
          </div>

          {/* Interactive filter buttons as permitted segmented control */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'PLANTING_SUBMITTED', label: 'Planted' },
              { id: 'TAG_APPROVAL_PENDING', label: 'Tag Pending' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'WINDOW_CLOSED', label: 'Closed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-green-800 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-3 px-4">Volunteer</th>
                <th className="py-3 px-4">Birthday &amp; Window</th>
                <th className="py-3 px-4">Activity Status</th>
                <th className="py-3 px-4">Tree Evidence</th>
                <th className="py-3 px-4">Tag Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No volunteers to show yet.
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map(({ volunteer, windowInfo, submission, activityStatus }) => (
                  <tr key={volunteer.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* Volunteer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar userId={volunteer.id} name={volunteer.name} size={36} />
                        <div>
                          <div className="font-semibold text-stone-900">{volunteer.name}</div>
                          <div className="text-[11px] font-mono text-stone-500">{displayId(volunteer)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Window */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-stone-800 font-medium">🎂 {volunteer.dob}</div>
                      <div className="text-stone-500">
                        {windowInfo.startDate} – {windowInfo.endDate}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(activityStatus, volunteer.status)}
                    </td>

                    {/* Tree Evidence */}
                    <td className="py-3 px-4">
                      {submission ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                            <img
                              src={submission.photoUrl}
                              alt="Sapling"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-stone-900 truncate max-w-[140px]">
                              {submission.treeSpecies}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              {submission.plantingDate}
                            </div>
                            {submission.driveLink && (
                              <a
                                href={submission.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-green-700 underline"
                              >
                                Open in Drive
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-400">None</span>
                      )}
                    </td>

                    {/* Tag Status */}
                    <td className="py-3 px-4">
                      {submission ? (
                        <span
                          className={`font-medium ${
                            submission.tagApprovalStatus === 'Yes – Approved'
                              ? 'text-green-700'
                              : submission.tagApprovalStatus === 'No – Not Approved'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {submission.tagApprovalStatus}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(volunteer)}
                        className="px-2.5 py-1.5 text-stone-700 hover:text-green-900 hover:bg-stone-100 rounded-lg transition-colors font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Detail Inspection Modal */}
      <VolunteerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        volunteer={selectedVolunteer}
        submission={
          selectedVolunteer
            ? unitSubmissions.find(
                (s) => s.volunteerId === selectedVolunteer.id && s.year === currentYear
              )
            : undefined
        }
      />
    </div>
  );
};
