export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  address?: Address;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  preferredProviderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PatientSearchResult {
  id: string;
  fullName: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
}
