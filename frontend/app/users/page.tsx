"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useUsers, useDeleteUser } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/Skeleton";
import { 
  Users as UsersIcon, 
  Trash2, 
  Mail, 
  Shield, 
  User as UserIcon,
  Search,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const { data: usersResponse, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="h-20 w-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#343a40]">Access Denied</h2>
          <p className="text-[#6c757d] mt-2">Only system administrators can access this page.</p>
        </div>
      </AppShell>
    );
  }

  const users = (usersResponse?.data as any[]) || [];
  const filteredUsers = users.filter((user: any) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    setUserToDelete({ id, name });
    setIsConfirmOpen(true);
  };

  const onConfirmDelete = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id, {
        onSuccess: () => {
          toast.success("User deleted successfully");
          setIsConfirmOpen(false);
          setUserToDelete(null);
        },
        onError: () => toast.error("Failed to delete user")
      });
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#343a40] tracking-tight">System Users</h1>
            <p className="text-sm font-medium text-[#6c757d] mt-1">Manage platform users and their roles.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
            <input 
              type="text"
              placeholder="Search users..."
              className="w-full md:w-80 pl-10 pr-4 py-2.5 rounded-xl border border-[#eff2f7] bg-white text-sm focus:border-primary/30 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#eff2f7] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f8fb] border-b border-[#eff2f7]">
                  <th className="px-6 py-4 text-xs font-bold text-[#343a40] uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#343a40] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#343a40] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#343a40] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff2f7]">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f8f8fb]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#343a40]">{user.name}</div>
                            <div className="text-xs text-[#6c757d] flex items-center gap-1">
                              <Mail size={12} /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          user.role === 'ADMIN' 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-gray-100 text-[#6c757d] border border-gray-200'
                        }`}>
                          <Shield size={12} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6c757d] font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-danger bg-danger/5 hover:bg-danger hover:text-white transition-all cursor-pointer ml-auto"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <UsersIcon size={40} className="text-[#eff2f7] mb-2" />
                        <p className="text-[#adb5bd] font-medium">No users found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={onConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete user ${userToDelete?.name}? this action cannot be undone and will remove all their data from the system.`}
          isLoading={deleteUser.isPending}
        />
      </div>
    </AppShell>
  );
}
