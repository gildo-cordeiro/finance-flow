import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profileApi';

export const PROFILE_KEY = ['settings', 'profile'];

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: profileApi.get });
}
