import React, { useState } from 'react';
import { Contact, PhoneItem } from '../types';
import { User, Phone, Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import { generateContactId } from '../utils/storage';

interface ContactFormModalProps {
  initialContact?: Contact | null;
  onSave: (contact: Contact) => void;
  onClose: () => void;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({ initialContact, onSave, onClose }) => {
  const isEditing = !!initialContact;

  const getInitialName = () => {
    if (!initialContact) return '';
    const parts = [initialContact.firstName, initialContact.lastName].filter(Boolean);
    return parts.join(' ') || initialContact.company || '';
  };

  const getInitialMobile = () => {
    if (!initialContact?.phones?.length) return '';
    const mobilePhone = initialContact.phones.find((p) => p.type === 'mobile');
    return mobilePhone ? mobilePhone.number : initialContact.phones[0].number;
  };

  const [name, setName] = useState(getInitialName());
  const [mobileNumber, setMobileNumber] = useState(getInitialMobile());
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const getInitials = () => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return trimmed.slice(0, 2).toUpperCase();
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    const trimmedMobile = mobileNumber.trim();

    if (!trimmedName) {
      setErrorMsg('Please enter a name for this contact.');
      return;
    }
    if (!trimmedMobile) {
      setErrorMsg('Please enter a mobile number.');
      return;
    }
    if (trimmedMobile.length !== 13 || !trimmedMobile.startsWith('+')) {
      setPhoneError('Mobile number must be exactly 13 characters including + (e.g. +15551234567).');
      return;
    }

    const nameParts = trimmedName.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const phoneItem: PhoneItem = {
      id: initialContact?.phones?.[0]?.id || `phone-${Date.now()}`,
      type: 'mobile',
      number: trimmedMobile,
      isPrimary: true,
    };

    const contactToSave: Contact = {
      id: initialContact?.id || generateContactId(),
      firstName,
      lastName,
      company: initialContact?.company,
      jobTitle: initialContact?.jobTitle,
      phones: [phoneItem],
      emails: initialContact?.emails || [],
      notes: initialContact?.notes,
      tags: initialContact?.tags || [],
      isFavorite: initialContact?.isFavorite || false,
      avatarColor: initialContact?.avatarColor || '#475569',
      avatarDataUrl: initialContact?.avatarDataUrl,
      createdAt: initialContact?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(contactToSave);
  };

  return (
    <div id="contact-form-modal" className="fixed inset-0 z-40 flex flex-col bg-[#1A1A1A] text-[#E0E0E0] max-w-md mx-auto overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#252525] bg-[#1A1A1A]/95 sticky top-0 z-20">
        <button type="button" onClick={onClose} className="flex items-center gap-1.5 text-xs font-medium text-[#888888] hover:text-[#E0E0E0] py-1.5 px-2 -ml-2 rounded-lg transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <h2 className="text-sm font-semibold text-[#E0E0E0] tracking-tight">{isEditing ? 'Edit Contact' : 'New Contact'}</h2>

        <button type="button" onClick={() => handleSave()} className="text-xs font-semibold bg-[#E0E0E0] text-[#121212] hover:bg-white active:scale-95 px-3.5 py-1.5 rounded-xl transition shadow-xs">
          Save
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between overflow-y-auto overscroll-contain p-6 pb-20">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-medium text-[#E0E0E0] bg-gradient-to-br from-[#333333] to-[#222222] border border-[#333333]/70 shadow-lg mb-2 transition-all">
              <span>{getInitials()}</span>
            </div>
            <p className="text-[11px] text-[#666666]">{name.trim() ? name.trim() : 'New Contact'}</p>
          </div>

          {(errorMsg || phoneError) && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg || phoneError}</span>
            </div>
          )}

          <div className="rounded-3xl bg-[#252525] border border-[#252525] divide-y divide-[#1A1A1A] overflow-hidden shadow-sm">
            <div className="px-5 py-4">
              <label htmlFor="contact-name-input" className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block mb-1.5 flex items-center gap-1.5">
                <User className="w-3 h-3 text-[#666666]" />
                <span>Name</span>
              </label>
              <input
                id="contact-name-input"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errorMsg) setErrorMsg(''); }}
                placeholder="Full name"
                autoFocus
                autoComplete="name"
                className="w-full bg-transparent text-sm text-[#E0E0E0] placeholder-[#666666] focus:outline-none"
              />
            </div>

            <div className="px-5 py-4">
              <label htmlFor="contact-mobile-input" className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#666666]" />
                <span>Mobile Number</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="contact-mobile-input"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => { setMobileNumber(e.target.value); if (phoneError) setPhoneError(''); }}
                  placeholder="+15551234567"
                  autoComplete="tel"
                  maxLength={13}
                  className={`w-full bg-transparent text-sm font-mono text-[#E0E0E0] placeholder-[#666666] focus:outline-none ${phoneError ? 'text-amber-400' : ''}`}
                />
                {mobileNumber.length > 0 && mobileNumber.length !== 13 && (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-[#666666] mt-1">Exactly 13 characters including +</p>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" className="w-full py-3.5 rounded-2xl bg-[#E0E0E0] text-[#121212] text-xs font-semibold hover:bg-white active:scale-98 transition flex items-center justify-center gap-2 shadow-sm">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isEditing ? 'Update Contact' : 'Save Contact'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};