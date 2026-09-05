import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Contact } from '../types';
import { Star, Mail, CheckSquare, AlertTriangle, Trash2 } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onSelect, onToggleFavorite, onDelete }) => {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);
  const [showDelete, setShowDelete] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const displayName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.company || 'Unnamed';
  const primaryPhone = contact.phones.find((p) => p.isPrimary) || contact.phones[0];
  const primaryEmail = contact.emails.find((e) => e.isPrimary) || contact.emails[0];

  const phoneIsValid = primaryPhone ? primaryPhone.number.length === 13 && primaryPhone.number.startsWith('+') : true;

  const getInitials = (): string => {
    const first = contact.firstName ? contact.firstName[0].toUpperCase() : '';
    const last = contact.lastName ? contact.lastName[0].toUpperCase() : '';
    if (first || last) return `${first}${last}`;
    if (contact.company) return contact.company[0].toUpperCase();
    return '?';
  };

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPressTimer();
  }, [clearPressTimer]);

  const handlePressStart = (clientX: number, clientY: number) => {
    didLongPressRef.current = false;
    isSwiping.current = false;
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      setShowDelete(true);
    }, 1000);
  };

  const handlePressMove = (clientX: number, clientY: number) => {
    const diffX = clientX - touchStartX.current;
    const diffY = clientY - touchStartY.current;
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      isSwiping.current = true;
      clearPressTimer();
    }
  };

  const handlePressEnd = () => {
    clearPressTimer();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (didLongPressRef.current) return;
    onSelect(contact);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDelete(false);
    onDelete?.(contact.id);
  };

  const dismissDelete = useCallback(() => {
    setShowDelete(false);
  }, []);

  return (
    <div className="relative border-b border-[#252525]/60 last:border-b-0">
      {showDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-between px-6 bg-rose-600/95">
          <span className="text-xs font-medium text-white/80">Delete contact?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismissDelete(); }}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="px-3 py-1.5 rounded-lg bg-white text-xs font-semibold text-rose-600 hover:bg-white/90 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div
        id={`contact-card-${contact.id}`}
        onClick={handleCardClick}
        onMouseDown={(e) => handlePressStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePressMove(e.clientX, e.clientY)}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => {
          handlePressEnd();
        }}
        onTouchStart={(e) => handlePressStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePressMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePressEnd}
        className={`group relative flex items-center justify-between px-6 py-3.5 active:bg-[#252525] transition-colors cursor-pointer hover:bg-[#252525]/60 ${
          showDelete ? 'pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center gap-4 min-w-0 pr-2">
          <div
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#333333] to-[#222222] border border-[#333333]/50 text-xs font-medium text-[#E0E0E0] shrink-0 overflow-hidden shadow-xs"
          >
            {contact.avatarDataUrl ? (
              <img src={contact.avatarDataUrl} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials()}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[#E0E0E0] truncate tracking-tight">{displayName}</h3>
              {contact.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#666666] truncate">
              {primaryPhone ? (
                <span className="tabular-nums tracking-normal text-[#888888] flex items-center gap-1">
                  {primaryPhone.number}
                  {!phoneIsValid && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
                </span>
              ) : contact.company ? (
                <span className="truncate">{contact.company}</span>
              ) : primaryEmail ? (
                <span className="truncate">{primaryEmail.address}</span>
              ) : (
                <span className="italic text-[#555555]">No number saved</span>
              )}
            </div>
          </div>
        </div>

        {!showDelete && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {primaryEmail && !primaryPhone && (
              <a href={`mailto:${primaryEmail.address}`} aria-label={`Email ${displayName}`} className="p-2 text-[#666666] hover:text-[#E0E0E0] rounded-full hover:bg-[#252525] transition" title={`Email ${primaryEmail.address}`}>
                <Mail className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={(e) => onToggleFavorite(contact.id, e)}
              aria-label={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-2 text-[#666666] hover:text-amber-400 rounded-full hover:bg-[#252525] transition"
            >
              <Star className={`w-4 h-4 ${contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-[#666666]'}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};