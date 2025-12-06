import { useEffect, useState } from 'react';
import api from '../services/api';

type EconomicRow = {
  txId: string;
  txHash: string;
  prevTxHash: string | null;
  batchId: string | null;
  fromParty: string;
  toParty: string;
  fromDid: string | null;
  toDid: string | null;
  product: string;
  quantity: number | null;
  amount: number | null;
  paymentMethod: string;
  timestamp: string;
  currency: string;
  orderId?: string | null;
  unit?: string | null;
};

type QualityRow = {
  txId: string;
  txHash: string;
  prevTxHash: string | null;
  batchId: string | null;
  actorDid: string | null;
  actorRole: string;
  stage: string;
  qualityScore: number | null;
  moistureLevel: number | null;
  temperature: number | null;
  spoilageDetected: boolean | null;
  aiVerificationHash: string | null;
  iotMerkleRoot: string | null;
  timestamp: string;
};

type ZkpRow = {
  id: string;
  did: string;
  userRole: string;
  userName: string;
  proofType: string;
  batchId?: string | null;
  verified: boolean;
  message?: string | null;
  claim?: string | null;
  proofHash?: string | null;
  timestamp: string;
};

export default function Ledger() {
  const [tab, setTab] = useState<'economic' | 'quality' | 'zkp'>('economic');
  const [economic, setEconomic] = useState<EconomicRow[]>([]);
  const [quality, setQuality] = useState<QualityRow[]>([]);
  const [zkp, setZkp] = useState<ZkpRow[]>([]);
  const [error, _setError] = useState<string | null>(null);
  const [economicLoading, setEconomicLoading] = useState(false);
  const [economicError, setEconomicError] = useState<string | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [zkpLoading, setZkpLoading] = useState(false);
  const [zkpError, setZkpError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    batchId: '',
    fromParty: '',
    toParty: '',
  });
  const [qualityFilters, setQualityFilters] = useState({
    batchId: '',
  });
  const [zkpFilters, setZkpFilters] = useState({
    batchId: '',
    proofType: '',
    verified: '',
  });

  useEffect(() => {
    if (tab === 'economic') {
      loadEconomicLedger();
    } else if (tab === 'quality') {
      loadQualityLedger();
    } else if (tab === 'zkp') {
      loadZkpLedger();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'zkp') {
      loadZkpLedger();
    }
  }, [zkpFilters.batchId, zkpFilters.proofType, zkpFilters.verified]);

  const loadZkpLedger = async () => {
    try {
      setZkpLoading(true);
      setZkpError(null);
      const params = new URLSearchParams();
      if (zkpFilters.batchId) params.append('batchId', zkpFilters.batchId);
      if (zkpFilters.proofType) params.append('proofType', zkpFilters.proofType);
      if (zkpFilters.verified) params.append('verified', zkpFilters.verified);

      const res = await api.get(`/ledger/zkp?${params.toString()}`);
      setZkp(res.data.proofs || []);
    } catch (e: any) {
      console.error('Failed to load ZKP ledger', e);
      setZkpError(e?.response?.data?.error || 'Failed to load ZKP proofs');
    } finally {
      setZkpLoading(false);
    }
  };

  const loadEconomicLedger = async () => {
    try {
      setEconomicLoading(true);
      setEconomicError(null);
      const params = new URLSearchParams();
      if (filters.batchId) params.append('batchId', filters.batchId);
      if (filters.fromParty) params.append('fromParty', filters.fromParty);
      if (filters.toParty) params.append('toParty', filters.toParty);
      
      const res = await api.get(`/ledger/economic?${params.toString()}`);
      const apiTransactions = res.data.transactions || [];
      
      // Load all order transactions from localStorage and merge with API transactions
      try {
        const saved = localStorage.getItem('unichain_economic_ledger_orders');
        const orderEntries = saved ? JSON.parse(saved) : [];
        
        // Merge order entries with API transactions
        const allTransactions = [...apiTransactions, ...orderEntries];
        
        // Remove duplicates based on txId (keep the latest version)
        const uniqueTransactions = new Map();
        allTransactions.forEach((tx: any) => {
          const key = tx.orderId || tx.txId;
          if (!uniqueTransactions.has(key) || new Date(tx.timestamp) > new Date(uniqueTransactions.get(key).timestamp)) {
            uniqueTransactions.set(key, tx);
          }
        });
        
        // Convert back to array and sort by timestamp (newest first)
        const sortedTransactions = Array.from(uniqueTransactions.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setEconomic(sortedTransactions);
      } catch (error) {
        console.error('Failed to load order entries', error);
        setEconomic(apiTransactions);
      }
    } catch (e: any) {
      console.error('Failed to load economic ledger', e);
      setEconomicError(e?.response?.data?.error || 'Failed to load economic ledger data');
    } finally {
      setEconomicLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'economic') {
      loadEconomicLedger();
    }
  }, [filters.batchId, filters.fromParty, filters.toParty]);

  // Auto-refresh Economic Ledger every 5 seconds to show real-time updates
  useEffect(() => {
    if (tab === 'economic') {
      const interval = setInterval(() => {
        loadEconomicLedger();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [tab, filters.batchId, filters.fromParty, filters.toParty]);

  useEffect(() => {
    if (tab === 'quality') {
      loadQualityLedger();
    }
  }, [qualityFilters.batchId]);

  const loadQualityLedger = async () => {
    try {
      setQualityLoading(true);
      setQualityError(null);
      const params = new URLSearchParams();
      if (qualityFilters.batchId) params.append('batchId', qualityFilters.batchId);
      
      const res = await api.get(`/ledger/quality?${params.toString()}`);
      setQuality(res.data.transactions || []);
    } catch (e: any) {
      console.error('Failed to load quality ledger', e);
      setQualityError(e?.response?.data?.error || 'Failed to load quality ledger data');
    } finally {
      setQualityLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleQualityFilterChange = (key: string, value: string) => {
    setQualityFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ batchId: '', fromParty: '', toParty: '' });
  };

  const clearQualityFilters = () => {
    setQualityFilters({ batchId: '' });
  };

  const handleZkpFilterChange = (key: string, value: string) => {
    setZkpFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearZkpFilters = () => {
    setZkpFilters({ batchId: '', proofType: '', verified: '' });
  };

  // Remove the old loading check since we have per-tab loading states

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Economic Ledger</h1>
        <p className="text-gray-600">
          Public ledger showing all economic transactions across the UNI-CHAIN network
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setTab('economic')}
          className={`px-4 py-2 rounded transition-colors ${
            tab === 'economic'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Economic Ledger
        </button>
        <button
          onClick={() => setTab('quality')}
          className={`px-4 py-2 rounded transition-colors ${
            tab === 'quality'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Quality Ledger
        </button>
        <button
          onClick={() => setTab('zkp')}
          className={`px-4 py-2 rounded transition-colors ${
            tab === 'zkp'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          ZKP Proofs
        </button>
      </div>

      {tab === 'economic' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch ID
                </label>
                <input
                  type="text"
                  value={filters.batchId}
                  onChange={(e) => handleFilterChange('batchId', e.target.value)}
                  placeholder="Filter by batch ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Party
                </label>
                <select
                  value={filters.fromParty}
                  onChange={(e) => handleFilterChange('fromParty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Parties</option>
                  <option value="FARMER">Farmer</option>
                  <option value="TRANSPORTER">Transporter</option>
                  <option value="RETAILER">Retailer</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Party
                </label>
                <select
                  value={filters.toParty}
                  onChange={(e) => handleFilterChange('toParty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Parties</option>
                  <option value="FARMER">Farmer</option>
                  <option value="TRANSPORTER">Transporter</option>
                  <option value="RETAILER">Retailer</option>
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Economic Ledger Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {economicError && (
              <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                {economicError}
              </div>
            )}
            {economicLoading ? (
              <div className="text-center py-8 text-gray-500">Loading economic ledger...</div>
            ) : economic.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No economic transactions found.</p>
                <p className="text-sm mt-2">
                  {Object.values(filters).some((f) => f) 
                    ? 'Try adjusting your filters.' 
                    : 'Transactions will appear here as users interact with the system.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">TX ID</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Batch ID</th>
                      <th className="p-3 text-left font-semibold text-gray-700">From Party</th>
                      <th className="p-3 text-left font-semibold text-gray-700">To Party</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Product</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Quantity</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Amount (₹)</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Payment Method</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {economic.map((tx) => (
                      <tr
                        key={tx.txId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-mono text-xs text-green-600">
                            {tx.txId.length > 12
                              ? `${tx.txId.substring(0, 12)}...`
                              : tx.txId}
                          </span>
                        </td>
                        <td className="p-3">
                          {tx.batchId ? (
                            <span className="font-mono text-xs text-blue-600">
                              {tx.batchId.length > 12
                                ? `${tx.batchId.substring(0, 12)}...`
                                : tx.batchId}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {tx.fromParty || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                            {tx.toParty || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-900">
                          <div>
                            {tx.product || 'N/A'}
                            {tx.orderId && (
                              <span className="ml-2 text-xs text-emerald-600 font-mono">
                                ({tx.orderId})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {tx.quantity != null
                            ? `${tx.quantity.toLocaleString('en-IN')} ${tx.unit || 'kg'}`
                            : '-'}
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-900">
                          {tx.amount != null
                            ? `₹${tx.amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              (tx as any).entryType === 'ORDER_PLACED' 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : (tx as any).entryType === 'ORDER_ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {tx.paymentMethod || 'N/A'}
                            </span>
                            {(tx as any).entryType && (
                              <span className="text-xs text-gray-500">
                                {(tx as any).entryType === 'ORDER_PLACED' ? 'Order Placed' : 
                                 (tx as any).entryType === 'ORDER_ACCEPTED' ? 'Order Accepted' : ''}
                              </span>
                            )}
                            {(tx as any).status && (
                              <span className={`text-xs font-semibold ${
                                (tx as any).status === 'Accepted' 
                                  ? 'text-emerald-600' 
                                  : 'text-amber-600'
                              }`}>
                                Status: {(tx as any).status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {new Date(tx.timestamp).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'quality' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch ID
                </label>
                <input
                  type="text"
                  value={qualityFilters.batchId}
                  onChange={(e) => handleQualityFilterChange('batchId', e.target.value)}
                  placeholder="Filter by batch ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <button
                onClick={clearQualityFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Quality Ledger Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {qualityError && (
              <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                {qualityError}
              </div>
            )}
            {qualityLoading ? (
              <div className="text-center py-8 text-gray-500">Loading quality ledger...</div>
            ) : quality.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No quality events found.</p>
                <p className="text-sm mt-2">
                  {Object.values(qualityFilters).some((f) => f) 
                    ? 'Try adjusting your filters.' 
                    : 'Quality events will appear here as users interact with the system.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">TX ID</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Batch ID</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Actor</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Quality Score</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Moisture (%)</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Temp (°C)</th>
                      <th className="p-3 text-center font-semibold text-gray-700">Spoilage</th>
                      <th className="p-3 text-left font-semibold text-gray-700">AI Hash</th>
                      <th className="p-3 text-left font-semibold text-gray-700">IoT Root</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quality.map((tx) => (
                      <tr
                        key={tx.txId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-mono text-xs text-green-600">
                            {tx.txId.length > 12
                              ? `${tx.txId.substring(0, 12)}...`
                              : tx.txId}
                          </span>
                        </td>
                        <td className="p-3">
                          {tx.batchId ? (
                            <span className="font-mono text-xs text-blue-600">
                              {tx.batchId.length > 12
                                ? `${tx.batchId.substring(0, 12)}...`
                                : tx.batchId}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {tx.actorRole || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {tx.qualityScore != null ? (
                            <span className={`font-semibold ${
                              tx.qualityScore >= 80 ? 'text-green-600' :
                              tx.qualityScore >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {tx.qualityScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {tx.moistureLevel != null
                            ? `${tx.moistureLevel.toFixed(1)}%`
                            : '-'}
                        </td>
                        <td className="p-3 text-right text-gray-700">
                          {tx.temperature != null
                            ? `${tx.temperature.toFixed(1)}°C`
                            : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {tx.spoilageDetected != null ? (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                tx.spoilageDetected
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {tx.spoilageDetected ? 'Yes' : 'No'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {tx.aiVerificationHash ? (
                            <span className="font-mono text-xs text-gray-600">
                              {tx.aiVerificationHash.length > 12
                                ? `${tx.aiVerificationHash.substring(0, 12)}...`
                                : tx.aiVerificationHash}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {tx.iotMerkleRoot ? (
                            <span className="font-mono text-xs text-gray-600">
                              {tx.iotMerkleRoot.length > 12
                                ? `${tx.iotMerkleRoot.substring(0, 12)}...`
                                : tx.iotMerkleRoot}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {new Date(tx.timestamp).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'zkp' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch ID
                </label>
                <input
                  type="text"
                  value={zkpFilters.batchId}
                  onChange={(e) => handleZkpFilterChange('batchId', e.target.value)}
                  placeholder="Filter by batch ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proof Type
                </label>
                <select
                  value={zkpFilters.proofType}
                  onChange={(e) => handleZkpFilterChange('proofType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Types</option>
                  <option value="QUALITY">Quality</option>
                  <option value="ECONOMIC">Economic</option>
                  <option value="ROUTE">Route</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={zkpFilters.verified}
                  onChange={(e) => handleZkpFilterChange('verified', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              <button
                onClick={clearZkpFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* ZKP Proofs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {zkpLoading ? (
              <div className="text-center py-8 text-gray-500">Loading ZKP proofs...</div>
            ) : zkpError ? (
              <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
                {zkpError}
              </div>
            ) : zkp.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No ZKP proofs found.</p>
                <p className="text-sm mt-2">
                  {Object.values(zkpFilters).some((f) => f) 
                    ? 'Try adjusting your filters.' 
                    : 'ZKP proofs will appear here as users generate them.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">Proof Type</th>
                      <th className="p-3 text-left font-semibold text-gray-700">User</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Batch ID</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Claim</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Proof Hash</th>
                      <th className="p-3 text-center font-semibold text-gray-700">Status</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zkp.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            {row.proofType}
                          </span>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{row.userName}</p>
                            <p className="text-xs text-gray-500">{row.userRole}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {row.batchId ? (
                            <span className="font-mono text-xs text-blue-600">
                              {row.batchId.length > 16
                                ? `${row.batchId.substring(0, 16)}...`
                                : row.batchId}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {row.claim ? (
                            <span className="text-xs text-gray-700" title={row.claim}>
                              {row.claim.length > 50
                                ? `${row.claim.substring(0, 50)}...`
                                : row.claim}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {row.proofHash ? (
                            <span className="font-mono text-xs text-green-600" title={row.proofHash}>
                              {row.proofHash.length > 16
                                ? `${row.proofHash.substring(0, 16)}...`
                                : row.proofHash}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              row.verified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {row.verified ? 'Verified' : 'Failed'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">
                          {new Date(row.timestamp).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
