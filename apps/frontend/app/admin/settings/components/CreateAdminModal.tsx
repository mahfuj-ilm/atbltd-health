'use client';

import React, { useState } from 'react';
import { UserPlus, X, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  createAdmin,
  CreateAdminPayload,
  CreateAdminResponse,
  getErrorMessage,
} from '../../../lib/apiClient';

interface CreateAdminModalProps {
  token: string | null;
  onClose: () => void;
  onSuccess: (res: CreateAdminResponse) => void;
}

export default function CreateAdminModal({ token, onClose, onSuccess }: CreateAdminModalProps) {
  const [form, setForm] = useState<CreateAdminPayload>({
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    permanentAddress: '',
    isTwoFactorEnabled: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!form.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!form.mobileNumber.trim()) {
      setError('Mobile number is required');
      return;
    }

    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createAdmin(token, {
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        email: form.email?.trim() || undefined,
        password: form.password?.trim() || undefined,
        permanentAddress: form.permanentAddress?.trim() || undefined,
        isTwoFactorEnabled: form.isTwoFactorEnabled,
      });

      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create admin account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Create New Admin</h3>
              <p className="text-xs text-gray-500">
                Add an administrator with full operations management privileges
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Operations Officer"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 01712345678"
              value={form.mobileNumber}
              onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="admin@atbltd.health (optional)"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">Initial Password</label>
              <span className="text-[11px] text-gray-400">Optional</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Leave blank to auto-generate from name & phone"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              If left empty, a secure temporary password will be auto-generated and displayed.
            </p>
          </div>

          {/* Permanent Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="Official address or office location (optional)"
              value={form.permanentAddress || ''}
              onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E]"
            />
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="text-xs font-semibold text-gray-800">Two-Factor Authentication</div>
              <div className="text-[11px] text-gray-500">Require OTP code upon admin login</div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(form.isTwoFactorEnabled)}
              onChange={(e) =>
                setForm({
                  ...form,
                  isTwoFactorEnabled: e.target.checked,
                })
              }
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
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
