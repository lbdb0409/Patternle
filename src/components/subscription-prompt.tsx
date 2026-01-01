'use client';

import { useState } from 'react';
import { Crown, Check, Loader2, Archive, Dumbbell, X } from 'lucide-react';

interface SubscriptionPromptProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function SubscriptionPrompt({ isModal = false, onClose }: SubscriptionPromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  const content = (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-8 text-center text-white">
        <Crown className="mx-auto mb-3" size={40} />
        <h2 className="text-2xl font-bold mb-2">Unlock Full Access</h2>
        <p className="text-primary-100">Get unlimited puzzles for just $3/month</p>
      </div>

      {/* Features */}
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Archive className="text-green-600 dark:text-green-400" size={16} />
            </div>
            <div>
              <h3 className="font-medium">Puzzle Archive</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Access all past puzzles and track your progress
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Dumbbell className="text-blue-600 dark:text-blue-400" size={16} />
            </div>
            <div>
              <h3 className="font-medium">Practice Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Unlimited random puzzles to sharpen your skills
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Check className="text-purple-600 dark:text-purple-400" size={16} />
            </div>
            <div>
              <h3 className="font-medium">Support Development</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Help us create more puzzles and features
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Price */}
        <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">$3</span>
            <span className="text-gray-500">/month</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Cancel anytime</p>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Crown size={20} />
          )}
          Subscribe Now
        </button>

        <p className="text-xs text-center text-gray-400">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="relative max-w-md w-full">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return <div className="max-w-md mx-auto">{content}</div>;
}
