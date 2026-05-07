"use client";

import { AppShell } from "@/components/layout/AppShell";
import {
  Edit3,
  ChevronDown,
  Loader2,
  Mail,
  Camera,
  MapPin,
  Briefcase,
  Clock,
  Link2,
  User,
  Lock,
  AlertTriangle,
  Share2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useUpdateProfile } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { ChangePassword } from "@/components/profile/ChangePassword";

type Tab = "profile" | "password" | "delete";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Change Password" },
  { id: "delete", label: "Delete Account" },
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "HR",
];

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-[#495057]">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[#dee2e6] bg-white px-3 py-2 text-sm text-[#495057] outline-none transition-all placeholder:text-[#adb5bd] focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-70 disabled:bg-[#f8f9fa] disabled:cursor-not-allowed";

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 rounded-lg" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const updateProfile = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    department: "Engineering",
    title: "",
    yearsOfExperience: "",
    location: "",
    linkedin: "",
    gender: "Male",
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      const parts = (user.name ?? "").split(" ");
      setFormData({
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? "",
        bio: user.bio ?? "",
        location: user.location ?? "",
        department: user.department ?? "Engineering",
        title: user.title ?? "",
        yearsOfExperience: String(user.yearsOfExperience ?? ""),
        linkedin: user.linkedin ?? "",
        gender: user.gender ?? "Male",
      });
      setIsDirty(false);
    }
  }, [user]);

  function set<K extends keyof typeof formData>(key: K, val: string) {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  }

  const handleSave = () => {
    updateProfile.mutate(
      {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        bio: formData.bio,
        location: formData.location,
        department: formData.department,
        title: formData.title,
        yearsOfExperience: formData.yearsOfExperience,
        linkedin: formData.linkedin,
        gender: formData.gender,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          setIsDirty(false);
          setIsEditingProfile(false);
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  if (loading) return <ProfileSkeleton />;

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name ?? "U"
  )}&background=1a3353&color=fff&size=200`;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 flex items-center gap-8 overflow-x-auto no-scrollbar border-b border-[#dee2e6]">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "text-primary"
                  : "text-[#6c757d] hover:text-[#495057]"
              }`}
            >
              {label}
              {activeTab === id && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            {/* Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="text-2xl font-bold uppercase tracking-wide text-[#343a40]">
                PROFILE
              </h1>
              <div className="text-sm text-[#adb5bd]">
                <span>Workspace</span>
                <span className="mx-2">/</span>
                <span className="text-[#495057]">Profile</span>
              </div>
            </div>

            {/* Profile Header */}
            <div className="rounded-lg border border-[#dee2e6] bg-white p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#dee2e6]">
                      <img
                        src={avatarUrl}
                        alt={user?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#dee2e6] text-[#6c757d] hover:text-primary transition-colors">
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#343a40]">
                      {user?.name}
                    </h2>
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[#6c757d]">
                      <Mail size={13} />
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 rounded-lg border border-[#dee2e6] bg-white px-4 py-2 text-sm font-semibold text-[#495057] transition-colors hover:bg-[#f8f9fa]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-[#343a40]">User Profile</h2>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)} 
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#dee2e6] text-[#6c757d] shadow-sm transition-all hover:border-primary hover:text-primary"
                  title="Edit Profile"
                >
                  <Edit3 size={18} />
                </button>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left: Bio */}
              <div className="rounded-lg border border-[#dee2e6] bg-white p-6">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-[#343a40]">
                    Bio/ About <span className="text-danger">*</span>
                  </h3>
                </div>
                <textarea
                  className={`w-full min-h-[120px] resize-none text-sm leading-relaxed text-[#495057] outline-none placeholder:text-[#adb5bd] transition-all ${isEditingProfile ? 'bg-white border border-primary/30 ring-4 ring-primary/5 rounded-lg p-3' : 'bg-transparent border-none p-0'}`}
                  value={formData.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  readOnly={!isEditingProfile}
                />

                <div className="mt-6 border-t border-[#f1f3f5] pt-6">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#adb5bd]">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.linkedin}
                    onChange={(e) => set("linkedin", e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>

              {/* Right: Form */}
              <div className="lg:col-span-2 rounded-lg border border-[#dee2e6] bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#343a40]">
                    Profile Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="First Name" required>
                    <input
                      className={inputCls}
                      value={formData.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      disabled={!isEditingProfile}
                    />
                  </Field>

                  <Field label="Last Name" required>
                    <input
                      className={inputCls}
                      value={formData.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      disabled={!isEditingProfile}
                    />
                  </Field>

                  <Field label="Department" required>
                    <div className="relative">
                      <select
                        className={`${inputCls} appearance-none pr-8`}
                        value={formData.department}
                        onChange={(e) => set("department", e.target.value)}
                        disabled={!isEditingProfile}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#adb5bd]"
                      />
                    </div>
                  </Field>

                  <Field label="Current Title" required>
                    <input
                      className={inputCls}
                      value={formData.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g., Software Engineer"
                      disabled={!isEditingProfile}
                    />
                  </Field>

                  <Field label="Years of Experience" required>
                    <input
                      type="number"
                      className={inputCls}
                      value={formData.yearsOfExperience}
                      onChange={(e) =>
                        set("yearsOfExperience", e.target.value)
                      }
                      disabled={!isEditingProfile}
                    />
                  </Field>

                  <Field label="Gender" required>
                    <div className="relative">
                      <select
                        className={`${inputCls} appearance-none pr-8`}
                        value={formData.gender}
                        onChange={(e) => set("gender", e.target.value)}
                        disabled={!isEditingProfile}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                        <option>Prefer not to say</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#adb5bd]"
                      />
                    </div>
                  </Field>

                  <Field label="Location" required className="md:col-span-2">
                    <input
                      className={inputCls}
                      value={formData.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="City, Country"
                      disabled={!isEditingProfile}
                    />
                  </Field>
                </div>

                {/* Edit Actions */}
                {isEditingProfile && (
                  <div className="mt-8 flex justify-end gap-3 border-t border-[#f1f3f5] pt-6">
                    <button 
                      onClick={() => { setIsEditingProfile(false); setFormData(prev => ({ ...prev, bio: user?.bio || "" })); }}
                      className="rounded-md bg-[#e76f51] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#e76f51]/90"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                      className="flex items-center gap-2 rounded-md bg-[#1d3bb3] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1d3bb3]/90 disabled:opacity-60"
                    >
                      {updateProfile.isPending && <Loader2 size={14} className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div>
            <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-[#343a40]">
              CHANGE PASSWORD
            </h1>
            <ChangePassword />
          </div>
        )}

        {/* Delete Account Tab */}
        {activeTab === "delete" && (
          <div>
            <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-[#343a40]">
              DELETE ACCOUNT
            </h1>
            <div className="mx-auto max-w-2xl rounded-lg border border-danger/20 bg-danger/5 p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#343a40] mb-2">
                Delete Your Account
              </h3>
              <p className="text-[#6c757d] mb-8">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button className="rounded-lg bg-danger px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-danger/90">
                Deactivate Account
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}