import React, { useMemo } from 'react';
import { Contact } from '../types';
import { ContactCard } from './ContactCard';
import { UserX, Users } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onOpenAddModal: () => void;
  onOpenImportExport: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onSelectContact,
  onToggleFavorite,
  searchQuery,
  onOpenAddModal,
  onOpenImportExport,
}) => {
  const groupedContacts = useMemo(() => {
    const groups: { [letter: string]: Contact[] } = {};

    contacts.forEach((contact) => {
      const name = `${contact.lastName || ''} ${contact.firstName || ''}`.trim() || contact.company || '';
      const firstChar = name.length > 0 ? name[0].toUpperCase() : '#';
      const letter = /^[A-Z]$/.test(firstChar) ? firstChar : '#';

      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    });

    const sortedLetters = Object.keys(groups).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return sortedLetters.map((letter) => ({ letter, items: groups[letter] }));
  }, [contacts]);

  const availableLetters = useMemo(() => groupedContacts.map((g) => g.letter), [groupedContacts]);

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`group-${letter}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#888888]">
        {searchQuery ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center text-[#666666] mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-[#E0E0E0]">No contacts found</h4>
            <p className="text-xs text-[#666666] mt-1 max-w-xs">
              No contacts matching &ldquo;{searchQuery}&rdquo;. Try another search term.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center text-[#888888] mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-[#E0E0E0]">Your contact book is empty</h4>
            <p className="text-xs text-[#666666] mt-1 max-w-xs mb-5">
              Add your first contact or import existing contacts from a .vcf file.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2.5 rounded-xl bg-[#E0E0E0] text-[#121212] text-xs font-semibold hover:bg-white transition"
              >
                + New Contact
              </button>
              <button
                type="button"
                onClick={onOpenImportExport}
                className="px-4 py-2.5 rounded-xl bg-[#252525] text-[#E0E0E0] text-xs font-medium hover:bg-[#333333] transition"
              >
                Import .VCF
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto overscroll-contain pb-24 pt-2">
      {groupedContacts.map((group) => (
        <div key={group.letter} id={`group-${group.letter}`} className="relative">
          <div className="sticky top-0 z-10 bg-[#1A1A1A]/95 backdrop-blur-md px-6 py-2 border-b border-[#252525]/60">
            <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">{group.letter}</p>
          </div>
          <div className="divide-y divide-[#252525]/40">
            {group.items.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onSelect={onSelectContact}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      ))}

      {availableLetters.length > 3 && (
        <div
          aria-hidden="true"
          className="fixed right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center py-2 px-1 rounded-full bg-[#1A1A1A]/90 backdrop-blur-xs border border-[#252525] text-[10px] font-mono text-[#666666] select-none shadow-md"
        >
          {availableLetters.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => scrollToLetter(letter)}
              className="w-4 h-4 flex items-center justify-center hover:text-[#E0E0E0] active:text-white"
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      <div className="py-6 text-center text-xs text-[#666666]">
        {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
      </div>
    </div>
  );
};