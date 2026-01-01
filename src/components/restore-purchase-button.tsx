'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export function RestorePurchaseButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'none' | 'error' | null>(null);

  const handleRestore = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/stripe/sync', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      if (data.isSubscribed) {
        setResult('success');
        // Reload page after short delay to refresh session
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult('none');
      }
    } catch (error) {
      console.error('Restore error:', error);
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleRestore}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Syncing...' : 'Restore Purchase'}
      </button>

      {result === 'success' && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle size={16} />
          <span>Subscription restored! Refreshing...</span>
        </div>
      )}

      {result === 'none' && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <XCircle size={16} />
          <span>No active subscription found</span>
        </div>
      )}

      {result === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <XCircle size={16} />
          <span>Failed to sync. Please try again.</span>
        </div>
      )}
    </div>
  );
}
