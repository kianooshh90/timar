import type { Lang } from "./store";

/** UI chrome strings (non-DB texts) */
export const UI = {
  nav: {
    how: { fa: "روند کار", en: "How It Works" },
    services: { fa: "خدمات", en: "Services" },
    who: { fa: "تیم طراحی", en: "Who Designs" },
    pricing: { fa: "تعرفه‌ها", en: "Pricing" },
    vault: { fa: "نمونه‌کارها", en: "Case Vault" },
    faq: { fa: "سوالات", en: "FAQ" },
    contact: { fa: "تماس", en: "Contact" },
    login: { fa: "ورود لابراتوار", en: "Lab Login" },
    panel: { fa: "پنل مدیریت", en: "Admin Panel" },
    dashboard: { fa: "پنل لابراتوار", en: "Lab Panel" },
    sendCase: { fa: "ارسال کیس", en: "Upload Case" },
    logout: { fa: "خروج", en: "Logout" },
  },
  hero: {
    ctaPrimary: { fa: "ارسال اولین کیس رایگان ←", en: "Upload Your Free First Case →" },
    ctaSecondary: { fa: "مشاهده روند کار ↓", en: "See how it works ↓" },
    formats: { fa: "فرمت‌ها", en: "FORMATS" },
    software: { fa: "نرم‌افزارها", en: "SOFTWARE" },
    liveQueue: { fa: "صف کیس‌ها — زنده", en: "Case Queue — live" },
    inQueue: { fa: "در صف", en: "in queue" },
  },
  process: {
    kicker: { fa: "روند کار", en: "The Process" },
    title: { fa: "از فایل کیس تا طراحی نهایی.", en: "From case file to finished design." },
    subtitle: { fa: "هر مرحله یک کار مشخص انجام می‌دهد — روی هر کدام بزنید.", en: "Each step does something — tap one to try it." },
  },
  services: {
    kicker: { fa: "خدمات ما", en: "What We Design" },
    title: { fa: "پوشش کامل کیس‌ها، یک شریک طراحی.", en: "Full case coverage, one design partner." },
    viewAll: { fa: "مشاهده همه خدمات با تعرفه ←", en: "View all services with pricing →" },
    from: { fa: "شروع از", en: "from" },
  },
  who: {
    kicker: { fa: "چه کسی کیس شما را طراحی می‌کند", en: "WHO'S ACTUALLY DESIGNING YOUR CASE" },
    drag: { fa: "برای مقایسه بکشید", en: "DRAG TO COMPARE" },
    sendCase: { fa: "یک کیس بفرستید، تفاوت را ببینید ←", en: "Send a case, see the difference →" },
  },
  pricing: {
    kicker: { fa: "تعرفه‌ها", en: "Pricing" },
    calculator: { fa: "ماشین‌حساب هزینه", en: "Cost calculator" },
    category: { fa: "دسته‌بندی", en: "CATEGORY" },
    type: { fa: "نوع خدمت", en: "TYPE" },
    units: { fa: "تعداد", en: "UNITS" },
    estimated: { fa: "هزینه تخمینی", en: "Estimated Cost" },
    turnaround: { fa: "زمان تحویل", en: "Turnaround" },
    rateCardTitle: { fa: "کارتعرفه کامل را به‌صورت PDF می‌خواهید؟", en: "Want the full rate card as a PDF?" },
    rateCardSub: { fa: "ایمیل خود را وارد کنید تا برای تیم‌تان بفرستیم.", en: "Enter your email and we'll send it straight to your inbox." },
    sendMe: { fa: "برایم بفرست", en: "Send it to me" },
    includesRevisions: { fa: "شامل اصلاحات نامحدود", en: "Includes unlimited revisions" },
  },
  vault: {
    kicker: { fa: "گالری نمونه‌کار", en: "Case Vault" },
    title: { fa: "نمونه کیس‌های واقعی.", en: "Browse real case examples." },
    all: { fa: "همه", en: "All" },
    download: { fa: "دانلود فایل طرح", en: "Download design file" },
    view: { fa: "مشاهده جزئیات", en: "View details" },
    files: { fa: "فایل‌های قابل دانلود", en: "Downloadable files" },
    like: { fa: "خوشتان آمد؟", en: "Like what you see?" },
    sendFirst: { fa: "اولین کیستان را بفرستید ←", en: "Send your first case →" },
    noFiles: { fa: "بدون فایل دانلودی", en: "No downloadable files" },
  },
  faq: {
    kicker: { fa: "چرا TDC", en: "Why TDC" },
    title: { fa: "چه چیزی ما را متمایز می‌کند.", en: "What sets us apart." },
    subtitle: { fa: "روی هر سوال بزنید تا باز شود.", en: "Tap a question to expand it." },
  },
  contact: {
    book: { fa: "رزرو تماس", en: "Schedule a call" },
    bookDesc: { fa: "درباره حجم کار، زمان تحویل یا نوع کیس خود صحبت کنیم. ۱۵ دقیقه، بدون تعارف.", en: "Talk through your volume, turnaround needs, or a specific case type. 15 minutes, no pressure." },
    bookBtn: { fa: "زمان‌بندی تماس", en: "Book a time" },
    inquiry: { fa: "ارسال استعلام", en: "Send an inquiry" },
    name: { fa: "نام", en: "Name" },
    email: { fa: "ایمیل", en: "Email" },
    phone: { fa: "تلفن (اختیاری)", en: "Phone (optional)" },
    topic: { fa: "موضوع", en: "Topic" },
    topics: {
      GENERAL: { fa: "سوال عمومی", en: "General question" },
      BULK: { fa: "قیمت همکاری حجمی", en: "Bulk / partnership pricing" },
      SOFTWARE: { fa: "سازگاری نرم‌افزار", en: "Software compatibility" },
      OTHER: { fa: "سایر", en: "Something else" },
    },
    message: { fa: "پیام شما", en: "Your message" },
    send: { fa: "ارسال استعلام", en: "Send inquiry" },
    sent: { fa: "استعلام شما ثبت شد؛ خیلی زود پاسخ می‌دهیم.", en: "Your inquiry was received — we'll reply shortly." },
  },
  cta: {
    title: { fa: "آماده ارسال اولین کیس هستید؟", en: "Ready to send your first case?" },
    sub: { fa: "بیشتر لابراتوارها با یک کیس آزمایشی شروع می‌کنند.", en: "Most labs start with a single test case before scaling up." },
    btn: { fa: "ارسال کیس ←", en: "Upload Case →" },
  },
  auth: {
    login: { fa: "ورود", en: "Login" },
    register: { fa: "ثبت‌نام لابراتوار", en: "Lab Registration" },
    email: { fa: "ایمیل", en: "Email" },
    password: { fa: "رمز عبور", en: "Password" },
    name: { fa: "نام و نام خانوادگی", en: "Full name" },
    labName: { fa: "نام لابراتوار / کلینیک", en: "Lab / Clinic name" },
    city: { fa: "شهر", en: "City" },
    loginBtn: { fa: "ورود به حساب", en: "Sign in" },
    registerBtn: { fa: "ایجاد حساب لابراتوار", en: "Create lab account" },
    noAccount: { fa: "حساب ندارید؟ ثبت‌نام لابراتوار", en: "No account? Register your lab" },
    hasAccount: { fa: "قبلاً ثبت‌نام کرده‌اید؟ ورود", en: "Already registered? Login" },
    registerHint: {
      fa: "با ثبت‌نام می‌توانید کیس ارسال کنید، وضعیت طراحی را زنده ببینید و فایل‌های نهایی را دریافت کنید.",
      en: "Register to submit cases, track design status live, and receive final files.",
    },
  },
  admin: {
    title: { fa: "پنل مدیریت TDC", en: "TDC Admin Panel" },
    dashboard: { fa: "داشبورد", en: "Dashboard" },
    cases: { fa: "کیس‌ها", en: "Cases" },
    portfolio: { fa: "نمونه‌کارها", en: "Portfolio" },
    services: { fa: "خدمات و تعرفه", en: "Services & Pricing" },
    inquiries: { fa: "استعلام‌ها", en: "Inquiries" },
    texts: { fa: "متون سایت", en: "Site Texts" },
    subscribers: { fa: "مشترکین", en: "Subscribers" },
    save: { fa: "ذخیره", en: "Save" },
    saved: { fa: "ذخیره شد ✓", en: "Saved ✓" },
    add: { fa: "افزودن", en: "Add" },
    edit: { fa: "ویرایش", en: "Edit" },
    delete: { fa: "حذف", en: "Delete" },
    confirmDelete: { fa: "مطمئن هستید؟", en: "Are you sure?" },
    cancel: { fa: "انصراف", en: "Cancel" },
  },
  lab: {
    title: { fa: "پنل لابراتوار", en: "Lab Panel" },
    newCase: { fa: "کیس جدید", en: "New Case" },
    myCases: { fa: "کیس‌های من", en: "My Cases" },
    profile: { fa: "پروفایل", en: "Profile" },
    welcome: { fa: "خوش آمدید", en: "Welcome" },
  },
  status: {
    RECEIVED: { fa: "دریافت شد", en: "Received" },
    IN_DESIGN: { fa: "در حال طراحی", en: "In Design" },
    QC: { fa: "کنترل کیفی", en: "QC Review" },
    DELIVERED: { fa: "تحویل شد", en: "Delivered" },
    CANCELLED: { fa: "لغو شد", en: "Cancelled" },
  },
  common: {
    toman: { fa: "تومان", en: "Toman" },
    loading: { fa: "در حال بارگذاری…", en: "Loading…" },
    error: { fa: "خطایی رخ داد. دوباره تلاش کنید.", en: "Something went wrong. Try again." },
    optional: { fa: "اختیاری", en: "optional" },
    close: { fa: "بستن", en: "Close" },
    uploadDrop: { fa: "فایل‌ها را اینجا رها کنید یا کلیک کنید", en: "Drop files here or click" },
    uploading: { fa: "در حال آپلود", en: "Uploading" },
    uploaded: { fa: "آپلود شد", en: "Uploaded" },
    remove: { fa: "حذف", en: "Remove" },
    bytes: { fa: "بایت", en: "B" },
    messages: { fa: "پیام‌ها", en: "Messages" },
    sendMsg: { fa: "ارسال پیام", en: "Send" },
    noData: { fa: "موردی نیست", en: "Nothing here yet" },
    soon: { fa: "به‌زودی", en: "Coming soon" },
  },
} as const;

