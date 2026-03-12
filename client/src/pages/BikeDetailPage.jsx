import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Zap, Settings, CircleDot, Battery, MapPin, IndianRupee, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

const typeConfig = {
  'electric': { label: 'Electric', color: 'bg-emerald-500', icon: Zap, gradient: 'from-emerald-400 to-teal-500' },
  'with-gear': { label: 'With Gear', color: 'bg-indigo-500', icon: Settings, gradient: 'from-blue-400 to-indigo-500' },
  'gearless': { label: 'Gearless', color: 'bg-purple-500', icon: CircleDot, gradient: 'from-purple-400 to-fuchsia-500' },
};

const BikeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchBike = async () => {
      try {
        const { data } = await api.get(`/bikes/${id}`);
        setBike(data.bike);
      } catch {
        toast.error('Bike not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBike();
  }, [id, navigate]);

  const handleBook = async () => {
    setBooking(true);
    try {
      const { data } = await api.post('/bookings', { bikeId: id });
      toast.success('Booking created! Check your email for OTP.');
      navigate(`/booking/${data.booking._id}/otp`);
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.unpaidBookingId) {
        toast.error('You have an unpaid ride. Please complete payment first.');
        navigate(`/invoice/${errData.unpaidBookingId}`);
      } else if (errData?.booking) {
        const status = errData.booking.status;
        if (status === 'active') {
          toast.error('You have an active ride');
          navigate(`/ride/${errData.booking._id}`);
        } else if (status === 'reserved') {
          toast.error('You have a pending booking');
          navigate(`/booking/${errData.booking._id}/otp`);
        }
      } else {
        toast.error(errData?.message || 'Booking failed');
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!bike) return null;

  const config = typeConfig[bike.type];
  const Icon = config.icon;
  const position = [bike.location.coordinates[1], bike.location.coordinates[0]];

  const bikeIcon = L.divIcon({
    className: 'custom-bike-marker',
    html: `<div style="width:36px;height:36px;background:${bike.type === 'electric' ? '#10b981' : bike.type === 'with-gear' ? '#6366f1' : '#a855f7'};border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="m12 17.5 2-7 4 0"/><path d="M5.5 17.5 8 7l5.5 3"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-700 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50">
          {/* Mini Map */}
          <div className="h-48 relative">
            <MapContainer center={position} zoom={15} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={position} icon={bikeIcon} />
            </MapContainer>
            <div className="absolute top-3 left-3 z-[1000]">
              <span className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full text-white bg-gradient-to-r ${config.gradient} shadow-md`}>
                <Icon className="w-4 h-4" />
                {config.label}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{bike.name}</h1>

            {bike.type === 'electric' && bike.batteryLevel !== null && (
              <div className="flex items-center gap-2 mt-3">
                <Battery className="w-5 h-5 text-emerald-500" />
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full h-3 transition-all"
                    style={{ width: `${bike.batteryLevel}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-emerald-600">{bike.batteryLevel}%</span>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 text-center border border-indigo-100">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-extrabold text-gray-900">₹{bike.baseFare}</p>
                <p className="text-xs text-indigo-500 font-medium mt-0.5">Base Fare</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center border border-orange-100">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-extrabold text-gray-900">₹{bike.pricePerKm}</p>
                <p className="text-xs text-orange-500 font-medium mt-0.5">Per KM</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-100">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-extrabold text-gray-900">₹{bike.pricePerMin}</p>
                <p className="text-xs text-emerald-500 font-medium mt-0.5">Per Min</p>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={booking || !bike.available}
              className="w-full mt-6 bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {booking ? 'Booking...' : !bike.available ? 'Not Available' : 'Book This Ride'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeDetailPage;
