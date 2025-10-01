'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Item = { id: number; item: string; quantity: number; price: number; note?: string };

export default function InvoiceForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [isClient, setIsClient] = useState(false);

  const [company, setCompany] = useState({
    addr1: 'Bazourieh',
    addr2: 'Main street',
    brand: 'Srour Solar Power',
    phones: '+961 78 863 012',
    email: 'sroursolarpower@gmail.com',
    taxRegNo: '5001963',
    logo: '/logo.png', // Default logo
  });

  const [billTo, setBillTo] = useState({ name: '', phone: '' });
  const [meta, setMeta] = useState({ 
    number: Math.floor(1000 + Math.random() * 9000), 
    date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) 
  });
  const [currency, setCurrency] = useState('USD');
  const [eurRate, setEurRate] = useState(0); // EUR to USD rate
  const [useCurrencyConversion, setUseCurrencyConversion] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Item[]>([
    { id: 1, item: '', quantity: NaN, price: NaN },
  ]);

  // Add/Remove items
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), item: '', quantity: NaN, price: NaN }]);
  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const handleItemChange = (id: number, field: keyof Item, value: string | number) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: field === 'item' || field === 'note' ? String(value) : Number(value) } : i)));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany({ ...company, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = () => {
    const data = { company, billTo, meta, items, currency, eurRate, useCurrencyConversion };
    localStorage.setItem('invoiceData', JSON.stringify(data));
    router.push('/invoice/preview');
  };

  const total = items.reduce((sum, item) => {
    const quantity = isNaN(item.quantity) ? 0 : item.quantity;
    const price = isNaN(item.price) ? 0 : item.price;
    return sum + (quantity * price);
  }, 0);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return company.brand && company.addr1 && company.phones && company.email;
      case 2:
        return billTo.name && billTo.phone;
      case 3:
        return meta.number && meta.date;
      case 4:
        return items.some(item => item.item && !isNaN(item.quantity) && !isNaN(item.price));
      default:
        return true;
    }
  };

  // Calendar functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  };

  const getCurrentDate = () => new Date();
  const getCurrentMonth = () => getCurrentDate().getMonth();
  const getCurrentYear = () => getCurrentDate().getFullYear();

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [currentYear, setCurrentYear] = useState(getCurrentYear());

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    setMeta({ ...meta, date: formatDate(newDate) });
    setShowCalendar(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-8">
      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Company Info</span>
            <span>Customer Info</span>
            <span>Invoice Details</span>
            <span>Items</span>
            <span>Preview</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 1 && "Company Information"}
            {currentStep === 2 && "Customer Information"}
            {currentStep === 3 && "Invoice Details"}
            {currentStep === 4 && "Invoice Items"}
            {currentStep === 5 && "Preview & Generate"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {currentStep === 1 && "Enter your company details"}
            {currentStep === 2 && "Enter customer information"}
            {currentStep === 3 && "Set invoice details and currency options"}
            {currentStep === 4 && "Add items to your invoice"}
            {currentStep === 5 && "Review and generate your invoice"}
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Company Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                    value={company.brand} 
                    onChange={e => setCompany({ ...company, brand: e.target.value })}
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                    value={company.email} 
                    onChange={e => setCompany({ ...company, email: e.target.value })}
                    suppressHydrationWarning 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Numbers</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                    value={company.phones} 
                    onChange={e => setCompany({ ...company, phones: e.target.value })}
                    suppressHydrationWarning 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                    value={company.addr1} 
                    onChange={e => setCompany({ ...company, addr1: e.target.value })}
                    suppressHydrationWarning 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                    value={company.addr2} 
                    onChange={e => setCompany({ ...company, addr2: e.target.value })}
                    suppressHydrationWarning 
                  />
                </div>
              </div>
              
              {/* Logo Upload Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Company Logo</span>
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img 
                        src={company.logo} 
                        alt="Company logo preview" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Logo</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">Upload your company logo (PNG, JPG, or SVG). The current logo will be used until you upload a new one.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Customer Information */}
          {currentStep === 2 && (
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
                    suppressHydrationWarning 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm" 
                    placeholder="Enter phone number"
                    value={billTo.phone} 
                    onChange={e => setBillTo({ ...billTo, phone: e.target.value })}
                    suppressHydrationWarning 
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Invoice Details */}
          {currentStep === 3 && (
            <section className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
                  <p className="text-sm text-gray-600">Configure your invoice settings and currency options</p>
                </div>
              </div>
              {/* Main Invoice Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Invoice Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm hover:shadow-md" 
                      value={meta.number} 
                      onChange={e => setMeta({ ...meta, number: Number(e.target.value) })}
                      suppressHydrationWarning
                      placeholder="Enter invoice number"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Invoice Date
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm hover:shadow-md cursor-pointer" 
                        value={meta.date} 
                        onChange={e => setMeta({ ...meta, date: e.target.value })}
                        suppressHydrationWarning
                        onClick={() => setShowCalendar(!showCalendar)}
                        placeholder="Select date"
                        readOnly
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const today = getCurrentDate();
                        setSelectedDate(today);
                        setMeta({ ...meta, date: formatDate(today) });
                        setShowCalendar(false);
                      }}
                      className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-md hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Today</span>
                    </button>
                  </div>
                  
                  {/* Calendar Dropdown */}
                  {showCalendar && (
                    <div ref={calendarRef} className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => navigateMonth('prev')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => navigateMonth('next')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }, (_, i) => (
                          <div key={`empty-${i}`} className="h-8"></div>
                        ))}
                        {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => {
                          const day = i + 1;
                          const isToday = day === getCurrentDate().getDate() && 
                                         currentMonth === getCurrentMonth() && 
                                         currentYear === getCurrentYear();
                          const isSelected = day === selectedDate.getDate() && 
                                           currentMonth === selectedDate.getMonth() && 
                                           currentYear === selectedDate.getFullYear();
                          
                          return (
                            <button
                              key={day}
                              onClick={() => handleDateSelect(day)}
                              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-green-600 text-white'
                                  : isToday
                                  ? 'bg-green-100 text-green-700 font-bold'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Currency
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-3 pl-10 appearance-none border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm hover:shadow-md cursor-pointer"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Currency Conversion Section */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-blue-900">Currency Conversion</h4>
                    <p className="text-sm text-blue-700">Convert prices between USD and EUR automatically</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="useConversion"
                        checked={useCurrencyConversion}
                        onChange={e => setUseCurrencyConversion(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="useConversion" className="text-sm font-semibold text-gray-700 cursor-pointer">
                        Enable automatic currency conversion
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-8">
                      I have prices in USD and want to convert them to EUR automatically
                    </p>
                  </div>
                  
                  {useCurrencyConversion && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          EUR to USD Exchange Rate
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 shadow-sm"
                              value={eurRate === 0 ? '' : eurRate}
                              onChange={e => setEurRate(Number(e.target.value))}
                              placeholder="0.85"
                            />
                            <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                              €1 = ${eurRate > 0 ? eurRate.toFixed(2) : '0.00'}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Enter the current EUR to USD exchange rate for accurate conversion
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h5 className="font-bold text-green-900">Live Conversion Preview</h5>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center py-2 border-b border-green-200">
                            <span className="text-gray-600">€100.00</span>
                            <span className="font-bold text-green-600">${eurRate > 0 ? (100 * eurRate).toFixed(2) : '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-green-200">
                            <span className="text-gray-600">€250.00</span>
                            <span className="font-bold text-green-600">${eurRate > 0 ? (250 * eurRate).toFixed(2) : '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">€500.00</span>
                            <span className="font-bold text-green-600">${eurRate > 0 ? (500 * eurRate).toFixed(2) : '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Step 4: Invoice Items */}
          {currentStep === 4 && (
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
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-lg shadow-md hover:from-orange-700 hover:to-orange-800 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200 shadow-sm">
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
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                          Unit Price ({currency === 'USD' ? '$' : '€'})
                          {useCurrencyConversion && currency === 'EUR' && (
                            <span className="text-xs text-blue-600 ml-1">(Auto-converted)</span>
                          )}
                        </label>
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
                    <div className="mt-3 text-right">
                      <span className="text-sm text-gray-600">Total: </span>
                      <span className="font-semibold text-orange-600">
                        {currency === 'USD' ? '$' : '€'}{(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex justify-center sm:justify-end">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 sm:p-4 border border-orange-200 w-full sm:w-auto">
                    <div className="text-center sm:text-right">
                      <span className="text-base sm:text-lg font-semibold text-gray-700">Grand Total: </span>
                      <span className="text-xl sm:text-2xl font-bold text-orange-600">
                        {currency === 'USD' ? '$' : '€'}{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step 5: Preview & Generate - Enhanced Design */}
          {currentStep === 5 && (
            <section className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-6 py-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Preview & Generate Invoice</h3>
                    <p className="text-emerald-100 text-sm">Review your invoice details before generating</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Invoice Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-blue-900">Invoice Summary</h4>
                      <p className="text-blue-700 text-sm">Complete overview of your invoice</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Number</p>
                          <p className="text-lg font-bold text-gray-900">#{meta.number}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</p>
                          <p className="text-lg font-bold text-gray-900">{meta.date}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</p>
                          <p className="text-lg font-bold text-gray-900">{billTo.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Items</p>
                          <p className="text-lg font-bold text-gray-900">{items.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</p>
                          <p className="text-lg font-bold text-gray-900">{currency}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-emerald-100 uppercase tracking-wide">Grand Total</p>
                          <p className="text-2xl font-bold text-white">
                            {currency === 'USD' ? '$' : '€'}{total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Items Preview</h4>
                      <p className="text-gray-600 text-sm">Review all items in your invoice</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        <div className="col-span-6">Description</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-center">Price</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.item || `Item ${index + 1}`}</p>
                                  {item.note && <p className="text-sm text-gray-500 mt-1">{item.note}</p>}
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-sm font-medium text-gray-700">{item.quantity || 0}</span>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-sm font-medium text-gray-700">
                                {currency === 'USD' ? '$' : '€'}{item.price || 0}
                              </span>
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="text-sm font-bold text-gray-900">
                                {currency === 'USD' ? '$' : '€'}{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-green-900">Ready to Generate</h5>
                        <p className="text-green-700 text-sm">Your invoice is complete and ready</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-600">
                      All required information has been filled out. Click the generate button to create your professional invoice.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-blue-900">What's Next?</h5>
                        <p className="text-blue-700 text-sm">After generating your invoice</p>
                      </div>
                    </div>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Preview your invoice</li>
                      <li>• Download as PDF</li>
                      <li>• Share via WhatsApp</li>
                      <li>• Send via email</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 sm:px-0 mt-8">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`group relative flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 font-bold text-sm sm:text-base overflow-hidden ${
                currentStep === 1 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl active:scale-98 sm:active:scale-95'
              }`}
            >
              <div className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm sm:shadow-md flex items-center justify-center transition-transform duration-300 ${currentStep !== 1 ? 'group-hover:-translate-x-1' : ''}`}>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="relative z-10">Previous</span>
              {currentStep !== 1 && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>

            {currentStep < totalSteps ? (
              <button 
                onClick={nextStep}
                disabled={!isStepValid()}
                className={`group relative flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 font-bold text-sm sm:text-base overflow-hidden ${
                  !isStepValid()
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-2xl hover:shadow-blue-500/30 sm:hover:shadow-blue-500/50 active:scale-98 sm:active:scale-95'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Next Step</span>
                <div className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 ${isStepValid() ? 'group-hover:translate-x-1' : ''}`}>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                {isStepValid() && (
                  <>
                    <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="hidden sm:block absolute bottom-0 left-0 w-24 h-24 bg-blue-300 opacity-20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handlePreview}
                className="group relative flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-2xl hover:shadow-emerald-500/30 sm:hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 font-bold text-sm sm:text-base overflow-hidden active:scale-98 sm:active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="relative z-10">Generate Invoice</span>
                <div className="hidden sm:block absolute top-0 left-1/4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="hidden sm:block absolute bottom-0 right-1/4 w-24 h-24 bg-teal-300 opacity-20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}