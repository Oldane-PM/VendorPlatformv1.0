import { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Upload,
  X,
  FileCheck2,
  AlertTriangle,
  Download,
  Link as LinkIcon,
  CheckCircle2,
  Check,
  FileText,
  Trash2,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface ReconTransaction {
  id: string;
  date: string;
  description: string;
  subDescription: string;
  statementAmount: number;
  systemAmount: number | null;
  matchStatus: 'Matched' | 'Unmatched' | 'Partial Match';
}

export function AccountReconciliationPage() {
  const [viewState, setViewState] = useState<'setup' | 'reconciling'>('setup');
  
  // Form State
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  
  // Upload State
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, size: string} | null>(null);

  // Bank Accounts Data
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/bank-accounts');
        const json = await res.json();
        if (json.accounts) {
          setBankAccounts(json.accounts);
        }
      } catch (err) {
        console.error('Failed to fetch bank accounts:', err);
      } finally {
        setIsLoadingAccounts(false);
      }
    }
    fetchAccounts();
  }, []);

  // Mock data for Reconciling view
  const mockTransactions: ReconTransaction[] = [
    {
      id: '1',
      date: 'Feb 16, 2025',
      description: 'Payment to CloudTech Solutions',
      subDescription: 'Invoice Payment',
      statementAmount: 45000.00,
      systemAmount: 45000.00,
      matchStatus: 'Matched'
    },
    {
      id: '2',
      date: 'Feb 14, 2025',
      description: 'Capital Injection - Funding',
      subDescription: 'Funding',
      statementAmount: 200000.00,
      systemAmount: 200000.00,
      matchStatus: 'Matched'
    },
    {
      id: '3',
      date: 'Feb 15, 2025',
      description: 'Payment to SecureIT Services',
      subDescription: 'Invoice Payment',
      statementAmount: 78000.00,
      systemAmount: 78000.00,
      matchStatus: 'Matched'
    },
    {
      id: '4',
      date: 'Feb 13, 2025',
      description: 'Bank Service Fee - Monthly',
      subDescription: 'Bank Fee',
      statementAmount: 45.50,
      systemAmount: null,
      matchStatus: 'Unmatched'
    },
    {
      id: '5',
      date: 'Feb 11, 2025',
      description: 'Payment to Azure Partners',
      subDescription: 'Invoice Payment',
      statementAmount: 32000.00,
      systemAmount: 32150.00,
      matchStatus: 'Partial Match'
    },
    {
      id: '6',
      date: 'Feb 9, 2025',
      description: 'FX Adjustment - Currency Variance',
      subDescription: 'FX Variance',
      statementAmount: 125.50,
      systemAmount: null,
      matchStatus: 'Unmatched'
    },
    {
      id: '7',
      date: 'Feb 7, 2025',
      description: 'Payment to Marketing Pros',
      subDescription: 'Invoice Payment',
      statementAmount: 22000.00,
      systemAmount: 22000.00,
      matchStatus: 'Matched'
    },
    {
      id: '8',
      date: 'Feb 4, 2025',
      description: 'Deposit - Client Payment',
      subDescription: 'Deposit',
      statementAmount: 1862.73,
      systemAmount: null,
      matchStatus: 'Unmatched'
    }
  ];

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    }
  };

  const getMatchBadge = (status: string) => {
    if (status === 'Matched') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Matched
        </span>
      );
    }
    if (status === 'Unmatched') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <X className="w-3.5 h-3.5 text-red-500" />
          Unmatched
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        Partial Match
      </span>
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111827]">Bank Reconciliation</h1>
        <p className="text-gray-500 mt-1 text-[15px]">
          Monthly structured reconciliation workflow with automated transaction matching
        </p>
      </div>

      {viewState === 'setup' && (
        <>
          {/* Reconciliation Setup Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Reconciliation Setup</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column - Dropdowns */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Period <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary appearance-none bg-white text-gray-900"
                    >
                      <option value="" disabled>Select Period...</option>
                      <option value="2026-03">March 2026</option>
                      <option value="2026-02">February 2026</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Account <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary appearance-none bg-white text-gray-900"
                      disabled={isLoadingAccounts}
                    >
                      <option value="" disabled>
                        {isLoadingAccounts ? 'Loading accounts...' : 'Select Bank Account...'}
                      </option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bank_name} - {acc.account_name} - {acc.last_four_digits} ({acc.currency})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  {(() => {
                    const selectedAccountData = bankAccounts.find(acc => acc.id === selectedAccount);
                    if (!selectedAccountData) return null;
                    return (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          Current Balance: <span className="text-gray-900 font-bold">{formatCurrency(selectedAccountData.current_balance, selectedAccountData.currency)}</span>
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                          {selectedAccountData.currency}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column - File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Bank Statement <span className="text-red-500">*</span>
                </label>
                
                {!uploadedFile ? (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      isDragActive ? 'border-primary bg-blue-50' : 'border-gray-200 bg-[#fbfbfb] hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-900 mb-1">Drag & Drop File Here</p>
                    <p className="text-sm text-gray-500 mb-4">or</p>
                    
                    <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF / Excel / Image
                      <input type="file" className="sr-only" onChange={handleFileSelect} accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png" />
                    </label>
                    
                    <p className="text-[13px] text-gray-400 mt-4">
                      Supported: PDF, XLSX, CSV, JPG, PNG
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-[#fbfbfb] relative">
                    <button 
                      onClick={() => setUploadedFile(null)} 
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 break-all pr-6">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{uploadedFile.size}</p>
                        <div className="flex items-center gap-1.5 mt-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">Upload Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Separator */}
            <hr className="my-6 border-gray-100" />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Save Draft
              </button>
              <button 
                onClick={() => setViewState('reconciling')}
                disabled={!uploadedFile || !selectedPeriod || !selectedAccount}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors
                  ${uploadedFile && selectedPeriod && selectedAccount 
                    ? 'bg-[#2563eb] text-white hover:bg-blue-700 shadow-sm' 
                    : 'bg-[#93c5fd] text-white cursor-not-allowed opacity-90'
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                Start Reconciliation
              </button>
            </div>
          </div>

          {/* Reconciliation History (only in setup view) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reconciliation History</h2>
                <p className="text-sm text-gray-500 mt-1">View past reconciliation records and status</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#f8f9fa] border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Bank Account</th>
                    <th className="px-6 py-4">Uploaded Statement</th>
                    <th className="px-6 py-4">Statement Balance</th>
                    <th className="px-6 py-4">System Balance</th>
                    <th className="px-6 py-4">Variance</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium whitespace-nowrap">
                  {/* Empty state or placeholders */}
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No past reconciliations found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewState === 'reconciling' && (
        <div className="space-y-6">
          {/* Back button */}
          <button 
            onClick={() => setViewState('setup')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-2"
          >
            ← Back to Setup
          </button>

          {/* Reconciliation Summary Card */}
          <div className="bg-[#fff9eb] border border-[#fde68a] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Reconciliation Summary</h2>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 text-sm font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Pending Review
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-5">
              {/* Stat Boxes */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px] shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">System Balance</p>
                <p className="text-2xl font-bold text-gray-900">USD 327,670.50</p>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px] shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Statement Balance</p>
                <p className="text-2xl font-bold text-gray-900">USD 329,578.73</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px] shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Difference</p>
                <p className="text-2xl font-bold text-amber-600">USD 1,908.23</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-[200px] shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Match Progress</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-900">50%</span>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-sm font-bold text-gray-700">4 Matched</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-sm font-bold text-gray-700">1 Partial Match</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-sm font-bold text-gray-700">3 Unmatched</span>
              </div>
            </div>
          </div>

          {/* Transaction Matching Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Transaction Matching</h2>
                <p className="text-[15px] text-gray-500 mt-0.5">
                  8 transactions • 4 matched • 3 require attention
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fbfbfb] border-b border-gray-200 text-xs text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-32">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Statement Amount</th>
                    <th className="px-6 py-4 text-center">System Amount</th>
                    <th className="px-6 py-4 text-center">Match Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-gray-600 font-medium">
                        {tx.date}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-gray-900 font-bold mb-0.5">{tx.description}</div>
                        <div className="text-gray-400 font-medium text-[13px]">{tx.subDescription}</div>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-gray-900">
                        {formatAmount(tx.statementAmount)}
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-gray-900">
                        {tx.systemAmount !== null ? formatAmount(tx.systemAmount) : '—'}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {getMatchBadge(tx.matchStatus)}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        {tx.matchStatus === 'Matched' ? (
                          <div className="flex items-center justify-end gap-1.5 text-gray-400 font-medium text-[13px]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Matched</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 text-[13px]">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold transition-colors">
                              <LinkIcon className="w-3.5 h-3.5" />
                              Match
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
                              <span className="text-gray-400 mb-[1px]">+</span> 
                              Adjust
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
