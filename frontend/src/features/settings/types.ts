export interface Profile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  currency: string;
  privacyVersion: string | null;
}

export interface UpdateProfileRequest {
  name: string;
  timezone: string;
}
