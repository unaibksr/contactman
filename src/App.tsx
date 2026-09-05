import React, { useState, useMemo, useEffect } from 'react';
import { Contact } from './types';
import {
  getStoredContacts,
  saveContacts,
  INITIAL_CONTACTS,
  sortContactsAlphabetical,
} from './utils/storage';
import { Header } from './components/Header';
import { ContactList } from './components/ContactList';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ContactFormModal } from './components/ContactFormModal';
import { VcfImportExportModal } from './components/VcfImportExportModal';
import { Plus, CheckCircle2, ShieldCheck, Download, Upload } from 'lucide-react';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    return sortContactsAlphabetical(getStoredContacts());
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'duplicates'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  const duplicateContactIds = useMemo(() => {
    const phoneMap = new Map<string, string[]>();
    contacts.forEach((c) => {
      c.phones.forEach((p) => {
        const normalized = p.number.replace(/[^0-9+]/g, '');
        if (!normalized) return;
        const existing = phoneMap.get(normalized) || [];
        existing.push(c.id);
        phoneMap.set(normalized, existing);
      });
    });

    const ids = new Set<string>();
    phoneMap.forEach((idsList) => {
      if (idsList.length > 1) {
        idsList.forEach((id) => ids.add(id));
      }
    });
    return ids;
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (activeFilter === 'favorites' && !c.isFavorite) return false;
      if (activeFilter === 'duplicates' && !duplicateContactIds.has(c.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const company = (c.company || '').toLowerCase();
        const jobTitle = (c.jobTitle || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        const phoneMatch = c.phones.some((p) => p.number.toLowerCase().includes(q));
        const emailMatch = c.emails.some((e) => e.address.toLowerCase().includes(q));
        return (
          fullName.includes(q) ||
          company.includes(q) ||
          jobTitle.includes(q) ||
          notes.includes(q) ||
          phoneMatch ||
          emailMatch
        );
      }
      return true;
    });
  }, [contacts, activeFilter, searchQuery, duplicateContactIds]);

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: Date.now() } : c
      );
      if (selectedContact && selectedContact.id === id) {
        setSelectedContact({ ...selectedContact, isFavorite: !selectedContact.isFavorite });
      }
      return updated;
    });
  };

  const handleSaveContact = (savedContact: Contact) => {
    setContacts((prev) => {
      const exists = prev.some((c) => c.id === savedContact.id);
      if (exists) {
        return sortContactsAlphabetical(prev.map((c) => (c.id === savedContact.id ? savedContact : c)));
      }

      const duplicate = prev.find((c) => {
        const savedName = `${savedContact.firstName} ${savedContact.lastName}`.trim().toLowerCase();
        const existingName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
        if (savedName && existingName && savedName === existingName) return true;

        const savedPhones = savedContact.phones.map((p) => p.number.replace(/[^0-9+]/g, '')).filter(Boolean);
        const existingPhones = c.phones.map((p) => p.number.replace(/[^0-9+]/g, '')).filter(Boolean);
        if (savedPhones.some((p) => existingPhones.includes(p))) return true;

        return false;
      });

      if (duplicate) {
        const merged = { ...duplicate, ...savedContact, id: duplicate.id, createdAt: duplicate.createdAt, updatedAt: Date.now() };
        return sortContactsAlphabetical(prev.map((c) => (c.id === duplicate.id ? merged : c)));
      }

      return sortContactsAlphabetical([savedContact, ...prev]);
    });

    if (selectedContact && selectedContact.id === savedContact.id) {
      setSelectedContact(savedContact);
    }
    setIsAddingContact(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selectedContact && selectedContact.id === id) {
      setSelectedContact(null);
    }
  };

  const handleRestoreDefaults = () => {
    setContacts(INITIAL_CONTACTS);
  };

  const handleOpenImportExport = () => {
    setIsImportExportOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#121212] text-[#E0E0E0] flex items-center justify-center p-0 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
      <div className="flex items-center justify-center w-full max-w-5xl">
        <main className="w-full max-w-[390px] h-screen sm:h-[720px] bg-[#1A1A1A] sm:rounded-[48px] sm:border-[10px] sm:border-[#252525] shadow-2xl flex flex-col overflow-hidden relative">
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            totalContacts={contacts.length}
            filteredCount={filteredContacts.length}
            duplicateCount={duplicateContactIds.size}
            onOpenAddModal={() => setIsAddingContact(true)}
            onOpenImportExport={handleOpenImportExport}
          />

          <ContactList
            contacts={filteredContacts}
            onSelectContact={(c) => setSelectedContact(c)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteContact={handleDeleteContact}
            searchQuery={searchQuery}
            onOpenAddModal={() => setIsAddingContact(true)}
            onOpenImportExport={handleOpenImportExport}
          />

          <button
            id="fab-add-contact"
            type="button"
            onClick={() => setIsAddingContact(true)}
            aria-label="Add new contact"
            className="absolute bottom-24 right-6 w-14 h-14 bg-[#E0E0E0] text-[#121212] rounded-2xl shadow-xl flex items-center justify-center hover:bg-white active:scale-95 transition-transform z-20"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {selectedContact && (
            <ContactDetailModal
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
              onEdit={(c) => {
                setEditingContact(c);
                setSelectedContact(null);
              }}
              onDelete={handleDeleteContact}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {(isAddingContact || editingContact) && (
            <ContactFormModal
              initialContact={editingContact}
              onSave={handleSaveContact}
              onClose={() => {
                setIsAddingContact(false);
                setEditingContact(null);
              }}
            />
          )}

          {isImportExportOpen && (
            <VcfImportExportModal
              contacts={contacts}
              filteredContacts={filteredContacts}
              onContactsUpdated={(updatedList) => setContacts(sortContactsAlphabetical(updatedList))}
              onClose={() => setIsImportExportOpen(false)}
              onRestoreDefaults={handleRestoreDefaults}
            />
          )}
        </main>

        <aside className="hidden lg:block ml-10 xl:ml-14 max-w-sm w-80 shrink-0 space-y-4">
          <div className="p-8 bg-[#1A1A1A] rounded-3xl border border-[#252525] shadow-xl text-[#E0E0E0]">
            <h2 className="text-xl font-light mb-3 text-[#E0E0E0]">Import & Export</h2>
            <p className="text-sm text-[#666666] leading-relaxed mb-6">
              Manage your contact library with industry-standard <span className="text-[#E0E0E0] font-medium">.vcf</span> (vCard) support. Fast, private, and fully offline.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl text-xs">
                <span className="text-[#888888]">Stored Contacts</span>
                <span className="font-mono text-[#E0E0E0]">{contacts.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl text-xs">
                <span className="text-[#888888]">Favorites</span>
                <span className="font-mono text-[#E0E0E0]">{contacts.filter((c) => c.isFavorite).length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl text-xs">
                <span className="text-[#888888]">Storage Mode</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Local PWA
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-[#252525]">
              <button
                type="button"
                onClick={handleOpenImportExport}
                className="py-2.5 px-3 rounded-xl bg-[#252525] text-xs font-medium text-[#E0E0E0] hover:bg-[#333333] transition flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#888888]" />
                <span>Import</span>
              </button>
              <button
                type="button"
                onClick={handleOpenImportExport}
                className="py-2.5 px-3 rounded-xl bg-[#252525] text-xs font-medium text-[#E0E0E0] hover:bg-[#333333] transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#888888]" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="p-5 bg-[#1A1A1A] rounded-3xl border border-[#252525] text-xs text-[#888888] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#888888] shrink-0" />
            <span>RFC 6350 vCard standard. Fully compliant with iOS, Android, macOS & Google Contacts.</span>
          </div>

          <div className="p-5 bg-[#1A1A1A] rounded-3xl border border-[#252525] text-xs text-[#888888]">
            <PWAInstallButton variant="full" />
          </div>
        </aside>
      </div>
    </div>
  );
}