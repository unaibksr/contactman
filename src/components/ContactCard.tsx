import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Contact } from '../types';
import { Star, Mail, AlertTriangle, Trash2 } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onUndoDelete?: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 150;

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onSelect, onToggleFavorite, onDelete, onUndoDelete }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'dragging' | 'revealed'>('idle');
  const startX = useRef(0);
  const startY = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const didDelete = useRef(false);

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

  const hapticAtThreshold = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // Haptics not supported
    }
  };

  const hapticDelete = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([8, 30, 8]);
      }
    } catch {
      // Haptics not supported
    }
  };

  const resetSwipe = useCallback(() => {
    setSwipeX(0);
    setPhase('idle');
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    if (didDelete.current) return;
    startX.current = clientX;
    startY.current = clientY;
    lastX.current = clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
    setPhase('dragging');
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (didDelete.current) return;
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (clientX - lastX.current) / dt;
    }
    lastX.current = clientX;
    lastTime.current = now;

    const diffX = clientX - startX.current;
    const diffY = Math.abs(clientY - startY.current);

    if (phase === 'idle' && Math.abs(diffX) > 8 && diffX > 0 && diffY < Math.abs(diffX)) {
      setPhase('dragging');
    }

    if (phase === 'dragging' && diffX > 0) {
      const offset = Math.min(diffX, MAX_SWIPE);
      setSwipeX(offset);
      if (offset >= SWIPE_THRESHOLD) {
        setPhase('revealed');
        hapticAtThreshold();
      }
    }
  };

  const handleEnd = () => {
    if (didDelete.current) return;
    if (phase === 'revealed') {
      const fastFlick = velocity.current > 0.8;
      if (swipeX >= SWIPE_THRESHOLD || fastFlick) {
        hapticDelete();
        didDelete.current = true;
        onDelete?.(contact.id);
        resetSwipe();
        return;
      }
    }
    if (phase === 'dragging' && swipeX < SWIPE_THRESHOLD) {
      resetSwipe();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (phase === 'dragging' || phase === 'revealed' || swipeX > 8) {
      e.preventDefault();
      return;
    }
    onSelect(contact);
  };

  const handleUndo = () => {
    didDelete.current = false;
    onUndoDelete?.(contact.id);
  };

  useEffect(() => {
    if (phase === 'dragging') {
      const el = document.getElementById(`contact-card-${contact.id}`);
      if (el) {
        el.style.touchAction = 'pan-y';
      }
    }
  }, [phase, contact.id]);

  const deleteOpacity = Math.min(swipeX / SWIPE_THRESHOLD, 1);
  const deleteWidth = Math.min(swipeX, MAX_SWIPE);
  const showDeleteActions = phase === 'revealed';

  return (
    <div className="relative overflow-hidden border-b border-[#252525]/60 last:border-b-0">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-between px-4 bg-rose-600 transition-opacity duration-150"
        style={{ width: deleteWidth, opacity: deleteOpacity }}
      >
        {showDeleteActions && (
          <>
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Delete</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hapticDelete();
                didDelete.current = true;
                onDelete?.(contact.id);
                resetSwipe();
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-rose-600"
              aria-label="Delete contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div
        id={`contact-card-${contact.id}`}
        onClick={handleCardClick}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          if (phase === 'dragging' && swipeX < SWIPE_THRESHOLD) {
            resetSwipe();
          }
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onTouchCancel={() => {
          if (phase === 'dragging' && swipeX < SWIPE_THRESHOLD) {
            resetSwipe();
          }
        }}
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: phase === 'idle' ? 'transform 0.25s ease-out' : 'none',
        }}
        className={`group relative flex items-center justify-between px-6 py-3.5 active:bg-[#252525] transition-colors cursor-pointer hover:bg-[#252525]/60 ${
          phase === 'dragging' || phase === 'revealed' ? 'select-none' : ''
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

        {!showDeleteActions && (
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