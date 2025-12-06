import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import RegisterFarmer from './pages/RegisterFarmer';
import RegisterTransporter from './pages/RegisterTransporter';
import RegisterRetailer from './pages/RegisterRetailer';
import RegisterConsumer from './pages/RegisterConsumer';
import Login from './pages/Login';
import VerifyIdentity from './pages/VerifyIdentity';
import ConsumerPortal from './pages/ConsumerPortal';
import ZKPVerification from './pages/ZKPVerification';
import Analytics from './pages/Analytics';
import DashboardLayout from './components/DashboardLayout';
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import TransporterDashboard from './pages/dashboard/TransporterDashboard';
import TransportLogPage from './pages/dashboard/TransportLogPage';
import RetailerDashboard from './pages/dashboard/RetailerDashboard';
import ConsumerDashboard from './pages/dashboard/ConsumerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Account from './pages/dashboard/Account';
import Ledger from './pages/Ledger';
import RegisterProducePage from './pages/dashboard/RegisterProducePage';
import RetailerLogPage from './pages/dashboard/RetailerLogPage';
import TrackProducts from './pages/dashboard/TrackProducts';
import Supplies from './pages/dashboard/Supplies';
import OrderSupplies from './pages/dashboard/OrderSupplies';
import Notifications from './pages/dashboard/Notifications';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/farmer" element={<RegisterFarmer />} />
        <Route path="/register/transporter" element={<RegisterTransporter />} />
        <Route path="/register/retailer" element={<RegisterRetailer />} />
        <Route path="/register/consumer" element={<RegisterConsumer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-identity" element={<VerifyIdentity />} />
        <Route path="/trace" element={<ConsumerPortal />} />
        <Route path="/consumer-portal" element={<ConsumerPortal />} />
        <Route path="/zkp-verification" element={<ZKPVerification />} />
        
        <Route
          path="/dashboard/farmer"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <FarmerDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/farmer/register-produce"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RegisterProducePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/farmer/track-products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TrackProducts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/farmer/supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Supplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transporter"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TransporterDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transporter/transport-log"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TransportLogPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transporter/track-products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TrackProducts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transporter/supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Supplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transporter/order-supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <OrderSupplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/retailer"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RetailerDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/retailer/retailer-log"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RetailerLogPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/retailer/track-products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TrackProducts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/retailer/supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Supplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/retailer/order-supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <OrderSupplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consumer"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ConsumerDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consumer/track-products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TrackProducts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consumer/supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Supplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/consumer/order-supplies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <OrderSupplies />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ledger"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Ledger />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Account />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/farmer"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Account />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/transporter"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Account />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/retailer"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Account />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/consumer"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Account />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;

