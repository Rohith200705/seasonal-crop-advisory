"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/language";
import { LANGS, type Lang } from "@/lib/i18n";

const links = [
  { href: "/", key: "nav_home" },
  { href: "/advisory", key: "nav_advisory" },
  { href: "/crops", key: "nav_crops" },
  { href: "/prices", key: "nav_prices" },
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/about", key: "nav_about" },
];

export default function Nav() {
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white"
          >
            🌾
          </span>
          <span className="hidden sm:block text-sm leading-tight">
            {t("brand")}
            <span className="block text-[10px] font-medium uppercase tracking-wider text-brand-500">
              Profit · Climate · Risk
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-100 text-brand-700"
                    : "text-ink/70 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-brand-200 bg-white">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code as Lang)}
                className={`px-2.5 py-1.5 text-xs font-bold transition ${
                  lang === l.code ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-50"
                }`}
                aria-label={l.label}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rounded-lg border border-brand-200 bg-white p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className="block h-0.5 w-5 bg-brand-700" />
            <span className="mt-1 block h-0.5 w-5 bg-brand-700" />
            <span className="mt-1 block h-0.5 w-5 bg-brand-700" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-brand-100 bg-white px-4 py-3 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                pathname === l.href ? "bg-brand-100 text-brand-700" : "text-ink/75"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
