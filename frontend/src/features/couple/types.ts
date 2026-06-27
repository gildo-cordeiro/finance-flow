export interface CoupleStatusResponse {
  status: 'NONE' | 'PENDING' | 'ACTIVE';
  isSender?: boolean;
  partnerEmail?: string;
  partnerName?: string;
  inviteToken?: string;
}
