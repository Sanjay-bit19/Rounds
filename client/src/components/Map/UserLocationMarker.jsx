import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #f97316, #e11d48);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(249, 115, 22, 0.2), 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const UserLocationMarker = ({ position }) => {
  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <span className="font-semibold text-indigo-700">You are here</span>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;
