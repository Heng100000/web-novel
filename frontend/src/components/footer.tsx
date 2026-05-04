"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Send as SendIcon,
  Globe,
  Share2
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary pt-10 pb-24 md:pb-6 text-white/90 font-khmer">
      <div className="w-full px-6 sm:px-12 lg:px-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="flex flex-col gap-3">
            <div className="size-14 overflow-hidden rounded-xl bg-white/10 p-2 border border-white/20">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <p className="text-[12px] leading-relaxed font-medium max-w-[280px] opacity-80">
              <span className="text-amber-500 font-bold">Our Novel - ហាងលក់សៀវភៅ</span> {t("footer_desc")}
            </p>
          </div>

          {/* Others Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[16px] font-black text-white">{t("others")}</h4>
            <div className="flex flex-col gap-2.5 text-[13px] font-medium">
              <Link href="/books" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">{t("all_products")}</Link>
              <Link href="/faq" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">{t("faq")}</Link>
              <Link href="/about" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">{t("about_us")}</Link>
              <Link href="/blog" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">{t("blog")}</Link>
              <Link href="/privacy" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">{t("privacy_policy")}</Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-black text-white uppercase tracking-wider">{t("follow_us")}</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <Link href="#" className="flex items-center gap-3 group">
                <div className="size-9 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                  <Globe className="size-4.5" />
                </div>
                <span className="font-bold">Facebook</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 group">
                <div className="size-9 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                  <Share2 className="size-4.5" />
                </div>
                <span className="font-bold">Instagram</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 group">
                <div className="size-9 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                  <SendIcon className="size-4.5" />
                </div>
                <span className="font-bold">Telegram</span>
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-black text-white uppercase tracking-wider">{t("contact_us")}</h3>
            <ul className="flex flex-col gap-3 text-[13px]">
              <li className="flex items-center gap-3 group cursor-pointer">
                <div className="size-9 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                  <Phone className="size-4.5" />
                </div>
                <span className="font-bold">011414213</span>
              </li>
              <li className="flex items-center gap-3 group cursor-pointer">
                <div className="size-9 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                  <Mail className="size-4.5" />
                </div>
                <span className="font-bold">linhsokheng168@gmail.com</span>
              </li>
              <li>
                <Link
                  href="https://maps.app.goo.gl/iHpKYBe2r7Usbo929?g_st=ic"
                  target="_blank"
                  className="flex items-start gap-3 group"
                >
                  <div className="size-9 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-primary transition-all">
                    <MapPin className="size-4.5" />
                  </div>
                  <span className="font-bold leading-relaxed group-hover:underline">
                    {t("find_us_on_map")}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section Wrapper for shorter width */}
        <div className="max-w-6xl mx-auto">
          {/* Separator */}
          <div className="mt-10 h-[1px] w-full bg-white/10" />

          {/* Bottom Bar */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-medium opacity-60">
              {t("copyright")} © {currentYear} {t("by")} <span className="text-amber-500 font-bold">Our Novel - ហាងលក់សៀវភៅ</span> - {t("all_rights_reserved")}.
            </p>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-medium opacity-60">{t("accept_payment")}:</span>
              <div className="flex items-center">
                <img src="/images/bank.png" alt="Bank" className="h-5 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[13px] font-bold opacity-40 hover:opacity-100 transition-opacity">
          <span>{t("powered_by")}</span>
          <div className="flex items-center gap-1.5">
            <div className="size-4 rounded-sm bg-white flex items-center justify-center">
              <div className="size-2 bg-primary rounded-full" />
            </div>
            <span className="font-hanuman text-[15px]">Doctor-IT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
