'use client';

import React, { useState } from 'react';
import { UserX, UserCheck, Loader2 } from 'lucide-react';
import { StaffUser, updateStaffStatus, getErrorMessage } from '../../../lib/apiClient';

interface StatusToggleModalProps {
  user: StaffUser | null;
  token: string | null;
  roleLabels: Record<string, string>;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function StatusToggleModal({
  user,
  token,
  roleLabels,
  onClose,
  onSuccess,
  onError,
}: StatusToggleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleToggle = async () => {
    if (!token) return;
    setIsSubmitting(true);

    try {
      const nextStatus = !user.isActive;
      const res = await updateStaffStatus(token, user.id, nextStatus);
      onSuccess(
        res.message || `Staff account ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
      );
      onClose();
    } catch (err: unknown) {
      onError(getErrorMessage(err) || 'Failed to update account status');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-full ${
              user.isActive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}
          >
            {user.isActive ? <UserX size={24} /> : <UserCheck size={24} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {user.isActive ? 'Deactivate Staff Account' : 'Activate Staff Account'}
            </h3>
            <p className="text-xs text-gray-500">
              {user.fullName} ({user.memberId})
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          {user.isActive ? (
            <>
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-gray-900">{user.fullName}</span>? This will
              immediately revoke their ability to log in and access system services.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{' '}
              <span className="font-semibold text-gray-900">{user.fullName}</span>? They will regain
              full system access under role{' '}
              <span className="font-semibold">{roleLabels[user.role] || user.role}</span>.
            </>
          )}
        </p>

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleToggle}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
              user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {user.isActive ? 'Confirm Deactivation' : 'Confirm Activation'}
          </button>
        </div>
      </div>
    </div>
  );
}
