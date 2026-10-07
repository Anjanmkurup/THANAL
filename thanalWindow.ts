import { ThanalWindowInfo, VolunteerActivityStatus, PlantingSubmission } from './types';

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD to a local Date object without time skew
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calculate the 21-day THANAL window for a given DOB and target year
 * 10 days before birthday + birthday + 10 days after birthday = 21 days
 */
export function calculateThanalWindow(dobString: string, targetYear?: number, referenceDate?: Date): ThanalWindowInfo {
  const ref = referenceDate || new Date();
  const year = targetYear || ref.getFullYear();
  
  if (!dobString) {
    return {
      year,
      birthdayDate: '',
      startDate: '',
      endDate: '',
      totalDays: 21,
      isTodayBirthday: false,
      isWindowActive: false,
      isWindowUpcoming: false,
      isWindowPast: false,
    };
  }

  const dob = parseDate(dobString);
  const birthMonth = dob.getMonth();
  const birthDay = dob.getDate();

  // Birthday in target year
  const bdayThisYear = new Date(year, birthMonth, birthDay);

  // 10 days before
  const start = new Date(bdayThisYear);
  start.setDate(start.getDate() - 10);

  // 10 days after
  const end = new Date(bdayThisYear);
  end.setDate(end.getDate() + 10);

  const bdayStr = formatDate(bdayThisYear);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const todayStr = formatDate(ref);

  const today = parseDate(todayStr);

  const isTodayBirthday = todayStr === bdayStr;
  const isWindowUpcoming = today < start;
  const isWindowPast = today > end;
  const isWindowActive = today >= start && today <= end;

  // Calculate days remaining in window
  let daysRemaining: number | undefined;
  let dayNumberInWindow: number | undefined;
  let daysUntilWindowStarts: number | undefined;

  const msPerDay = 1000 * 60 * 60 * 24;

  if (isWindowUpcoming) {
    daysUntilWindowStarts = Math.ceil((start.getTime() - today.getTime()) / msPerDay);
  } else if (isWindowActive) {
    const elapsedDays = Math.floor((today.getTime() - start.getTime()) / msPerDay);
    dayNumberInWindow = elapsedDays + 1; // 1 to 21
    daysRemaining = Math.max(0, Math.floor((end.getTime() - today.getTime()) / msPerDay));
  } else if (isWindowPast) {
    daysRemaining = 0;
  }

  return {
    year,
    birthdayDate: bdayStr,
    startDate: startStr,
    endDate: endStr,
    totalDays: 21,
    dayNumberInWindow,
    daysRemaining,
    daysUntilWindowStarts,
    isTodayBirthday,
    isWindowActive,
    isWindowUpcoming,
    isWindowPast,
  };
}

/**
 * Determine the volunteer's current activity status
 * 
 * Rules:
 * Automatically marked COMPLETED only when:
 * 1. Planting submitted
 * 2. Photo uploaded
 * 3. Tree details entered
 * 4. Tag status = Yes – Approved
 * 
 * Statuses:
 * - UPCOMING
 * - ACTIVE
 * - PLANTING_SUBMITTED
 * - TAG_APPROVAL_PENDING
 * - COMPLETED
 * - WINDOW_CLOSED
 */
export function determineActivityStatus(
  windowInfo: ThanalWindowInfo,
  submission?: PlantingSubmission
): VolunteerActivityStatus {
  // If completed with approved tag
  if (
    submission &&
    submission.treeSpecies &&
    submission.photoUrl &&
    submission.plantingDate &&
    submission.tagApprovalStatus === 'Yes – Approved'
  ) {
    return 'COMPLETED';
  }

  // If planting is submitted
  if (submission && submission.photoUrl && submission.treeSpecies) {
    if (submission.tagApprovalStatus === 'Pending') {
      return 'TAG_APPROVAL_PENDING';
    }
    if (submission.tagApprovalStatus === 'No – Not Approved') {
      return 'PLANTING_SUBMITTED';
    }
    return 'PLANTING_SUBMITTED';
  }

  // No submission yet
  if (windowInfo.isWindowUpcoming) {
    return 'UPCOMING';
  }

  if (windowInfo.isWindowActive) {
    return 'ACTIVE';
  }

  if (windowInfo.isWindowPast) {
    return 'WINDOW_CLOSED';
  }

  return 'UPCOMING';
}

/**
 * Human friendly date range format: e.g. "10 Oct – 30 Oct 2026"
 */
export function formatRangeDisplay(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '';
  const s = parseDate(startDateStr);
  const e = parseDate(endDateStr);
  
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  const sDay = s.getDate();
  const eDay = e.getDate();
  const year = e.getFullYear();

  if (sMonth === eMonth) {
    return `${sDay}–${eDay} ${sMonth} ${year}`;
  }
  return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`;
}
