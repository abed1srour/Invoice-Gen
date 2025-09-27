'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Item = { id: number; item: string; quantity: number; price: number; note?: string };

export default function InvoiceForm() {
  const router = useRouter();

  const [company, setCompany] = useState({
    addr1: 'Bazourieh',
    addr2: 'Main street',
    brand: 'Srour Solar Power',
    phones: '+961 78 863 012',
    email: 'sroursolarpower@gmail.com',
    taxRegNo: '5001963',
  });

  const [billTo, setBillTo] = useState({ name: '', phone: '' });
  const [meta, setMeta] = useState({ number: Math.floor(1000 + Math.random() * 9000), date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) });
  const [currency, setCurrency] = useState('USD');

  const [items, setItems] = useState<Item[]>([
    { id: 1, item: '', quantity: NaN, price: NaN },
  ]);

  // Add/Remove items
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), item: '', quantity: NaN, price: NaN }]);
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const handleItemChange = (id: number, field: keyof Item, value: string | number) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: field === 'item' || field === 'note' ? String(value) : Number(value) } : i)));
  };

  const handlePreview = () => {
    const data = { company, billTo, meta, items, currency };
    localStorage.setItem('invoiceData', JSON.stringify(data));
    router.push('/invoice/preview');
  };

  const total = items.reduce((sum, item) => {
    const quantity = isNaN(item.quantity) ? 0 : item.quantity;
    const price = isNaN(item.price) ? 0 : item.price;
    return sum + (quantity * price);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 mb-4 sm:mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Invoice Generator</h1>
                <p className="text-xs sm:text-sm text-gray-600">Create Professional Invoices</p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <a
                href="/invoice/preview"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-md hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Invoice</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Invoice</h2>
          <p className="text-sm sm:text-base text-gray-600">Fill out the form below to create your professional invoice</p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Company Details */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Company Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={company.brand} 
                  onChange={e => setCompany({ ...company, brand: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Registration Number</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={company.taxRegNo} 
                  onChange={e => setCompany({ ...company, taxRegNo: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={company.addr1} 
                  onChange={e => setCompany({ ...company, addr1: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={company.addr2} 
                  onChange={e => setCompany({ ...company, addr2: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Numbers</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={company.phones} 
                  onChange={e => setCompany({ ...company, phones: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input 
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={company.email} 
                  onChange={e => setCompany({ ...company, email: e.target.value })} 
                />
              </div>
            </div>
          </section>

        {/* Customer */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Customer Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  placeholder="Enter customer full name"
                  value={billTo.name} 
                  onChange={e => setBillTo({ ...billTo, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  placeholder="Enter phone number"
                  value={billTo.phone} 
                  onChange={e => setBillTo({ ...billTo, phone: e.target.value })} 
                />
              </div>
          </div>
        </section>

          {/* Invoice Details */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Invoice Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                  value={meta.number} 
                  onChange={e => setMeta({ ...meta, number: Number(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm text-sm sm:text-base" 
                    value={meta.date} 
                    onChange={e => setMeta({ ...meta, date: e.target.value })} 
                  />
                  <button
                    type="button"
                    onClick={() => setMeta({ ...meta, date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) })}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium text-xs sm:text-sm whitespace-nowrap"
                  >
                    Today
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
          </div>
        </section>

        {/* Items */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Invoice Items</span>
              </h3>
              <button 
                onClick={addItem} 
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-3">
                    <div className="col-span-1 sm:col-span-2 lg:col-span-6">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Description</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm text-sm sm:text-base" 
                        placeholder="Enter item description"
                        value={item.item} 
                        onChange={e => handleItemChange(item.id, 'item', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm text-sm sm:text-base" 
                        value={isNaN(item.quantity) ? '' : item.quantity} 
                        onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Unit Price ({currency === 'USD' ? '$' : '€'})</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm text-sm sm:text-base" 
                        value={isNaN(item.price) ? '' : item.price} 
                        onChange={e => handleItemChange(item.id, 'price', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-end">
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center text-sm sm:text-base"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Note (Optional)</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                        placeholder="Add a note for this item"
                        value={item.note ?? ''} 
                        onChange={e => handleItemChange(item.id, 'note', e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-600">Total: </span>
                    <span className="font-semibold text-gray-900">${(item.quantity * item.price).toFixed(2)}</span>
          </div>
              </div>
            ))}
          </div>

            {/* Total Summary */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex justify-center sm:justify-end">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 w-full sm:w-auto">
                  <div className="text-center sm:text-right">
                    <span className="text-base sm:text-lg font-semibold text-gray-700">Grand Total: </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
          </div>
        </section>

          {/* Generate Button */}
          <div className="flex justify-center px-4 sm:px-0">
            <button 
              onClick={handlePreview} 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm sm:text-base">Preview / Generate PDF</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}