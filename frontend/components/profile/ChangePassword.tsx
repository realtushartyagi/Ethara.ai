"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export function ChangePassword() {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success("Password changed successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to change password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock size={24} />
        </div>
        <h3 className="text-xl font-bold text-[#343a40]">Change Password</h3>
        <p className="text-sm text-[#6c757d] mt-1">Update your account password to stay secure.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#343a40] ml-1">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className="w-full rounded-xl border border-[#eff2f7] bg-[#f8f8fb]/50 px-4 py-3 text-sm font-medium outline-none focus:border-primary/30 transition-all pr-12"
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#343a40] transition-colors"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#343a40] ml-1">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className="w-full rounded-xl border border-[#eff2f7] bg-[#f8f8fb]/50 px-4 py-3 text-sm font-medium outline-none focus:border-primary/30 transition-all pr-12"
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#343a40] transition-colors"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#343a40] ml-1">Confirm New Password</label>
          <input
            type="password"
            className="w-full rounded-xl border border-[#eff2f7] bg-[#f8f8fb]/50 px-4 py-3 text-sm font-medium outline-none focus:border-primary/30 transition-all"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95 disabled:opacity-70 cursor-pointer"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
