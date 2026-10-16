"use client";

import { useEffect, useState } from "react";
import { Loader2, LogIn, UserPlus, Mail, Lock, Building2, User, MapPin, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTdc, panelFor } from "../store";
import { t, UI } from "../i18n";
import { toast } from "sonner";

export function AuthModal() {
  const { lang, overlay, closeOverlay, openOverlay, refreshUser } = useTdc();
  const open = overlay?.type === "auth";
  const initialTab = overlay?.type === "auth" ? overlay.tab ?? "login" : "login";
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"login" | "register" | "forgot">(initialTab);
  const [login, setLogin] = useState({ identifier: "", password: "" });
  const [forgot, setForgot] = useState({ email: "", phone: "" });
  const [forgotSent, setForgotSent] = useState(false);

  // Start on the requested tab each time the dialog is opened
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setForgotSent(false);
    }
  }, [open, initialTab]);
  const [reg, setReg] = useState({ name: "", labName: "", email: "", phone: "", city: "", password: "" });

  const errText = (code: string) => {
    const map: Record<string, { fa: string; en: string }> = {
      INVALID_CREDENTIALS: { fa: "ایمیل / نام کاربری یا رمز عبور اشتباه است", en: "Invalid e-mail / username or password" },
      ACCOUNT_DISABLED: { fa: "این حساب غیرفعال شده است. با مدیریت تماس بگیرید.", en: "This account is disabled. Please contact the admin." },
      INVALID_EMAIL: { fa: "ایمیل وارد شده معتبر نیست", en: "Please enter a valid e-mail address" },
      EMAIL_TAKEN: { fa: "این ایمیل قبلاً ثبت شده است", en: "This email is already registered" },
      WEAK_PASSWORD: { fa: "رمز عبور باید حداقل ۶ کاراکتر باشد", en: "Password must be at least 6 characters" },
      MISSING_FIELDS: { fa: "همه فیلدهای الزامی را پر کنید", en: "Please fill all required fields" },
    };
    const e = map[code];
    return e ? t(e, lang) : t(UI.common.error, lang);
  };

  const doLogin = async () => {
    if (!login.identifier.trim() || !login.password) return toast.error(errText("MISSING_FIELDS"));
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(errText(data.error));
      await refreshUser();
      closeOverlay();
      toast.success(lang === "fa" ? `خوش آمدید ${data.user.name}!` : `Welcome ${data.user.name}!`);
      openOverlay(panelFor(data.user));
    } catch {
      toast.error(t(UI.common.error, lang));
    } finally {
      setBusy(false);
    }
  };

  const doForgot = async () => {
    if (!forgot.email.includes("@")) return toast.error(errText("MISSING_FIELDS"));
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forgot),
      });
      if (!res.ok) return toast.error(t(UI.common.error, lang));
      setForgotSent(true);
    } catch {
      toast.error(t(UI.common.error, lang));
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async () => {
    if (!reg.name || !reg.email || !reg.password) return toast.error(errText("MISSING_FIELDS"));
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(errText(data.error));
      await refreshUser();
      closeOverlay();
      toast.success(lang === "fa" ? "حساب لابراتوار شما ساخته شد!" : "Your lab account is ready!");
      openOverlay({ type: "lab", tab: "newCase" });
    } catch {
      toast.error(t(UI.common.error, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeOverlay()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll border-white/10 bg-[#101318] p-0 text-white sm:max-w-md">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-start">
            <DialogTitle className="text-xl font-extrabold">
              {lang === "fa" ? "ورود به حساب TDC" : "Sign in to TDC"}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/50">
              {lang === "fa"
                ? "برای لابراتوارها، کلینیک‌های همکار و طراحان"
                : "For partner labs, clinics & designers"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register" | "forgot")} className="mt-5">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="login" className="gap-1.5 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300">
                <LogIn className="h-4 w-4" />
                {t(UI.auth.login, lang)}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300">
                <UserPlus className="h-4 w-4" />
                {t(UI.auth.register, lang)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5 space-y-4">
              <div>
                <Label className="text-white/70">{lang === "fa" ? "ایمیل یا نام کاربری" : "E-mail or username"}</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    dir="ltr"
                    value={login.identifier}
                    onChange={(e) => setLogin({ ...login, identifier: e.target.value })}
                    className="rounded-xl border-white/15 bg-white/5 ps-9 text-white placeholder:text-white/25"
                    placeholder="lab@example.com"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/70">{t(UI.auth.password, lang)}</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    type="password"
                    dir="ltr"
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && doLogin()}
                    className="rounded-xl border-white/15 bg-white/5 ps-9 text-white placeholder:text-white/25"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button
                onClick={doLogin}
                disabled={busy}
                className="w-full rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t(UI.auth.loginBtn, lang)}
              </Button>
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("forgot")}
                  className="text-center text-xs text-white/55 hover:text-white"
                >
                  {lang === "fa" ? "رمز عبور را فراموش کرده‌اید؟" : "Forgot your password?"}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-center text-xs text-orange-400 hover:text-orange-300"
                >
                  {t(UI.auth.noAccount, lang)}
                </button>
              </div>
            </TabsContent>

            <TabsContent value="register" className="mt-5 space-y-4">
              <p className="rounded-xl bg-orange-500/10 px-4 py-3 text-xs leading-6 text-orange-200/80">
                {t(UI.auth.registerHint, lang)}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-white/70">{t(UI.auth.name, lang)} *</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      value={reg.name}
                      onChange={(e) => setReg({ ...reg, name: e.target.value })}
                      className="rounded-xl border-white/15 bg-white/5 ps-9 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70">{t(UI.auth.labName, lang)}</Label>
                  <div className="relative mt-1.5">
                    <Building2 className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      value={reg.labName}
                      onChange={(e) => setReg({ ...reg, labName: e.target.value })}
                      className="rounded-xl border-white/15 bg-white/5 ps-9 text-white"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-white/70">{t(UI.auth.email, lang)} *</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      type="email"
                      dir="ltr"
                      value={reg.email}
                      onChange={(e) => setReg({ ...reg, email: e.target.value })}
                      className="rounded-xl border-white/15 bg-white/5 ps-9 text-white"
                      placeholder="lab@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70">{t(UI.contact.phone, lang)}</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      dir="ltr"
                      value={reg.phone}
                      onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                      className="rounded-xl border-white/15 bg-white/5 ps-9 text-white tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70">{t(UI.auth.city, lang)}</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      value={reg.city}
                      onChange={(e) => setReg({ ...reg, city: e.target.value })}
                      className="rounded-xl border-white/15 bg-white/5 ps-9 text-white"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-white/70">{t(UI.auth.password, lang)} *</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      type="password"
                      dir="ltr"
                      value={reg.password}
                      onChange={(e) => setReg({ ...reg, password: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && doRegister()}
                      className="rounded-xl border-white/15 bg-white/5 ps-9 text-white"
                      placeholder="min 6 chars"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={doRegister}
                disabled={busy}
                className="w-full rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t(UI.auth.registerBtn, lang)}
              </Button>
              <button
                type="button"
                onClick={() => setTab("login")}
                className="w-full text-center text-xs text-orange-400 hover:text-orange-300"
              >
                {t(UI.auth.hasAccount, lang)}
              </button>
            </TabsContent>

            <TabsContent value="forgot" className="mt-5 space-y-4">
              {forgotSent ? (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                  <p className="text-sm leading-7 text-white/75">
                    {lang === "fa"
                      ? "اگر این ایمیل در سیستم ثبت شده باشد، درخواست شما برای مدیریت ارسال شد. پس از بررسی با شما تماس می‌گیریم و رمز موقت را اعلام می‌کنیم."
                      : "If this e-mail is registered, your request was sent to the admin. We will contact you and give you a temporary password."}
                  </p>
                  <Button onClick={() => setTab("login")} className="w-full rounded-full bg-white/10 font-bold text-white hover:bg-white/15">
                    {lang === "fa" ? "بازگشت به ورود" : "Back to sign in"}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="rounded-xl bg-orange-500/10 px-4 py-3 text-xs leading-6 text-orange-200/80">
                    {lang === "fa"
                      ? "ایمیل حساب خود را وارد کنید. درخواست شما به مدیریت می‌رسد و یک رمز موقت برایتان تنظیم می‌شود (بعد از ورود می‌توانید آن را از «پروفایل» تغییر دهید)."
                      : "Enter your account e-mail. Your request goes to the admin, who will set a temporary password for you (you can change it later in your profile)."}
                  </p>
                  <div>
                    <Label className="text-white/70">{t(UI.auth.email, lang)}</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <Input
                        type="email"
                        dir="ltr"
                        value={forgot.email}
                        onChange={(e) => setForgot({ ...forgot, email: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && doForgot()}
                        className="rounded-xl border-white/15 bg-white/5 ps-9 text-white placeholder:text-white/25"
                        placeholder="lab@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/70">{lang === "fa" ? "شماره تماس (اختیاری)" : "Phone (optional)"}</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <Input
                        dir="ltr"
                        value={forgot.phone}
                        onChange={(e) => setForgot({ ...forgot, phone: e.target.value })}
                        className="rounded-xl border-white/15 bg-white/5 ps-9 text-white tabular-nums"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={doForgot}
                    disabled={busy}
                    className="w-full rounded-full bg-gradient-to-l from-orange-600 to-orange-500 py-3 font-bold text-white"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : lang === "fa" ? "ارسال درخواست بازیابی رمز" : "Request password reset"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="flex w-full items-center justify-center gap-1 text-center text-xs text-orange-400 hover:text-orange-300"
                  >
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                    {lang === "fa" ? "بازگشت به ورود" : "Back to sign in"}
                  </button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
