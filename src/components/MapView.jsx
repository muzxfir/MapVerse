import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.divIcon({
  className: "custom-country-marker",
  html: '<span>●</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
});

function MapController({ country }) {
  const map = useMap();

  useEffect(() => {
    if (country?.latlng?.length === 2) {
      map.flyTo(country.latlng, 5, {
        duration: 1.3,
      });
    }
  }, [country, map]);

  return null;
}

export default function MapView({ country }) {
  const position =
    country?.latlng?.length === 2 ? country.latlng : [20, 0];

  return (
    <div className="leaflet-map-card">
      <MapContainer
        center={position}
        zoom={country ? 5 : 2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController country={country} />

        {country?.latlng?.length === 2 && (
          <Marker position={country.latlng} icon={markerIcon}>
            <Popup>
              <strong>{country.name.common}</strong>
              <br />
              Capital: {country.capital?.[0] || "N/A"}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="leaflet-map-label">
        <span>Live Map</span>
        <strong>{country?.name?.common || "World"}</strong>
      </div>
    </div>
  );
}
