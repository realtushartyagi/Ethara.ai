"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/api.service";
import { toast } from "sonner";
import { LayoutDashboard, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Flower2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      login(data.accessToken, data.user);
      toast.success("Welcome back!", {
        description: `Logged in as ${data.user.name}`,
      });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1a3353] items-center justify-center p-12 overflow-hidden">
        {/* Background Pattern/Image */}
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
            Nurturing the Next Generation of AI Professionals.
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            The most advanced project management platform for modern collaborative teams. Track tasks, manage members, and hit every deadline.
          </p>
          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-[#1a3353] bg-gray-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-white/60">Joined by 2,000+ teams</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#f8f8fb]">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-[#1a3353] flex items-center justify-center shadow-lg">
              <Flower2 size={22} className="text-white" />
            </div>
            <span className="text-lg font-black text-[#1a3353] tracking-tight uppercase">Ethara AI</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-[#1a3353] mb-2">Welcome Back</h2>
            <p className="text-[#6c757d] font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#495057] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#eff2f7] bg-white text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold text-[#495057]">Password</label>
                <Link href="/auth/forgot-password" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#adb5bd] group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-[#eff2f7] bg-white text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="remember" className="text-sm font-bold text-[#6c757d] cursor-pointer">Keep me signed in</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a3353] hover:bg-[#1a3353]/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#1a3353]/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm font-bold text-[#6c757d]">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">Sign up for free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
