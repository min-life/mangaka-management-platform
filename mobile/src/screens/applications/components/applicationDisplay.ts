import { Colors } from '@/src/constants/colors';
import { ApplicationStatus, ApplicationType } from '@/src/types/applications';

export function getApplicationTypeLabel(type: ApplicationType) {
  return type === 'MANUSCRIPT_REVIEW' ? 'Manuscript Review' : 'Publish Request';
}

export function getApplicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVE':
      return 'Approved';
    case 'REJECT':
      return 'Rejected';
    case 'CANCELLED':
      return 'Cancelled';
  }
}

export function getApplicationStatusColor(status: ApplicationStatus) {
  switch (status) {
    case 'PENDING':
      return Colors.statusReview;
    case 'APPROVE':
      return Colors.statusDone;
    case 'REJECT':
      return '#EF4444';
    case 'CANCELLED':
      return Colors.statusPending;
  }
}

export function getApplicationTypeColor(type: ApplicationType) {
  return type === 'MANUSCRIPT_REVIEW' ? Colors.statusProgress : Colors.iconApp;
}

