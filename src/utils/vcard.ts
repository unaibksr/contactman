import { Contact, VcfParseResult, PhoneType, EmailType } from '../types';
import { normalizePhoneNumber } from './storage';

function escapeVCardText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n');
}

function unescapeVCardText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function decodeQuotedPrintable(input: string): string {
  if (!input) return '';
  const cleaned = input.replace(/=\r?\n/g, '');
  try {
    const bytes: number[] = [];
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '=' && i + 2 < cleaned.length) {
        const hex = cleaned.substring(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16));
          i += 2;
          continue;
        }
      }
      bytes.push(cleaned.charCodeAt(i));
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return cleaned.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
}

export function contactsToVCardString(contacts: Contact[]): string {
  return contacts.map(contactToSingleVCard).join('\r\n\r\n');
}

function contactToSingleVCard(c: Contact): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact';
  lines.push(`FN:${escapeVCardText(fn)}`);
  lines.push(`N:${escapeVCardText(c.lastName || '')};${escapeVCardText(c.firstName || '')};;;`);

  if (c.company) lines.push(`ORG:${escapeVCardText(c.company)}`);
  if (c.jobTitle) lines.push(`TITLE:${escapeVCardText(c.jobTitle)}`);

  c.phones.forEach((phone) => {
    if (!phone.number.trim()) return;
    let typeParam = 'CELL,VOICE';
    if (phone.type === 'work') typeParam = 'WORK,VOICE';
    else if (phone.type === 'home') typeParam = 'HOME,VOICE';
    else if (phone.type === 'other') typeParam = 'OTHER';
    if (phone.isPrimary) typeParam += ',PREF';
    lines.push(`TEL;TYPE=${typeParam}:${phone.number.trim()}`);
  });

  c.emails.forEach((email) => {
    if (!email.address.trim()) return;
    let typeParam = 'INTERNET,HOME';
    if (email.type === 'work') typeParam = 'INTERNET,WORK';
    else if (email.type === 'other') typeParam = 'INTERNET';
    if (email.isPrimary) typeParam += ',PREF';
    lines.push(`EMAIL;TYPE=${typeParam}:${email.address.trim()}`);
  });

  if (c.notes) lines.push(`NOTE:${escapeVCardText(c.notes)}`);

  if (c.tags && c.tags.length > 0) {
    lines.push(`CATEGORIES:${c.tags.map(escapeVCardText).join(',')}`);
  }

  if (c.avatarDataUrl && c.avatarDataUrl.startsWith('data:image/')) {
    const match = c.avatarDataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (match) {
      lines.push(`PHOTO;ENCODING=b;TYPE=${match[1].toUpperCase()}:${match[2]}`);
    }
  }

  lines.push(`REV:${new Date(c.updatedAt || Date.now()).toISOString()}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVcfFile(contacts: Contact[], filename = 'contacts.vcf'): void {
  const vcfContent = contactsToVCardString(contacts);
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.vcf') ? filename : `${filename}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseVcfString(rawText: string): VcfParseResult {
  const result: VcfParseResult = { contacts: [], rawCount: 0, parseErrors: [] };
  if (!rawText || !rawText.trim()) return result;

  const unfolded = rawText.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const vcardBlocks: string[][] = [];
  let currentBlock: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === 'BEGIN:VCARD') {
      currentBlock = [];
    } else if (trimmed.toUpperCase() === 'END:VCARD') {
      if (currentBlock) {
        vcardBlocks.push(currentBlock);
        currentBlock = null;
      }
    } else if (currentBlock && trimmed.length > 0) {
      currentBlock.push(line);
    }
  }

  result.rawCount = vcardBlocks.length;

  for (let idx = 0; idx < vcardBlocks.length; idx++) {
    try {
      const parsed = parseSingleVCardBlock(vcardBlocks[idx]);
      if (parsed) result.contacts.push(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.parseErrors.push(`Contact #${idx + 1}: ${msg}`);
    }
  }

  return result;
}

