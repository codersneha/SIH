import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { dashboardService } from '../../services/dashboard';

interface Batch {
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  status: string;
  date: string;
}

// Count-up animation component
function CountUp({ value, duration = 2000, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = 0;
    const endValue = value;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = startValue + (endValue - startValue) * progress;
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{Number(count.toFixed(decimals)).toLocaleString('en-IN')}</>;
}

export default function FarmerDashboard() {
  const [_user, setUser] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalBatches: 0,
    traceabilityRate: 100,
    complianceScore: 99.3,
  });

  useEffect(() => {
    loadUser();
    loadBatches();
    loadMetrics();
    
    // Auto-refresh metrics every 5 seconds
    const interval = setInterval(() => {
      loadMetrics();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user');
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getFarmerBatches();
      setBatches(response.data.batches || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Get metrics from backend
      const backendMetrics = await dashboardService.getDashboardMetrics();
      
      // Count orders from localStorage (frontend orders)
      const localStorageOrders = JSON.parse(localStorage.getItem('unichain_economic_ledger_orders') || '[]');
      const orderCount = localStorageOrders.filter((entry: any) => 
        entry.entryType === 'ORDER_PLACED' || entry.entryType === 'ORDER_ACCEPTED'
      ).length;
      
      // Combine backend and frontend order counts
      const totalOrders = backendMetrics.data.totalOrders + orderCount;
      
      // Ensure traceabilityRate is a valid number (default to 100 if undefined/null)
      const traceabilityRate = backendMetrics.data.traceabilityRate ?? 100;
      
      console.log('[FarmerDashboard] Metrics loaded:', {
        totalOrders,
        totalBatches: backendMetrics.data.totalBatches,
        traceabilityRate,
        rawTraceabilityRate: backendMetrics.data.traceabilityRate,
      });
      
      setMetrics({
        totalOrders,
        totalBatches: backendMetrics.data.totalBatches,
        traceabilityRate: typeof traceabilityRate === 'number' ? traceabilityRate : 100,
        complianceScore: 99.3,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
      // Keep existing metrics on error
    }
  };

  // Calculate monthly KPIs from current month's batches
  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyBatches = batches.filter((batch) => {
      const batchDate = new Date(batch.date);
      return (
        batchDate.getMonth() === currentMonth &&
        batchDate.getFullYear() === currentYear
      );
    });

    const totalQuantity = monthlyBatches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    return {
      totalQuantity,
      unit: monthlyBatches[0]?.unit || 'kg',
    };
  };

  const stats = getMonthlyStats();
  const recentBatches = batches.slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      Registered: { text: 'Registered', color: 'text-slate-700', bgColor: 'bg-slate-50' },
      'In Transit': { text: 'In Transit', color: 'text-amber-700', bgColor: 'bg-amber-50' },
      Delivered: { text: 'Delivered', color: 'text-blue-700', bgColor: 'bg-blue-50' },
      Sold: { text: 'Sold', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    };
    return statusMap[status] || { text: status, color: 'text-gray-700', bgColor: 'bg-gray-50' };
  };

  // Mock values for system metrics
  const coldChainStability = 94;
  const freshnessScore = 91;
  const deviations = 2;
  const ledgerSync = 99.98;

  return (
    <div className="space-y-8">
      {/* Professional Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  UNI-CHAIN Monthly Operational Overview
                </h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <span className="text-sm font-semibold text-emerald-300">LIVE SYSTEM</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <p className="text-lg text-slate-300 font-medium">
                  Blockchain-Based Traceability Dashboard
                </p>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg">
                  <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-300">Ledger Sync: {ledgerSync}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-300">
                Cold Chain Stability: <span className="text-white">{coldChainStability}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-300">
                Freshness Score: <span className="text-white">{freshnessScore}/100</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-300">
                Deviations: <span className="text-white">{deviations}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Five Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Orders Tracked */}
        <div className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              TOTAL ORDERS TRACKED
            </p>
            <p className="text-xs text-gray-400 mb-4">All Orders (Any Status)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">
                <CountUp value={metrics.totalOrders} />
              </p>
              <span className="text-lg text-gray-500 font-medium">orders</span>
            </div>
          </div>
        </div>

        {/* Total Produce Registered */}
        <div className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              TOTAL PRODUCE REGISTERED
            </p>
            <p className="text-xs text-gray-400 mb-4">This Month</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">
                <CountUp value={stats.totalQuantity} />
              </p>
              <span className="text-lg text-gray-500 font-medium">{stats.unit}</span>
            </div>
          </div>
        </div>

        {/* Total Batches Processed */}
        <div className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              TOTAL BATCHES PROCESSED
            </p>
            <p className="text-xs text-gray-400 mb-4">All Farmers</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">
                <CountUp value={metrics.totalBatches} />
              </p>
              <span className="text-lg text-gray-500 font-medium">batches</span>
            </div>
          </div>
        </div>

        {/* Traceability Completion Rate */}
        <div className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              TRACEABILITY COMPLETION RATE
            </p>
            <p className="text-xs text-gray-400 mb-4">Cold Chain Integrity</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">
                <CountUp value={metrics.traceabilityRate} decimals={0} />
              </p>
              <span className="text-lg text-gray-500 font-medium">%</span>
            </div>
          </div>
        </div>

        {/* Compliance Integrity Score */}
        <div className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              COMPLIANCE INTEGRITY SCORE
            </p>
            <p className="text-xs text-gray-400 mb-4">This Month</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">
                <CountUp value={metrics.complianceScore} decimals={1} />
              </p>
              <span className="text-lg text-gray-500 font-medium">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Produce Activity
              </h2>
              <p className="text-sm text-gray-500 mt-1">Last 5 batches</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Loading batches...</span>
            </div>
          </div>
        ) : recentBatches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">No batches found</p>
            <p className="text-sm text-gray-500">Register your produce to see it here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBatches.map((batch) => {
                  const status = getStatusBadge(batch.status);
                  return (
                    <tr
                      key={batch.batchId}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                          {batch.batchId}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900">{batch.productName}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-gray-700 font-medium">
                          {batch.quantity.toLocaleString('en-IN')} {batch.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-gray-900">
                          ₹{batch.sellingPrice.toLocaleString('en-IN')}/{batch.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${status.bgColor} ${status.color} border border-current border-opacity-20`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 font-medium">
                          {formatDate(batch.date)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
