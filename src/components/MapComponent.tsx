import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapComponentProps {
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
  ip?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  lat = 47.3672,
  lon = 7.3417,
  city = 'Delémont',
  country = 'Switzerland',
  ip = '170.205.81.42',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create new leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 11,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // CARTO Voyager Tile Layer (Powered by OpenStreetMap data, high availability CDN)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Custom Neo-brutalist marker icon using HTML/SVG
      const customIcon = L.divIcon({
        className: 'custom-neo-marker',
        html: `
          <div style="
            background: #FFE600;
            border: 3px solid #000;
            box-shadow: 3px 3px 0px 0px #000;
            border-radius: 9999px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 14px;
          ">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #000; padding: 2px;">
          <div style="background: #22C55E; color: #000; border: 2px solid #000; padding: 2px 6px; display: inline-block; font-size: 11px; margin-bottom: 4px; font-weight: 800;">
            ${ip}
          </div>
          <div style="font-size: 14px; font-weight: 800;">${city}, ${country}</div>
          <div style="font-size: 11px; color: #444; font-family: monospace;">LAT: ${lat} | LON: ${lon}</div>
        </div>
      `;

      marker.bindPopup(popupContent).openPopup();

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Update position
      const map = mapInstanceRef.current;
      map.setView([lat, lon], 11);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
        markerRef.current.setPopupContent(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #000; padding: 2px;">
            <div style="background: #22C55E; color: #000; border: 2px solid #000; padding: 2px 6px; display: inline-block; font-size: 11px; margin-bottom: 4px; font-weight: 800;">
              ${ip}
            </div>
            <div style="font-size: 14px; font-weight: 800;">${city}, ${country}</div>
            <div style="font-size: 11px; color: #444; font-family: monospace;">LAT: ${lat} | LON: ${lon}</div>
          </div>
        `);
      }
    }
  }, [lat, lon, city, country, ip]);

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[320px] rounded-none z-0"
      />
      {/* Neo badge over map */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#FFE600] text-black border-2 border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#000]">
        LIVE MAP // {lat.toFixed(4)}, {lon.toFixed(4)}
      </div>
    </div>
  );
};
