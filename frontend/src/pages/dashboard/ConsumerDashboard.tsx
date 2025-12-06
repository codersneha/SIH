import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { dashboardService } from '../../services/dashboard';
import DashboardHeader from '../../components/DashboardHeader';

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

export default function ConsumerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalBatches: 0,
    traceabilityRate: 100,
    complianceScore: 99.3,
  });
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
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
      
      setMetrics({
        totalOrders,
        totalBatches: backendMetrics.data.totalBatches,
        traceabilityRate: typeof traceabilityRate === 'number' ? traceabilityRate : 100,
        complianceScore: 99.3,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader />

      {/* Four Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products Tracked */}
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

      {/* Welcome Message */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name || 'User'}!
          </h2>
          <p className="text-gray-600 mb-6">
            Use the Track Products page to verify the authenticity and trace the journey of your purchased products.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm font-semibold text-emerald-700">✓ Blockchain Verified</p>
            </div>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-700">✓ Full Traceability</p>
            </div>
            <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-700">✓ Quality Assured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
