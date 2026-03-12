import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Home, History } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/fareCalculator';

const PaymentSuccessPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${id}`);
        setBooking(data.booking);
      } catch {
        navigate('/');
      }
    };
    fetchBooking();
  }, [id, navigate]);

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-6 shadow-lg shadow-emerald-500/25">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="text-gray-500 mt-2">Your ride has been completed and payment processed.</p>

        {booking && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 text-left border border-white/50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500">Bike</span>
              <span className="font-bold text-gray-900">{booking.bike?.name}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500">Distance</span>
              <span className="font-bold text-gray-900">{booking.totalDistance?.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500">Duration</span>
              <span className="font-bold text-gray-900">{Math.round(booking.totalDuration)} min</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900">Amount Paid</span>
              <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {formatCurrency(booking.fareBreakdown?.totalFare || 0)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Link
            to="/"
            className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Map
          </Link>
          <Link
            to="/history"
            className="flex-1 border-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <History className="w-5 h-5" />
            Ride History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
