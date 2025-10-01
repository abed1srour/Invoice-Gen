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
  eurRate?: number;
  useCurrencyConversion?: boolean;
}

export default function InvoicePreview() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const loadHtml2Pdf = useHtml2Pdf();

  const [data, setData] = useState<DataShape | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('invoiceData');
    if (raw) setData(JSON.parse(raw));
    else setData({
      company: { name: 'SROUR SOLAR POWER', addr1: 'Bazourieh', addr2: 'Main street', brand: 'Srour Solar Power', phones: '+961 78 863 012', email: 'sroursolarpower@gmail.com', taxRegNo: '5001963', logo: '/logo.png' },
      billTo: { name: 'Customer', phone: '' },
      meta: { number: 1001, date: new Date().toLocaleDateString() },
      items: [{ id: 1, item: 'Sample item', quantity: 1, price: 100 }],
      currency: 'USD',
    });
  }, []);

  if (!data) return null;

  const { company, billTo, meta, items, currency = 'USD', eurRate = 0, useCurrencyConversion = false } = data;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style:'currency', currency }).format(n);
  
  // Apply currency conversion if enabled and rate is set
  const convertedItems = useCurrencyConversion && currency === 'EUR' && eurRate > 0
    ? items.map(item => ({
        ...item,
        price: item.price * eurRate // Convert EUR prices to USD for calculation
      }))
    : items;
    
  const subtotal = convertedItems.reduce((s, it) => {
    const quantity = isNaN(it.quantity) ? 0 : it.quantity;
    const price = isNaN(it.price) ? 0 : it.price;
    return s + (quantity * price);
  }, 0);

  async function downloadPdf() {
    const html2pdf = await loadHtml2Pdf();
    if (!nodeRef.current) return;
    
    // Store original styles
    const originalWidth = nodeRef.current.style.width;
    const originalTransform = nodeRef.current.style.transform;
    const originalPosition = nodeRef.current.style.position;
    const originalMarginLeft = nodeRef.current.style.marginLeft;
    const originalLeft = nodeRef.current.style.left;
    
    // Force desktop view for PDF generation - override all responsive styles
    nodeRef.current.style.width = '794px';
    nodeRef.current.style.transform = 'none';
    nodeRef.current.style.position = 'static';
    nodeRef.current.style.marginLeft = '0';
    nodeRef.current.style.left = '0';
    
    // Add temporary class to force desktop layout
    nodeRef.current.classList.add('generating-pdf');
    
    await html2pdf().from(nodeRef.current).set({
      margin: [10, 10, 10, 10],
      filename: `invoice-${meta.number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).save();
    
    // Restore original styles
    nodeRef.current.style.width = originalWidth;
    nodeRef.current.style.transform = originalTransform;
    nodeRef.current.style.position = originalPosition;
    nodeRef.current.style.marginLeft = originalMarginLeft;
    nodeRef.current.style.left = originalLeft;
    nodeRef.current.classList.remove('generating-pdf');
  }

  async function shareToWhatsApp() {
    const html2pdf = await loadHtml2Pdf();
    if (!nodeRef.current) return;
    
    // Store original styles
    const originalWidth = nodeRef.current.style.width;
    const originalTransform = nodeRef.current.style.transform;
    const originalPosition = nodeRef.current.style.position;
    const originalMarginLeft = nodeRef.current.style.marginLeft;
    const originalLeft = nodeRef.current.style.left;
    
    // Force desktop view for PDF generation
    nodeRef.current.style.width = '794px';
    nodeRef.current.style.transform = 'none';
    nodeRef.current.style.position = 'static';
    nodeRef.current.style.marginLeft = '0';
    nodeRef.current.style.left = '0';
    nodeRef.current.classList.add('generating-pdf');
    
    try {
      // Generate PDF as blob
      const pdfBlob = await html2pdf().from(nodeRef.current).set({
        margin: [10, 10, 10, 10],
        filename: `invoice-${meta.number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 794,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).outputPdf('blob');
      
      // Create a file from the blob
      const file = new File([pdfBlob], `invoice-${meta.number}.pdf`, { type: 'application/pdf' });
      
      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${meta.number}`,
          text: `Invoice #${meta.number} - ${billTo.name}`,
        });
      } else {
        // Fallback: download and show message to manually share
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${meta.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('PDF downloaded! Please share it manually via WhatsApp from your downloads folder.');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      alert('Unable to share. The PDF will be downloaded instead.');
      downloadPdf();
    } finally {
      // Restore original styles
      nodeRef.current.style.width = originalWidth;
      nodeRef.current.style.transform = originalTransform;
      nodeRef.current.style.position = originalPosition;
      nodeRef.current.style.marginLeft = originalMarginLeft;
      nodeRef.current.style.left = originalLeft;
      nodeRef.current.classList.remove('generating-pdf');
    }
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
              className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button 
              onClick={shareToWhatsApp} 
              className="sm:hidden inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 border border-transparent rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Share via WhatsApp
            </button>
            <button 
              onClick={() => window.print()} 
              className="print:hidden hidden sm:inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        <div className="print:flex print:justify-center print:items-center print:min-h-screen">
          <div ref={nodeRef} className="invoice-container rounded-2xl bg-white shadow print:rounded-none print:shadow-none print:mx-auto">
          {/* Header with company logo */}
          <div className="flex items-start justify-between border-b p-8">
            <div className="flex items-center gap-4">
              <img src={company?.logo || '/logo.png'} alt="Company logo" className="h-45 w-auto" />
            </div>
            <div className="text-right text-sm text-gray-700">
              <div className="text-2xl font-semibold text-gray-900">Invoice</div>
              <div className="mt-4 font-semibold text-gray-900">{company?.name}</div>
              <div className="mt-2">{company?.brand}</div>
              <div>{company?.addr1}</div>
              <div>{company?.addr2}</div>
              <div>{company?.phones}</div>
              <div>{company?.email}</div>
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
                  <th className="w-1/2 py-3 px-3 text-left font-semibold">Item</th>
                  <th className="w-1/6 py-3 px-3 text-center font-semibold">Quantity</th>
                  <th className="w-1/6 py-3 px-3 text-center font-semibold">Price</th>
                  <th className="w-1/6 py-3 px-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {convertedItems.map((it) => {
                  const quantity = isNaN(it.quantity) ? 0 : it.quantity;
                  const price = isNaN(it.price) ? 0 : it.price;
                  const amount = quantity * price;
                  return (
                    <tr key={it.id} className="border-b align-top">
                      <td className="w-1/2 py-3 px-3 text-gray-900">
                        <div className="font-medium">{it.item || '—'}</div>
                        {it.note && <div className="mt-1 text-xs text-gray-500">{it.note}</div>}
                      </td>
                      <td className="w-1/6 py-3 px-3 text-center text-gray-700">{isNaN(it.quantity) ? '—' : it.quantity}</td>
                      <td className="w-1/6 py-3 px-3 text-center text-gray-700">{isNaN(it.price) ? '—' : fmt(it.price)}</td>
                      <td className="w-1/6 py-3 px-3 text-right font-medium text-gray-900">{fmt(amount)}</td>
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
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
        
        /* Force desktop layout during PDF generation - highest priority */
        .generating-pdf {
          width: 794px !important;
          transform: none !important;
          position: static !important;
          margin-left: 0 !important;
          left: 0 !important;
          max-width: 794px !important;
        }
        
        .generating-pdf .invoice-content {
          min-width: 794px !important;
          width: 794px !important;
        }
        
        /* Force invoice to display at full width on mobile devices */
        @media (max-width: 768px) {
          .invoice-container:not(.generating-pdf) {
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
        
        /* PDF generation styles */
        @media print {
          .invoice-container {
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
          }
          
          .print\\:flex {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            min-height: 100vh !important;
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
