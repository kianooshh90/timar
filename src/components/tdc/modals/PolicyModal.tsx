"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ShieldCheck, RefreshCcw } from "lucide-react";
import { useTdc, st } from "../store";
import { t, UI } from "../i18n";

export function PolicyModal() {
  const { site, lang, overlay, closeOverlay } = useTdc();
  const open = overlay?.type === "policy";
  const tab = overlay?.type === "policy" ? overlay.tab ?? "terms" : "terms";
  const s = site?.settings;

  const tabs = [
    { key: "terms", label: lang === "fa" ? "شرایط خدمات" : "Terms", icon: FileText, body: lang === "fa" ? s?.termsFa : s?.termsEn },
    { key: "privacy", label: lang === "fa" ? "حریم خصوصی" : "Privacy", icon: ShieldCheck, body: lang === "fa" ? s?.privacyFa : s?.privacyEn },
    { key: "refund", label: lang === "fa" ? "اصلاحات" : "Refund", icon: RefreshCcw, body: lang === "fa" ? s?.refundFa : s?.refundEn },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeOverlay()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto thin-scroll border-white/10 bg-[#101318] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {lang === "fa" ? "قوانین و مقررات TDC" : "TDC Policies"}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={tab}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            {tabs.map((tab2) => (
              <TabsTrigger
                key={tab2.key}
                value={tab2.key}
                className="gap-1.5 text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300"
              >
                <tab2.icon className="h-3.5 w-3.5" />
                {tab2.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab2) => (
            <TabsContent key={tab2.key} value={tab2.key} className="mt-4">
              <div className="whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-8 text-white/70">
                {tab2.body || t(UI.common.soon, lang)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-center text-[11px] text-white/30">{s?.email}</p>
      </DialogContent>
    </Dialog>
  );
}
