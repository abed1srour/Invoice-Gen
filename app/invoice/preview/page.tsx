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

  async function generatePdfBlob() {
    const html2pdf = await loadHtml2Pdf();
    if (!nodeRef.current) return null;
    
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
      
      return pdfBlob;
    } finally {
      // Restore original styles
      if (nodeRef.current) {
        nodeRef.current.style.width = originalWidth;
        nodeRef.current.style.transform = originalTransform;
        nodeRef.current.style.position = originalPosition;
        nodeRef.current.style.marginLeft = originalMarginLeft;
        nodeRef.current.style.left = originalLeft;
        nodeRef.current.classList.remove('generating-pdf');
      }
    }
  }

  async function shareToWhatsApp() {
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;
      
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
      console.error('Error sharing to WhatsApp:', error);
      alert('Unable to share. The PDF will be downloaded instead.');
      downloadPdf();
    }
  }

  async function shareViaEmail() {
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;
      
      const file = new File([pdfBlob], `invoice-${meta.number}.pdf`, { type: 'application/pdf' });
      
      // Try Web Share API first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${meta.number}`,
          text: `Invoice #${meta.number} - ${billTo.name}`,
        });
      } else {
        // Fallback: download and open mailto
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${meta.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Open email client
        window.location.href = `mailto:?subject=Invoice%20%23${meta.number}&body=Please%20find%20the%20invoice%20in%20your%20downloads%20folder.`;
      }
    } catch (error) {
      console.error('Error sharing via email:', error);
      downloadPdf();
    }
  }

  async function shareToTelegram() {
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;
      
      const file = new File([pdfBlob], `invoice-${meta.number}.pdf`, { type: 'application/pdf' });
      
      // Try Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${meta.number}`,
          text: `Invoice #${meta.number} - ${billTo.name}`,
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${meta.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('PDF downloaded! Please share it manually via Telegram from your downloads folder.');
      }
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
      downloadPdf();
    }
  }

  async function shareToMessenger() {
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;
      
      const file = new File([pdfBlob], `invoice-${meta.number}.pdf`, { type: 'application/pdf' });
      
      // Try Web Share API
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${meta.number}`,
          text: `Invoice #${meta.number} - ${billTo.name}`,
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${meta.number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('PDF downloaded! Please share it manually via Messenger from your downloads folder.');
      }
    } catch (error) {
      console.error('Error sharing to Messenger:', error);
      downloadPdf();
    }
  }

  async function shareGeneric() {
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;
      
      const file = new File([pdfBlob], `invoice-${meta.number}.pdf`, { type: 'application/pdf' });
      
      // Use Web Share API
      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Invoice #${meta.number}`,
            text: `Invoice #${meta.number} - ${billTo.name}`,
          });
        } else {
          // Share without file
          await navigator.share({
            title: `Invoice #${meta.number}`,
            text: `Invoice #${meta.number} - ${billTo.name}`,
          });
          downloadPdf();
        }
      } else {
        // Fallback: just download
        downloadPdf();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      downloadPdf();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 sm:py-8 mobile-invoice-wrapper">
      <div className="mx-auto w-full sm:max-w-4xl sm:px-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="hidden sm:block text-lg font-semibold text-gray-900 mb-4">Invoice Preview</h1>
          
          {/* Mobile Interface - Improved Design */}
          <div className="flex sm:hidden flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 mobile-buttons">
            {/* Header Section */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Share Invoice</h1>
                <p className="text-gray-600 text-sm">Choose how you'd like to share your invoice</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-6 py-6 space-y-6">
              {/* Primary Actions */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Quick Share</h2>
                <div className="space-y-3">
                  <button 
                    onClick={shareToWhatsApp} 
                    className="w-full flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl active:scale-98 transition-all duration-200"
                  >
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Share via WhatsApp
                  </button>
                  
                  <button 
                    onClick={downloadPdf} 
                    className="w-full flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl active:scale-98 transition-all duration-200"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>

              {/* More Options */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">More Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={shareViaEmail}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 active:scale-95 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Email
                  </button>
                  
                  <button 
                    onClick={shareToTelegram}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 active:scale-95 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.099.154.232.17.326.016.094.037.308.02.472z"/>
                      </svg>
                    </div>
                    Telegram
                  </button>
                  
                  <button 
                    onClick={shareToMessenger}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 active:scale-95 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8l3.13 3.259L19.752 8l-6.559 6.963z"/>
                      </svg>
                    </div>
                    Messenger
                  </button>
                  
                  <button 
                    onClick={shareGeneric}
                    className="flex flex-col items-center justify-center p-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 active:scale-95 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    More
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <a 
                href="/invoice/form" 
                className="w-full flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl active:scale-98 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Form
              </a>
            </div>
          </div>

          {/* Desktop Buttons - Horizontal */}
          <div className="hidden sm:flex items-center justify-end gap-3">
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
          </div>
        </div>

        <div className="print:flex print:justify-center print:items-center print:min-h-screen invoice-wrapper-mobile hidden sm:block">
          <div ref={nodeRef} className="invoice-container rounded-2xl bg-white shadow print:rounded-none print:shadow-none print:mx-auto mx-2 sm:mx-0">
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
        
        /* Zoom out to show full invoice on mobile devices */
        @media (max-width: 768px) {
          /* Main wrapper - allow scrolling if needed */
          .mobile-invoice-wrapper {
            padding-top: 0 !important;
            padding-bottom: 1rem !important;
          }
          
          /* Buttons stay at natural position */
          .mobile-buttons {
            position: relative;
            z-index: 10;
          }
          
          /* Invoice wrapper on mobile - completely hidden */
          .invoice-wrapper-mobile {
            display: none !important;
          }
          
        }
        
        
        /* Print styles */
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print\\:hidden { 
            display: none !important; 
          }
          
          /* Hide all navigation and buttons when printing */
          .mobile-buttons,
          .mobile-invoice-wrapper,
          .bg-white.border-t.border-gray-200,
          .flex.sm\\:flex.items-center.justify-end.gap-3,
          .bg-gray-100.sm\\:py-8,
          .mx-auto.w-full.sm\\:max-w-4xl.sm\\:px-4,
          .mb-4.sm\\:mb-6,
          .hidden.sm\\:block.text-lg.font-semibold.text-gray-900.mb-4 {
            display: none !important;
          }
          
          /* Show only invoice content when printing */
          .invoice-wrapper-mobile {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            min-height: 100vh !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .invoice-container {
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Ensure proper print layout */
          @page { 
            size: A4; 
            margin: 10mm; 
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
