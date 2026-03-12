import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Receipt, MapPin, Timer, Bike, IndianRupee, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatCurrency } from '../utils/fareCalculator';

const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${id}`);
        if (data.booking.paymentStatus === 'paid') {
          navigate(`/payment-success/${id}`, { replace: true });
          return;
        }
        setBooking(data.booking);
      } catch {
        toast.error('Booking not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        setPaying(false);
        return;
      }

      const { data } = await api.post('/payments/create-order', { bookingId: id });

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Rounds',
        description: `Ride Payment - ${booking.bike?.name}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: id,
            });
            toast.success('Payment successful!');
            navigate(`/payment-success/${id}`, { replace: true });
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: {},
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
      setPaying(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) return null;

  const { fareBreakdown } = booking;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ride Complete</h1>
          <p className="text-gray-500 mt-1">Here's your ride summary</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50">
          {/* Ride Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{booking.bike?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{booking.bike?.type?.replace('-', ' ')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-bold text-gray-900">{formatDuration(booking.totalDuration)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-bold text-gray-900">{booking.totalDistance.toFixed(2)} km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Fare Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-semibold text-gray-900">{formatCurrency(fareBreakdown.baseFare)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance Fare ({booking.totalDistance.toFixed(2)} km)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(fareBreakdown.distanceFare)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Fare ({formatDuration(booking.totalDuration)})</span>
                <span className="font-semibold text-gray-900">{formatCurrency(fareBreakdown.timeFare)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{formatCurrency(fareBreakdown.totalFare)}</span>
              </div>
              <p className="text-xs text-gray-400 text-right">
                Charged by {fareBreakdown.distanceFare >= fareBreakdown.timeFare ? 'distance' : 'time'} (higher of the two)
              </p>
            </div>
          </div>

          {/* Pay Button */}
          <div className="p-6 pt-0">
            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {paying ? 'Processing...' : `Pay ${formatCurrency(fareBreakdown.totalFare)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
