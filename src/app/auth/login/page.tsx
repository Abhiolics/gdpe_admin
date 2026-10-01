"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, KeyRound, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState("audacious.here@gmail.com");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);

  const authorizedEmail = "audacious.here@gmail.com";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== authorizedEmail) {
      toast.error(`Access Denied: Only ${authorizedEmail} is authorized for Admin Portal access.`);
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanEmail);
      setStep("otp");
    } catch (err) {
      // toast notification is already shown in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), otp);
    } catch (err) {
      // toast notification is already shown in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 selection:bg-emerald-500 selection:text-slate-950">
      {/* Background radial glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />

      <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-emerald-950/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>GDP<span className="text-emerald-400">e</span> Admin Portal</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            {step === "email" 
              ? "OTP-based secure authentication (Only authorized admin email)" 
              : `Verification code sent to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-slate-300">Administrator Email</Label>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Lock className="h-3 w-3" /> OTP Only
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-8 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-14 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Only  <span className="text-slate-300 font-mono font-semibold">Authorized Person </span> is permitted for administrator access.
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !email} 
                className="w-full h-14 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP to Email...
                  </>
                ) : (
                  "Send One-Time Password"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">Enter OTP Code</Label>
                <div className="relative">
                  <KeyRound className="absolute h-8 left-3 top-3 w-4 text-slate-500" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    autoFocus
                    className="pl-10 h-14 border-slate-800 bg-slate-950 text-white placeholder:text-slate-600 tracking-widest text-lg font-mono focus-visible:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Check your inbox / spam folder for the 6-digit code.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setStep("email"); setOtp(""); }}
                  className="flex-1 h-14 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                >
                  Change Email
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || otp.length < 4}
                  className="flex-1 h-14 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enter"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
