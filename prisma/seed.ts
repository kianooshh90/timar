/**
 * Seed script — TDC (Timar Dental Center)
 * Seeds: admin user, site settings, services (Toman), portfolio items, FAQs
 * Run: bunx tsx prisma/seed.ts   (or bun prisma/seed.ts)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SETTINGS: Record<string, unknown> = {
  // ---- General ----
  siteName: "TDC",
  siteNameFull: "Timar Dental Center",
  taglineFa: "مرکز طراحی دیجیتال دندانپزشکی",
  taglineEn: "Digital Dental Design Center",

  // ---- Announcement bar ----
  announcementFa: "اولین کیس کراون-بریج یا ایمپلنت شما رایگان است — همین حالا ارسال کنید ←",
  announcementEn: "Your first crown & bridge or implant case is free — send it now →",
  announcementActive: true,

  // ---- Hero ----
  heroBadgeFa: "خدمات طراحی CAD دندانپزشکی",
  heroBadgeEn: "DENTAL CAD DESIGN SERVICES",
  heroTitleFa: "طراحی CAD دقیق دندانپزشکی، به‌موقع و مطمئن.",
  heroTitleEn: "Precision dental CAD design, on demand.",
  heroSubtitleFa:
    "فایل‌های اسکن STL و دستور کار کیس را برای ما بفرستید؛ طراحی‌های سازگار با 3Shape و exocad را تحویل بگیرید — آماده‌ی ورود مستقیم به روند فرز یا پرینت شما.",
  heroSubtitleEn:
    "Send your STL files and case instructions, get expert 3Shape-compatible CAD/CAM designs back — built to drop straight into your milling or printing workflow.",
  heroStats: JSON.stringify([
    { value: "۲ ساعت", valueEn: "2h", labelFa: "میانگین زمان تحویل", labelEn: "Avg. turnaround" },
    { value: "۸+ سال", valueEn: "8+ yrs", labelFa: "تجربه بازار", labelEn: "Market experience" },
    { value: "۱۰۰٪", valueEn: "100%", labelFa: "کنترل کیفی همه کیس‌ها", labelEn: "Cases QC reviewed" },
  ]),
  heroFormats: "STL · PLY · OCC",
  heroSoftware: "3Shape · exocad · hyperDENT",

  // ---- Process steps ----
  process: JSON.stringify([
    {
      step: "01",
      titleFa: "ثبت کیس",
      titleEn: "Case Received",
      descFa: "فایل‌های اسکن و دستور کار از طریق پنل یا ایمیل دریافت می‌شود.",
      descEn: "STL files and instructions received through the portal or email.",
    },
    {
      step: "02",
      titleFa: "در حال طراحی",
      titleEn: "In Design",
      descFa: "کیس شما بر اساس مارجین‌ها و مشخصات متریال در نرم‌افزارهای CAD طراحی می‌شود.",
      descEn: "Your case is designed against your margins and material specs.",
    },
    {
      step: "03",
      titleFa: "کنترل کیفی",
      titleEn: "QC Review",
      descFa: "هر کیس پیش از تحویل با چک‌لیست QC استاندارد بررسی می‌شود.",
      descEn: "Checked against our standing QC checklist before it's marked ready.",
    },
    {
      step: "04",
      titleFa: "تحویل",
      titleEn: "Delivered",
      descFa: "فایل نهایی در پنل شما و ایمیل‌تان قرار می‌گیرد؛ آماده فرز یا پرینت.",
      descEn: "Final files land in your dashboard, ready to mill or print.",
    },
  ]),

  // ---- Who designs / comparison ----
  whoDesignsFa:
    "طراحی هر کیس توسط متخصصان باتجربه CAD دندانپزشکی انجام می‌شود؛ تیم ثابتی که سلایق شما را یاد می‌گیرد تا با هر کیس، اصلاحات کمتری لازم باشد.",
  whoDesignsEn:
    "Every case is led by experienced dental CAD specialists — the same small team that learns your preferences, so corrections drop with every case you send.",
  compareLeftTitle: "تامین‌کننده معمولی",
  compareLeftTitleEn: "TYPICAL VENDOR",
  compareLeft: JSON.stringify([
    "هر کسی که خالی باشد کیس شما را طراحی می‌کند",
    "آناتومی پیش‌فرض، بازبینی حداقلی",
    "قیمت‌گذاری پشت عبارت «تماس بگیرید»",
    "هر بار طراح جدید، یادگیری دوباره سلیقه شما",
  ]),
  compareRightTitle: "TDC",
  compareRightTitleEn: "TDC",
  compareRight: JSON.stringify([
    "طراحی توسط متخصص باتجربه CAD دندانپزشکی",
    "بررسی با چک‌لیست QC استاندارد",
    "تعرفه شفاف و منتشرشده روی سایت",
    "همان تیم ثابت، در هر کیس",
  ]),

  // ---- Pricing ----
  pricingTitleFa: "تعرفه‌های شفاف، بدون سورپرایز.",
  pricingTitleEn: "Flat per-item pricing, no surprises.",
  pricingSubtitleFa:
    "هر قیمت شامل اصلاحات نامحدود تا رضایت کامل شماست.",
  pricingSubtitleEn: "Every price includes unlimited revisions until you're satisfied.",
  pricingVolumeNoteFa:
    "لابراتوارهایی که ماهانه بیش از ۵۰ یونیت ارسال کنند، مشمول تعرفه همکاری حجمی می‌شوند که پس از مشخص شدن حجم ماهانه به‌صورت اختصاصی اعلام می‌گردد.",
  pricingVolumeNoteEn:
    "Labs sending 50+ units/month qualify for volume pricing, quoted individually once monthly volume is established.",

  // ---- Why us / FAQ ----
  faq: JSON.stringify([
    {
      qFa: "چه کسی کیس من را طراحی می‌کند؟",
      qEn: "Who's actually designing my case?",
      aFa: "تسلط فنی کامل روی مارجین، اکلوژن و آناتومی — هر کیس توسط متخصص باتجربه CAD دندانپزشکی هدایت می‌شود.",
      aEn: "Strong technical command of margins, occlusion, and anatomy — every case is led by an experienced dental CAD specialist.",
    },
    {
      qFa: "با داده‌های بیمار و فایل‌های کیس چطور برخورد می‌کنید؟",
      qEn: "How do you handle patient data and case files?",
      aFa: "فایل‌ها از طریق کانال‌های رمزنگاری‌شده منتقل و فقط تا زمان لازم نگهداری می‌شوند. داده‌های بیمار هرگز در اختیار شخص ثالث قرار نمی‌گیرد.",
      aEn: "Files are transmitted over encrypted connections and retained only as long as needed. We never share patient data with third parties.",
    },
    {
      qFa: "چقدر سریع پاسخ می‌دهید؟",
      qEn: "How fast do you respond?",
      aFa: "پاسخ‌ها همان روز داده می‌شود — هرگز چند روز منتظر پاسخ یک کیس یا پیام نمی‌مانید.",
      aEn: "Questions answered same-day — never a multi-day wait on a case or a message.",
    },
    {
      qFa: "کیفیت طراحی را چطور تضمین می‌کنید؟",
      qEn: "How do you guarantee design quality?",
      aFa: "هر کیس پیش از تحویل، چک‌لیست QC دائمی برای مارجین، نقاط تماس و آناتومی را طی می‌کند.",
      aEn: "Every case runs a standing QC checklist for margins, contacts, and anatomy before it ships.",
    },
    {
      qFa: "با چه فرمت‌هایی کار می‌کنید؟",
      qEn: "What file formats do you work with?",
      aFa: "به‌صورت بومی در 3Shape و exocad کار می‌کنیم. فایل‌های اسکن STL را بفرستید و طراحی‌ها را در فرمت دلخواه شما تحویل بگیرید.",
      aEn: "We work natively in 3Shape and exocad. Send STL scan files, and we return designs in your preferred format.",
    },
    {
      qFa: "چند بار اصلاح رایگان شامل می‌شود؟",
      qEn: "How many revisions are included?",
      aFa: "اصلاحات نامحدود روی هر کیس، بدون هزینه اضافه، تا کاملاً راضی باشید.",
      aEn: "Unlimited revisions on every case, included in the flat price, until you're fully satisfied.",
    },
    {
      qFa: "تحویل فوری (راش) دارید؟",
      qEn: "Do you offer rush turnaround?",
      aFa: "بله — برای کیس‌های معمول کراون-بریج و ایمپلنت، تحویل فوری به‌صورت آپشن پرداختی ارائه می‌شود.",
      aEn: "Yes — same-hour rush is available on standard crown & bridge and implant cases as a paid add-on.",
    },
    {
      qFa: "قرارداد یا حداقل حجم کار لازم است؟",
      qEn: "Is there a contract or minimum volume?",
      aFa: "نه قرارداد، نه حداقل حجم. هفته‌ای یک کیس یا پنجاه کیس در ماه — ظرفیت ما با شما انعطاف دارد.",
      aEn: "No contracts and no minimum volume. Send one case a week or fifty a month.",
    },
    {
      qFa: "برای اولین کیس چه چیزی باید بفرستم؟",
      qEn: "What do I need to send for my first case?",
      aFa: "فایل اسکن (STL)، قوس مقابل، ثبت بایت در صورت لزوم و یادداشت‌های کیس. رسید را تأیید و زمان تحویل را اعلام می‌کنیم.",
      aEn: "Scan files (STL), opposing arch, bite registration if relevant, and your case notes.",
    },
    {
      qFa: "سیستم‌های ایمپلنت پشتیبانی می‌شوند؟",
      qEn: "Which implant systems do you support?",
      aFa: "همه سیستم‌های ایمپلنت اصلی و کتابخانه‌های اسکن‌بادی پشتیبانی می‌شوند — سیستم خود را هنگام ثبت کیس ذکر کنید.",
      aEn: "All major implant systems and scan body libraries are supported — note your system when you submit a case.",
    },
  ]),

  // ---- Talk to us ----
  talkTitleFa: "با ما در تماس باشید",
  talkTitleEn: "Talk To Us",
  talkSubtitleFa: "یک تماس بگیرید، یا فقط سوالتان را بپرسید.",
  talkSubtitleEn: "Book a call, or just ask a question.",

  // ---- Contact ----
  phone1: "09107586343",
  phone2: "09186606709",
  email: "tdctimar@gmail.com",
  instagram: "https://www.instagram.com/timar_dental",
  telegram: "https://t.me/Timar_Dental",
  whatsapp: "",
  addressFa: "کرمانشاه، مرکز تخصصی دندانپزشکی تیمار",
  addressEn: "Kermanshah, Timar Dental Center",
  workingHoursFa: "شنبه تا پنجشنبه، ۹ صبح تا ۸ شب",
  workingHoursEn: "Sat–Thu, 9am–8pm",

  // ---- Footer / legal ----
  footerAboutFa:
    "TDC (Timar Dental Center) — شریک طراحی دیجیتال لابراتوارها و کلینیک‌های دندانپزشکی؛ از کراون-بریج تا فول-آرک.",
  footerAboutEn:
    "TDC (Timar Dental Center) — the digital design partner for dental labs and clinics; from crown & bridge to full-arch.",
  termsFa:
    "این شرایط، استفاده از خدمات طراحی CAD دندانپزشکی TDC را تنظیم می‌کند.\n\n۱. خدمات: طراحی CAD خارج‌سپاری‌شده برای لابراتوارها و کلینیک‌ها؛ کراون-بریج، ایمپلنت، رمووابل، فول-آرک و طراحی لبخند دیجیتال.\n\n۲. قیمت و پرداخت: صورتحساب به‌صورت هر قلم و بر اساس کارتعرفه منتشرشده صادر می‌شود. پرداخت پس از تأیید کیس هماهنگ می‌گردد؛ تسویه ماهانه پس از ۳ پرداخت سر‌وقت در دسترس است.\n\n۳. اصلاحات: نامحدود و رایگان تا رضایت کامل. پس از شروع کار، وجه بازگشت داده نمی‌شود و راه‌حل، اصلاح است.\n\n۴. مسئولیت: صلاحیت بالینی نهایی بر عهده دندانپزشک معالج و لابراتوار ارسال‌کننده است.\n\n۵. تماس: tdctimar@gmail.com",
  privacyFa:
    "TDC توضیح می‌دهد چه اطلاعاتی جمع‌آوری می‌کند و چگونه استفاده می‌شود.\n\n۱. اطلاعات جمع‌آوری‌شده: اطلاعات تماس (نام، ایمیل، تلفن، نام لابراتوار)، فایل‌ها و دستور کارهای ارسالی از طریق سایت.\n\n۲. اطلاعات پرداخت: از طریق این وب‌سایت اطلاعات کارت بانکی جمع‌آوری نمی‌شود.\n\n۳. حقوق شما: بر اساس قوانین جاری، حق دسترسی، اصلاح و حذف داده‌ها برای شما محفوظ است.\n\n۴. تماس: tdctimar@gmail.com",
  refundFa:
    "اصلاحات نامحدود روی هر کیس. پس از شروع طراحی، وجهی بازگشت داده نمی‌شود.\n\n۱. زمان پرداخت: پس از تأیید کیس هماهنگ می‌شود، نه هنگام ارسال.\n\n۲. اصلاحات: نامحدود، رایگان، تا رضایت شما.\n\n۳. پس از شروع کار: راه‌حل، اصلاح است نه بازگشت وجه.\n\n۴. لغو قبل از شروع: با ایمیل به tdctimar@gmail.com — کیس‌های شروع‌نشده رایگان لغو می‌شوند.",
  termsEn:
    "These terms govern your use of TDC dental CAD design services.\n\n1. Services: Outsourced dental CAD design for labs and clinics: crown & bridge, implant, removable, full-arch, digital smile planning.\n\n2. Pricing & payment: Billed flat, per item, per our published rate card. Payment is arranged once a case is confirmed.\n\n3. Revisions & refunds: Unlimited revisions included. No refunds once design work begins.\n\n4. Liability: Final clinical suitability remains the responsibility of the treating dentist and submitting lab.\n\n5. Contact: tdctimar@gmail.com",
  privacyEn:
    "TDC explains what we collect and how it's used.\n\n1. Information we collect: Contact info (name, email, phone, lab name), case files and instructions submitted through the site.\n\n2. Payment information: We do not collect card or bank details through this website.\n\n3. Your rights: Access, correction, deletion rights depending on your location.\n\n4. Contact: tdctimar@gmail.com",
  refundEn:
    "Unlimited revisions on every case. No refunds once design work begins.\n\n1. Payment timing: Arranged once a case is confirmed — not at submission.\n\n2. Revisions: Unlimited, free, until you're satisfied.\n\n3. Once work starts: The remedy is a revision, not a refund.\n\n4. Cancel before work begins: Email tdctimar@gmail.com — free of charge.",
};

const SERVICES = [
  { category: "CROWN_BRIDGE", name: "کاپینگ / ساده", nameEn: "Coping / Simple", price: 1200000, unit: "/unit", turnaround: "۱ تا ۲ ساعت", sortOrder: 1 },
  { category: "CROWN_BRIDGE", name: "فول کانتور", nameEn: "Full Contour", price: 1500000, unit: "/unit", turnaround: "۱ تا ۲ ساعت", sortOrder: 2 },
  { category: "CROWN_BRIDGE", name: "ونیر / لایه‌ای", nameEn: "Veneer / Layered", price: 2500000, unit: "/unit", turnaround: "۲ تا ۴ ساعت", sortOrder: 3 },
  { category: "IMPLANT", name: "اباتمنت اختصاصی", nameEn: "Custom Abutment Design", price: 2800000, unit: "/unit", turnaround: "۱ تا ۲ ساعت", sortOrder: 4 },
  { category: "IMPLANT", name: "کراون روی اباتمنت", nameEn: "Crown Over Abutment", price: 3500000, unit: "/unit", turnaround: "۱ تا ۲ ساعت", sortOrder: 5 },
  { category: "REMOVABLE", name: "دست‌دندان کامل", nameEn: "Complete Denture Design", price: 12000000, unit: "/arch", turnaround: "۱ روز کاری", sortOrder: 6 },
  { category: "REMOVABLE", name: "دست‌دندان پارسیل", nameEn: "Partial Denture Design", price: 9500000, unit: "/arch", turnaround: "۱ روز کاری", sortOrder: 7 },
  { category: "FULL_ARCH", name: "طراحی هایبرید", nameEn: "Hybrid Design", price: 38000000, unit: "/arch", turnaround: "۴ تا ۶ ساعت", sortOrder: 8 },
  { category: "FULL_ARCH", name: "بار / زیرساخت", nameEn: "Bar / Substructure Design", price: 15000000, unit: "/arch", turnaround: "۴ تا ۶ ساعت", sortOrder: 9 },
  { category: "DSD", name: "برنامه‌ریزی و طراحی لبخند", nameEn: "Case Planning & Visualization", price: 8000000, unit: "/case", turnaround: "۱ تا ۲ ساعت", sortOrder: 10 },
];

const PORTFOLIO = [
  {
    title: "کراون‌های تمام زیرکونیا",
    titleEn: "Full Zirconia Crowns",
    description: "کانتور مونولیتیک با آناتومی طبیعی و نقاط تماس تنظیم‌شده",
    descriptionEn: "Monolithic contour with natural anatomy and adjusted contacts",
    category: "CROWN_BRIDGE",
    badge: "زیرکونیا",
    images: JSON.stringify(["/images/portfolio/zirconia-crowns.png"]),
    files: JSON.stringify([
      { path: "/samples/zirconia-crowns-sample.stl", name: "zirconia-crowns-sample.stl", size: 84213 },
    ]),
    sortOrder: 1,
  },
  {
    title: "کراون پیچ‌شونده ایمپلنت",
    titleEn: "Screw-Retained Crown",
    description: "کانتور آناتومیک روی بیس تیتانیومی با دسترسی پیچ ایده‌آل",
    descriptionEn: "Anatomic contour on titanium base with ideal screw access",
    category: "IMPLANTS",
    badge: "ایمپلنت",
    images: JSON.stringify(["/images/portfolio/screw-retained-crown.png"]),
    files: JSON.stringify([
      { path: "/samples/screw-retained-crown-sample.stl", name: "screw-retained-crown-sample.stl", size: 64021 },
    ]),
    sortOrder: 2,
  },
  {
    title: "بریج سه‌ unit زیرکونیا",
    titleEn: "3-Unit Zirconia Bridge",
    description: "طراحی کانکتور چند‌unit با استحکام و زیبایی",
    descriptionEn: "Multi-unit connector design with strength and esthetics",
    category: "CROWN_BRIDGE",
    badge: "بریج",
    images: JSON.stringify(["/images/portfolio/zirconia-bridge.png"]),
    files: JSON.stringify([
      { path: "/samples/zirconia-bridge-sample.stl", name: "zirconia-bridge-sample.stl", size: 98340 },
    ]),
    sortOrder: 3,
  },
  {
    title: "ست‌آپ دست‌دندان دیجیتال",
    titleEn: "Digital Denture Setup",
    description: "چیدمان کامل دندان‌ها روی قوس پایین با پایه دیجیتال",
    descriptionEn: "Full arch tooth arrangement with digital base design",
    category: "REMOVABLE",
    badge: "رمووابل",
    images: JSON.stringify(["/images/portfolio/digital-denture.png"]),
    files: JSON.stringify([
      { path: "/samples/digital-denture-sample.stl", name: "digital-denture-sample.stl", size: 129876 },
    ]),
    sortOrder: 4,
  },
  {
    title: "طراحی لبخند دیجیتال",
    titleEn: "Digital Smile Design",
    description: "برنامه‌ریزی و شبیه‌سازی لبخند پیش از شروع درمان",
    descriptionEn: "Case planning & smile visualization before treatment",
    category: "DSD",
    badge: "DSD",
    images: JSON.stringify(["/images/portfolio/smile-design.png"]),
    files: JSON.stringify([
      { path: "/samples/smile-design-plan.pdf", name: "smile-design-plan.pdf", size: 45012 },
    ]),
    sortOrder: 5,
  },
  {
    title: "فول-آرک هایبرید آل-آن-ایکس",
    titleEn: "Full-Arch All-on-X Hybrid",
    description: "پروتز هایبرید با زیرساخت بار تیتانیومی",
    descriptionEn: "Hybrid prosthesis with titanium bar substructure",
    category: "FULL_ARCH",
    badge: "فول-آرک",
    images: JSON.stringify(["/images/portfolio/full-arch.png"]),
    files: JSON.stringify([
      { path: "/samples/full-arch-hybrid-sample.stl", name: "full-arch-hybrid-sample.stl", size: 240512 },
    ]),
    sortOrder: 6,
  },
  {
    title: "اباتمنت اختصاصی تیتانیوم",
    titleEn: "Custom Titanium Abutment",
    description: "اباتمنت سفارشی با پروفایل خروجی بهینه برای بافت نرم",
    descriptionEn: "Custom abutment with optimized emergence profile",
    category: "IMPLANTS",
    badge: "ایمپلنت",
    images: JSON.stringify(["/images/site/abutment.png"]),
    files: JSON.stringify([
      { path: "/samples/custom-abutment-sample.stl", name: "custom-abutment-sample.stl", size: 51230 },
    ]),
    sortOrder: 7,
  },
];

async function main() {
  console.log("🌱 Seeding TDC database...");

  // Admin user
  const adminPass = await bcrypt.hash("timar1234", 10);
  await db.user.upsert({
    where: { email: "tdctimar@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      email: "tdctimar@gmail.com",
      password: adminPass,
      name: "TDC Admin",
      role: "ADMIN",
      labName: "Timar Dental Center",
      referralCode: "TDC-ADMIN",
    },
  });

  // Demo lab user
  const labPass = await bcrypt.hash("lab1234", 10);
  await db.user.upsert({
    where: { email: "lab@demo.ir" },
    update: {},
    create: {
      email: "lab@demo.ir",
      password: labPass,
      name: "کاربر نمونه",
      role: "LAB",
      labName: "لابراتوار نمونه",
      phone: "09120000000",
      referralCode: "TDC-LAB01",
    },
  });

  // Settings
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: String(value) },
    });
  }

  // Services (only if empty)
  const serviceCount = await db.service.count();
  if (serviceCount === 0) {
    await db.service.createMany({ data: SERVICES });
  }

  // Portfolio (only if empty)
  const pCount = await db.portfolioItem.count();
  if (pCount === 0) {
    for (const p of PORTFOLIO) {
      await db.portfolioItem.create({ data: p });
    }
  }

  // Placeholder sample files for downloads
  const fs = await import("fs");
  fs.mkdirSync("/home/z/my-project/public/samples", { recursive: true });
  const sampleNote =
    "TDC — Timar Dental Center\nنمونه فایل خروجی طراحی CAD\nاین یک فایل نمونه برای نمایش عملکرد دانلود است.\n";
  for (const f of [
    "zirconia-crowns-sample.stl",
    "screw-retained-crown-sample.stl",
    "zirconia-bridge-sample.stl",
    "digital-denture-sample.stl",
    "full-arch-hybrid-sample.stl",
    "custom-abutment-sample.stl",
  ]) {
    const p = `/home/z/my-project/public/samples/${f}`;
    if (!fs.existsSync(p)) fs.writeFileSync(p, sampleNote);
  }
  const pdfPath = "/home/z/my-project/public/samples/smile-design-plan.pdf";
  if (!fs.existsSync(pdfPath)) fs.writeFileSync(pdfPath, sampleNote);

  console.log("✅ Seed complete");
  console.log("   Admin: tdctimar@gmail.com / timar1234");
  console.log("   Demo lab: lab@demo.ir / lab1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
