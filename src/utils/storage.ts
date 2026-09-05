import { Contact, DuplicateResolution } from '../types';

const STORAGE_KEY = 'contact_book_v1';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c-1',
    firstName: 'Elena',
    lastName: 'Rostova',
    company: 'Studio Form & Light',
    jobTitle: 'Architectural Designer',
    phones: [{ id: 'p-1', type: 'mobile', number: '+1 (555) 234-8901', isPrimary: true }],
    emails: [{ id: 'e-1', type: 'work', address: 'elena@studioformlight.design', isPrimary: true }],
    notes: 'Key collaborator on the residential minimalist pavilion project.',
    tags: ['Work', 'Design'],
    isFavorite: true,
    avatarColor: '#0284c7',
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'c-2',
    firstName: 'Marcus',
    lastName: 'Chen',
    company: 'Kinetic Labs',
    jobTitle: 'Systems Engineer',
    phones: [{ id: 'p-3', type: 'mobile', number: '+1 (555) 345-6789', isPrimary: true }],
    emails: [
      { id: 'e-2', type: 'work', address: 'm.chen@kineticlabs.tech', isPrimary: true },
      { id: 'e-3', type: 'home', address: 'marcus.chen@gmail.com' },
    ],
    notes: 'Met at Open Systems conference. Great resource for WebAssembly.',
    tags: ['Work', 'Tech'],
    isFavorite: true,
    avatarColor: '#16a34a',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'c-3',
    firstName: 'Maya',
    lastName: 'Patel',
    company: 'Sora Press',
    jobTitle: 'Editorial Director',
    phones: [{ id: 'p-4', type: 'mobile', number: '+1 (555) 789-0123', isPrimary: true }],
    emails: [{ id: 'e-4', type: 'home', address: 'maya.patel@sorapress.com', isPrimary: true }],
    notes: 'Coffee every first Thursday of the month.',
    tags: ['Friends', 'Family'],
    isFavorite: false,
    avatarColor: '#d97706',
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'c-4',
    firstName: 'Soren',
    lastName: 'Lindqvist',
    company: 'Nordic Audio',
    jobTitle: 'Acoustic Specialist',
    phones: [{ id: 'p-5', type: 'mobile', number: '+46 8 123 4567', isPrimary: true }],
    emails: [{ id: 'e-5', type: 'work', address: 'soren@nordicaudio.se', isPrimary: true }],
    notes: 'Expert in room acoustic calibration and spatial recordings.',
    tags: ['Audio', 'Work'],
    isFavorite: false,
    avatarColor: '#7c3aed',
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'c-5',
    firstName: 'Olivia',
    lastName: 'Wright',
    company: 'Wright & Associates',
    jobTitle: 'Principal Counsel',
    phones: [
      { id: 'p-6', type: 'mobile', number: '+1 (555) 901-2345', isPrimary: true },
      { id: 'p-7', type: 'home', number: '+1 (555) 432-1098' },
    ],
    emails: [{ id: 'e-6', type: 'work', address: 'olivia@wrightlegal.com', isPrimary: true }],
    notes: 'Trust & estate inquiries.',
    tags: ['Legal', 'VIP'],
    isFavorite: true,
    avatarColor: '#e11d48',
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 20,
  },
];

export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save contacts', err);
  }
}

export function generateContactId(): string {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sortContactsAlphabetical(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase() || a.company?.toLowerCase() || '';
    const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase() || b.company?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

export function mergeImportedContacts(
  existing: Contact[],
  imported: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[],
  resolution: DuplicateResolution
): { updatedList: Contact[]; addedCount: number; updatedCount: number; skippedCount: number } {
  const currentList = [...existing];
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const normalizePhone = (num: string) => num.replace(/[^0-9+]/g, '');
  const normalizeEmail = (em: string) => em.trim().toLowerCase();

  for (const item of imported) {
    const duplicateIdx = currentList.findIndex((c) => {
      const matchName =
        c.firstName.trim().toLowerCase() === item.firstName.trim().toLowerCase() &&
        c.lastName.trim().toLowerCase() === item.lastName.trim().toLowerCase() &&
        (c.firstName || c.lastName);

      if (matchName) return true;

      const cPhones = c.phones.map((p) => normalizePhone(p.number)).filter(Boolean);
      const itemPhones = item.phones.map((p) => normalizePhone(p.number)).filter(Boolean);
      if (cPhones.some((p) => itemPhones.includes(p))) return true;

      const cEmails = c.emails.map((e) => normalizeEmail(e.address)).filter(Boolean);
      const itemEmails = item.emails.map((e) => normalizeEmail(e.address)).filter(Boolean);
      if (cEmails.some((e) => itemEmails.includes(e))) return true;

      return false;
    });

    if (duplicateIdx !== -1) {
      if (resolution === 'skip_existing') {
        skippedCount++;
        continue;
      }
      if (resolution === 'overwrite') {
        const existingItem = currentList[duplicateIdx];
        currentList[duplicateIdx] = {
          ...item,
          id: existingItem.id,
          createdAt: existingItem.createdAt,
          updatedAt: Date.now(),
        };
        updatedCount++;
        continue;
      }
    }

    currentList.push({
      ...item,
      id: generateContactId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    addedCount++;
  }

  return {
    updatedList: sortContactsAlphabetical(currentList),
    addedCount,
    updatedCount,
    skippedCount,
  };
}