import { useNavigate, Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons
const FormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const RecordsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BeneficiaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-2.874M9 20H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2h4l2 3h4a2 2 0 012 2v3.5" /></svg>;

function VolunteerPage() {
  const { logout, user } = useAuth();

  const TabButton = ({ to, title, icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `flex items-center px-4 py-2.5 font-medium rounded-lg transition-all duration-300 ${isActive
        ? 'bg-secondary text-white shadow-lg shadow-secondary/30 transform scale-105'
        : 'text-gray-600 hover:bg-white hover:text-secondary hover:shadow-sm'
        }`}
    >
      {icon} {title}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-surface-50 p-4 md:p-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50 to-transparent -z-10"></div>

      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
        <div>
          <h1 className="text-4xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-teal-600">
            AidTrack
          </h1>
          <p className="text-gray-500 font-medium ml-1">Volunteer Portal</p>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/profile" className="flex items-center text-sm font-semibold text-gray-600 hover:text-secondary transition-colors">
            <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mr-2">
              {user?.fullName?.charAt(0) || 'V'}
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

      <div className="max-w-5xl mx-auto animate-fade-in">
        <nav className="flex space-x-2 p-1.5 bg-gray-200/50 backdrop-blur-sm rounded-xl mb-8 w-fit">
          <TabButton to="distribute" title="New Entry" icon={<FormIcon />} />
          <TabButton to="records" title="My Records" icon={<RecordsIcon />} />
          <TabButton to="beneficiaries" title="Beneficiaries" icon={<BeneficiaryIcon />} />
        </nav>

        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default VolunteerPage;