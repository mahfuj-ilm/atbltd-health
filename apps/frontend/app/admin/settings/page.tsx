'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  ShieldAlert,
  Loader2,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Shield,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import AdminTable from '../components/AdminTable';
import {
  StaffUser,
  getStaffUsers,
  getErrorMessage,
  CreateAdminResponse,
} from '../../lib/apiClient';
import ResetPasswordModal from './components/ResetPasswordModal';
import StatusToggleModal from './components/StatusToggleModal';
import EditSettingsModal from './components/EditSettingsModal';
import CreateAdminModal from './components/CreateAdminModal';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  owner: 'Owner',
  agent: 'Agent',
};

const ROLE_BADGES: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border border-blue-200',
  owner: 'bg-amber-100 text-amber-800 border border-amber-200',
  agent: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

export default function StaffSettingsPage() {
  const { token, user: currentUser } = useAuth();

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [passwordModalUser, setPasswordModalUser] = useState<StaffUser | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<StaffUser | null>(null);
  const [editSettingsModalUser, setEditSettingsModalUser] = useState<StaffUser | null>(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getStaffUsers(token, {
        page,
        limit: 20,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setStaff(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err) || 'Failed to fetch staff members');
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, roleFilter, searchQuery]);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  const handleSuccess = (msg: string) => {
    setSuccessMessage(msg);
    void fetchStaff();
    setTimeout(() => setSuccessMessage(null), 8000);
  };

  const handleCreateAdminSuccess = (res: CreateAdminResponse) => {
    const tempNotice = res.temporaryPassword
      ? ` Auto-generated temporary password: ${res.temporaryPassword}`
      : '';
    handleSuccess(
      `${res.message || 'Admin account created successfully.'} (ID: ${res.user.memberId}).${tempNotice}`,
    );
  };

  // Check role: strictly super_admin
  if (currentUser && currentUser.role !== 'super_admin') {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-center mt-10">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-red-800">Access Restricted</h2>
        <p className="text-red-600 mt-2 text-sm">
          Staff settings, credentials, and account activation controls are strictly restricted to
          the Super Admin role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0A2A5E]">Staff Settings & Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Super Admin Only
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Manage administrative credentials, toggle account statuses, and configure staff details
            across all Admins, Owners, and Agents.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowCreateAdminModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-[#0A2A5E] hover:bg-[#081f42] rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={15} />
            Create Admin
          </button>
          <button
            type="button"
            onClick={() => void fetchStaff()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-emerald-600 hover:text-emerald-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 text-sm shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-600 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Staff' },
            { id: 'super_admin', label: 'Super Admins' },
            { id: 'admin', label: 'Admins' },
            { id: 'owner', label: 'Owners' },
            { id: 'agent', label: 'Agents' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setRoleFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === tab.id
                  ? 'bg-[#0A2A5E] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {roleFilter === 'admin' && (
            <button
              type="button"
              onClick={() => setShowCreateAdminModal(true)}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <UserPlus size={13} />+ Create Admin
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, mobile, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2A5E] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0A2A5E]" />
            <span className="text-sm font-semibold text-gray-800">Staff Accounts ({total})</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A2A5E]" />
            <p className="text-sm">Loading staff accounts...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <User className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium">No staff members found matching criteria.</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting the search query or filter.</p>
          </div>
        ) : (
          <AdminTable minWidth={900}>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">2FA</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {staff.map((member) => {
                const isSelf = Boolean(
                  currentUser &&
                  (member.memberId === currentUser.memberId ||
                    (currentUser.id && member.id === currentUser.id)),
                );
                return (
                  <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Staff Member Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0A2A5E]/10 text-[#0A2A5E] flex items-center justify-center font-bold text-xs shrink-0">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {member.fullName}
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{member.memberId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ROLE_BADGES[member.role] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-700 flex items-center gap-1">
                        <Phone size={12} className="text-gray-400" />
                        <span>{member.mobileNumber}</span>
                      </div>
                      {member.email ? (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-gray-400" />
                          <span>{member.email}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">No email set</div>
                      )}
                    </td>

                    {/* 2FA */}
                    <td className="px-5 py-4">
                      {member.isTwoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} />
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Disabled</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => setPasswordModalUser(member)}
                          title="Reset Password"
                          className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-gray-200 hover:border-amber-300"
                        >
                          <KeyRound size={15} />
                        </button>

                        {/* Edit Settings Button */}
                        <button
                          type="button"
                          onClick={() => setEditSettingsModalUser(member)}
                          title="Edit Staff Settings"
                          className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                        >
                          <Settings size={15} />
                        </button>

                        {/* Activate / Deactivate Button */}
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setStatusModalUser(member)}
                          title={
                            isSelf
                              ? 'Cannot deactivate your own account'
                              : member.isActive
                                ? 'Deactivate Account'
                                : 'Activate Account'
                          }
                          className={`p-1.5 rounded-lg transition-colors border ${
                            isSelf
                              ? 'text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50'
                              : member.isActive
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 hover:border-red-300'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-gray-200 hover:border-green-300'
                          }`}
                        >
                          {member.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Modals */}
      {passwordModalUser && (
        <ResetPasswordModal
          user={passwordModalUser}
          token={token}
          onClose={() => setPasswordModalUser(null)}
          onSuccess={handleSuccess}
        />
      )}

      {statusModalUser && (
        <StatusToggleModal
          user={statusModalUser}
          token={token}
          roleLabels={ROLE_LABELS}
          onClose={() => setStatusModalUser(null)}
          onSuccess={handleSuccess}
          onError={(err) => setErrorMessage(err)}
        />
      )}

      {editSettingsModalUser && (
        <EditSettingsModal
          user={editSettingsModalUser}
          currentUser={currentUser}
          token={token}
          onClose={() => setEditSettingsModalUser(null)}
          onSuccess={handleSuccess}
        />
      )}

      {showCreateAdminModal && (
        <CreateAdminModal
          token={token}
          onClose={() => setShowCreateAdminModal(false)}
          onSuccess={handleCreateAdminSuccess}
        />
      )}
    </div>
  );
}
