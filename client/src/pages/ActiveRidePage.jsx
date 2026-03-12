import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Timer, MapPin, IndianRupee, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { haversineDistance } from '../utils/haversine';
import { calculateFare, formatCurrency } from '../utils/fareCalculator';
import 'leaflet/dist/leaflet.css';

const userIcon = L.divIcon({
  className: 'ride-user-marker',
  html: `<div style="width:24px;height:24px;background:linear-gradient(135deg, #f97316, #e11d48);border:3px solid white;border-radius:50%;box-shadow:0 0 0 8px rgba(249,115,22,0.2),0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const FollowUser = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const ActiveRidePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [pathPositions, setPathPositions] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [fare, setFare] = useState(null);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  // Fetch booking
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${id}`);
        if (data.booking.status !== 'active') {
          if (data.booking.status === 'reserved') {
            navigate(`/booking/${id}/otp`, { replace: true });
          } else if (data.booking.status === 'completed') {
            navigate(`/invoice/${id}`, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
          return;
        }
        setBooking(data.booking);

        // Restore waypoints if any
        if (data.booking.waypoints?.length > 0) {
          const positions = data.booking.waypoints.map((w) => [w.lat, w.lng]);
          setPathPositions(positions);
          const lastWp = positions[positions.length - 1];
          setCurrentPosition(lastWp);
        }

        // Calculate elapsed time from startTime
        const startTime = new Date(data.booking.startTime);
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      } catch {
        toast.error('Booking not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  // Timer
  useEffect(() => {
    if (!booking) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // Geolocation tracking
  useEffect(() => {
    if (!booking) return;

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setCurrentPosition(newPos);

          setPathPositions((prev) => {
            const updated = [...prev, newPos];
            // Calculate distance
            if (prev.length > 0) {
              const lastPos = prev[prev.length - 1];
              const dist = haversineDistance(lastPos[0], lastPos[1], newPos[0], newPos[1]);
              // Only add if moved more than 5 meters (0.005 km) to filter GPS noise
              if (dist > 0.005) {
                setTotalDistance((d) => d + dist);
                return updated;
              }
            }
            return prev.length === 0 ? updated : prev;
          });

          // Send location to server every 10 seconds
          const now = Date.now();
          if (now - lastSentRef.current > 10000) {
            lastSentRef.current = now;
            api.post(`/bookings/${id}/location`, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }).catch(() => {});
          }
        },
        (err) => {
          if (!currentPosition) {
            // Use start location as fallback
            if (booking.startLocation?.coordinates) {
              const [lng, lat] = booking.startLocation.coordinates;
              setCurrentPosition([lat, lng]);
            }
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [booking, id]);

  // Update fare
  useEffect(() => {
    if (!booking?.bike) return;
    const durationMinutes = elapsedSeconds / 60;
    const fareData = calculateFare({
      baseFare: booking.bike.baseFare,
      pricePerKm: booking.bike.pricePerKm,
      pricePerMin: booking.bike.pricePerMin,
      distanceKm: totalDistance,
      durationMinutes,
    });
    setFare(fareData);
  }, [elapsedSeconds, totalDistance, booking]);

  const handleEndRide = async () => {
    setEnding(true);
    try {
      const endData = currentPosition
        ? { lat: currentPosition[0], lng: currentPosition[1] }
        : {};
      await api.post(`/bookings/${id}/end`, endData);
      toast.success('Ride ended!');
      navigate(`/invoice/${id}`, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end ride');
    } finally {
      setEnding(false);
      setShowEndModal(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) return null;

  const mapCenter = currentPosition || [12.9716, 77.5946];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={16} className="w-full h-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {currentPosition && (
            <>
              <Marker position={currentPosition} icon={userIcon} />
              <FollowUser position={currentPosition} />
            </>
          )}
          {pathPositions.length > 1 && (
            <Polyline positions={pathPositions} color="#6366f1" weight={4} opacity={0.7} />
          )}
        </MapContainer>

        {/* Ride info overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Riding</p>
                <p className="font-bold text-gray-900">{booking.bike?.name}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Timer className="w-4 h-4 text-indigo-500" />
              <span className="text-xs">Duration</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 font-mono">{formatTime(elapsedSeconds)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="text-xs">Distance</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{totalDistance.toFixed(2)} <span className="text-sm">km</span></p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              <span className="text-xs">Fare</span>
            </div>
            <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{fare ? formatCurrency(fare.totalFare) : '₹0'}</p>
            {fare && (
              <p className="text-[10px] text-gray-400">
                {fare.fareType === 'distance' ? 'distance based' : 'time based'}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowEndModal(true)}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <StopCircle className="w-5 h-5" />
          End Ride
        </button>
      </div>

      {/* End Ride Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">End Ride?</h3>
            <p className="text-gray-500 mt-2">
              Your ride will be ended and you'll be charged based on the distance and time traveled.
            </p>
            {fare && (
              <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mt-3">
                Estimated: {formatCurrency(fare.totalFare)}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continue Ride
              </button>
              <button
                onClick={handleEndRide}
                disabled={ending}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all"
              >
                {ending ? 'Ending...' : 'End Ride'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveRidePage;
