import React, { useState, useRef } from 'react';
import { Contact, DuplicateResolution } from '../types';
import {
  X,
  Upload,
  Download,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { parseVcfString, downloadVcfFile } from '../utils/vcard';
import { mergeImportedContacts } from '../utils/storage';

interface VcfImportExportModalProps {
  contacts: Contact[];
  filteredContacts: Contact[];
  onContactsUpdated: (updatedList: Contact[]) => void;
  onClose: () => void;
  onRestoreDefaults: () => void;
}

export const VcfImportExportModal: React.FC<VcfImportExportModalProps> = ({
  contacts,
  filteredContacts,
  onContactsUpdated,
  onClose,
  onRestoreDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceDescription, setSourceDescription] = useState<string>('');
  const [resolution, setResolution] = useState<DuplicateResolution>('skip_existing');
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportScope, setExportScope] = useState<'all' | 'favorites' | 'filtered'>('all');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const parseContent = (content: string, sourceLabel: string) => {
    setParseError(null);
    setImportSummary(null);

    if (!content || !content.trim()) {
      setParseError('The content appears to be empty.');
      setParsedContacts(null);
      return;
    }

    try {
      const isVCard = content.toUpperCase().includes('BEGIN:VCARD');
      if (isVCard) {
        const vcfResult = parseVcfString(content);
        if (vcfResult.contacts.length === 0) {
          setParseError('No valid vCard (BEGIN:VCARD ... END:VCARD) records were found.');
          setParsedContacts(null);
        } else {
          setParsedContacts(vcfResult.contacts);
          setSourceDescription(`${sourceLabel} (${vcfResult.contacts.length} vCard contacts)`);
        }
      } else {
        setParseError('Only .vcf (vCard) files are supported.');
        setParsedContacts(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(`Failed to parse: ${msg}`);
      setParsedContacts(null);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => parseContent(e.target?.result as string, file.name);
    reader.onerror = () => setParseError('Failed to read the selected file.');
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    parseContent(pastedText, 'Pasted text');
  };

  const handleExecuteImport = () => {
    if (!parsedContacts || parsedContacts.length === 0) return;

    const { updatedList, addedCount, updatedCount, skippedCount } = mergeImportedContacts(contacts, parsedContacts, resolution);
    onContactsUpdated(updatedList);
    setImportSummary(`Successfully imported: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped.`);
    setParsedContacts(null);
    setPastedText('');
  };

  const getExportTargetList = (): { list: Contact[]; label: string } => {
    if (exportScope === 'favorites') return { list: contacts.filter((c) => c.isFavorite), label: 'contacts-favorites' };
    if (exportScope === 'filtered') return { list: filteredContacts, label: 'contacts-filtered' };
    return { list: contacts, label: 'contacts-all' };
  };

  const handleDownloadVcf = () => {
    const { list, label } = getExportTargetList();
    if (list.length === 0) {
      setExportSuccessMsg('No contacts match the selected criteria to export.');
      setTimeout(() => setExportSuccessMsg(null), 3000);
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${label}-${dateStr}.vcf`;
    downloadVcfFile(list, filename);
    setExportSuccessMsg(`Exported ${list.length} contacts to ${filename}`);
    setTimeout(() => setExportSuccessMsg(null), 3500);
  };

  const favoriteCount = contacts.filter((c) => c.isFavorite).length;

  return (
    <div id="vcf-import-export-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#1A1A1A] border border-[#252525] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#E0E0E0]">
        <div className="px-6 pt-5 pb-3 border-b border-[#252525]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#888888]" />
              <h2 className="text-sm font-semibold text-[#E0E0E0]">Import & Export Contacts</h2>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 text-[#888888] hover:text-[#E0E0E0] rounded-full hover:bg-[#252525] transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#252525]">
            <button
              type="button"
              onClick={() => { setActiveTab('import'); setImportSummary(null); }}
              className={`py-2 text-xs font-medium rounded-xl transition ${activeTab === 'import' ? 'bg-[#1A1A1A] text-[#E0E0E0] font-semibold shadow-xs' : 'text-[#888888] hover:text-[#E0E0E0]'}`}
            >
              Import Contacts
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('export'); setExportSuccessMsg(null); }}
              className={`py-2 text-xs font-medium rounded-xl transition ${activeTab === 'export' ? 'bg-[#1A1A1A] text-[#E0E0E0] font-semibold shadow-xs' : 'text-[#888888] hover:text-[#E0E0E0]'}`}
            >
              Export Contacts
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
          {activeTab === 'import' ? (
            <>
              {importSummary && (
                <div className="p-3.5 rounded-2xl bg-[#252525] border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSummary}</span>
                </div>
              )}

              {parseError && (
                <div className="p-3.5 rounded-2xl bg-[#252525] border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {!parsedContacts && (
                <div className="flex items-center justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setImportMode(importMode === 'file' ? 'paste' : 'file')} className="flex items-center gap-1.5 text-[11px] font-medium text-[#888888] hover:text-[#E0E0E0] px-2 py-1 rounded-lg hover:bg-[#252525] transition">
                    {importMode === 'file' ? (
                      <>
                        <span>Paste text instead</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload file instead</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {!parsedContacts ? (
                importMode === 'file' ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition cursor-pointer text-center ${dragOver ? 'border-[#E0E0E0] bg-[#252525]' : 'border-[#333333] bg-[#202020] hover:bg-[#252525] hover:border-[#444444]'}`}
                  >
                    <input ref={fileInputRef} type="file" accept=".vcf,.vcard,.txt,text/vcard,text/x-vcard,text/plain" className="hidden" onChange={handleFileChange} />
                    <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center text-[#888888] mb-3">
                      <Upload className="w-5 h-5 text-[#E0E0E0]" />
                    </div>
                    <h4 className="text-xs font-semibold text-[#E0E0E0]">Drop your .vcf file here, or click to browse</h4>
                    <p className="text-[11px] text-[#666666] mt-1.5 max-w-xs leading-relaxed">Compatible with vCard 2.1, 3.0, 4.0 exported from iPhone, Android, Google Contacts, or Outlook.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-[#202020] border border-[#333333] p-3">
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder={`Paste contacts here...\nExample:\nJohn Doe, +1 555 123-4567\nJane Smith, 555-987-6543\n\nOr paste raw vCard text (BEGIN:VCARD ...)`}
                        rows={6}
                        className="w-full bg-transparent text-xs text-[#E0E0E0] placeholder-[#555555] font-mono focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                    <button type="button" onClick={handlePasteSubmit} disabled={!pastedText.trim()} className="w-full py-2.5 rounded-xl bg-[#E0E0E0] text-[#121212] text-xs font-semibold hover:bg-white active:scale-98 transition disabled:opacity-40 disabled:cursor-not-allowed">
                      Parse Contacts
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[#252525] p-3.5 rounded-2xl">
                    <div>
                      <span className="text-xs font-semibold text-[#E0E0E0] block">{sourceDescription}</span>
                      <span className="text-[11px] text-[#888888]">Ready to import into your contact book</span>
                    </div>
                    <button type="button" onClick={() => { setParsedContacts(null); setPastedText(''); }} className="text-xs text-[#888888] hover:text-[#E0E0E0] underline">
                      Change file
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block">Duplicate Handling</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      {(['skip_existing', 'overwrite', 'keep_both'] as DuplicateResolution[]).map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setResolution(res)}
                          className={`p-2.5 rounded-xl text-[11px] font-medium transition ${resolution === res ? 'bg-[#E0E0E0] text-[#121212] font-semibold' : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0]'}`}
                        >
                          {res === 'skip_existing' ? 'Skip existing' : res === 'overwrite' ? 'Overwrite' : 'Keep both'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl bg-[#252525] divide-y divide-[#1A1A1A] p-2">
                    {parsedContacts.slice(0, 10).map((c, i) => {
                      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.company || 'Unnamed';
                      const ph = c.phones[0]?.number;
                      return (
                        <div key={i} className="py-2 px-3 flex items-center justify-between text-xs">
                          <span className="font-medium text-[#E0E0E0] truncate pr-2">{name}</span>
                          <span className="text-[#888888] font-mono text-[11px] shrink-0">{ph || c.emails[0]?.address || '—'}</span>
                        </div>
                      );
                    })}
                    {parsedContacts.length > 10 && (
                      <div className="py-2 text-center text-[11px] text-[#666666] italic">+ {parsedContacts.length - 10} more contacts...</div>
                    )}
                  </div>

                  <button type="button" onClick={handleExecuteImport} className="w-full py-3.5 rounded-2xl bg-[#E0E0E0] text-[#121212] text-xs font-semibold hover:bg-white active:scale-98 transition flex items-center justify-center gap-2 shadow-sm">
                    <Download className="w-4 h-4" />
                    <span>Import {parsedContacts.length} Contacts</span>
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-[#252525] flex items-center justify-between">
                <span className="text-[11px] text-[#666666]">Need demo contacts?</span>
                <button type="button" onClick={() => { onRestoreDefaults(); setImportSummary('Restored 5 sample contacts.'); }} className="flex items-center gap-1.5 text-[11px] font-medium text-[#888888] hover:text-[#E0E0E0] transition">
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore Sample Contacts</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {exportSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-[#252525] border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block">Select Contacts to Export</label>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <button type="button" onClick={() => setExportScope('all')} className={`p-2.5 rounded-xl text-[11px] font-medium transition ${exportScope === 'all' ? 'bg-[#E0E0E0] text-[#121212] font-semibold' : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0]'}`}>
                    All ({contacts.length})
                  </button>
                  <button type="button" onClick={() => setExportScope('favorites')} disabled={favoriteCount === 0} className={`p-2.5 rounded-xl text-[11px] font-medium transition ${exportScope === 'favorites' ? 'bg-[#E0E0E0] text-[#121212] font-semibold' : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0]'} ${favoriteCount === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    Starred ({favoriteCount})
                  </button>
                  <button type="button" onClick={() => setExportScope('filtered')} className={`p-2.5 rounded-xl text-[11px] font-medium transition ${exportScope === 'filtered' ? 'bg-[#E0E0E0] text-[#121212] font-semibold' : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0]'}`}>
                    Search ({filteredContacts.length})
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase tracking-widest text-[#666666] font-bold block">Choose Export Format</span>

                <button type="button" onClick={handleDownloadVcf} className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#252525] hover:bg-[#333333] text-left transition group active:scale-98">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-[#E0E0E0] shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#E0E0E0] block">Download .VCF (vCard 3.0)</span>
                      <span className="text-[11px] text-[#888888]">Compatible with iPhone, Android, Google Contacts & macOS</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[#888888] group-hover:text-[#E0E0E0] shrink-0" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};