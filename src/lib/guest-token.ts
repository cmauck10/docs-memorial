import { v4 as uuidv4 } from 'uuid';

const GUEST_TOKEN_KEY = 'memorial_guest_token';

export function getGuestToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  let token = localStorage.getItem(GUEST_TOKEN_KEY);
  
  if (!token) {
    token = uuidv4();
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  }
  
  return token;
}

export function clearGuestToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  }
}

