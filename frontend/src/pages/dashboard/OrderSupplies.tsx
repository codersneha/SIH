import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth';
import { suppliesService, Supply } from '../../services/supplies';
import { useNotifications } from '../../context/NotificationContext';

interface Order {
  orderId: string;
  supplyItem: string;
  quantity: number;
  unit: string;
  price: number;
  totalAmount: number;
  from: string;
  fromDid: string;
  fromRole: string;
  toRole: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Received' | 'Accepted';
  deliveryPreference: string;
  destination: string;
  notes?: string;
  createdAt: string;
}

// Dummy orders data - filtered by role-based flow
// Consumer → Retailer, Retailer → Transporter, Transporter → Farmer
// Note: This function is kept for potential future use but currently unused
// const generateDummyOrders = (userRole: string): Order[] => {
//   const baseOrders: Order[] = [
//     {
//       orderId: 'ORD-1234',
//       supplyItem: 'Apple',
//       quantity: 50,
//       unit: 'kg',
//       price: 120,
//       totalAmount: 6000,
//       from: 'John Consumer',
//       fromDid: 'did:unichain:consumer-123',
//       fromRole: 'CONSUMER',
//       toRole: 'RETAILER',
//       status: 'Pending',
//       deliveryPreference: 'Standard',
//       destination: 'Retail Store A',
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
//     },
//     {
//       orderId: 'ORD-1235',
//       supplyItem: 'Packaging Crates',
//       quantity: 100,
//       unit: 'units',
//       price: 22,
//       totalAmount: 2200,
//       from: 'Retail Supply Co.',
//       fromDid: 'did:unichain:retailer-456',
//       fromRole: 'RETAILER',
//       toRole: 'TRANSPORTER',
//       status: 'Pending',
//       deliveryPreference: 'Priority',
//       destination: 'Distribution Center',
//       createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
//     },
//     {
//       orderId: 'ORD-1236',
//       supplyItem: 'Fuel',
//       quantity: 200,
//       unit: 'liters',
//       price: 95,
//       totalAmount: 19000,
//       from: 'Transport Solutions',
//       fromDid: 'did:unichain:transporter-789',
//       fromRole: 'TRANSPORTER',
//       toRole: 'FARMER',
//       status: 'Pending',
//       deliveryPreference: 'Standard',
//       destination: 'Farm Warehouse',
//       notes: 'Urgent delivery required',
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
//     },
//   ];
//
//   // Filter orders based on role
//   if (userRole === 'RETAILER') {
//     return baseOrders.filter(order => order.toRole === 'RETAILER' && order.fromRole === 'CONSUMER');
//   } else if (userRole === 'TRANSPORTER') {
//     return baseOrders.filter(order => order.toRole === 'TRANSPORTER' && order.fromRole === 'RETAILER');
//   } else if (userRole === 'FARMER') {
//     return baseOrders.filter(order => order.toRole === 'FARMER' && order.fromRole === 'TRANSPORTER');
//   }
//   return [];
// };

