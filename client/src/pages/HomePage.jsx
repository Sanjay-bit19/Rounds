import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Zap, Settings, CircleDot, Navigation, Battery, Search, X, LocateFixed } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import MapView from '../components/Map/MapView';
import { haversineDistance } from '../utils/haversine';

const bikeTypeConfig = {
  'electric': { label: 'Electric', color: 'bg-emerald-500', textColor: 'text-emerald-600', icon: Zap, gradient: 'from-emerald-400 to-teal-500' },
  'with-gear': { label: 'With Gear', color: 'bg-blue-500', textColor: 'text-blue-600', icon: Settings, gradient: 'from-blue-400 to-indigo-500' },
  'gearless': { label: 'Gearless', color: 'bg-purple-500', textColor: 'text-purple-600', icon: CircleDot, gradient: 'from-purple-400 to-fuchsia-500' },
};

const HomePage = () => {
  const [bikes, setBikes] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [selectedBike, setSelectedBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback to Bangalore center
          setUserPosition([12.9716, 77.5946]);
          setLocationName('Bangalore (Default)');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserPosition([12.9716, 77.5946]);
      setLocationName('Bangalore (Default)');
    }
  }, []);

  // Reverse geocode to get location name
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
      );
      const data = await res.json();
      const name = data.address?.suburb || data.address?.city || data.address?.town || data.display_name?.split(',')[0] || 'Current Location';
      setLocationName(name);
    } catch {
      setLocationName('Current Location');
    }
  };

  // Search locations using Nominatim - biased toward current position
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Build a viewbox around the user's current position (~30km radius)
      // This biases results toward nearby locations (e.g. neighborhoods in same city)
      let viewboxParam = '';
      if (userPosition) {
        const [lat, lng] = userPosition;
        const delta = 0.3; // ~30km bias radius
        viewboxParam = `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}&bounded=0`;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1${viewboxParam}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  const handleSearchInput = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchLocations(value), 400);
  };

  // Select a search result
  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setUserPosition([lat, lng]);
    const name = result.display_name.split(',').slice(0, 2).join(',');
    setLocationName(name);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    toast.success(`Location set to ${name}`);
  };

  // Use current GPS location
  const useMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setShowSearch(false);
          setSearchQuery('');
          toast.success('Using your current location');
        },
        () => toast.error('Could not get your location'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Fetch bikes
  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const params = userPosition
          ? { lat: userPosition[0], lng: userPosition[1], radius: 3 }
          : {};
        const { data } = await api.get('/bikes', { params });
        setBikes(data.bikes);
      } catch (error) {
        toast.error('Failed to load bikes');
      } finally {
        setLoading(false);
      }
    };
    fetchBikes();
  }, [userPosition]);

  const getDistance = (bike) => {
    if (!userPosition) return null;
    const [lng, lat] = bike.location.coordinates;
    return haversineDistance(userPosition[0], userPosition[1], lat, lng);
  };

  const filteredBikes = filterType === 'all'
    ? bikes
    : bikes.filter((b) => b.type === filterType);

  const sortedBikes = [...filteredBikes].sort((a, b) => {
    const distA = getDistance(a);
    const distB = getDistance(b);
    if (distA === null || distB === null) return 0;
    return distA - distB;
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
              <p className="text-sm font-medium text-indigo-600 animate-pulse">Finding rides near you...</p>
            </div>
          </div>
        ) : (
          <MapView
            bikes={filteredBikes}
            userPosition={userPosition}
            onBikeSelect={setSelectedBike}
            selectedBikeId={selectedBike?._id}
          />
        )}

        {/* Location Search Bar - overlayed on map */}
        <div className="absolute top-4 left-4 right-4 z-10 max-w-md" ref={searchRef}>
          <div
            className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl border border-white/50 overflow-hidden transition-all"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setShowSearch(true)}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              {showSearch ? (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Search for a location..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                  autoFocus
                />
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Your location</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{locationName || 'Detecting...'}</p>
                </div>
              )}
              {showSearch ? (
                <button onClick={(e) => { e.stopPropagation(); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearch && (
              <div className="border-t border-gray-100">
                <button
                  onClick={useMyLocation}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
                >
                  <LocateFixed className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-600">Use my current location</span>
                </button>
                {searching && (
                  <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                )}
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => selectLocation(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{result.display_name}</span>
                  </button>
                ))}
                {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recenter button */}
        {userPosition && (
          <button
            onClick={() => setUserPosition([...userPosition])}
            className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-3 hover:bg-white transition-all hover:shadow-xl group"
            title="Center on my location"
          >
            <Navigation className="w-5 h-5 text-indigo-500 group-hover:text-orange-500 transition-colors" />
          </button>
        )}
      </div>

      {/* Bike List Sidebar */}
      <div className="w-full lg:w-[400px] bg-gradient-to-b from-slate-50 to-white border-t lg:border-t-0 lg:border-l border-gray-200/50 flex flex-col max-h-[50vh] lg:max-h-full">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Available Rides
            <span className="ml-auto text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              {filteredBikes.length} bikes
            </span>
          </h2>

          {/* Filter pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'electric', label: 'Electric' },
              { key: 'with-gear', label: 'With Gear' },
              { key: 'gearless', label: 'Gearless' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  filterType === key
                    ? 'bg-white text-indigo-700 shadow-md'
                    : 'bg-white/15 text-white/90 hover:bg-white/25 backdrop-blur-sm'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bike List */}
        <div className="flex-1 overflow-y-auto">
          {sortedBikes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MapPin className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium">No bikes available</p>
              <p className="text-sm mt-1">Try changing your location or filter</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {sortedBikes.map((bike) => {
                const config = bikeTypeConfig[bike.type];
                const distance = getDistance(bike);
                const Icon = config.icon;

                return (
                  <button
                    key={bike._id}
                    onClick={() => {
                      setSelectedBike(bike);
                      navigate(`/bike/${bike._id}`);
                    }}
                    className={`w-full p-4 text-left rounded-xl transition-all group ${
                      selectedBike?._id === bike._id
                        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 ring-2 ring-indigo-400 shadow-md'
                        : 'bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{bike.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r ${config.gradient}`}>
                            <Icon className="w-3 h-3" />
                            {config.label}
                          </span>
                          {bike.type === 'electric' && bike.batteryLevel !== null && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                              <Battery className="w-3 h-3" />
                              {bike.batteryLevel}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                          ₹{bike.pricePerKm}<span className="text-xs font-normal text-gray-400">/km</span>
                        </p>
                        {distance !== null && (
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
