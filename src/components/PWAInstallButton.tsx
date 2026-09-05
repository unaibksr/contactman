import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        type="button"
        onClick={install}
        className={
          variant === 'full'
            ? 'w-full flex items-center justify-center gap-2 rounded-2xl bg-[#E0E0E0] text-[#121212] px-4 py-3 text-xs font-semibold tracking-wide hover:bg-white transition shadow-sm'
            : 'p-2 bg-[#252525] text-[#E0E0E0] rounded-full hover:bg-[#333333] active:scale-95 transition'
        }
        title="Install Contact Book"
      >
        <Download className="w-4 h-4" />
        {variant === 'full' && <span>Install App</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'full'
              ? 'w-full flex items-center justify-center gap-2 rounded-2xl bg-[#252525] text-[#E0E0E0] px-4 py-3 text-xs font-medium hover:bg-[#333333] transition'
              : 'p-2 bg-[#252525] text-[#888888] hover:text-[#E0E0E0] rounded-full hover:bg-[#333333] active:scale-95 transition'
          }
          title="Install on iPhone / iPad"
        >
          <Share className="w-4 h-4" />
          {variant === 'full' && <span>Install App</span>}
        </button>

        {showIOSGuide && (
          <div
            id="ios-install-modal"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
          >
            <div className="w-full max-w-sm rounded-3xl bg-[#1A1A1A] border border-[#252525] p-6 shadow-2xl text-[#E0E0E0]">
              <div className="flex items-center justify-between pb-3 border-b border-[#252525]">
                <h3 className="text-sm font-semibold text-[#E0E0E0]">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#888888] hover:text-white rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-[#888888] leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#252525] text-[#E0E0E0] shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <p>1. Tap the <strong className="text-[#E0E0E0]">Share</strong> icon in the bottom Safari toolbar.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#252525] text-[#E0E0E0] shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <p>2. Scroll down and tap <strong className="text-[#E0E0E0]">Add to Home Screen</strong>.</p>
                </div>
              </div>
              <button
                id="close-ios-guide-btn"
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-[#252525] py-2.5 text-xs font-medium text-[#E0E0E0] hover:bg-[#333333] transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};