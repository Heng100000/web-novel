"use client";

import { useRef } from "react";
import { IconX, IconPrinter } from "../dashboard-icons";
import { formatDate } from "@/lib/utils";

interface InvoiceData {
  invoice_no: string;
  customer_name: string;
  billing_address: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  book_details: {
    title: string;
    price: string;
  };
  quantity: number;
  price_at_purchase: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    order_date: string;
    items: OrderItem[];
    invoice: InvoiceData;
    payment: {
      payment_method: string;
    };
  };
}

export function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order.invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 print:p-0 print:bg-white print:backdrop-blur-none transition-all duration-500">
      <div className="relative flex h-full max-h-[98vh] w-full max-w-[210mm] flex-col overflow-hidden rounded-xl bg-card-bg shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-grayborde animate-in zoom-in-95 duration-300 print:h-auto print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Modal Toolbar - Hidden on Print */}
        <div className="flex items-center justify-between border-b border-grayborde px-6 py-4 bg-bg-soft/50 print:hidden transition-colors font-battambang">
          <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">ការមើលឯកសារជាមុន</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="btn-primary"
            >
              <IconPrinter className="size-4" />
              បោះពុម្ព / រក្សាទុកជា PDF
            </button>
            <button 
              onClick={onClose}
              className="btn-secondary !size-10 !px-0"
            >
              <IconX className="size-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body - A4 Structured */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-[20mm] bg-white dark:bg-zinc-100 print:overflow-visible print:p-[10mm]">
          <div className="flex flex-col h-full font-battambang text-zinc-900">
            
            {/* Title */}
            <h1 className="text-center text-4xl font-extrabold text-primary mb-8 print:mb-6 tracking-tighter">វិក្កយបត្រ / INVOICE</h1>

            {/* Top Layout: Company & Logo */}
            <div className="flex justify-between items-start mb-10 print:mb-8">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-primary mb-1 font-battambang">បណ្ណាគារ ណូវែលអាត់មីន</h2>
                <div className="text-[13px] leading-relaxed text-zinc-700 font-battambang">
                  <p>ផ្លូវ ១២៣ សង្កាត់ណូវែល</p>
                  <p>រាជធានីភ្នំពេញ</p>
                  <p>កម្ពុជា, ១២០០០</p>
                  <p>ទូរស័ព្ទ៖ +៨៥៥ ១២ ៣៤៥ ៦៧៨</p>
                  <p>អ៊ីមែល៖ contact@noveladmin.com</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <img 
                  src="/images/logo_full.png" 
                  alt="NovelAdmin Logo" 
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>

            <div className="w-full h-[1px] bg-primary mb-6 opacity-30" />

            {/* Mid Layout: Bill To & Invoice Info */}
            <div className="flex justify-between mb-10 print:mb-8 text-[14px] font-battambang">
              <div>
                <h3 className="text-primary font-bold mb-2 text-lg">បង់ប្រាក់ដោយ</h3>
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold text-zinc-900">{order.invoice.customer_name}</p>
                  <div className="text-zinc-700 max-w-xs whitespace-pre-wrap">
                    {order.invoice.billing_address}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col gap-1.5 min-w-[200px] font-battambang text-[12px]">
                <div className="grid grid-cols-2 gap-x-4">
                   <span className="font-bold text-primary">លេខវិក្កយបត្រ ៖</span>
                   <span className="font-bold">{order.invoice.invoice_no}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                   <span className="text-zinc-700">កាលបរិច្ឆេទ ៖</span>
                   <span>{formatDate(order.invoice.created_at)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                   <span className="text-zinc-600">ថ្ងៃត្រូវបង់ ៖</span>
                   <span>{formatDate(order.invoice.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 mb-10 print:mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary text-white text-[13px] uppercase font-battambang">
                    <th className="px-4 py-2 text-left border border-primary">ល.រ</th>
                    <th className="px-4 py-2 text-left border border-primary">ការពិពណ៌នា</th>
                    <th className="px-4 py-2 text-center border border-primary">ចំនួន</th>
                    <th className="px-4 py-2 text-right border border-primary">តម្លៃរាយ</th>
                    <th className="px-4 py-2 text-right border border-primary">សរុប</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {order.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-zinc-200">
                      <td className="px-4 py-2.5 border-x border-zinc-200">{index + 1}</td>
                      <td className="px-4 py-2.5 border-x border-zinc-200">{item.book_details.title}</td>
                      <td className="px-4 py-2.5 text-center border-x border-zinc-200">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right border-x border-zinc-200">${parseFloat(item.price_at_purchase).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right border-x border-zinc-200 font-bold">${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-start mb-16 print:mb-12 font-battambang">
               <div>
                  <h4 className="text-primary font-bold mb-2">ការណែនាំអំពីការទូទាត់</h4>
                  <div className="text-[12px] text-zinc-600">
                     <p>បង់ប្រាក់តាមរយៈ សាច់ប្រាក់ ឬ ផ្ទេរតាមធនាគារ ៖</p>
                     <p className="font-bold text-zinc-800 mt-1">NovelAdmin Bookstore Co., Ltd</p>
                  </div>
               </div>
               <div className="w-full max-w-[280px] font-battambang">
                  <div className="flex justify-between py-2 border-t-[1.5px] border-primary font-bold text-sm">
                     <span>សរុបរង</span>
                     <span>${parseFloat(order.invoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-[0.5px] bg-zinc-400 mb-2" />
                  <div className="flex flex-col gap-2 mt-2">
                     <div className="flex justify-between text-base font-bold text-zinc-900">
                        <span>សរុបរួម</span>
                        <span>${parseFloat(order.invoice.total_amount).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-[13px] text-zinc-600 italic">
                        <span>បានបង់រួច ({formatDate(order.invoice.created_at)})</span>
                        <span>${parseFloat(order.invoice.total_amount).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm font-black text-zinc-900 border-t border-zinc-200 pt-2 mt-1">
                        <span>សមតុល្យត្រូវបង់</span>
                        <span>$0.00</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Signature Area */}
            <div className="flex flex-col items-end mt-auto pt-10 font-battambang">
               <div className="flex flex-col items-center">
                  {/* Simulated Signature Line */}
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Signature_of_Jean-S%C3%A9bastien_Bach.svg" className="h-12 opacity-80 invert grayscale" alt="sig" />
                  <div className="w-48 h-[1px] bg-zinc-900 mb-2" />
                  <span className="text-[13px] font-bold uppercase tracking-wide text-zinc-900">ហត្ថលេខាអ្នកទទួលបន្ទុក</span>
               </div>
            </div>

          </div>
        </div>

      </div>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            display: block !important;
            visibility: visible !important;
          }
          .fixed * {
            visibility: visible;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
