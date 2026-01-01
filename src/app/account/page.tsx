import { getSession, getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { SubscribeButton } from '@/components/subscribe-button';
import { ManageSubscriptionButton } from '@/components/manage-subscription-button';
import { RestorePurchaseButton } from '@/components/restore-purchase-button';
import { SignOutButton } from '@/components/sign-out-button';
import { CheckCircle, XCircle, Crown, Calendar, Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const user = await getCurrentUser();

  const isSubscribed =
    user?.subscription?.status === 'active' &&
    user.subscription.currentPeriodEnd &&
    user.subscription.currentPeriodEnd > new Date();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Account</h1>
        <p className="text-gray-500">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Flame size={18} />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-2xl font-bold">{user?.currentStreak || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Crown size={18} />
            <span className="text-sm font-medium">Longest Streak</span>
          </div>
          <div className="text-2xl font-bold">{user?.longestStreak || 0}</div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold mb-4">Subscription</h2>

        {isSubscribed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle size={20} />
              <span className="font-medium">Active Subscription</span>
            </div>

            {user?.subscription?.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={16} />
                <span className="text-sm">
                  {user.subscription.cancelAtPeriodEnd
                    ? 'Cancels'
                    : 'Renews'}{' '}
                  on {format(user.subscription.currentPeriodEnd, 'MMMM d, yyyy')}
                </span>
              </div>
            )}

            <p className="text-sm text-gray-500">
              You have access to the puzzle archive and practice mode.
            </p>

            <ManageSubscriptionButton />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-500">
              <XCircle size={20} />
              <span>No active subscription</span>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4">
              <h3 className="font-medium mb-2">Premium Benefits</h3>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Access to the full puzzle archive</li>
                <li>• Unlimited practice mode</li>
                <li>• Detailed hints in practice mode</li>
                <li>• Support the development</li>
              </ul>
            </div>

            <SubscribeButton />

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Already purchased? Sync your subscription:</p>
              <RestorePurchaseButton />
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <SignOutButton />
      </div>
    </div>
  );
}
