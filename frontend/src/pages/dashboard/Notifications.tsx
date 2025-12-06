import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { authService } from '../../services/auth';
import { useState, useEffect } from 'react';

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user');
    }
  };

  // Filter notifications based on user role
  const filteredNotifications = notifications.filter(notif => {
    // Show order_received if user's role matches toRole (all users of that role see it)
    if (notif.type === 'order_received' && notif.toRole === user?.role) {
      return true;
    }
    // Show order_placed if user placed it (only the person who placed it sees it)
    // We check if the notification's fromUser matches current user's name/DID
    if (notif.type === 'order_placed' && notif.fromRole === user?.role) {
      // For now, show to all users of that role since we don't have user-specific filtering
      // In a real app, you'd check notif.fromDid === user.did
      return true;
    }
    // Show order_accepted if user placed the order (only the person who placed it sees it)
    if (notif.type === 'order_accepted' && notif.fromRole === user?.role) {
      // For now, show to all users of that role since we don't have user-specific filtering
      // In a real app, you'd check notif.fromDid === user.did
      return true;
    }
    return false;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'order_received':
        return (
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        );
      case 'order_accepted':
        return (
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_placed':
        return 'border-blue-200 bg-blue-50';
      case 'order_received':
        return 'border-amber-200 bg-amber-50';
      case 'order_accepted':
        return 'border-emerald-200 bg-emerald-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600 text-lg">Stay updated with your order activities</p>
        </div>
        {unreadNotifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-sm transition-all duration-200"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Notifications</p>
              <p className="text-3xl font-bold text-gray-900">{filteredNotifications.length}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Unread</p>
              <p className="text-3xl font-bold text-amber-600">{unreadNotifications.length}</p>
            </div>
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Read</p>
              <p className="text-3xl font-bold text-emerald-600">{readNotifications.length}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 mb-1">No notifications</p>
          <p className="text-sm text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Unread</h2>
              <div className="space-y-3">
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`bg-white rounded-2xl border-2 ${getNotificationColor(notif.type)} shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] ${
                      !notif.read ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {getNotificationIcon(notif.type)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900 text-lg mb-1">{notif.message}</p>
                            {notif.supplyItem && (
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <span className="font-semibold">Item: {notif.supplyItem}</span>
                                {notif.quantity && (
                                  <span>Quantity: {notif.quantity} {notif.unit}</span>
                                )}
                                {notif.totalAmount && (
                                  <span className="font-bold text-emerald-700">
                                    Amount: ₹{notif.totalAmount.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {!notif.read && (
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-gray-500">{formatDate(notif.timestamp)}</span>
                          {notif.actionUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(notif.actionUrl!);
                              }}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm transition-all duration-200"
                            >
                              View Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Read</h2>
              <div className="space-y-3">
                {readNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`bg-white rounded-2xl border-2 ${getNotificationColor(notif.type)} shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-200 opacity-75`}
                  >
                    <div className="flex items-start gap-4">
                      {getNotificationIcon(notif.type)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900 text-lg mb-1">{notif.message}</p>
                            {notif.supplyItem && (
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <span className="font-semibold">Item: {notif.supplyItem}</span>
                                {notif.quantity && (
                                  <span>Quantity: {notif.quantity} {notif.unit}</span>
                                )}
                                {notif.totalAmount && (
                                  <span className="font-bold text-emerald-700">
                                    Amount: ₹{notif.totalAmount.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-gray-500">{formatDate(notif.timestamp)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notif.id);
                            }}
                            className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

