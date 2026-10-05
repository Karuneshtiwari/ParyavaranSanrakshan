import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Dynamic Map Centering and Smooth FlyTo on Bin Selection
const MapUpdater = ({ selectedBin }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedBin && selectedBin.latitude && selectedBin.longitude) {
      map.flyTo([selectedBin.latitude, selectedBin.longitude], 16, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedBin, map]);
  return null;
};

// Custom SVG Bin Icon Generator for Leaflet Map
const createBinIcon = (status, isSelected = false) => {
  const color = status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#f59e0b' : '#10b981';
  const size = isSelected ? 44 : 36;
  const anchor = size / 2;
  const glow = isSelected ? `box-shadow: 0 0 20px ${color}, 0 4px 10px rgba(0,0,0,0.5); transform: scale(1.15);` : 'box-shadow: 0 4px 8px rgba(0,0,0,0.3);';

  const svgHtml = `
    <div style="position: relative; width: ${size}px; height: ${size}px; transition: all 0.3s ease;">
      <div style="position: absolute; inset: 0; background-color: ${color}; border-radius: 50%; opacity: ${isSelected ? 0.35 : 0.2};" class="${status === 'Critical' || isSelected ? 'animate-pulse' : ''}"></div>
      <div style="position: absolute; inset: 3px; background-color: ${color}; border: 2.5px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; ${glow}">
        <!-- Authentic Municipal Waste Bin SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-bin-marker',
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor],
  });
};

export const BinMap = ({ bins = [], selectedBin = null, onSelectBin = null }) => {
  const defaultCenter = [12.9716, 77.5946]; // Bengaluru Metropolitan centroid

  return (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-emerald-900/20 shadow-xl relative z-10">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <MapUpdater selectedBin={selectedBin} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bins.map((bin) => {
          const isSelected = selectedBin?.id === bin.id;
          const icon = createBinIcon(bin.status, isSelected);
          const pred = bin.latest_prediction;

          return (
            <Marker
              key={bin.id}
              position={[bin.latitude, bin.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectBin) onSelectBin(bin);
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[210px] text-slate-900">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                    <span className="font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded font-mono">
                      {bin.bin_code}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      bin.status === 'Critical' ? 'bg-red-100 text-red-700' :
                      bin.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {bin.status}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-900">{bin.location_name}</h4>
                  <p className="text-[11px] text-slate-500 mb-2">{bin.waste_type}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Current Fill</span>
                      <strong className="text-sm font-bold text-slate-800">{bin.current_fill}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Pred 6h</span>
                      <strong className="text-sm font-bold text-slate-800">
                        {pred ? `${pred.predicted_6h}%` : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] flex justify-between items-center text-slate-600">
                    <span>Overflow Risk:</span>
                    <span className={`font-bold ${
                      pred?.risk_level === 'HIGH' ? 'text-red-600' :
                      pred?.risk_level === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {pred ? pred.risk_level : 'LOW'}
                    </span>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    Last collection: {new Date(bin.last_collection).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-xl shadow-lg z-[1000] text-xs space-y-1">
        <div className="font-semibold text-[11px] text-slate-300 uppercase tracking-wider mb-1">Bin Status</div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Normal (&lt;60%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Warning (60-79%)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Critical (&ge;80% / High Risk)</span>
        </div>
      </div>
    </div>
  );
};
