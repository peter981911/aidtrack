import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ProfilePage from './pages/ProfilePage';

// Layout Pages
import AdminPage from './pages/AdminPage';
import VolunteerPage from './pages/VolunteerPage';

// Admin Components
import Dashboard from './components/Dashboard';
import StockManager from './components/StockManager';
import RecordsTable from './components/RecordsTable';
import BeneficiariesPage from './components/BeneficiariesPage';
import TeamManagementPage from './components/TeamManagementPage';

// Volunteer Components
import DistributionForm from './components/DistributionForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminPage />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="stock" element={<StockManager />} />
                <Route path="records" element={<RecordsTable />} />
                <Route path="beneficiaries" element={<BeneficiariesPage />} />
                <Route path="team" element={<TeamManagementPage />} />
              </Route>
            </Route>

            {/* Protected Volunteer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['volunteer']} />}>
              <Route path="/volunteer" element={<VolunteerPage />}>
                <Route index element={<Navigate to="distribute" replace />} />
                <Route path="distribute" element={<DistributionForm />} />
                <Route path="records" element={<RecordsTable />} />
                <Route path="beneficiaries" element={<BeneficiariesPage />} />
              </Route>
            </Route>

            {/* Protected Profile Route (accessible by anyone logged in) */}
            <Route element={<ProtectedRoute allowedRoles={['volunteer', 'admin']} />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Optional: Add a 404 Not Found route */}
            <Route path="*" element={<Navigate to="/login" />} />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;