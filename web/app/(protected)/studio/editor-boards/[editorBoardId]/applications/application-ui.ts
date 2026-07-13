export function getStatusStyle(status: string) {
  switch (status) {
    case 'APPROVE':
      return 'border-[#315846] bg-[#14291f] text-[#9df2c7]';
    case 'SUBMITTED':
      return 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]';
    case 'PENDING':
      return 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]';
    case 'REJECT':
      return 'border-[#6b2637] bg-[#371522] text-[#ff9ab3]';
    case 'CANCELLED':
      return 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]';
    default:
      return 'border-[#39424f] bg-[#1a222d] text-[#aeb7c2]';
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'APPROVE':
      return 'Approved';
    case 'SUBMITTED':
      return 'Submitted';
    case 'PENDING':
      return 'Pending';
    case 'REJECT':
      return 'Rejected';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getApplicationTypeLabel(type?: string) {
  switch (type) {
    case 'CREATE_ARC':
      return 'Create Arc';
    case 'CREATE_CHAPTER':
      return 'Create Chapter';
    case 'MANUSCRIPT_REVIEW':
      return 'Manuscript Review';
    case 'PUBLISH_REQUEST':
      return 'Publish Request';
    default:
      return type ?? 'Application';
  }
}

export function isBoardReviewableStatus(status: string) {
  return status === 'SUBMITTED' || status === 'PENDING';
}
