import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Bike, MapPin, Timer, IndianRupee, CheckCircle, Clock, TrendingUp, Route, Gauge } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils/fareCalculator';

const typeColors = {
  'electric': 'bg-emerald-100 text-emerald-700',
  'with-gear': 'bg-indigo-100 text-indigo-700',
  'gearless': 'bg-purple-100 text-purple-700',
};

const PIE_COLORS = {
  electric: '#10b981',
  'with-gear': '#6366f1',
  gearless: '#a855f7',
};

const RideHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/bookings/history');
        setBookings(data.bookings);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    if (!bookings.length) return null;
    const totalRides = bookings.length;
    const totalDistance = bookings.reduce((sum, b) => sum + (b.totalDistance || 0), 0);
    const totalSpent = bookings.reduce((sum, b) => sum + (b.fareBreakdown?.totalFare || 0), 0);
    const avgDuration = bookings.reduce((sum, b) => sum + (b.totalDuration || 0), 0) / totalRides;
    return { totalRides, totalDistance, totalSpent, avgDuration };
  }, [bookings]);

  // Spending over time (grouped by date, chronological)
  const spendingData = useMemo(() => {
    const dateMap = {};
    bookings.forEach((b) => {
      const date = new Date(b.endTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dateMap[date] = (dateMap[date] || 0) + (b.fareBreakdown?.totalFare || 0);
    });
    return Object.entries(dateMap)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .reverse();
  }, [bookings]);

  // Rides by bike type
  const typeData = useMemo(() => {
    const typeMap = {};
    bookings.forEach((b) => {
      const type = b.bike?.type || 'unknown';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const typeLabels = { electric: 'Electric', 'with-gear': 'With Gear', gearless: 'Gearless' };
    return Object.entries(typeMap).map(([type, count]) => ({
      name: typeLabels[type] || type,
      value: count,
      type,
    }));
  }, [bookings]);

  // Distance per ride (for bar chart, chronological)
  const distanceData = useMemo(() => {
    return [...bookings]
      .reverse()
      .map((b, i) => ({
        ride: `#${i + 1}`,
        distance: Math.round((b.totalDistance || 0) * 100) / 100,
        name: b.bike?.name || 'Ride',
      }));
  }, [bookings]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="text-gray-500 font-medium">{label}</p>
          <p className="text-gray-900 font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const DistanceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="text-gray-500 font-medium">{payload[0].payload.name}</p>
          <p className="text-gray-900 font-bold">{payload[0].value} km</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bike className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-lg">No rides yet</p>
            <Link to="/" className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-semibold">
              Book your first ride
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                    <Bike className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Rides</span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{stats.totalRides}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <Route className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Distance</span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{stats.totalDistance.toFixed(1)} <span className="text-sm font-normal text-gray-400">km</span></p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Spent</span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Avg Duration</span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{Math.round(stats.avgDuration)} <span className="text-sm font-normal text-gray-400">min</span></p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Spending Over Time - Takes 2 cols */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Spending Over Time
                </h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendingData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#6366f1"
                        fill="url(#spendGradient)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rides by Type - Donut */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-indigo-500" />
                  Rides by Type
                </h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {typeData.map((entry) => (
                          <Cell key={entry.type} fill={PIE_COLORS[entry.type] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} ride${value > 1 ? 's' : ''}`, name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Distance Per Ride Bar Chart */}
            {distanceData.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Distance Per Ride
                </h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distanceData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="ride" tick={{ fontSize: 11 }} stroke="#cbd5e1" tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} stroke="#cbd5e1" tickLine={false} tickFormatter={(v) => `${v}km`} />
                      <Tooltip content={<DistanceTooltip />} />
                      <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Ride Cards List */}
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              All Rides
            </h2>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100/50 p-5 hover:shadow-md transition-all hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{booking.bike?.name || 'Unknown Bike'}</h3>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${typeColors[booking.bike?.type] || 'bg-gray-100 text-gray-600'}`}>
                        {booking.bike?.type?.replace('-', ' ') || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        {formatCurrency(booking.fareBreakdown?.totalFare || 0)}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {booking.paymentStatus === 'paid' ? (
                          <><CheckCircle className="w-3 h-3" /> Paid</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Pending</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Timer className="w-3.5 h-3.5" />
                      <span>{Math.round(booking.totalDuration)} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{booking.totalDistance?.toFixed(2)} km</span>
                    </div>
                    <div className="text-right text-gray-400 text-xs">
                      {booking.endTime ? formatDate(booking.endTime) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RideHistoryPage;