function parseSingleVCardBlock(lines: string[]): Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> | null {
  let firstName = '';
  let lastName = '';
  let company = '';
  let jobTitle = '';
  const phones: Contact['phones'] = [];
  const emails: Contact['emails'] = [];
  let notes = '';
  const tags: string[] = [];
  let avatarDataUrl: string | undefined;

  let hasFormattedName = false;
  let formattedName = '';

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const propPart = line.substring(0, colonIndex);
    let valuePart = line.substring(colonIndex + 1);
    const propParams = propPart.split(';');
    let propName = propParams[0].trim().toUpperCase();

    if (propName.includes('.')) {
      propName = propName.split('.').pop() || propName;
    }

    const isQuotedPrintable = propParams.some((p) => p.toUpperCase().includes('ENCODING=QUOTED-PRINTABLE') || p.toUpperCase() === 'QUOTED-PRINTABLE');
    if (isQuotedPrintable) {
      valuePart = decodeQuotedPrintable(valuePart);
    }

    switch (propName) {
      case 'FN': {
        formattedName = unescapeVCardText(valuePart).trim();
        hasFormattedName = true;
        break;
      }
      case 'N': {
        const parts = valuePart.split(';').map((p) => unescapeVCardText(p).trim());
        lastName = parts[0] || '';
        firstName = parts[1] || '';
        if (parts[2] && !firstName) firstName = parts[2];
        break;
      }
      case 'ORG': {
        const orgParts = valuePart.split(';').map((p) => unescapeVCardText(p).trim());
        company = orgParts[0] || '';
        break;
      }
      case 'TITLE': {
        jobTitle = unescapeVCardText(valuePart).trim();
        break;
      }
      case 'TEL': {
        const rawNum = unescapeVCardText(valuePart).trim();
        if (rawNum) {
          const num = normalizePhoneNumber(rawNum);
          const upperProps = propPart.toUpperCase();
          let type: PhoneType = 'mobile';
          if (upperProps.includes('WORK')) type = 'work';
          else if (upperProps.includes('HOME')) type = 'home';
          else if (upperProps.includes('OTHER')) type = 'other';
          const isPrimary = upperProps.includes('PREF');
          phones.push({ id: `phone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, number: num, isPrimary });
        }
        break;
      }
      case 'EMAIL': {
        const email = unescapeVCardText(valuePart).trim();
        if (email) {
          const upperProps = propPart.toUpperCase();
          let type: EmailType = 'home';
          if (upperProps.includes('WORK')) type = 'work';
          else if (upperProps.includes('OTHER')) type = 'other';
          const isPrimary = upperProps.includes('PREF');
          emails.push({ id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, address: email, isPrimary });
        }
        break;
      }
      case 'NOTE': {
        notes = unescapeVCardText(valuePart).trim();
        break;
      }
      case 'CATEGORIES': {
        const cats = valuePart.split(',').map((c) => unescapeVCardText(c).trim()).filter(Boolean);
        tags.push(...cats);
        break;
      }
      case 'PHOTO': {
        if (valuePart.startsWith('data:image/')) {
          avatarDataUrl = valuePart;
        } else if (valuePart.length > 30) {
          const isPng = propPart.toUpperCase().includes('PNG');
          avatarDataUrl = `data:image/${isPng ? 'png' : 'jpeg'};base64,${valuePart.replace(/\s+/g, '')}`;
        }
        break;
      }
    }
  }

  if (!firstName && !lastName && hasFormattedName && formattedName) {
    const spaceIdx = formattedName.lastIndexOf(' ');
    if (spaceIdx !== -1) {
      firstName = formattedName.substring(0, spaceIdx).trim();
      lastName = formattedName.substring(spaceIdx + 1).trim();
    } else {
      firstName = formattedName;
    }
  }

  if (!firstName && !lastName) {
    if (company) {
      firstName = company;
      company = '';
    } else if (phones.length > 0) {
      firstName = phones[0].number;
    } else if (emails.length > 0) {
      firstName = emails[0].address;
    } else {
      firstName = 'Unknown';
    }
  }

  return {
    firstName,
    lastName,
    company: company || undefined,
    jobTitle: jobTitle || undefined,
    phones,
    emails,
    notes: notes || undefined,
    tags: Array.from(new Set(tags)),
    isFavorite: false,
    avatarColor: '#475569',
    avatarDataUrl,
  };
}