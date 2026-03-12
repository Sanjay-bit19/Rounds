import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

const bikeColors = {
  'electric': '#10b981',    // green
  'with-gear': '#6366f1',   // indigo
  'gearless': '#a855f7',    // purple
};

const bikeLabels = {
  'electric': 'Electric',
  'with-gear': 'With Gear',
  'gearless': 'Gearless',
};

const createBikeIcon = (type, isSelected) => {
  const color = bikeColors[type] || '#6b7280';
  const size = isSelected ? 42 : 34;

  return L.divIcon({
    className: 'custom-bike-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 12px rgba(0,0,0,0.25)${isSelected ? ', 0 0 0 4px ' + color + '40' : ''};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        ${isSelected ? 'transform: scale(1.1);' : ''}
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18.5" cy="17.5" r="3.5"/>
          <circle cx="5.5" cy="17.5" r="3.5"/>
          <circle cx="15" cy="5" r="1"/>
          <path d="m12 17.5 2-7 4 0"/>
          <path d="M5.5 17.5 8 7l5.5 3"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const BikeMarker = ({ bike, isSelected, onClick }) => {
  const navigate = useNavigate();
  const position = [bike.location.coordinates[1], bike.location.coordinates[0]]; // [lat, lng]

  return (
    <Marker
      position={position}
      icon={createBikeIcon(bike.type, isSelected)}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="min-w-[200px] p-1">
          <h3 className="font-bold text-gray-900 text-base">{bike.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: bikeColors[bike.type] }}
            >
              {bikeLabels[bike.type]}
            </span>
            {bike.type === 'electric' && bike.batteryLevel !== null && (
              <span className="text-xs text-emerald-600 font-medium">
                {bike.batteryLevel}% charged
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600 space-y-0.5">
            <p>Base fare: <span className="font-bold text-gray-800">₹{bike.baseFare}</span></p>
            <p>Per km: <span className="font-bold text-gray-800">₹{bike.pricePerKm}</span></p>
          </div>
          <button
            onClick={() => navigate(`/bike/${bike._id}`)}
            className="mt-3 w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold py-2 rounded-lg transition-all shadow-sm"
          >
            View & Book
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default BikeMarker;
