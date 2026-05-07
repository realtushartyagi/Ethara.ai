"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { LayoutDashboard, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, Flower2 } from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/signup", formData);
      if (response.data.accessToken) {
        login(response.data.accessToken, response.data.user);
        toast.success("Account created successfully!", {
          description: `Welcome to Team Task Manager, ${formData.name}`,
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1a3353] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="/team_task_manager_auth_bg_1778038107745.png" 
             alt="Background" 
             className="w-full h-full object-cover"
           />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a3353] via-[#1a3353]/80 to-transparent" />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
              <img src="/icon.svg" alt="Logo" width={28} height={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 leading-tight">Ethara AI</span>
              <span className="text-xl font-black text-white tracking-tight">MANAGER</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
            Build Intelligent teams with <span className="text-primary-light">Ethara AI.</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Create an account today and experience the future of collaborative task management. Simple for members, powerful for admins.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Organize projects with zero friction",
              "Advanced Role-Based Access Control",
              "Real-time Kanban visibility",
              "Professional team dashboards"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80 font-bold text-sm">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                   <div className="h-2 w-2 rounded-full bg-primary-light shadow-[0_0_8px_rgba(var(--color-primary-light),0.8)]" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#f8f8fb]">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-[#1a3353] flex items-center justify-center shadow-lg">
              <Flower2 size={22} className="text-white" />
            </div>
            <span className="text-lg font-black text-[#1a3353] tracking-tight uppercase">Ethara AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#1a3353] mb-2">Create Account</h2>
            <p className="text-[#6c757d] font-medium">Join us and start managing like a pro.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#495057] ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#eff2f7] bg-white text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#495057] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#eff2f7] bg-white text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#495057] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-2xl border border-[#eff2f7] bg-white text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#495057] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#6c757d] px-2">
              By creating an account, you agree to our <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a3353] hover:bg-[#1a3353]/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#1a3353]/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-bold text-[#6c757d]">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">Sign in instead</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