export default function OrderSupplies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'place' | 'receive'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'receive' ? 'receive' : 'place';
  });
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { addNotification, removeNotification, notifications } = useNotifications();
  
  // Place Order Form State
  const [formData, setFormData] = useState({
    supplyItem: '',
    quantity: '',
    deliveryPreference: 'Standard',
    destination: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    loadUser();
    loadSupplies();
  }, []);

  // Handle tab parameter and load orders when user is available
  useEffect(() => {
    if (user?.role) {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'receive' && canReceiveOrder) {
        setActiveTab('receive');
      }
      
      if (user.role === 'CONSUMER') {
        // Load consumer orders from localStorage and merge with ledger data
        try {
          const saved = localStorage.getItem('unichain_consumer_orders');
          const consumerOrders = saved ? JSON.parse(saved) : [];
          
          // Also check ledger for accepted orders to update status
          const ledgerSaved = localStorage.getItem('unichain_economic_ledger_orders');
          const ledgerEntries = ledgerSaved ? JSON.parse(ledgerSaved) : [];
          
          // Update order statuses based on ledger
          const updatedOrders = consumerOrders.map((order: Order) => {
            // Check if there's an accepted entry for this order
            const hasAcceptedEntry = ledgerEntries.some((e: any) => 
              e.orderId === order.orderId && 
              e.entryType === 'ORDER_ACCEPTED'
            );
            
            if (hasAcceptedEntry && order.status === 'Pending') {
              return { ...order, status: 'Accepted' as const };
            }
            return order;
          });
          
          setOrders(updatedOrders);
          setLoadingOrders(false);
        } catch (error) {
          console.error('Failed to load consumer orders', error);
          setOrders([]);
          setLoadingOrders(false);
        }
      } else {
        // For other roles, load received orders from ledger
        loadReceivedOrders();
      }
    }
  }, [user, searchParams]);

  // Refresh received orders when receive tab is active
  useEffect(() => {
    if (activeTab === 'receive' && user?.role) {
      if (user.role === 'CONSUMER') {
        // For consumers, reload orders from localStorage
        try {
          const saved = localStorage.getItem('unichain_consumer_orders');
          const consumerOrders = saved ? JSON.parse(saved) : [];
          setOrders(consumerOrders);
          setLoadingOrders(false);
        } catch (error) {
          console.error('Failed to load consumer orders', error);
          setOrders([]);
          setLoadingOrders(false);
        }
      } else {
        // For other roles, load received orders
        loadReceivedOrders();
        // Auto-refresh every 3 seconds when on receive tab
        const interval = setInterval(() => {
          loadReceivedOrders();
        }, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [activeTab, user]);

  const loadReceivedOrders = () => {
    if (!user?.role) {
      setLoadingOrders(false);
      return;
    }
    
    try {
      setLoadingOrders(true);
      // Load all orders from ledger where this user's role is the receiver
      const saved = localStorage.getItem('unichain_economic_ledger_orders');
      const allLedgerEntries = saved ? JSON.parse(saved) : [];
      
      console.log(`[loadReceivedOrders] User role: ${user.role}, Total ledger entries: ${allLedgerEntries.length}`);
      console.log(`[loadReceivedOrders] All ORDER_PLACED entries:`, allLedgerEntries.filter((e: any) => e.entryType === 'ORDER_PLACED'));
      
      // Filter orders that are for this user's role and still pending (not accepted)
      const receivedOrders = allLedgerEntries
        .filter((entry: any) => {
          // Check if this is an order entry
          if (!entry.orderId || !entry.entryType) {
            return false;
          }
          
          // Must be an ORDER_PLACED entry
          if (entry.entryType !== 'ORDER_PLACED') {
            return false;
          }
          
          // Check if order is for this role - entry must have fromRole
          if (!entry.fromRole) {
            console.warn('[loadReceivedOrders] Order entry missing fromRole:', entry.orderId, entry);
            return false;
          }
          
          const receiverRole = getReceiverRoleForOrder(entry.fromRole);
          console.log(`[loadReceivedOrders] Order ${entry.orderId}: fromRole=${entry.fromRole}, receiverRole=${receiverRole}, user.role=${user.role}`);
          
          if (receiverRole !== user.role) {
            return false;
          }
          
          // Only show pending orders (not yet accepted)
          // Check if there's no accepted entry for this order
          const hasAcceptedEntry = allLedgerEntries.some((e: any) => 
            e.orderId === entry.orderId && 
            e.entryType === 'ORDER_ACCEPTED'
          );
          
          if (hasAcceptedEntry) {
            console.log(`[loadReceivedOrders] Order ${entry.orderId} has been accepted, skipping`);
            return false;
          }
          
          // Must be pending status (accept 'Pending', undefined, null, or empty string)
          const isPending = entry.status === 'Pending' || entry.status === undefined || entry.status === null || entry.status === '';
          console.log(`[loadReceivedOrders] Order ${entry.orderId} isPending=${isPending}, status="${entry.status}"`);
          return isPending;
        })
        .map((entry: any) => {
          // Convert ledger entry to Order format
          return {
            orderId: entry.orderId,
            supplyItem: entry.product,
            quantity: entry.quantity,
            unit: entry.unit || 'kg',
            price: entry.quantity > 0 ? entry.amount / entry.quantity : 0,
            totalAmount: entry.amount,
            from: entry.fromParty,
            fromDid: entry.fromDid,
            fromRole: entry.fromRole,
            toRole: user.role,
            status: 'Pending',
            deliveryPreference: entry.deliveryPreference || 'Standard',
            destination: entry.destination || 'To be determined',
            notes: entry.notes || undefined,
            createdAt: entry.timestamp,
          };
        });
      
      // Remove duplicates based on orderId (keep the most recent)
      const uniqueOrdersMap = new Map();
      receivedOrders.forEach((order: Order) => {
        if (!uniqueOrdersMap.has(order.orderId)) {
          uniqueOrdersMap.set(order.orderId, order);
        }
      });
      
      const uniqueOrders = Array.from(uniqueOrdersMap.values());
      
      // Sort by creation date (newest first)
      uniqueOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`[OrderSupplies] Loaded ${uniqueOrders.length} received orders for ${user.role}:`, uniqueOrders);
      setOrders(uniqueOrders);
    } catch (error) {
      console.error('Failed to load received orders', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getReceiverRoleForOrder = (fromRole: string) => {
    if (fromRole === 'CONSUMER') return 'RETAILER';
    if (fromRole === 'RETAILER') return 'TRANSPORTER';
    if (fromRole === 'TRANSPORTER') return 'FARMER';
    return null;
  };

  const loadUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user');
    }
  };

  const loadSupplies = async () => {
    try {
      setLoadingSupplies(true);
      const data = await suppliesService.getSupplies();
      setSupplies(data.supplies);
    } catch (error) {
      console.error('Failed to load supplies', error);
    } finally {
      setLoadingSupplies(false);
    }
  };

  // Get selected item details
  const selectedItem = supplies.find(item => item.id === formData.supplyItem);
  const availableStock = selectedItem?.quantityLeft || 0;
  const isOutOfStock = selectedItem && parseInt(formData.quantity) > availableStock;

  // Calculate order price
  const calculateOrderPrice = () => {
    if (!selectedItem || !formData.quantity) return 0;
    const quantity = parseInt(formData.quantity) || 0;
    const itemPrice = selectedItem.currentPrice;
    const subtotal = itemPrice * quantity;
    const priorityFee = formData.deliveryPreference === 'Priority' ? 50 : 0;
    return subtotal + priorityFee;
  };

  const orderPrice = calculateOrderPrice();
  const itemSubtotal = selectedItem && formData.quantity 
    ? selectedItem.currentPrice * (parseInt(formData.quantity) || 0) 
    : 0;
  const priorityFee = formData.deliveryPreference === 'Priority' ? 50 : 0;

  // Role-based access
  const canPlaceOrder = user?.role && ['TRANSPORTER', 'RETAILER', 'CONSUMER'].includes(user.role);
  const canReceiveOrder = user?.role && ['FARMER', 'TRANSPORTER', 'RETAILER'].includes(user.role);
  const isConsumer = user?.role === 'CONSUMER';

  // Ensure tab is set correctly when user loads
  useEffect(() => {
    if (user?.role) {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'receive' && canReceiveOrder) {
        setActiveTab('receive');
        if (user.role !== 'CONSUMER') {
          loadReceivedOrders();
        }
      }
    }
  }, [user, searchParams]);

  // Determine who receives orders based on role
  const getReceiverRole = () => {
    if (user?.role === 'CONSUMER') return 'RETAILER';
    if (user?.role === 'RETAILER') return 'TRANSPORTER';
    if (user?.role === 'TRANSPORTER') return 'FARMER';
    return null;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setOrderSuccess(null);

    // Validation
    if (!formData.supplyItem) {
      setFormErrors({ supplyItem: 'Please select a supply item' });
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setFormErrors({ quantity: 'Please enter a valid quantity' });
      return;
    }
    if (isOutOfStock) {
      setFormErrors({ quantity: 'Insufficient stock available' });
      return;
    }
    if (!formData.destination) {
      setFormErrors({ destination: 'Please enter a destination' });
      return;
    }

    // Show bill preview first
    setShowBill(true);
  };

  const getOrderSuppliesPath = () => {
    if (user?.role === 'TRANSPORTER') return '/dashboard/transporter/order-supplies';
    if (user?.role === 'RETAILER') return '/dashboard/retailer/order-supplies';
    if (user?.role === 'CONSUMER') return '/dashboard/consumer/order-supplies';
    if (user?.role === 'FARMER') return '/dashboard/farmer/order-supplies';
    return '/dashboard/order-supplies';
  };

  const confirmOrder = () => {
    if (!selectedItem || !user) return;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const receiverRole = getReceiverRole();

    // Create new order
    const newOrder: Order = {
      orderId,
      supplyItem: selectedItem.name,
      quantity: parseInt(formData.quantity),
      unit: selectedItem.unit,
      price: selectedItem.currentPrice,
      totalAmount: orderPrice,
      from: user.name || 'User',
      fromDid: user.did || '',
      fromRole: user.role,
      toRole: receiverRole || '',
      status: 'Pending',
      deliveryPreference: formData.deliveryPreference,
      destination: formData.destination,
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    // Note: Do NOT decrease quantity when order is placed
    // Quantity will only decrease when retailer accepts the order
    // This ensures accurate inventory tracking

    // Register order in Economic Ledger (Order Placed)
    const orderPlacedEntry = {
      txId: `TX-${orderId}-PLACED`,
      txHash: `HASH-${orderId}-PLACED-${Date.now()}`,
      prevTxHash: null,
      batchId: null,
      fromParty: user.name || 'User',
      toParty: receiverRole || 'Pending',
      fromDid: user.did || null,
      toDid: null,
      fromRole: user.role, // CRITICAL: Store the role of who placed the order
      product: selectedItem.name,
      quantity: parseInt(formData.quantity),
      unit: selectedItem.unit, // Store unit for display
      amount: orderPrice,
      paymentMethod: 'Order Placed',
      timestamp: new Date().toISOString(),
      currency: 'INR',
      entryType: 'ORDER_PLACED',
      orderId: orderId,
      status: 'Pending',
      deliveryPreference: formData.deliveryPreference, // Store delivery preference
      destination: formData.destination, // Store destination
      notes: formData.notes || null, // Store notes if any
    };
    
    // Save to localStorage for Economic Ledger display
    const existingLedger = JSON.parse(localStorage.getItem('unichain_economic_ledger_orders') || '[]');
    existingLedger.push(orderPlacedEntry);
    localStorage.setItem('unichain_economic_ledger_orders', JSON.stringify(existingLedger));
    
    console.log('[confirmOrder] Order placed and saved to ledger:', {
      orderId,
      fromRole: user.role,
      receiverRole,
      entry: orderPlacedEntry,
      totalEntries: existingLedger.length
    });
    
    console.log('[confirmOrder] Order placed and saved to ledger:', {
      orderId,
      fromRole: user.role,
      receiverRole,
      entry: orderPlacedEntry,
      totalEntries: existingLedger.length
    });

    // Add notification for order placed (to the person who placed it)
    addNotification({
      type: 'order_placed',
      orderId,
      message: `Your order ${orderId} has been placed successfully`,
      fromUser: user.name || 'User',
      fromRole: user.role,
      toRole: receiverRole || '',
      supplyItem: selectedItem.name,
      quantity: parseInt(formData.quantity),
      unit: selectedItem.unit,
      totalAmount: orderPrice,
    });

    // Add notification for order received (to all users of the receiver role)
    // This will be shown to all retailers/transporters/farmers based on the flow
    addNotification({
      type: 'order_received',
      orderId,
      message: `New order received: ${selectedItem.name} (${formData.quantity} ${selectedItem.unit}) from ${user.name || 'User'}`,
      fromUser: user.name || 'User',
      fromRole: user.role,
      toRole: receiverRole || '',
      supplyItem: selectedItem.name,
      quantity: parseInt(formData.quantity),
      unit: selectedItem.unit,
      totalAmount: orderPrice,
      actionUrl: `${getOrderSuppliesPath()}?tab=receive`,
    });

    // Store order for all roles to track their placed orders
    const orderStorageKey = `unichain_${user.role.toLowerCase()}_orders`;
    try {
      const existingOrders = JSON.parse(localStorage.getItem(orderStorageKey) || '[]');
      existingOrders.push(newOrder);
      localStorage.setItem(orderStorageKey, JSON.stringify(existingOrders));
    } catch (error) {
      console.error('Failed to store order', error);
    }

    // For consumer, also update local state for Active/Past Orders view
    if (user.role === 'CONSUMER') {
      setOrders([...orders, newOrder]);
    }

    // Show success message
    setOrderSuccess(`Order placed successfully for ${formData.quantity} ${selectedItem.unit} of ${selectedItem.name}. Total: ₹${orderPrice.toLocaleString('en-IN')}`);

    // Reset form
    setFormData({
      supplyItem: '',
      quantity: '',
      deliveryPreference: 'Standard',
      destination: '',
      notes: '',
    });
    setShowBill(false);
  };

  // Helper function to map display name to productId
  const getProductIdFromName = (displayName: string): string => {
    // Find the supply item by name
    const supplyItem = supplies.find(item => item.name.toLowerCase() === displayName.toLowerCase());
    if (supplyItem) {
      return supplyItem.id; // This is the productId (e.g., "APPLE", "POTATO")
    }
    // Fallback: convert display name to uppercase and remove spaces
    return displayName.toUpperCase().replace(/\s+/g, '');
  };

  const handleAcceptOrder = async (order: Order) => {
    // Only update supply quantity when a retailer accepts an order from a consumer
    // This represents the actual sale/fulfillment of the order
    if (user?.role === 'RETAILER' && order.fromRole === 'CONSUMER') {
      try {
        // Map display name to productId
        const productId = getProductIdFromName(order.supplyItem);
        console.log('[handleAcceptOrder] Updating supply quantity:', {
          displayName: order.supplyItem,
          productId,
          quantity: order.quantity,
          fromRole: order.fromRole,
          toRole: user.role
        });
        
        // Update supply quantity in database (decrease by order quantity)
        // This is when the actual sale happens - quantity decreases in database
        await suppliesService.updateSupplyQuantity(productId, order.quantity);
        console.log('[handleAcceptOrder] Supply quantity updated successfully');
        
        // Increment total produce sold for retailer in localStorage
        try {
          const currentTotal = parseFloat(localStorage.getItem('unichain_retailer_total_sold') || '1280');
          const newTotal = currentTotal + order.quantity;
          localStorage.setItem('unichain_retailer_total_sold', newTotal.toString());
        } catch (error) {
          console.error('Failed to update retailer total sold:', error);
        }
        
        // Reload supplies to reflect the change immediately
        await loadSupplies();
        
        // The Supplies page auto-refreshes every 5 seconds, so all users will see the updated quantity
      } catch (error: any) {
        console.error('[handleAcceptOrder] Failed to update supply quantity:', error);
        // Continue with order acceptance even if quantity update fails
      }
    }

    // Update order status
    const updatedOrders = orders.map(o => {
      if (o.orderId === order.orderId) {
        return { ...o, status: 'Accepted' as const };
      }
      return o;
    });
    setOrders(updatedOrders);

    // Update orders in localStorage for the role that placed the order
    const orderStorageKey = `unichain_${order.fromRole.toLowerCase()}_orders`;
    try {
      const saved = localStorage.getItem(orderStorageKey);
      const storedOrders = saved ? JSON.parse(saved) : [];
      const updatedOrders = storedOrders.map((o: Order) => {
        if (o.orderId === order.orderId) {
          return { ...o, status: 'Accepted' as const };
        }
        return o;
      });
      localStorage.setItem(orderStorageKey, JSON.stringify(updatedOrders));
      
      // If consumer, also update local state to reflect the change immediately
      if (order.fromRole === 'CONSUMER') {
        // Reload consumer orders from localStorage to get the updated status
        const updatedConsumerOrders = JSON.parse(localStorage.getItem('unichain_consumer_orders') || '[]');
        setOrders(updatedConsumerOrders);
      }
    } catch (error) {
      console.error('Failed to update orders', error);
    }

    // Remove all order_received notifications for this order (closes order for all)
    notifications.forEach(notif => {
      if (notif.orderId === order.orderId && notif.type === 'order_received') {
        removeNotification(notif.id);
      }
    });

    // Add notification for order accepted (to the person who placed the order)
    addNotification({
      type: 'order_accepted',
      orderId: order.orderId,
      message: `Your order ${order.orderId} has been accepted! ${order.supplyItem} (${order.quantity} ${order.unit}) - Total: ₹${order.totalAmount.toLocaleString('en-IN')}`,
      fromUser: user?.name || 'User',
      fromRole: user?.role || '',
      toRole: order.fromRole,
      supplyItem: order.supplyItem,
      quantity: order.quantity,
      unit: order.unit,
      totalAmount: order.totalAmount,
    });

    // Remove the "Order Placed" entry with status "Pending" from ledger and create "Order Accepted" entry
    const existingLedger = JSON.parse(localStorage.getItem('unichain_economic_ledger_orders') || '[]');
    
    // Find the pending order entry
    const pendingOrderIndex = existingLedger.findIndex((entry: any) => 
      entry.orderId === order.orderId && 
      (entry.entryType === 'ORDER_PLACED' || entry.status === 'Pending')
    );
    
    let pendingEntryHash = null;
    if (pendingOrderIndex !== -1) {
      const pendingEntry = existingLedger[pendingOrderIndex];
      pendingEntryHash = pendingEntry.txHash;
      // Remove the pending entry
      existingLedger.splice(pendingOrderIndex, 1);
    }
    
    // Create new "Order Accepted" entry with payment method "Order Accepted"
    const acceptedEntry = {
      txId: `TX-${order.orderId}-ACCEPTED`,
      txHash: `HASH-${order.orderId}-ACCEPTED-${Date.now()}`,
      prevTxHash: pendingEntryHash,
      batchId: null,
      fromParty: order.from,
      toParty: user?.name || 'User',
      fromDid: order.fromDid || null,
      toDid: user?.did || null,
      product: order.supplyItem,
      quantity: order.quantity,
      unit: order.unit,
      amount: order.totalAmount,
      paymentMethod: 'Order Accepted',
      timestamp: new Date().toISOString(),
      currency: 'INR',
      entryType: 'ORDER_ACCEPTED',
      orderId: order.orderId,
      status: 'Accepted',
    };
    
    // Add the new accepted entry
    existingLedger.push(acceptedEntry);
    
    // Save updated ledger
    localStorage.setItem('unichain_economic_ledger_orders', JSON.stringify(existingLedger));
    
    // Reload received orders to reflect the change (remove accepted order from list)
    // This will automatically remove the order from all retailers/transporters/farmers
    if (user?.role && user.role !== 'CONSUMER') {
      setTimeout(() => {
        loadReceivedOrders();
      }, 100);
    }

    // Show success toast
    setOrderSuccess(`Order ${order.orderId} accepted. Notification sent to ${order.from}.`);
    setTimeout(() => setOrderSuccess(null), 5000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'FARMER': 'Farmer',
      'TRANSPORTER': 'Transporter',
      'RETAILER': 'Retailer',
      'CONSUMER': 'Consumer',
    };
    return roleMap[role] || role;
  };

  const getDeliveryBadge = (preference: string) => {
    if (preference === 'Priority') {
      return { text: 'Priority', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    }
    if (preference === 'Cold Chain Required') {
      return { text: 'Cold Chain', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    }
    return { text: 'Standard', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Order Supplies</h1>
        <p className="text-gray-600 text-lg">Place and receive supply orders across the UNI-CHAIN network</p>
      </div>

      {/* Success Toast */}
      {orderSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{orderSuccess}</span>
        </div>
      )}


      {/* Tab Selector */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('place');
              setSearchParams({});
            }}
            disabled={!canPlaceOrder}
            className={`flex-1 px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
              activeTab === 'place' && canPlaceOrder
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : canPlaceOrder
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            title={!canPlaceOrder ? 'Not available for your role' : ''}
          >
            Place Order
          </button>
          {!isConsumer && (
            <button
              onClick={() => {
                setActiveTab('receive');
                setSearchParams({ tab: 'receive' });
              }}
              disabled={!canReceiveOrder}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
                activeTab === 'receive' && canReceiveOrder
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : canReceiveOrder
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title={!canReceiveOrder ? 'Not available for your role' : ''}
            >
              Received Order
            </button>
          )}
          {isConsumer && (
            <button
              onClick={() => {
                setActiveTab('receive');
                setSearchParams({ tab: 'receive' });
              }}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
                activeTab === 'receive'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active/Past Orders
            </button>
          )}
        </div>
      </div>

      {/* Place Order Section */}
      {activeTab === 'place' && canPlaceOrder && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Place New Order</h2>
              <p className="text-gray-600">Select supplies from available inventory and place your order</p>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Supply Item */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Supply Item
                  </span>
                </label>
                {loadingSupplies ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading supplies...</span>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.supplyItem}
                      onChange={(e) => {
                        setFormData({ ...formData, supplyItem: e.target.value });
                        setFormErrors({});
                        setShowBill(false);
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium ${
                        formErrors.supplyItem ? 'border-red-300' : 'border-gray-200'
                      }`}
                      required
                    >
                      <option value="">Select a supply item</option>
                      {supplies.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category}) - ₹{item.currentPrice.toFixed(2)}/{item.unit}
                        </option>
                      ))}
                    </select>
                    {formErrors.supplyItem && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.supplyItem}</p>
                    )}
                    {selectedItem && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                          selectedItem.quantityLeft > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {selectedItem.quantityLeft > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                        </div>
                        <span className="text-sm text-gray-600">
                          Available: <span className="font-semibold">{selectedItem.quantityLeft}</span> {selectedItem.unit}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quantity and Delivery Preference Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Quantity to Order
                    </span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => {
                      setFormData({ ...formData, quantity: e.target.value });
                      setFormErrors({});
                      setShowBill(false);
                    }}
                    min="1"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium ${
                      formErrors.quantity || isOutOfStock ? 'border-red-300' : 'border-gray-200'
                    }`}
                    required
                  />
                  {formErrors.quantity && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.quantity}</p>
                  )}
                  {isOutOfStock && formData.quantity && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">✗ Out of stock - Only {availableStock} {selectedItem?.unit} available</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Delivery Preference
                    </span>
                  </label>
                  <select
                    value={formData.deliveryPreference}
                    onChange={(e) => {
                      setFormData({ ...formData, deliveryPreference: e.target.value });
                      setShowBill(false);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Priority">Priority (+₹50)</option>
                    <option value="Cold Chain Required">Cold Chain Required</option>
                  </select>
                </div>
              </div>

              {/* Order Price Display */}
              {selectedItem && formData.quantity && parseInt(formData.quantity) > 0 && !isOutOfStock && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Order Price</h3>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
                      Live Calculation
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">
                        {selectedItem.name} × {formData.quantity} {selectedItem.unit}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        ₹{itemSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {priorityFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Priority Delivery Fee</span>
                        <span className="text-gray-900 font-semibold">₹{priorityFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t-2 border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-emerald-700">
                          ₹{orderPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Destination */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Destination Location
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => {
                    setFormData({ ...formData, destination: e.target.value });
                    setFormErrors({});
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium ${
                    formErrors.destination ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter delivery destination"
                  required
                />
                {formErrors.destination && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.destination}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes (Optional)
                  </span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium resize-none"
                  placeholder="Add any special instructions or notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isOutOfStock || !selectedItem || !formData.quantity}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Review Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      supplyItem: '',
                      quantity: '',
                      deliveryPreference: 'Standard',
                      destination: '',
                      notes: '',
                    });
                    setFormErrors({});
                    setShowBill(false);
                  }}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-base transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Bill Preview Modal */}
          {showBill && selectedItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Bill Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Order Bill</h2>
                      <p className="text-emerald-100 text-sm">Review your order before placing</p>
                    </div>
                    <button
                      onClick={() => setShowBill(false)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bill Content */}
                <div className="p-8 space-y-6">
                  {/* Order Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Details</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supply Item:</span>
                          <span className="font-semibold text-gray-900">{selectedItem.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-semibold text-gray-900">{formData.quantity} {selectedItem.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-semibold text-gray-900">₹{selectedItem.currentPrice.toFixed(2)}/{selectedItem.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Preference:</span>
                          <span className="font-semibold text-gray-900">{formData.deliveryPreference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Destination:</span>
                          <span className="font-semibold text-gray-900">{formData.destination}</span>
                        </div>
                        {formData.notes && (
                          <div>
                            <span className="text-gray-600 block mb-1">Notes:</span>
                            <span className="text-gray-900">{formData.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Price Breakdown</h3>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">
                            {selectedItem.name} × {formData.quantity} {selectedItem.unit}
                          </span>
                          <span className="text-gray-900 font-semibold text-lg">
                            ₹{itemSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {priorityFee > 0 && (
                          <div className="flex justify-between items-center pt-3 border-t border-emerald-200">
                            <div>
                              <span className="text-gray-700 font-medium">Priority Delivery Fee</span>
                              <p className="text-xs text-gray-500">Express delivery service</p>
                            </div>
                            <span className="text-gray-900 font-semibold text-lg">₹{priorityFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="pt-4 border-t-2 border-emerald-300">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Total Amount</span>
                            <span className="text-3xl font-bold text-emerald-700">
                              ₹{orderPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowBill(false)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold text-base transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmOrder}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Confirm & Place Order</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active/Past Orders Section - For Consumers Only */}
      {activeTab === 'receive' && isConsumer && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Active/Past Orders</h2>
            <p className="text-gray-600">Track all your orders and their current status</p>
            <p className="text-sm text-gray-500 mt-1">
              View all orders you've placed, from pending to delivered
            </p>
          </div>

          {loadingOrders ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="font-semibold text-gray-900 mb-1">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 mb-1">No orders yet</p>
              <p className="text-sm text-gray-500">Place your first order to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((order) => {
                  const deliveryBadge = getDeliveryBadge(order.deliveryPreference);
                  const isAccepted = order.status === 'Accepted' || order.status === 'Delivered';
                  const isPending = order.status === 'Pending';
                  
                  // Get status badge info
                  const getStatusBadge = () => {
                    if (isAccepted) {
                      return {
                        text: 'Delivered',
                        bgColor: 'bg-emerald-50',
                        color: 'text-emerald-700',
                        borderColor: 'border-emerald-200',
                        icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )
                      };
                    } else if (isPending) {
                      return {
                        text: 'Yet to be Accepted',
                        bgColor: 'bg-amber-50',
                        color: 'text-amber-700',
                        borderColor: 'border-amber-200',
                        icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )
                      };
                    }
                    return {
                      text: order.status,
                      bgColor: 'bg-gray-50',
                      color: 'text-gray-700',
                      borderColor: 'border-gray-200',
                      icon: null
                    };
                  };
                  
                  const statusBadge = getStatusBadge();
                  
                  return (
                    <div
                      key={order.orderId}
                      className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Status Indicator Bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        isAccepted ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-gray-400'
                      }`}></div>

                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                                {order.orderId}
                              </span>
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${deliveryBadge.bgColor} ${deliveryBadge.color} ${deliveryBadge.borderColor}`}>
                                {deliveryBadge.text}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{order.supplyItem}</h3>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${statusBadge.bgColor} ${statusBadge.color} ${statusBadge.borderColor}`}>
                            {statusBadge.icon}
                            <span className="text-xs font-semibold">{statusBadge.text}</span>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 font-medium">Quantity</span>
                            <span className="text-base font-bold text-gray-900">
                              {order.quantity} {order.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 font-medium">Unit Price</span>
                            <span className="text-base font-bold text-gray-900">
                              ₹{order.price.toFixed(2)}/{order.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                            <span className="text-sm text-gray-700 font-semibold">Total Amount</span>
                            <span className="text-lg font-bold text-emerald-700">
                              ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Destination</p>
                            <p className="text-sm font-semibold text-gray-900">{order.destination}</p>
                          </div>
                          {order.notes && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Notes</p>
                              <p className="text-sm text-gray-900">{order.notes}</p>
                            </div>
                          )}
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Order Date</p>
                            <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Received Order Section - Card Based (For Retailer, Transporter, Farmer) */}
      {activeTab === 'receive' && canReceiveOrder && !isConsumer && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Received Orders</h2>
            <p className="text-gray-600">Accept and manage orders assigned to you from the supply chain</p>
            <p className="text-sm text-gray-500 mt-1">
              All orders made by {user?.role === 'RETAILER' ? 'consumers' : user?.role === 'TRANSPORTER' ? 'retailers' : 'transporters'} will appear here. 
              When you accept an order, it will be removed from all other {user?.role === 'RETAILER' ? 'retailers' : user?.role === 'TRANSPORTER' ? 'transporters' : 'farmers'}.
            </p>
          </div>

          {loadingOrders ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="font-semibold text-gray-900 mb-1">Loading orders...</p>
            </div>
          ) : orders.filter(o => o.status !== 'Accepted').length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 mb-1">No pending orders</p>
              <p className="text-sm text-gray-500">New orders assigned to you will appear here</p>
              <p className="text-xs text-gray-400 mt-2">Check your notifications for new order alerts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.filter(o => o.status !== 'Accepted').map((order) => {
                const deliveryBadge = getDeliveryBadge(order.deliveryPreference);
                const isAccepted = order.status === 'Accepted';
                
                return (
                  <div
                    key={order.orderId}
                    className="group relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Status Indicator Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      isAccepted ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></div>

                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                              {order.orderId}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${deliveryBadge.bgColor} ${deliveryBadge.color} ${deliveryBadge.borderColor}`}>
                              {deliveryBadge.text}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{order.supplyItem}</h3>
                        </div>
                        {isAccepted && (
                          <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <span className="text-xs font-semibold text-emerald-700">✓ Accepted</span>
                          </div>
                        )}
                      </div>

                      {/* Order Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600 font-medium">Quantity</span>
                          <span className="text-base font-bold text-gray-900">
                            {order.quantity} {order.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600 font-medium">Unit Price</span>
                          <span className="text-base font-bold text-gray-900">
                            ₹{order.price.toFixed(2)}/{order.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                          <span className="text-sm text-gray-700 font-semibold">Total Amount</span>
                          <span className="text-lg font-bold text-emerald-700">
                            ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Ordered By</p>
                          <p className="text-sm font-semibold text-gray-900">{order.from}</p>
                          <p className="text-xs text-gray-500">{getRoleLabel(order.fromRole)}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Destination</p>
                          <p className="text-sm font-semibold text-gray-900">{order.destination}</p>
                        </div>
                        {order.notes && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Notes</p>
                            <p className="text-sm text-gray-900">{order.notes}</p>
                          </div>
                        )}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Order Date</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!isAccepted && (
                        <button
                          onClick={() => handleAcceptOrder(order)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Accept Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Disabled Tab Messages */}
      {activeTab === 'place' && !canPlaceOrder && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Not Available for Your Role</h3>
          <p className="text-gray-600">Place Order is only available for Transporter, Retailer, and Consumer roles.</p>
        </div>
      )}

      {activeTab === 'receive' && !canReceiveOrder && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Not Available for Your Role</h3>
          <p className="text-gray-600">Receive Order is only available for Farmer, Transporter, and Retailer roles.</p>
        </div>
      )}
    </div>
  );
}
