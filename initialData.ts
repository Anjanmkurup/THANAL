import {
  VSUser,
  VolunteerUser,
  Unit,
  PlantingSubmission,
  NotificationLog,
} from './types';

export const INITIAL_UNITS: Unit[] = [
  {
    id: 'GCEK-141',
    code: '141',
    name: 'NSS Unit 141 - Govt. College of Engineering Kannur',
    college: 'Government College of Engineering Kannur',
    district: 'Kannur',
    state: 'Kerala',
    assignedVsIds: [],
    createdAt: '2025-01-01',
  },
  {
    id: 'GCEK-257',
    code: '257',
    name: 'NSS Unit 257 - Govt. College of Engineering Kannur',
    college: 'Government College of Engineering Kannur',
    district: 'Kannur',
    state: 'Kerala',
    assignedVsIds: [],
    createdAt: '2025-01-01',
  },
  {
    id: 'GCEK-265',
    code: '265',
    name: 'NSS Unit 265 - Govt. College of Engineering Kannur',
    college: 'Government College of Engineering Kannur',
    district: 'Kannur',
    state: 'Kerala',
    assignedVsIds: [],
    createdAt: '2025-01-01',
  },
];

// Production state: Empty until real Volunteer Secretaries register
export const INITIAL_VS_USERS: VSUser[] = [];

// Production state: Empty until real volunteers register and are approved by their Unit VS
export const INITIAL_VOLUNTEERS: VolunteerUser[] = [];

// Production state: Empty until real volunteers submit tree planting evidence
export const INITIAL_SUBMISSIONS: PlantingSubmission[] = [];

// Production state: Empty until automatic or system notifications are dispatched
export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [];
