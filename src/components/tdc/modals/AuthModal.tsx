"use client";

import { useState } from "react";
import { Loader2, LogIn, UserPlus, Mail, Lock, Building2, User, MapPin, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTdc } from "../store";
import { t, UI } from "../i18n";
import { toast } from "sonner";

export function AuthModal() {
  const { lang, overlay, closeOverlay, openOverlay, refreshUser } = useTdc();
  const open = overlay?.type === "auth";
  const initialTab = overlay?.type === "auth" ? overlay.tab ?? "login" : "login";
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ name: "", labName: "", email: "", phone: "", city: "", password: "" });

  const errText = (code: string) => {
    const map: Record<string, { fa: string; en: string }> = {
      INVALID_CREDENTIALS: { fa: "ایمیل یا رمز عبور اشتباه است", en: "Invalid email or password" },
      EMAIL_TAKEN: { fa: "این ایمیل قبلاً ثبت شده است", en: "This email is already registered" },
      WEAK_PASSWORD: { fa: "رمز عبور باید حداقل ۶ کاراکتر باشد", en: "Password must be at least 6 characters" },
      MISSING_FIELDS: { fa: "همه فیلدهای الزامی را پر کنید", en: "Please fill all required fields" },
    };
    const e = map[code];
    return e ? t(e, lang) : t(UI.common.error, lang);
  };

  const doLogin = async () => {
    if (!login.email || !login.password) return toast.error(errText("MISSING_FIELDS"));
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
      if (data.user.role === "ADMIN") openOverlay({ type: "admin" });
      else openOverlay({ type: "lab" });
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
                ? "برای لابراتوارها و کلینیک‌های همکار"
                : "For partner labs & clinics"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={initialTab} className="mt-5">
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
                <Label className="text-white/70">{t(UI.auth.email, lang)}</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    type="email"
                    dir="ltr"
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
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
              <button
                onClick={() => document.querySelector<HTMLButtonElement>('[data-radix-collection-item][value="register"]')?.click()}
                className="w-full text-center text-xs text-orange-400 hover:text-orange-300"
              >
                {t(UI.auth.noAccount, lang)}
              </button>
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
                onClick={() => document.querySelector<HTMLButtonElement>('[data-radix-collection-item][value="login"]')?.click()}
                className="w-full text-center text-xs text-orange-400 hover:text-orange-300"
              >
                {t(UI.auth.hasAccount, lang)}
              </button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
