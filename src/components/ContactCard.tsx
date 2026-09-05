import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Contact } from '../types';
import { Star, Phone, Mail, CheckSquare, AlertTriangle, Trash2 } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onSelect,
  onToggleFavorite,
  onDelete,
  selectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}) => {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
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

  const handlePressStart = (clientX: number) => {
    if (selectionMode) return;
    didLongPressRef.current = false;
    isSwiping.current = false;
    touchStartX.current = clientX;
    touchCurrentX.current = clientX;
    pressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPress?.(contact.id);
    }, 1000);
  };

  const handlePressMove = (clientX: number) => {
    if (selectionMode) return;
    const diff = clientX - touchStartX.current;
    if (Math.abs(diff) > 10) {
      isSwiping.current = true;
      clearPressTimer();
    }
    if (isSwiping.current && diff > 0) {
      touchCurrentX.current = clientX;
      const offset = Math.min(diff, 120);
      setSwipeOffset(offset);
      setShowDelete(offset > 60);
    }
  };

  const handlePressEnd = () => {
    clearPressTimer();
    if (!isSwiping.current) return;
    if (swipeOffset < 60) {
      setSwipeOffset(0);
      setShowDelete(false);
    }
    isSwiping.current = false;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (didLongPressRef.current) return;
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect?.(contact.id);
      return;
    }
    if (swipeOffset < 60) {
      onSelect(contact);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSwipeOffset(0);
    setShowDelete(false);
    onDelete?.(contact.id);
  };

  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    setShowDelete(false);
  }, []);

  useEffect(() => {
    if (selectionMode) resetSwipe();
  }, [selectionMode, resetSwipe]);

  return (
    <div className="relative overflow-hidden border-b border-[#252525]/60 last:border-b-0">
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-center bg-rose-600 transition-all duration-200 ${
          showDelete ? 'w-24 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          className="flex items-center justify-center w-16 h-16 text-white"
          aria-label="Delete contact"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div
        id={`contact-card-${contact.id}`}
        onClick={handleCardClick}
        onMouseDown={(e) => handlePressStart(e.clientX)}
        onMouseMove={(e) => handlePressMove(e.clientX)}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => {
          handlePressEnd();
          if (isSwiping.current && swipeOffset < 60) resetSwipe();
        }}
        onTouchStart={(e) => handlePressStart(e.touches[0].clientX)}
        onTouchMove={(e) => handlePressMove(e.touches[0].clientX)}
        onTouchEnd={handlePressEnd}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
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

        {!selectionMode && !showDelete && (
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
    </div>
  );
};