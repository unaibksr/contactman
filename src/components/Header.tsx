import React from 'react';
import { Search, X, Star, Upload, Download, CopyCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: 'all' | 'favorites' | 'duplicates';
  onFilterChange: (filter: 'all' | 'favorites' | 'duplicates') => void;
  totalContacts: number;
  filteredCount: number;
  duplicateCount?: number;
  onOpenAddModal: () => void;
  onOpenImportExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalContacts,
  filteredCount,
  duplicateCount = 0,
  onOpenAddModal,
  onOpenImportExport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#1A1A1A] border-b border-[#252525]">
      <div className="pt-4 px-6 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[#E0E0E0]">Contacts</h1>
            <span className="text-[11px] font-mono font-medium text-[#888888] px-2 py-0.5 rounded-full bg-[#252525]">
              {filteredCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton variant="compact" />

            <button
              id="header-import-vcf-btn"
              type="button"
              onClick={() => onOpenImportExport()}
              title="Import VCF"
              className="p-2 bg-[#252525] text-[#E0E0E0] rounded-full hover:bg-[#333333] active:scale-95 transition"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              id="header-export-vcf-btn"
              type="button"
              onClick={() => onOpenImportExport()}
              title="Export VCF"
              className="p-2 bg-[#252525] text-[#E0E0E0] rounded-full hover:bg-[#333333] active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#666666]" />
          </div>
          <input
            id="contact-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${totalContacts} contacts`}
            className="w-full bg-[#252525] border-none rounded-2xl py-2.5 pl-10 pr-9 text-sm text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#444444] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-3 flex items-center text-[#666666] hover:text-[#E0E0E0]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-6 pb-3 pt-1 overflow-x-auto scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
            activeFilter === 'all'
              ? 'bg-[#E0E0E0] text-[#121212] font-semibold shadow-xs'
              : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0] hover:bg-[#333333]'
          }`}
        >
          All ({totalContacts})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('favorites')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
            activeFilter === 'favorites'
              ? 'bg-[#E0E0E0] text-[#121212] font-semibold shadow-xs'
              : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0] hover:bg-[#333333]'
          }`}
        >
          <Star
            className={`w-3 h-3 ${
              activeFilter === 'favorites' ? 'fill-[#121212] text-[#121212]' : 'fill-[#888888] text-[#888888]'
            }`}
          />
          <span>Favorites</span>
        </button>

        {duplicateCount > 0 && (
          <button
            type="button"
            onClick={() => onFilterChange('duplicates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              activeFilter === 'duplicates'
                ? 'bg-[#E0E0E0] text-[#121212] font-semibold shadow-xs'
                : 'bg-[#252525] text-[#888888] hover:text-[#E0E0E0] hover:bg-[#333333]'
            }`}
          >
            <CopyCheck
              className={`w-3 h-3 ${
                activeFilter === 'duplicates' ? 'text-[#121212]' : 'text-[#888888]'
              }`}
            />
            <span>Duplicates ({duplicateCount})</span>
          </button>
        )}
      </div>
    </header>
  );
};