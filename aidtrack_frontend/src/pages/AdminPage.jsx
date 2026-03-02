import { useEffect } from 'react';
import { useNavigate, Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons for tabs
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const StockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const RecordsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BeneficiaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-2.874M9 20H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2h4l2 3h4a2 2 0 012 2v3.5" /></svg>;
const TeamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

function AdminPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not an admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/volunteer');
    }
  }, [user, navigate]);

  const TabButton = ({ to, title, icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `flex items-center px-4 py-2.5 font-medium rounded-lg transition-all duration-300 ${isActive
          ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
          : 'text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm'
        }`}
    >
      {icon} {title}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-surface-50 p-4 md:p-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/50 to-transparent -z-10"></div>

      <header className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
            AidTrack
          </h1>
          <p className="text-gray-500 font-medium ml-1">Admin Portal</p>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/profile" className="flex items-center text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
              {user?.fullName?.charAt(0) || 'A'}
            </span>
            My Profile
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Tabs Navigation */}
        <nav className="flex flex-wrap gap-2 p-1.5 bg-gray-200/50 backdrop-blur-sm rounded-xl mb-8 w-fit">
          <TabButton to="dashboard" title="Dashboard" icon={<DashboardIcon />} />
          <TabButton to="stock" title="Inventory" icon={<StockIcon />} />
          <TabButton to="records" title="Records" icon={<RecordsIcon />} />
          <TabButton to="beneficiaries" title="Beneficiaries" icon={<BeneficiaryIcon />} />
          <TabButton to="team" title="Team" icon={<TeamIcon />} />
        </nav>

        {/* Main Content Area */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminPage;