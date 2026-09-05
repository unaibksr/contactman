import React, { useCallback, useEffect, useRef } from 'react';
import { Contact } from '../types';
import { Star, Phone, Mail, CheckSquare } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onSelect,
  onToggleFavorite,
  selectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}) => {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  const displayName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.company || 'Unnamed';
  const primaryPhone = contact.phones.find((p) => p.isPrimary) || contact.phones[0];
  const primaryEmail = contact.emails.find((e) => e.isPrimary) || contact.emails[0];

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

  const handlePressStart = () => {
    didLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPress?.(contact.id);
    }, 1000);
  };

  const handlePressEnd = () => {
    clearPressTimer();
  };

  const handlePressMove = () => {
    clearPressTimer();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (didLongPressRef.current) return;
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect?.(contact.id);
      return;
    }
    onSelect(contact);
  };

  return (
    <div
      id={`contact-card-${contact.id}`}
      onClick={handleCardClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressMove}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={handlePressMove}
      className={`group relative flex items-center justify-between px-6 py-3.5 active:bg-[#252525] transition-colors border-b border-[#252525]/60 last:border-b-0 ${
        selectionMode ? 'cursor-default' : 'cursor-pointer hover:bg-[#252525]/60'
      } ${isSelected ? 'bg-[#252525]/60' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0 pr-2">
        {selectionMode ? (
          <div
            className={`flex items-center justify-center w-5 h-5 rounded-md border shrink-0 ${
              isSelected ? 'bg-[#E0E0E0] border-[#E0E0E0]' : 'border-[#888888]'
            }`}
          >
            {isSelected && <CheckSquare className="w-3.5 h-3.5 text-[#121212]" />}
          </div>
        ) : (
          <div
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#333333] to-[#222222] border border-[#333333]/50 text-xs font-medium text-[#E0E0E0] shrink-0 overflow-hidden shadow-xs"
          >
            {contact.avatarDataUrl ? (
              <img src={contact.avatarDataUrl} alt={displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials()}</span>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#E0E0E0] truncate tracking-tight">{displayName}</h3>
            {contact.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#666666] truncate">
            {primaryPhone ? (
              <span className="tabular-nums tracking-normal text-[#888888]">{primaryPhone.number}</span>
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

      {!selectionMode && (
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {primaryPhone && (
            <a href={`tel:${primaryPhone.number}`} aria-label={`Call ${displayName}`} className="p-2 text-[#666666] hover:text-[#E0E0E0] rounded-full hover:bg-[#252525] transition" title={`Call ${primaryPhone.number}`}>
              <Phone className="w-4 h-4" />
            </a>
          )}

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
  );
};