export function t(entry: { fa: string; en: string } | undefined, lang: Lang): string {
  if (!entry) return "";
  return lang === "fa" ? entry.fa : entry.en;
}

export const CATEGORIES: Record<string, { fa: string; en: string }> = {
  CROWN_BRIDGE: { fa: "کراون و بریج", en: "Crown & Bridge" },
  IMPLANT: { fa: "ایمپلنت", en: "Implant" },
  REMOVABLE: { fa: "رمووابل", en: "Removable" },
  FULL_ARCH: { fa: "فول-آرک / آل-آن-ایکس", en: "Full-Arch / All-on-X" },
  DSD: { fa: "طراحی لبخند دیجیتال", en: "Digital Smile Design" },
};

export const VAULT_FILTERS: { key: string; label: { fa: string; en: string } }[] = [
  { key: "ALL", label: { fa: "همه", en: "All" } },
  { key: "IMPLANTS", label: { fa: "ایمپلنت", en: "Implants" } },
  { key: "CROWN_BRIDGE", label: { fa: "کراون و بریج", en: "Crown & Bridge" } },
  { key: "REMOVABLE", label: { fa: "رمووابل", en: "Removable" } },
  { key: "FULL_ARCH", label: { fa: "فول-آرک", en: "Full-Arch" } },
  { key: "DSD", label: { fa: "طراحی لبخند", en: "Smile Design" } },
];

export function fmtToman(value: number, lang: Lang): string {
  if (lang === "fa") {
    return `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
  }
  return `${new Intl.NumberFormat("en-US").format(value)} T`;
}

export function fmtBytes(bytes: number, lang: Lang): string {
  if (bytes < 1024) return `${bytes} ${lang === "fa" ? "بایت" : "B"}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fmtDate(iso: string, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
