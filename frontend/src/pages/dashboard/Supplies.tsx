import { useEffect, useState } from 'react';
import { suppliesService, Supply } from '../../services/supplies';

export default function Supplies() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = ['All', 'Fruits', 'Vegetables', 'Grains', 'Pulses'];

  useEffect(() => {
    loadSupplies();
    
    // Auto-refresh supplies every 5 seconds to show real-time quantity changes
    const interval = setInterval(() => {
      loadSupplies(true); // Show refreshing indicator
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredSupplies(supplies);
    } else {
      setFilteredSupplies(supplies.filter(s => s.category === selectedCategory));
    }
  }, [selectedCategory, supplies]);

  const loadSupplies = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await suppliesService.getSupplies();
      setSupplies(data.supplies);
      setFilteredSupplies(data.supplies);
      setLastUpdated(data.lastUpdated);
    } catch (err: any) {
      console.error('Failed to load supplies:', err);
      setError(err?.response?.data?.error || 'Failed to load supplies data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Fruits': 'from-orange-500 to-red-500',
      'Vegetables': 'from-green-500 to-emerald-500',
      'Grains': 'from-amber-500 to-yellow-500',
      'Pulses': 'from-purple-500 to-pink-500',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };


  const getChangeColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-green-600 bg-green-50';
    if (changePercent < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getChangeIcon = (changePercent: number) => {
    if (changePercent > 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      );
    }
    if (changePercent < 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading supply prices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  // Group filtered supplies by category
  const groupedSupplies = filteredSupplies.reduce((acc, supply) => {
    if (!acc[supply.category]) {
      acc[supply.category] = [];
    }
    acc[supply.category].push(supply);
    return acc;
  }, {} as Record<string, Supply[]>);

  return (
    <div>
      {/* Professional Header Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 rounded-2xl shadow-xl mb-8 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Supply Prices</h1>
                  <p className="text-emerald-100 text-sm font-medium">Real-time market prices & inventory tracking</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {isRefreshing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold text-white">Updating quantities...</span>
                </div>
              )}
              {lastUpdated && !isRefreshing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-sm font-semibold text-white">
                    Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              
              {/* Category Filter */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-white text-emerald-700 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supply Cards by Category */}
      {Object.keys(groupedSupplies).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">No supplies found in this category</p>
        </div>
      ) : (
        Object.entries(groupedSupplies).map(([category, categorySupplies]) => (
          <div key={category} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-1 h-8 bg-gradient-to-b ${getCategoryColor(category)} rounded-full`}></div>
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                {categorySupplies.length} items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categorySupplies.map((supply) => (
                <div
                  key={supply.id}
                  className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(supply.category)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                  {/* Content */}
                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{supply.icon}</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{supply.name}</h3>
                          <p className="text-sm text-gray-500 font-medium">{supply.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{supply.currentPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">/{supply.unit}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Previous: ₹{supply.previousPrice.toFixed(2)}/{supply.unit}
                      </p>
                    </div>

                    {/* Quantity Left */}
                    <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Quantity Left</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-blue-700">
                              {supply.quantityLeft.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm text-blue-600 font-medium">{supply.unit}</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Change Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${getChangeColor(supply.changePercent)}`}>
                      {getChangeIcon(supply.changePercent)}
                      <span className="text-sm font-bold">
                        {supply.changePercent > 0 ? '+' : ''}{supply.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    {/* Decorative Corner */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${getCategoryColor(supply.category)} opacity-10 rounded-bl-full`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Summary Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Supplies</span>
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{supplies.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Rising Prices</span>
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {supplies.filter(s => s.changePercent > 0).length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Falling Prices</span>
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {supplies.filter(s => s.changePercent < 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}
