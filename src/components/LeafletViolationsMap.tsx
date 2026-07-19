import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { MapPin, AlertCircle, Calendar, User } from 'lucide-react';

// Fix for default Leaflet icon issue in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletViolationsMapProps {
  violations: any[];
}

// Center of Yemen
const YEMEN_CENTER: [number, number] = [15.3694, 44.1910];

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const LeafletViolationsMap: React.FC<LeafletViolationsMapProps> = ({ violations }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Filter violations with coordinates
  const violationsWithCoords = violations.filter(v => v.latitude && v.longitude);

  return (
    <div className="w-full h-[600px] rounded-[32px] overflow-hidden border-8 border-white shadow-2xl relative z-10">
      <MapContainer 
        center={YEMEN_CENTER} 
        zoom={6} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {violationsWithCoords.map((v) => (
          <Marker 
            key={v.id} 
            position={[v.latitude, v.longitude]}
          >
            <Popup className="custom-leaflet-popup">
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <div className="flex items-center gap-2 mb-2 text-red-600 font-black uppercase tracking-widest text-[10px]">
                  <AlertCircle size={12} />
                  {v.type}
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{v.victimName}</h4>
                <p className="text-xs text-slate-500 mb-3">{v.governorate}</p>
                
                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Calendar size={12} className="text-blue-600" />
                    {v.date}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <User size={12} className="text-blue-600" />
                    {v.victimInstitution || (isRtl ? 'مستقل' : 'Freelance')}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
          background: #f8fafc;
          font-family: inherit;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 12px;
          min-width: 180px;
        }
      `}} />
    </div>
  );
};

export default LeafletViolationsMap;
