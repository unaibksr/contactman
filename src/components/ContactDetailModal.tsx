import React, { useState } from 'react';
import { Contact } from '../types';
import {
  ArrowLeft,
  Star,
  Edit2,
  Trash2,
  MessageSquare,
  Mail,
  Copy,
  Check,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { downloadVcfFile } from '../utils/vcard';

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({ contact, onClose, onEdit, onDelete, onToggleFavorite }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportedSingle, setExportedSingle] = useState(false);

  const displayName =
    `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.company || 'Unnamed Contact';

  const primaryPhone = contact.phones.find((p) => p.isPrimary) || contact.phones[0];
  const primaryEmail = contact.emails.find((e) => e.isPrimary) || contact.emails[0];

  const phoneIsValid = (phone: { number: string }) => phone.number.length === 13 && phone.number.startsWith('+');

  const getInitials = (): string => {
    const first = contact.firstName ? contact.firstName[0].toUpperCase() : '';
    const last = contact.lastName ? contact.lastName[0].toUpperCase() : '';
    if (first || last) return `${first}${last}`;
    if (contact.company) return contact.company[0].toUpperCase();
    return '?';
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportSingle = () => {
    const safeName = displayName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    downloadVcfFile([contact], `${safeName}.vcf`);
    setExportedSingle(true);
    setTimeout(() => setExportedSingle(false), 2500);
  };

  return (
    <div id="contact-detail-view" className="fixed inset-0 z-40 flex flex-col bg-[#1A1A1A] text-[#E0E0E0] max-w-md mx-auto overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#252525] bg-[#1A1A1A]/95 backdrop-blur-md sticky top-0 z-20">
        <button type="button" onClick={onClose} aria-label="Back to contacts list" className="flex items-center gap-1.5 text-[#888888] hover:text-[#E0E0E0] p-1.5 -ml-1 rounded-full hover:bg-[#252525] transition">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-medium">Contacts</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={(e) => onToggleFavorite(contact.id, e)} className="p-2 bg-[#252525] text-[#888888] hover:text-amber-400 rounded-full hover:bg-[#333333] active:scale-95 transition" title={contact.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}>
            <Star className={`w-4 h-4 ${contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-[#888888]'}`} />
          </button>
          <button type="button" onClick={() => onEdit(contact)} className="p-2 bg-[#252525] text-[#888888] hover:text-[#E0E0E0] rounded-full hover:bg-[#333333] active:scale-95 transition" title="Edit Contact">
            <Edit2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-[#252525] text-[#888888] hover:text-rose-400 rounded-full hover:bg-[#333333] active:scale-95 transition" title="Delete Contact">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-medium bg-gradient-to-br from-[#333333] to-[#222222] border border-[#333333]/70 text-[#E0E0E0] shadow-xl overflow-hidden mb-3.5">
            {contact.avatarDataUrl ? (
              <img src={contact.avatarDataUrl} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials()}</span>
            )}
          </div>

          <h1 className="text-xl font-semibold text-[#E0E0E0] tracking-tight">{displayName}</h1>

          {(contact.jobTitle || contact.company) && (
            <p className="text-xs text-[#666666] mt-1 flex items-center gap-1.5">
              {contact.jobTitle && <span>{contact.jobTitle}</span>}
              {contact.jobTitle && contact.company && <span>at</span>}
              {contact.company && <span className="font-medium text-[#888888]">{contact.company}</span>}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {primaryPhone ? (
            <a href={`sms:${primaryPhone.number}`} className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#252525] hover:bg-[#333333] text-[#E0E0E0] active:scale-98 transition">
              <MessageSquare className="w-4 h-4 mb-1.5 text-[#E0E0E0]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#888888]">Message</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#202020] text-[#555555] opacity-50 cursor-not-allowed">
              <MessageSquare className="w-4 h-4 mb-1.5 opacity-40" />
              <span className="text-[10px] uppercase tracking-wider">Message</span>
            </div>
          )}

          {primaryEmail ? (
            <a href={`mailto:${primaryEmail.address}`} className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#252525] hover:bg-[#333333] text-[#E0E0E0] active:scale-98 transition">
              <Mail className="w-4 h-4 mb-1.5 text-[#E0E0E0]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#888888]">Email</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#202020] text-[#555555] opacity-50 cursor-not-allowed">
              <Mail className="w-4 h-4 mb-1.5 opacity-40" />
              <span className="text-[10px] uppercase tracking-wider">Email</span>
            </div>
          )}

          <button type="button" onClick={handleExportSingle} className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#252525] hover:bg-[#333333] text-[#E0E0E0] active:scale-98 transition">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#888888]">Share</span>
          </button>
        </div>

        <div className="rounded-3xl bg-[#252525] border border-[#252525] divide-y divide-[#1A1A1A] overflow-hidden">
          {contact.phones.length > 0 && (
            <div className="p-4 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block">Phone Numbers</span>
              {contact.phones.map((phone) => (
                <div key={phone.id} className="flex items-center justify-between">
                  <div>
                    <a href={`tel:${phone.number}`} className="text-sm font-medium text-[#E0E0E0] hover:underline transition">
                      {phone.number}
                    </a>
                    <span className="text-xs text-[#666666] capitalize ml-2">{phone.type} {phone.isPrimary && '• Default'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!phoneIsValid(phone) && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    <button type="button" onClick={() => copyToClipboard(phone.number, phone.id)} aria-label="Copy phone number" className="p-1.5 text-[#666666] hover:text-[#E0E0E0] rounded-md hover:bg-[#333333] transition" title="Copy number">
                      {copiedField === phone.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {contact.emails.length > 0 && (
            <div className="p-4 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block">Email Addresses</span>
              {contact.emails.map((email) => (
                <div key={email.id} className="flex items-center justify-between">
                  <div>
                    <a href={`mailto:${email.address}`} className="text-sm font-medium text-[#E0E0E0] hover:underline transition">
                      {email.address}
                    </a>
                    <span className="text-xs text-[#666666] capitalize ml-2">{email.type} {email.isPrimary && '• Default'}</span>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(email.address, email.id)} aria-label="Copy email address" className="p-1.5 text-[#666666] hover:text-[#E0E0E0] rounded-md hover:bg-[#333333] transition" title="Copy email">
                    {copiedField === email.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {contact.company && (
            <div className="p-4 flex items-start gap-3">
              <Building className="w-4 h-4 text-[#666666] mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block">Organization</span>
                <p className="text-sm text-[#E0E0E0] mt-0.5 font-medium">{contact.company}</p>
                {contact.jobTitle && <p className="text-xs text-[#666666]">{contact.jobTitle}</p>}
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">Notes</span>
              </div>
              <p className="text-xs text-[#888888] whitespace-pre-line leading-relaxed pl-5">{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="pt-1">
          <button type="button" onClick={handleExportSingle} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#252525] hover:bg-[#333333] active:scale-98 text-xs font-medium text-[#E0E0E0] transition shadow-xs">
            {exportedSingle ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Downloaded .vcf File!</span>
              </>
            ) : (
              <>
                <span>Export Contact as .vcf</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-3xl bg-[#1A1A1A] border border-[#252525] p-5 shadow-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-[#E0E0E0]">Delete Contact?</h4>
            <p className="text-xs text-[#666666] mt-1.5 leading-normal">
              Are you sure you want to delete <strong className="text-[#E0E0E0]">{displayName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 text-xs font-medium rounded-xl bg-[#252525] text-[#888888] hover:text-[#E0E0E0] hover:bg-[#333333] transition">
                Cancel
              </button>
              <button type="button" onClick={() => { onDelete(contact.id); onClose(); }} className="flex-1 py-2.5 text-xs font-medium rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};