import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bike, User, LogOut, History, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-orange-300 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-lg flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <span>Rounds</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link to="/" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all font-medium">
                  Map
                </Link>
                <Link to="/history" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  Rides
                </Link>
                <Link to="/profile" className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {user?.name?.split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-white/70 hover:text-rose-300 hover:bg-rose-500/10 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-md pb-4">
          <div className="px-4 pt-2 space-y-1">
            {isAuthenticated ? (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all">Map</Link>
                <Link to="/history" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all">Ride History</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2.5 px-3 text-rose-400 hover:bg-rose-500/10 rounded-lg font-medium transition-all">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-orange-400 hover:text-orange-300 font-medium transition-all">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
