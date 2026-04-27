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

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#2b4510] pt-10 pb-4 text-white/90 font-khmer">
      <div className="w-full px-6 sm:px-12 lg:px-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="flex flex-col gap-3">
            <div className="size-14 overflow-hidden rounded-2xl bg-white/10 p-2 border border-white/20">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <p className="text-[12px] leading-relaxed font-medium max-w-[280px] opacity-80">
              Our Novel - ហាងលក់សៀវភៅ ជាទីកន្លែងប្រមូលផ្តុំសៀវភៅ និងប្រលោមលោកគ្រប់ប្រភេទ។ យើងប្តេជ្ញាផ្តល់ជូននូវសៀវភៅដែលមានគុណភាព និងបទពិសោធន៍អានដ៏ល្អបំផុតសម្រាប់អ្នកស្រឡាញ់ការអានគ្រប់រូប។
            </p>
          </div>

          {/* Others Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[16px] font-black text-white">ផ្សេងៗ</h4>
            <div className="flex flex-col gap-2.5 text-[13px] font-medium">
              <Link href="/books" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">ផលិតផលទាំងអស់</Link>
              <Link href="/faq" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">សំនួរ និងចម្លើយ</Link>
              <Link href="/about" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">អំពីពួកយើង</Link>
              <Link href="/blog" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">ប្លុក</Link>
              <Link href="/privacy" className="transition-colors hover:text-white underline decoration-transparent hover:decoration-white">គោលការណ៍ភាពឯកជន</Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-black text-white uppercase tracking-wider">តាមដានពួកយើង</h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <Link href="#" className="flex items-center gap-3 group">
                <div className="size-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-[#2b4510] transition-all">
                  <Globe className="size-4.5" />
                </div>
                <span className="font-bold">Facebook</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 group">
                <div className="size-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-[#2b4510] transition-all">
                  <Share2 className="size-4.5" />
                </div>
                <span className="font-bold">Instagram</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 group">
                <div className="size-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-[#2b4510] transition-all">
                  <SendIcon className="size-4.5" />
                </div>
                <span className="font-bold">Telegram</span>
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-black text-white uppercase tracking-wider">ទាក់ទងមកពួកយើង</h3>
            <ul className="flex flex-col gap-3 text-[13px]">
              <li className="flex items-center gap-3 group cursor-pointer">
                <div className="size-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-[#2b4510] transition-all">
                  <Phone className="size-4.5" />
                </div>
                <span className="font-bold">011414213</span>
              </li>
              <li className="flex items-center gap-3 group cursor-pointer">
                <div className="size-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-[#2b4510] transition-all">
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
                  <div className="size-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#2b4510] transition-all">
                    <MapPin className="size-4.5" />
                  </div>
                  <span className="font-bold leading-relaxed group-hover:underline">
                    ស្វែងរកពួកយើងនៅលើផែនទី
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
              រក្សាសិទ្ធិ © {currentYear} ដោយ Our Novel - ហាងលក់សៀវភៅ រក្សាសិទ្ធិគ្រប់យ៉ាង.
            </p>
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-medium opacity-60">ទទួលយកការទូទាត់:</span>
              <div className="flex items-center">
                <img src="/images/bank.png" alt="Bank" className="h-5 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[13px] font-bold opacity-40 hover:opacity-100 transition-opacity">
          <span>ដំណើរការដោយ</span>
          <div className="flex items-center gap-1.5">
            <div className="size-4 rounded-sm bg-white flex items-center justify-center">
              <div className="size-2 bg-[#3b6016] rounded-full" />
            </div>
            <span className="font-hanuman text-[15px]">Doctor-IT</span>
          </div>
        </div>
      </div>


    </footer>
  );
}
