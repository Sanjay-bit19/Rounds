import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BikeMarker from './BikeMarker';
import UserLocationMarker from './UserLocationMarker';

// Fix default marker icon issue with Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
};

const MapView = ({ bikes, userPosition, onBikeSelect, selectedBikeId }) => {
  const defaultCenter = [12.9716, 77.5946]; // Bangalore
  const center = userPosition || defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="w-full h-full rounded-xl"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap position={userPosition} />

      {userPosition && <UserLocationMarker position={userPosition} />}

      {bikes.map((bike) => (
        <BikeMarker
          key={bike._id}
          bike={bike}
          isSelected={selectedBikeId === bike._id}
          onClick={() => onBikeSelect(bike)}
        />
      ))}
    </MapContainer>
  );
};

export default MapView;
