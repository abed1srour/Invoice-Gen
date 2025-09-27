'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

const useHtml2Pdf = () =>
  useMemo(() => async () => (await import('html2pdf.js')).default, []);

interface InvoiceItem { id: number; item: string; quantity: number; price: number; note?: string }
interface DataShape {
  company: any;
  billTo: { name: string; phone: string };
  meta: { number: number; date: string };
  items: InvoiceItem[];
  currency?: string;
}

export default function InvoicePreview() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const loadHtml2Pdf = useHtml2Pdf();

  const [data, setData] = useState<DataShape | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('invoiceData');
    if (raw) setData(JSON.parse(raw));
    else setData({
      company: { name: 'SROUR SOLAR POWER', addr1: 'Bazourieh', addr2: 'Main street', brand: 'Srour Solar Power', phones: '+961 78 863 012', email: 'sroursolarpower@gmail.com', taxRegNo: '5001963' },
      billTo: { name: 'Customer', phone: '' },
      meta: { number: 1001, date: new Date().toLocaleDateString() },
      items: [{ id: 1, item: 'Sample item', quantity: 1, price: 100 }],
      currency: 'USD',
    });
  }, []);

  if (!data) return null;

  const { company, billTo, meta, items, currency = 'USD' } = data;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style:'currency', currency }).format(n);
  const subtotal = items.reduce((s, it) => {
    const quantity = isNaN(it.quantity) ? 0 : it.quantity;
    const price = isNaN(it.price) ? 0 : it.price;
    return s + (quantity * price);
  }, 0);

  async function downloadPdf() {
    const html2pdf = await loadHtml2Pdf();
    if (!nodeRef.current) return;
    await html2pdf().from(nodeRef.current).set({
      margin: [10,10,10,10],
      filename: `invoice-${meta.number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: nodeRef.current.scrollWidth,
        height: nodeRef.current.scrollHeight
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).save();
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8">
      <div className="mx-auto w-full sm:max-w-4xl px-2 sm:px-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Invoice Preview</h1>
          <div className="flex gap-3">
            <a 
              href="/invoice/form" 
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Form
            </a>
            <button 
              onClick={downloadPdf} 
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button 
              onClick={() => window.print()} 
              className="print:hidden inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        <div ref={nodeRef} className="invoice-container rounded-2xl bg-white shadow print:rounded-none print:shadow-none">
          {/* Header with your /public/logo.png */}
          <div className="flex items-start justify-between border-b p-8">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Company logo" className="h-45 w-auto" />
            </div>
            <div className="text-right text-sm text-gray-700">
              <div className="text-2xl font-semibold text-gray-900">Invoice</div>
              <div className="mt-4 font-semibold text-gray-900">{company?.name}</div>
              <div className="mt-2">{company?.brand}</div>
              <div>{company?.addr1}</div>
              <div>{company?.addr2}</div>
              <div>{company?.phones}</div>
              <div>{company?.email}</div>
              {company?.taxRegNo && <div>Tax Reg No.: {company.taxRegNo}</div>}
            </div>
          </div>

          <div className="invoice-content">
          {/* Bill to / meta */}
          <div className="grid grid-cols-2 items-start gap-6 border-b bg-gray-100 p-6">
            <div>
              <div className="text-xs font-semibold text-gray-600">BILL TO</div>
              <div className="mt-2 font-medium text-gray-900">{billTo.name}</div>
              <div className="text-gray-700">{billTo.phone}</div>
            </div>
            <div className="text-right text-sm">
              <div className="text-xs font-semibold text-gray-600">BILL INFO</div>
              <div className="mt-2">
                <div><span className="text-gray-500">Invoice #</span> <span className="ml-2 font-semibold text-gray-900">{meta.number}</span></div>
                <div><span className="text-gray-500">Date</span> <span className="ml-2 font-semibold text-gray-900">{meta.date}</span></div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 pb-2 pt-4">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-y bg-gray-50 text-gray-600">
                  <th className="w-2/5 py-3 px-3 text-left font-semibold">Item</th>
                  <th className="w-1/5 py-3 px-3 text-center font-semibold">Quantity</th>
                  <th className="w-1/5 py-3 px-3 text-center font-semibold">Price</th>
                  <th className="w-1/5 py-3 px-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const quantity = isNaN(it.quantity) ? 0 : it.quantity;
                  const price = isNaN(it.price) ? 0 : it.price;
                  const amount = quantity * price;
                  return (
                    <tr key={it.id} className="border-b align-top">
                      <td className="w-2/5 py-3 px-3 text-gray-900">
                        <div className="font-medium">{it.item || '—'}</div>
                        {it.note && <div className="mt-1 text-xs text-gray-500">{it.note}</div>}
                      </td>
                      <td className="w-1/5 py-3 px-3 text-center text-gray-700">{isNaN(it.quantity) ? '—' : it.quantity}</td>
                      <td className="w-1/5 py-3 px-3 text-center text-gray-700">{isNaN(it.price) ? '—' : fmt(it.price)}</td>
                      <td className="w-1/5 py-3 px-3 text-right font-medium text-gray-900">{fmt(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-6 p-6">
            <div />
            <div className="text-sm">
              <div className="flex justify-between border-b py-1">
                <div className="text-gray-600">Subtotal</div>
                <div className="font-medium text-gray-900">{fmt(subtotal)}</div>
              </div>
              <div className="mt-2 flex justify-between">
                <div className="text-gray-600">Total</div>
                <div className="font-semibold text-gray-900">{fmt(subtotal)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-8">
            <div className="border-t border-gray-200 pt-6">
              <div className="text-xs text-gray-600 leading-relaxed">
                <p className="text-gray-500 italic">
                  Thank you for choosing {company?.brand || 'our services'}. We appreciate your business and look forward to serving you again.
                </p>
              </div>
              
              <div className="mt-6 text-right">
                <div className="font-semibold text-gray-700">{company?.brand}</div>
                <div className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
        
        /* Force invoice to display at full width on mobile devices */
        @media (max-width: 768px) {
          .invoice-container {
            width: 100vw !important;
            margin-left: -50vw !important;
            left: 50% !important;
            position: relative !important;
            transform: scale(0.8) !important;
            transform-origin: top left !important;
          }
          
          .invoice-content {
            min-width: 800px !important;
          }
        }
        
        /* Override oklch colors for PDF generation */
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-white { background-color: #ffffff !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-gray-900 { color: #111827 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .border-gray-200 { border-color: #e5e7eb !important; }
        .border-gray-400 { border-color: #9ca3af !important; }
      `}</style>
    </div>
  );
}
