import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Register() {
  const roles = [
    {
      path: '/register/farmer',
      title: 'Farmer',
      description: 'Register as a farmer to track your produce',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100/50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-300',
      glowClass: 'from-emerald-400 to-emerald-600',
      cornerClass: 'from-emerald-100',
    },
    {
      path: '/register/transporter',
      title: 'Transporter',
      description: 'Register as a transporter to manage shipments',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-300',
      glowClass: 'from-blue-400 to-blue-600',
      cornerClass: 'from-blue-100',
    },
    {
      path: '/register/retailer',
      title: 'Retailer',
      description: 'Register as a retailer to sell products',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100/50',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      glowClass: 'from-amber-400 to-amber-600',
      cornerClass: 'from-amber-100',
    },
    {
      path: '/register/consumer',
      title: 'Consumer',
      description: 'Register as a consumer to track products',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100/50',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-300',
      glowClass: 'from-purple-400 to-purple-600',
      cornerClass: 'from-purple-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      
      {/* Professional Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-700">Get Started</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Choose Your Role
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select your role to begin your journey with UNI-CHAIN's blockchain-powered supply chain platform
            </p>
          </div>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {roles.map((role) => (
            <Link
              key={role.path}
              to={role.path}
              className="group relative"
            >
              {/* Glow Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${role.glowClass} rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300`}></div>
              
              {/* Card */}
              <div className={`relative bg-white rounded-2xl border-2 ${role.borderColor} ${role.hoverBorder} shadow-lg hover:shadow-2xl p-8 transition-all duration-300 transform hover:-translate-y-1`}>
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  {/* Icon Container */}
                  <div className="mb-6">
                    <div className={`relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${role.gradient} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative text-white">
                        {role.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-900 transition-colors">
                      {role.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed font-medium mb-4">
                      {role.description}
                    </p>
                    
                    {/* Arrow Indicator */}
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
                      <span>Get Started</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Decorative Corner Accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${role.cornerClass} to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
