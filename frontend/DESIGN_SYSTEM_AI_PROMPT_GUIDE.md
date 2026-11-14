# 🎨 DataNarrator — UI Design System & AI Master Prompt Guide
> **مرجع نظام التصميم وبرومبت الذكاء الاصطناعي الشامل لمشروع DataNarrator**  
> هذا الدليل مصمم بالكامل بالاعتماد على كود وتصميم الواجهات الفعلي الموجود في المشروع. يمكنك نسخ البرومبت الموحد وإعطاؤه لأي نموذج ذكاء اصطناعي (مثل ChatGPT, Claude, v0, Cursor, Gemini) للحصول دائماً على نفس التصميم بدقة 100% وبدون أي تباين.

---

## 📋 فهرس الدليل | Table of Contents
1. [البرومبت الماستر الجاهز للنسخ (Copy-Paste AI System Prompt)](#1-البرومبت-الماستر-الجاهز-للنسخ-copy-paste-master-prompt)
2. [فلسفة وهوية التصميم (Design Identity & Mood)](#2-فلسفة-وهوية-التصميم-design-identity--mood)
3. [لوحة الألوان الدقيقة (Exact Color Palette Matrix)](#3-لوحة-الألوان-الدقيقة-exact-color-palette-matrix)
4. [مقياس الخطوط والنصوص (Typography & Hierarchy)](#4-مقياس-الخطوط-والنصوص-typography--hierarchy)
5. [الهيكل والشبكة وتخطيط الصفحة (Layout & Structural Layout)](#5-الهيكل-والشبكة-وتخطيط-الصفحة-layout--structural-layout)
6. [الخلفية المميزة والعناصر الديكورية (Signature Background Atmosphere)](#6-الخلفية-المميزة-والعناصر-الديكورية-signature-background-atmosphere)
7. [كتالوج المكونات الأساسية بالكود (Component Archetypes & Code)](#7-كتالوج-المكونات-الأساسية-بالكود-component-archetypes)
8. [قواعد الصرامة والممنوعات للذكاء الاصطناعي (AI Guardrails & Negative Prompts)](#8-قواعد-الصرامة-والممنوعات-للذكاء-الاصطناعي-ai-guardrails)
9. [أمثلة طلب صفحات جديدة (Few-Shot Prompts for New Screens)](#9-أمثلة-طلب-صفحات-جديدة-few-shot-prompts)

---

## 1. البرومبت الماستر الجاهز للنسخ (Copy-Paste Master Prompt)

> **💡 طريقة الاستخدام:**  
> انسخ النص أدناه وضعه في بداية أي محادثة مع أي AI، أو في خانة **Custom Instructions / System Prompt** في ChatGPT أو **Project Instructions** في Claude أو ملف `.cursorrules` في Cursor:

```markdown
You are an expert Frontend Design System Engineer. You must strictly adhere to the "DataNarrator" Design System for all UI code, components, and layouts you generate. Never deviate from these exact tokens, colors, rounded values, and visual language.

### 🎯 BRAND IDENTITY: DataNarrator
DataNarrator is an intelligent data-storytelling and visualization platform. The design aesthetic is "Warm Tech": a clean, breathable, white-dominant dashboard infused with subtle glassmorphism, soft organic peach warmth, technical blueprint illustrations, and refined corporate blue & golden amber accents.

### 🎨 COLOR MATRIX (EXACT HEX & TAILWIND TOKENS)
- Main App Background: Pure White `#FFFFFF` (`bg-white`)
- Primary Brand Navy: `#1a3a5c`
  - Used for category eyebrows, page headers, active nav background tint (`bg-[#1a3a5c]/10 text-[#1a3a5c]`), and primary badges.
- Primary Action Blue (Buttons): `#4f8ec5` (Hover: `#407caf`)
  - Used for primary CTA buttons (`bg-[#4f8ec5] text-white hover:bg-[#407caf] shadow-sm`).
- Accent Sky / Cyan: `#4a9fc0`
  - Used for card hover borders (`hover:border-[#4a9fc0]/50`), analysis feature icon (`text-[#4a9fc0] bg-[#4a9fc0]/10`).
- Brand Golden Mustard / Amber:
  - Logo Accent: `#d88d1f` (`text-[#d88d1f]` font-bold tracking-tight)
  - Feature Icon Accent: `#b5762f` (`text-[#b5762f] bg-[#b5762f]/10`)
  - Stepper / Number Badges: `#feb851` (`bg-[#feb851] text-white rounded-full size-8 font-bold`)
  - Gradient Badge Start: `from-[#b5762f]/15 to-[#4a9fc0]/15`
- Atmospheric Warm Peach (Organic Blob): `#FCEDDF` (Used in central organic background SVG).
- Blueprint Schematic Stroke: `#d3dde7` (Used for 2px stroke background SVGs: charts, databases, circuit lines, 5x5 dot grids).
- Neutrals & Text:
  - Headings / Titles: `text-slate-800` (`font-bold` or `font-semibold`)
  - Body / Subtitles: `text-slate-500` (`text-sm leading-relaxed`)
  - Inactive Nav items: `text-slate-600` (`hover:bg-slate-100 hover:text-slate-700`)
  - Neutral Borders: `border-slate-200/80` or `border-slate-200`
  - Glass Card Background: `bg-white/70 backdrop-blur-sm` (Hover: `hover:bg-white hover:shadow-md`)

### 📐 SPATIAL & CORNER RADIUS SCALE
- Large Cards / Containers: `rounded-2xl` (16px) with `border border-slate-200/80 bg-white/70 p-5` or `p-8 backdrop-blur-sm`
- Medium Containers / Stepper items: `rounded-xl` (12px) with `border border-slate-200/70 bg-white/60 p-3`
- Buttons & Nav Links: `rounded-lg` (8px-10px)
- Circular Badges & Pills: `rounded-full`

### 🧱 PAGE LAYOUT RULES
1. Two-Column Dashboard Shell:
   - Sidebar: Collapsible (`w-64` expanded, `w-16` collapsed) on the left, border-r `border-slate-200`, white background.
   - Main content: `relative flex-1 overflow-y-auto bg-white min-h-screen`.
2. Content Container:
   - Always centered with `relative mx-auto flex max-w-4xl flex-col gap-8 px-8 py-10`.
3. Background Layer:
   - Always include `<DecorativeBackground />` as an absolute pointer-events-none layer behind main content with the peach blob (`#FCEDDF`) and light blueprint strokes (`#d3dde7`).

### ❌ STRICT NEGATIVE RULES (DO NOT USE)
- DO NOT use dark purple, violet, indigo, or emerald green accents.
- DO NOT use pure black `#000000` text (always use `text-slate-800` or `#1a3a5c`).
- DO NOT use harsh black drop shadows (use subtle `shadow-sm` and `hover:shadow-md`).
- DO NOT create sharp, square corners (everything uses `rounded-lg`, `rounded-xl`, or `rounded-2xl`).
- DO NOT make solid opaque gray cards. Cards MUST have the translucent glass look: `bg-white/70 backdrop-blur-sm border border-slate-200/80`.
- Icons must strictly be from `lucide-react`.
```

---

## 2. فلسفة وهوية التصميم (Design Identity & Mood)

| الخاصية | القيمة المعتمدة في DataNarrator | الشرح والتطبيق |
| :--- | :--- | :--- |
| **اسم المنصة** | **DataNarrator** | منصة سرد قصص البيانات وتحويل الأرقام إلى رسوم بيانية وتقارير آلية. |
| **طابع التصميم (Mood)** | **Warm Tech / Human Analytics** | يجمع بين احترافية أدوات البيانات ودقة التحليل، مع دفء بصري إنساني بعيداً عن برود لوحات التحكم التقليدية. |
| **النمط البصري الأساسي** | **Soft Glassmorphism on Clean White** | خلفية بيضاء نقية تحتوي بقعة أورجانيك بلون الخوخ الدافئ، تعلوها بطاقات شبه شفافة ناعمة `backdrop-blur-sm bg-white/70`. |
| **نمط الرسوم التوضيحية** | **Blueprint Schematic Strokes** | خطوط هيكلية رفيعة بسمك `strokeWidth="2"` بلون أزرق رمادي ثلجي `#d3dde7` تمثل مخططات داتا بيس ورسوم بيانية وشبكات نقطية `DotGrid`. |
| **مكتبة الأيقونات** | **Lucide React** | أحجام موحدة: `size-3.5` للبادجات، `size-4` للأزرار والروابط، `size-5` لأزرار التحكم، `size-6` لأيقونات البطاقات الرئيسية. |

---

## 3. لوحة الألوان الدقيقة (Exact Color Palette Matrix)

### الألوان الوظيفية والرئيسية (Semantic Colors)

| اسم اللون | كود HEX | كود Tailwind التقريبي | الوظيفة الدقيقة في الواجهة |
| :--- | :--- | :--- | :--- |
| **Brand Deep Navy** | `#1a3a5c` | `text-[#1a3a5c]` / `bg-[#1a3a5c]` | العناوين الترحيبية الصغرى، البادجات، عنصر القائمة النشط (`bg-[#1a3a5c]/10 text-[#1a3a5c]`)، أيقونة الرسم البياني. |
| **Action Blue** | `#4f8ec5` | `bg-[#4f8ec5]` | زر الإجراء الأساسي (CTA Button) مثل "Upload dataset". |
| **Action Blue (Hover)** | `#407caf` | `hover:bg-[#407caf]` | حالة التحويم لزر الإجراء الرئيسي. |
| **Sky / Cyan Accent** | `#4a9fc0` | `text-[#4a9fc0]` / `border-[#4a9fc0]/50` | حدود البطاقات عند الـ hover، أيقونة التحليل الآلي، الطرف الثاني لتدرج شريط الـ Badge. |
| **Logo Amber** | `#d88d1f` | `text-[#d88d1f]` | لون شعار المنصة DataNarrator في أعلى القائمة الجانبية. |
| **Warm Bronze / Amber** | `#b5762f` | `text-[#b5762f]` | أيقونة رفع البيانات (`Upload dataset`)، والطرف الأول لتدرج بادج التحفيز. |
| **Golden Yellow** | `#feb851` | `bg-[#feb851]` | دوائر ترقيم الخطوات (1, 2, 3) في سكشن الـ Hero. |
| **Atmospheric Peach** | `#FCEDDF` | `fill-[#FCEDDF]` | بقعة الأورجانيك الناعمة الكبيرة في منتصف الخلفية الديكورية. |
| **Blueprint Ice Slate** | `#d3dde7` | `text-[#d3dde7]` | خطوط المخططات البيانية الهندسية وشبكات النقاط 5×5 في الخلفية. |

### درجات الرمادي والنصوص (Neutral Scale)

| العنصر | القيمة المعتمدة | Tailwind Class |
| :--- | :--- | :--- |
| **خلفية الصفحة الأساسية** | أبيض ناصع | `bg-white` |
| **خلفية البطاقات Glass** | أبيض شفاف 70% | `bg-white/70 backdrop-blur-sm` |
| **خلفية البطاقات الداخلية** | أبيض شفاف 60% | `bg-white/60` |
| **العناوين الرئيسية** | كحلي رمادي داكن | `text-slate-800` |
| **النصوص التوضيحية والفرعية**| رمادي متوسط مقروء | `text-slate-500` |
| **عناصر القوائم غير النشطة**| رمادي معتدل | `text-slate-600 hover:bg-slate-100 hover:text-slate-700` |
| **الحدود الخفيفة (Borders)** | رمادي ناعم هادئ | `border-slate-200` أو `border-slate-200/80` |

---

## 4. مقياس الخطوط والنصوص (Typography & Hierarchy)

| الرتبة / العنصر | الحجم والوزن (Tailwind) | اللون | مثال الاستخدام |
| :--- | :--- | :--- | :--- |
| **Brand Logo** | `text-2xl font-bold tracking-tight` | `#d88d1f` | شعار "DataNarrator" في الـ Sidebar |
| **Category Eyebrow** | `text-sm font-medium` | `#1a3a5c` | "Welcome back", "Analytics", "Project 01" |
| **Page H1 / Header** | `text-2xl font-bold` | `text-slate-800` | "What would you like to do today?" |
| **Hero Title** | `text-3xl font-bold leading-tight text-balance` | `text-slate-800` | "Start telling your data story with us" |
| **Card Title (H3)** | `text-base font-semibold` | `text-slate-800` | "Upload dataset", "Create visualization" |
| **Card Description** | `text-sm leading-relaxed` | `text-slate-500` | نصوص الشرح والتفاصيل داخل الكروت |
| **Step Title** | `text-sm font-semibold` | `text-slate-800` | "Upload", "Explore", "Understand" |
| **Step Caption** | `text-xs` | `text-slate-500` | "Drop your dataset in seconds." |
| **Pill Badge Text** | `text-xs font-medium` | `#1a3a5c` | "Turn data into stories" |
| **Button Label** | `text-sm font-semibold` | `text-white` | "Upload dataset", "Run analysis" |

---

## 5. الهيكل والشبكة وتخطيط الصفحة (Layout & Structural Layout)

### 1. إطار التطبيق الخارجي (Application Shell)
```tsx
<div className="flex min-h-screen bg-white">
  {/* Sidebar بعرض ديناميكي متجاوب */}
  <AppSidebar />

  {/* مساحة المحتوى الرئيسية مع سكرول منفصل وخلفية ممتدة */}
  <main className="relative flex-1 overflow-y-auto bg-white">
    {/* طبقة الرسومات الخلفية الديكورية */}
    <DecorativeBackground />

    {/* حاوية المحتوى المحددة والموسّطة */}
    <div className="relative mx-auto flex max-w-4xl flex-col gap-8 px-8 py-10">
      {/* Page Content Here */}
    </div>
  </main>
</div>
```

### 2. معايير القائمة الجانبية (AppSidebar Standards)
- **العرض الموسع:** `w-64` (256px)
- **العرض المطوي:** `w-16` (64px)
- **الانتقال السلس:** `transition-all duration-300`
- **حالة العنصر النشط (Active Item):**
  ```tsx
  className="bg-[#1a3a5c]/10 font-semibold text-[#1a3a5c] hover:bg-[#1a3a5c]/15 rounded-lg py-3 px-4 flex items-center gap-3 text-sm"
  ```
- **حالة العنصر غير النشط (Inactive Item):**
  ```tsx
  className="font-medium text-slate-600 hover:bg-slate-100 rounded-lg py-3 px-4 flex items-center gap-3 text-sm transition"
  ```
- **الجزء السفلي (Auth / Settings):**
  `mt-auto border-t border-slate-200 px-3 py-4`

---

## 6. الخلفية المميزة والعناصر الديكورية (Signature Background Atmosphere)

> **✨ سر هوية DataNarrator البصرية:**  
> الصفحة ليست خلفية بيضاء عادية؛ بل تحتوي على طبقة خلفية تفاعلية بصرية تجعل أي شاشة جديدة تبدو مطابقة تماماً للمشروع الأصلي:

```tsx
// DecorativeBackground.tsx
export function DecorativeBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 1. البقعة الأورجانيك الخوخية في المنتصف */}
      <svg
        className="absolute left-1/2 top-1/2 h-[90%] w-[75%] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 600 500"
        fill="none"
      >
        <path
          d="M300 40C400 30 520 70 555 170C590 270 540 360 450 415C360 470 240 480 150 430C60 380 20 280 45 190C70 100 200 50 300 40Z"
          fill="#FCEDDF"
        />
      </svg>

      {/* 2. مخطط الشارتات في الأعلى يساراً */}
      <svg
        className="absolute -left-6 top-10 w-56 text-[#d3dde7]"
        viewBox="0 0 220 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="10" y="10" width="130" height="90" rx="6" />
        <line x1="10" y1="28" x2="140" y2="28" />
        <rect x="24" y="60" width="12" height="28" fill="currentColor" stroke="none" opacity="0.4" />
        <rect x="42" y="48" width="12" height="40" fill="currentColor" stroke="none" opacity="0.4" />
        <rect x="60" y="66" width="12" height="22" fill="currentColor" stroke="none" opacity="0.4" />
        <polyline points="88,80 104,58 118,68 132,44" fill="none" />
        <rect x="70" y="80" width="120" height="70" rx="6" />
        <circle cx="100" cy="115" r="18" />
      </svg>

      {/* 3. مخطط أسطوانة قواعد البيانات في الأسفل يساراً */}
      <svg
        className="absolute -left-4 bottom-6 w-52 text-[#d3dde7]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <ellipse cx="70" cy="55" rx="45" ry="16" />
        <path d="M25 55 V95 A45 16 0 0 0 115 95 V55" />
        <path d="M25 95 V135 A45 16 0 0 0 115 135 V95" />
        <rect x="95" y="120" width="95" height="65" rx="6" />
        <circle cx="120" cy="152" r="14" />
      </svg>

      {/* 4. شبكات النقاط الهندسية (Dot Grids 5x5) */}
      <DotGrid className="right-16 top-10" />
      <DotGrid className="left-1/3 bottom-8" />
    </div>
  )
}

function DotGrid({ className = "" }: { className?: string }) {
  const dots = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      dots.push(<circle key={`${r}-${c}`} cx={4 + c * 12} cy={4 + r * 12} r="2" />)
    }
  }
  return (
    <svg className={`absolute h-14 w-14 text-[#d3dde7] ${className}`} viewBox="0 0 60 60" fill="currentColor">
      {dots}
    </svg>
  )
}
```

---

## 7. كتالوج المكونات الأساسية بالكود (Component Archetypes)

### أ. زر الإجراء الأساسي (Primary CTA Button)
```tsx
<button className="inline-flex items-center gap-2 rounded-lg bg-[#4f8ec5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#407caf]">
  <Upload className="size-4" />
  <span>Upload dataset</span>
</button>
```

### ب. شريط التحفيز الصغير (Pill Badge with Gradient)
```tsx
<span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#b5762f]/15 to-[#4a9fc0]/15 px-3 py-1 text-xs font-medium text-[#1a3a5c]">
  <Sparkles className="size-3.5 text-[#b5762f]" />
  Turn data into stories
</span>
```

### ج. بطاقة الميزات الزجاجية (Glass Feature Card)
```tsx
<article className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition hover:border-[#4a9fc0]/50 hover:bg-white hover:shadow-md">
  {/* صندوق الأيقونة بتعتيم 10% ولون مخصص */}
  <div className="mb-4 inline-flex rounded-xl p-3 bg-[#1a3a5c]/10">
    <BarChart3 className="size-6 text-[#1a3a5c]" />
  </div>
  <h3 className="mb-1 text-base font-semibold text-slate-800">Create visualization</h3>
  <p className="text-sm leading-relaxed text-slate-500">
    Turn raw numbers into clear charts and interactive dashboards.
  </p>
</article>
```
> **تنوع ألوان الأيقونات الثلاثة في الكروت:**
> 1. كارت الجداول والرفع: أيقونة ولون خلفية `#b5762f` (برونزي دافئ)
> 2. كارت الرسوم البيانية: أيقونة ولون خلفية `#1a3a5c` (كحلي عميق)
> 3. كارت التحليلات: أيقونة ولون خلفية `#4a9fc0` (سماوي مائي)

### د. بطاقة الهيرو الكبرى مع الخطوات (Hero Section Container)
```tsx
<section className="rounded-2xl border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-sm">
  <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
    
    {/* الجانب الأيسر: العنوان والنص والزر */}
    <div className="max-w-xl">
      <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#b5762f]/15 to-[#4a9fc0]/15 px-3 py-1 text-xs font-medium text-[#1a3a5c]">
        <Sparkles className="size-3.5 text-[#b5762f]" />
        Turn data into stories
      </span>
      <h2 className="text-3xl font-bold leading-tight text-balance text-slate-800">
        Start telling your data story with us
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        Upload a dataset and DataNarrator builds the visualizations and written analysis for you.
      </p>
      <div className="mt-6">
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#4f8ec5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#407caf]">
          <Upload className="size-4" />
          Upload dataset
        </button>
      </div>
    </div>

    {/* الجانب الأيمن: قائمة الخطوات المرقمة الذهبية */}
    <ol className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:max-w-xs lg:grid-cols-1">
      <li className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/60 p-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#feb851] text-sm font-bold text-white">
          1
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Upload</p>
          <p className="text-xs text-slate-500">Drop your dataset in seconds.</p>
        </div>
      </li>
    </ol>

  </div>
</section>
```

### هـ. حقول الإدخال والمدخلات المتوافقة مع النظام (Form Input Pattern)
```tsx
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-700">Dataset Name</label>
  <input
    type="text"
    placeholder="e.g. Q3 Sales Performance"
    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#4a9fc0] focus:outline-none focus:ring-2 focus:ring-[#4a9fc0]/20"
  />
</div>
```

### و. بطاقات الجداول والبيانات (Data Table Pattern)
```tsx
<div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm">
  <table className="w-full text-left text-sm">
    <thead className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
      <tr>
        <th className="px-5 py-3.5">Dataset</th>
        <th className="px-5 py-3.5">Rows</th>
        <th className="px-5 py-3.5">Status</th>
        <th className="px-5 py-3.5 text-right">Action</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 text-slate-700">
      <tr className="hover:bg-slate-50/60 transition">
        <td className="px-5 py-3.5 font-medium text-slate-800">Customer_Churn.csv</td>
        <td className="px-5 py-3.5 text-slate-500">14,250</td>
        <td className="px-5 py-3.5">
          <span className="inline-flex rounded-full bg-[#4a9fc0]/10 px-2.5 py-0.5 text-xs font-medium text-[#1a3a5c]">
            Analyzed
          </span>
        </td>
        <td className="px-5 py-3.5 text-right">
          <button className="text-xs font-semibold text-[#4f8ec5] hover:text-[#407caf]">
            View Report →
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 8. قواعد الصرامة والممنوعات للذكاء الاصطناعي (AI Guardrails)

عند إرسال هذا الدليل للذكاء الاصطناعي، يلتزم بالقواعد الحاسمة التالية:

| ❌ ممنوع تماماً (Strictly Prohibited) | ✅ البديل الإلزامي (Strict Requirement) |
| :--- | :--- |
| استخدام اللون الأسود الداكن `#000000` أو الرمادي الفاحم في النصوص. | استخدام `text-slate-800` للعناوين و `text-slate-500` للشروحات. |
| استخدام درجات البنفسجي، الفوشيا، النيون أو التدرجات الشائعة في قوالب AI الرخيصة. | الالتزام الصارم بالتناغم: كحلي `#1a3a5c` + أزرق أزرار `#4f8ec5` + خردلي `#feb851` + سماوي `#4a9fc0`. |
| جعل البطاقات ذات خلفية رمادية مصمتة داكنة أو بيضاء خشنة بدون بلور. | استخدام `bg-white/70 backdrop-blur-sm border border-slate-200/80`. |
| وضع حواف حادة أو زوايا 90 درجة (`rounded-none`). | الكروت: `rounded-2xl`، الخطوات: `rounded-xl`، الأزرار: `rounded-lg`. |
| استبدال أيقونات Lucide بأيقونات أخرى عشوائية. | استخدام `lucide-react` حصرًا بنفس مقاسات المشروع (`size-4`, `size-6`). |
| نسيان طبقة الخلفية الهندسية الشفافة (`DecorativeBackground`). | يجب إبقاء طبقة الرسوم الهندسية باللون `#d3dde7` والبقعة الخوخية `#FCEDDF`. |

---

## 9. أمثلة طلب صفحات جديدة (Few-Shot Prompts for New Screens)

إليك صيغ جاهزة ومجرّبة تطلب بها من الـ AI تصميم صفحات جديدة بالاعتماد على هذا الدليل:

### مثال 1: طلب صفحة "رفع ملف واختيار نوع التحليل" (Upload Screen)
> "بناءً على مرجع نظام تصميم **DataNarrator** المحدد أعلاه، اكتب لي كود React/Next.js لصفحة `Upload Dataset`.
> تتضمن: منطقة Drag-and-Drop لتحميل ملفات CSV/Excel داخل بطاقة زجاجية `rounded-2xl bg-white/70 backdrop-blur-sm`، مع قائمة منسدلة لاختيار قطاع البيانات، وزر CTA أساسي بلون `#4f8ec5`، وبطاقة خطوات 1-2-3 بالدوائر الذهبية `#feb851` على الجانب. تأكد من استخدام نفس الـ Header والـ DecorativeBackground."

### مثال 2: طلب صفحة "لوحة مشاريعي والتقارير المحفوظة" (My Projects Screen)
> "بناءً على مرجع نظام تصميم **DataNarrator** المحدد أعلاه، قم بإنشاء صفحة `My Projects`.
> تحتوي على: شريط علوي به مربع بحث وزر `+ New Project` بلون `#4f8ec5`، متبوعاً بجدول زجاجي يعرض قائمة المشاريع بحالات ملونة ناعمة، وزر قائمة ثلاثية النقاط، مع كروت إحصائية علوية بنفس ستايل `FeatureCards` الثلاثية بألوان الأيقونات المعتمدة."

### مثال 3: طلب نافذة منبثقة (Modal / Dialog)
> "بناءً على مرجع تصميم **DataNarrator**، صمم لي Modal لتأكيد تصدير التقرير إلى PDF. يجب أن تكون الخلفية المغبشة `backdrop-blur-md bg-slate-900/20`، والنافذة بحواف `rounded-2xl bg-white p-6 shadow-xl border border-slate-200`، وزر الإلغاء ناعم وزر التصدير بلون `#4f8ec5`."
