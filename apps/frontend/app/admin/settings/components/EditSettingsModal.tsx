'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, AlertTriangle, Loader2 } from 'lucide-react';
import {
  StaffUser,
  updateStaffSettings,
  UpdateStaffSettingsPayload,
  getErrorMessage,
} from '../../../lib/apiClient';

interface EditSettingsModalProps {
  user: StaffUser | null;
  currentUser: { id?: string; memberId?: string; role?: string } | null;
  token: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function EditSettingsModal({
  user,
  currentUser,
  token,
  onClose,
  onSuccess,
}: EditSettingsModalProps) {
  const [formData, setFormData] = useState<UpdateStaffSettingsPayload>({
    fullName: user?.fullName || '',
    mobileNumber: user?.mobileNumber || '',
    email: user?.email || '',
    role: user?.role,
    isTwoFactorEnabled: user?.isTwoFactorEnabled,
  });
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        mobileNumber: user.mobileNumber || '',
        email: user.email || '',
        role: user.role,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      });
      setSettingsError(null);
    }
  }, [user]);

  if (!user) return null;

  const isEditingSelf = Boolean(
    currentUser &&
    (user.memberId === currentUser.memberId || (currentUser.id && user.id === currentUser.id)),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.fullName?.trim()) {
      setSettingsError('Full name is required');
      return;
    }

    if (!formData.mobileNumber?.trim()) {
      setSettingsError('Mobile number is required');
      return;
    }

    setIsSubmitting(true);
    setSettingsError(null);

    try {
      const res = await updateStaffSettings(token, user.id, {
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email?.trim() || undefined,
        role: formData.role,
        isTwoFactorEnabled: formData.isTwoFactorEnabled,
      });

      onSuccess(res.message || 'Staff settings updated successfully.');
      onClose();
    } catch (err: unknown) {
      setSettingsError(getErrorMessage(err) || 'Failed to update staff settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Edit Staff Settings</h3>
              <p className="text-xs text-gray-500">
                {user.fullName} ({user.memberId})
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {settingsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{settingsError}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
            <input
              type="text"
              value={formData.mobileNumber || ''}
              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Optional email"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Role</label>
            <select
              value={formData.role || 'admin'}
              disabled={isEditingSelf}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E] disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="agent">Agent</option>
            </select>
            {isEditingSelf && (
              <p className="text-[11px] text-amber-600 mt-1">
                You cannot alter your own Super Admin role.
              </p>
            )}
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="text-xs font-semibold text-gray-800">Two-Factor Authentication</div>
              <div className="text-[11px] text-gray-500">Require OTP code upon staff login</div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(formData.isTwoFactorEnabled)}
              onChange={(e) => setFormData({ ...formData, isTwoFactorEnabled: e.target.checked })}
              className="w-4 h-4 text-[#0A2A5E] rounded border-gray-300 focus:ring-[#0A2A5E]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0A2A5E] hover:bg-[#081f42] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
