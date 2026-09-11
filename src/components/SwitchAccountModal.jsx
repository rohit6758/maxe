/**
 * SwitchAccountModal
 *
 * Instagram-style account switcher. Saves account info (id, name, username, avatar_url, email)
 * to localStorage when a user logs in. Shows a list of saved accounts and lets the user
 * tap to switch (signs out current, signs in the other with saved credentials if available,
 * or opens the auth page to log in again).
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Check, User, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

const SAVED_ACCOUNTS_KEY = 'maxe_saved_accounts';

export function useSavedAccounts() {
  const getSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const saveAccount = (profile) => {
    if (!profile?.id) return;
    const saved = getSaved();
    const existing = saved.findIndex(a => a.id === profile.id);
    const entry = {
      id: profile.id,
      name: profile.name || 'Unnamed',
      username: profile.username || '',
      avatar_url: profile.avatar_url || null,
      email: profile.email || null,
      saved_at: Date.now(),
    };
    if (existing >= 0) {
      saved[existing] = entry;
    } else {
      saved.push(entry);
    }
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(saved));
  };

  const removeAccount = (id) => {
    const saved = getSaved().filter(a => a.id !== id);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(saved));
  };

  return { getSaved, saveAccount, removeAccount };
}

export default function SwitchAccountModal({ onClose }) {
  const { session, userProfile } = useAppContext();
  const { getSaved, removeAccount } = useSavedAccounts();
  const [accounts, setAccounts] = useState([]);
  const [switching, setSwitching] = useState(null);

  useEffect(() => {
    setAccounts(getSaved());
  }, []);

  const currentId = session?.user?.id;

  const handleSwitch = async (account) => {
    if (account.id === currentId) return; // already active
    setSwitching(account.id);
    // Sign out current user
    await supabase.auth.signOut();
    // Redirect to auth page — the user will log in to the other account
    // We can pre-fill the username in URL params as a hint
    const hint = account.username || account.email || '';
    window.location.href = `${window.location.origin}/auth?hint=${encodeURIComponent(hint)}`;
  };

  const handleAddAccount = async () => {
    // Sign out and go to auth to log in a new account
    await supabase.auth.signOut();
    window.location.href = `${window.location.origin}/auth`;
  };

  const handleRemoveSaved = (e, id) => {
    e.stopPropagation();
    removeAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl pb-safe animate-slide-up max-w-md mx-auto"
        style={{ background: 'var(--theme-surface)', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--theme-ring) 60%, transparent)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 40%, transparent)' }}>
          <h3 className="font-bold text-base" style={{ color: 'var(--theme-header)' }}>Switch Account</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-background">
            <X size={18} style={{ color: 'var(--theme-body)' }} />
          </button>
        </div>

        {/* Account list */}
        <div className="px-4 py-2 space-y-1 max-h-64 overflow-y-auto">
          {accounts.length === 0 && (
            <p className="text-center text-sm py-6" style={{ color: 'var(--theme-body)' }}>No saved accounts yet.</p>
          )}
          {accounts.map(account => {
            const isActive = account.id === currentId;
            const isSwitching = switching === account.id;
            return (
              <button
                key={account.id}
                onClick={() => handleSwitch(account)}
                disabled={isActive || isSwitching}
                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                style={{
                  background: isActive ? 'color-mix(in srgb, var(--theme-primary) 8%, transparent)' : 'transparent',
                  border: isActive ? '1.5px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)' : '1.5px solid transparent',
                  opacity: isSwitching ? 0.6 : 1,
                }}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center border-2"
                  style={{ borderColor: isActive ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-ring) 50%, transparent)', background: 'var(--theme-background)' }}>
                  {account.avatar_url
                    ? <img src={account.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <User size={18} style={{ color: 'var(--theme-primary)' }} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--theme-header)' }}>{account.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--theme-primary)' }}>
                    @{account.username || account.email || 'account'}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 shrink-0">
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full"
                      style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                      <Check size={10} /> Active
                    </span>
                  )}
                  {!isActive && (
                    <>
                      <ChevronRight size={16} style={{ color: 'var(--theme-body)' }} />
                      <button
                        onClick={e => handleRemoveSaved(e, account.id)}
                        className="p-1 rounded-full hover:bg-red-50"
                        title="Remove from saved accounts"
                      >
                        <X size={13} className="text-red-400" />
                      </button>
                    </>
                  )}
                  {isSwitching && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Add account button */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 40%, transparent)' }}>
          <button
            onClick={handleAddAccount}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all font-bold text-sm"
            style={{ color: 'var(--theme-primary)', background: 'color-mix(in srgb, var(--theme-primary) 6%, transparent)', border: '1.5px dashed color-mix(in srgb, var(--theme-primary) 30%, transparent)' }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
              <Plus size={18} style={{ color: 'var(--theme-primary)' }} />
            </div>
            Add another account
          </button>
        </div>

        {/* Sign out all */}
        <div className="px-4 pb-6 pt-1">
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/auth'; }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ color: '#DC6B6B', background: 'rgba(220,107,107,0.06)', border: '1px solid rgba(220,107,107,0.15)' }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}
