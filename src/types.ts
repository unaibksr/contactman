export type PhoneType = 'mobile' | 'work' | 'home' | 'other';
export type EmailType = 'home' | 'work' | 'other';

export interface PhoneItem {
  id: string;
  type: PhoneType;
  number: string;
  isPrimary?: boolean;
}

export interface EmailItem {
  id: string;
  type: EmailType;
  address: string;
  isPrimary?: boolean;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  phones: PhoneItem[];
  emails: EmailItem[];
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  avatarColor: string;
  avatarDataUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VcfParseResult {
  contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[];
  rawCount: number;
  parseErrors: string[];
}

export type DuplicateResolution = 'skip_existing' | 'overwrite' | 'keep_both';