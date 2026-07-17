import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ShieldAlert, X, ChevronRight, Activity, Calendar, Award, Info, RefreshCw, Eye, Image as ImageIcon } from 'lucide-react';
import L from 'leaflet';

// Define the tile imagery providers
const TILE_STREETS = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTRIBUTION_STREETS = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const TILE_SATELLITE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ATTRIBUTION_SATELLITE = "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

interface YemenMapProps {
  data: Record<string, number>;
  violationsList?: any[];
  selectedGovernorate?: string | null;
  onSelectGovernorate?: (gov: string | null) => void;
}

export default function YemenMap({ 
  data, 
  violationsList = [], 
  selectedGovernorate = null, 
  onSelectGovernorate = () => {} 
}: YemenMapProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  // High contrast Leaflet Map view configurations
  const [isSatellite, setIsSatellite] = useState(false);
  const [hoveredGov, setHoveredGov] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Core list of Yemen Governorates with real lat/lng coordinates (matching standard administrative positions)
  const governorates = useMemo(() => [
    { nameAr: 'صنعاء', nameEn: "Sana'a", coordinates: [15.35, 44.20] as [number, number] },
    { nameAr: 'أمانة العاصمة صنعاء', nameEn: 'Sana\'a City Assembly', coordinates: [15.35, 44.20] as [number, number] },
    { nameAr: 'عدن', nameEn: 'Aden', coordinates: [12.80, 45.02] as [number, number] },
    { nameAr: 'تعز', nameEn: 'Taiz', coordinates: [13.58, 44.02] as [number, number] },
    { nameAr: 'حضرموت', nameEn: 'Hadramout', coordinates: [16.03, 48.75] as [number, number] },
    { nameAr: 'مأرب', nameEn: 'Marib', coordinates: [15.45, 45.33] as [number, number] },
    { nameAr: 'الحديدة', nameEn: 'Hodeidah', coordinates: [14.80, 43.00] as [number, number] },
    { nameAr: 'شبوة', nameEn: 'Shabwah', coordinates: [14.53, 46.83] as [number, number] },
    { nameAr: 'أبين', nameEn: 'Abyan', coordinates: [13.50, 45.83] as [number, number] },
    { nameAr: 'لحج', nameEn: 'Lahij', coordinates: [13.06, 44.53] as [number, number] },
    { nameAr: 'الضالع', nameEn: 'Al Dhale\'e', coordinates: [13.75, 44.73] as [number, number] },
    { nameAr: 'إب', nameEn: 'Ibb', coordinates: [13.97, 44.18] as [number, number] },
    { nameAr: 'ذمار', nameEn: 'Dhamar', coordinates: [14.55, 44.40] as [number, number] },
    { nameAr: 'صعدة', nameEn: 'Sa\'ada', coordinates: [16.95, 43.75] as [number, number] },
    { nameAr: 'الجوف', nameEn: 'Al Jawf', coordinates: [16.48, 44.83] as [number, number] },
    { nameAr: 'عمران', nameEn: 'Amran', coordinates: [15.83, 43.93] as [number, number] },
    { nameAr: 'حجة', nameEn: 'Hajjah', coordinates: [15.90, 43.30] as [number, number] },
    { nameAr: 'المحويت', nameEn: 'Al Mahwit', coordinates: [15.40, 43.60] as [number, number] },
    { nameAr: 'ريمة', nameEn: 'Raymah', coordinates: [14.63, 43.70] as [number, number] },
    { nameAr: 'البيضاء', nameEn: 'Al Bayda', coordinates: [14.20, 45.50] as [number, number] },
    { nameAr: 'سقطرى', nameEn: 'Socotra Island', coordinates: [12.46, 53.82] as [number, number] },
    { nameAr: 'المهرة', nameEn: 'Al Mahrah', coordinates: [16.53, 51.83] as [number, number] },
  ], []);

  // Compute stats details of currently clicked governorate
  const currentGovStats = useMemo(() => {
    if (!selectedGovernorate) return null;
    
    const matchedGovs = [selectedGovernorate];
    if (selectedGovernorate === 'صنعاء') matchedGovs.push('أمانة العاصمة صنعاء');
    if (selectedGovernorate === 'أمانة العاصمة صنعاء') matchedGovs.push('صنعاء');

    const govViolations = violationsList.filter(v => matchedGovs.includes(v.governorate));
    const count = govViolations.length;
    
    // Group by violations type
    const typesBreakdown = govViolations.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    const sortedTypes = Object.entries(typesBreakdown)
      .map(([name, val]) => ({ name, value: Number(val) }))
      .sort((a, b) => b.value - a.value);

    // Group by perpetrators to track frequent offending entities
    const perpetratorsBreakdown = govViolations.reduce((acc: Record<string, number>, curr) => {
      const perpName = curr.perpetrator || (isRtl ? 'جهة غير معروفة' : 'Unknown Perpetrator');
      acc[perpName] = (acc[perpName] || 0) + 1;
      return acc;
    }, {});

    const sortedPerpetrators = Object.entries(perpetratorsBreakdown)
      .map(([name, val]) => ({ name, value: Number(val) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    // Latest incidents list
    const latestIncidents = govViolations
      .slice(0, 3)
      .map(v => ({
        id: v.id,
        victimName: v.victimName,
        type: v.type,
        date: v.date,
        institution: v.victimInstitution || ''
      }));

    const govDetails = governorates.find(g => g.nameAr === selectedGovernorate || g.nameEn === selectedGovernorate);

    return {
      nameAr: govDetails?.nameAr || selectedGovernorate,
      nameEn: govDetails?.nameEn || selectedGovernorate,
      count,
      types: sortedTypes,
      perpetrators: sortedPerpetrators,
      recent: latestIncidents
    };
  }, [selectedGovernorate, violationsList, governorates, isRtl]);

  // Find maximum violations in a single governorate to scale visual hotspot heat
  const maxViolationsCount = useMemo(() => {
    const counts = governorates.map(gov => {
      let count = data[gov.nameAr] || 0;
      if (gov.nameAr === 'صنعاء') {
        count += (data['أمانة العاصمة صنعاء'] || 0);
      }
      return count;
    });
    return Math.max(...counts, 1);
  }, [data, governorates]);

  // Identify governorates with severe violations to trigger pulsing animation markers
  const severeGovernorates = useMemo(() => {
    const list = new Set<string>();
    violationsList.forEach(v => {
      if (!v || !v.governorate) return;
      const typeStr = String(v.type || '');
      const isSevere = typeStr.includes('جسيم') || typeStr.toLowerCase().includes('severe');
      if (isSevere) {
        list.add(v.governorate);
        if (v.governorate === 'صنعاء') {
          list.add('أمانة العاصمة صنعاء');
        }
        if (v.governorate === 'أمانة العاصمة صنعاء') {
          list.add('صنعاء');
        }
      }
    });
    return list;
  }, [violationsList]);

  // Leaflet Map Initializer & Updater
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Double initialization safety guard
    if (!mapRef.current) {
      // Create fresh Leaflet map container centered on central Yemen coordinate
      const map = L.map(mapContainerRef.current, {
        center: [15.35, 47.50],
        zoom: 6.5,
        minZoom: 5.5,
        maxZoom: 16,
        scrollWheelZoom: true,
        zoomControl: false // Custom controls added for style parity
      });

      // Add custom styled zoom controls placed ideally at top right
      new L.Control.Zoom({ position: 'topright' }).addTo(map);

      mapRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    const mapInst = mapRef.current;
    
    // Clear legacy tile layers to support dynamic Streets/Satellite toggles smoothly
    mapInst.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInst.removeLayer(layer);
      }
    });

    // Mount active map tile layer (OpenStreetMap / Esri Satellite)
    const activeTile = isSatellite ? TILE_SATELLITE : TILE_STREETS;
    const activeAttr = isSatellite ? ATTRIBUTION_SATELLITE : ATTRIBUTION_STREETS;
    L.tileLayer(activeTile, {
      attribution: activeAttr,
      maxZoom: 18,
    }).addTo(mapInst);

    return () => {
      // Do NOT kill map on layer shifts, only on complete component unmount to maintain scroll history
    };
  }, [isSatellite]);

  // Draw regional and single-incident markers on map when dependencies change
  useEffect(() => {
    const mapInst = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!mapInst || !markersGroup) return;

    // Clear prior markers
    markersGroup.clearLayers();

    // 1. Draw governorate cluster hotspots
    governorates.forEach((gov) => {
      let count = data[gov.nameAr] || 0;
      if (gov.nameAr === 'صنعاء') {
        count += (data['أمانة العاصمة صنعاء'] || 0);
      }

      const hasSevere = severeGovernorates.has(gov.nameAr);
      const isSelected = selectedGovernorate === gov.nameAr || (gov.nameAr === 'صنعاء' && selectedGovernorate === 'أمانة العاصمة صنعاء');

      // Calculate dynamic circle markers size
      const sizeMultiplier = 2.5;
      const baseDiameter = 24;
      const computedDiameter = Math.min(80, baseDiameter + (count * sizeMultiplier));

      const isHotspot = count > 0;
      
      // Determine the color design framework
      let circleColor = 'bg-blue-600/90 border-blue-400';
      
      if (isHotspot) {
        const ratio = count / maxViolationsCount;
        if (ratio > 0.7) {
          circleColor = 'bg-rose-700/95 border-rose-400';
        } else if (ratio > 0.3) {
          circleColor = 'bg-amber-600/95 border-amber-400 font-black';
        } else {
          circleColor = 'bg-yellow-500/95 border-yellow-300 text-slate-900';
        }
      }

      if (hasSevere) {
        circleColor = 'bg-rose-600 text-white font-extrabold border-rose-300';
      }

      if (isSelected) {
        circleColor = 'bg-violet-700 text-white font-black border-violet-300 ring-4 ring-violet-500/30';
      }

      // Compose high-fidelity modern SVG and CSS pulse layout via L.divIcon
      const innerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110" 
             style="width: ${computedDiameter}px; height: ${computedDiameter}px;"
             title="${isRtl ? gov.nameAr : gov.nameEn}: ${count} ${isRtl ? 'انتهاك' : 'violations'}">
          ${hasSevere ? `
            <span class="absolute inline-flex h-full w-full rounded-full bg-rose-500 animate-ping opacity-75"></span>
            <span class="absolute inline-flex h-[130%] w-[130%] rounded-full bg-rose-400 animate-pulse opacity-40"></span>
          ` : ''}
          ${isSelected ? `
            <span class="absolute inline-flex h-full w-full rounded-full bg-violet-400 animate-ping opacity-60"></span>
          ` : ''}
          <div class="relative rounded-full shadow-2xl border-2 flex flex-col items-center justify-center text-center leading-none ${circleColor}" 
               style="width: 100%; height: 100%;">
            <span class="text-[11px] font-black">${count}</span>
            <span class="text-[7px] font-bold tracking-tighter opacity-90 truncate max-w-[80%]">
              ${isRtl ? gov.nameAr.slice(0, 5) : gov.nameEn.slice(0, 5)}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: innerHtml,
        className: 'custom-map-marker',
        iconSize: [computedDiameter, computedDiameter],
        iconAnchor: [computedDiameter / 2, computedDiameter / 2]
      });

      const marker = L.marker([gov.coordinates[0], gov.coordinates[1]], { icon: customIcon });

      // Click callback
      marker.on('click', () => {
        onSelectGovernorate(isSelected ? null : gov.nameAr);
      });

      // Simple mouse hover states
      marker.on('mouseover', () => {
        setHoveredGov(gov.nameAr);
      });
      marker.on('mouseout', () => {
        setHoveredGov(null);
      });

      // Interactive popup
      const popupHtml = `
        <div class="p-3 text-right ${isRtl ? '' : 'text-left'} font-sans max-w-xs">
          <h4 class="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between gap-4">
            <span>📍 ${isRtl ? gov.nameAr : gov.nameEn}</span>
            <span class="bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
              ${count} ${isRtl ? 'حالة' : 'Cases'}
            </span>
          </h4>
          <p class="text-[11px] text-slate-500 mt-2 leading-relaxed">
            ${isRtl 
              ? `تم تسجيل ورصد ${count} انتهاك وحادث ضد حقوق الصحافة في هذه المنطقة.` 
              : `Fully cataloged ${count} verified violations/events against press freedom.`}
          </p>
          ${hasSevere ? `
            <div class="bg-rose-50 text-rose-700 text-[10px] p-2 rounded-lg border border-rose-100 font-bold mt-2 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              <span>${isRtl ? '⚠️ تحتوي على تهديد جسيم نشط حالياً!' : '⚠️ Contains active severe threat!'}</span>
            </div>
          ` : ''}
          <div class="mt-3">
            <button 
              class="w-full bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase py-2 rounded-lg text-center hover:bg-slate-800 transition-colors border-none cursor-pointer"
              onclick="window.dispatchEvent(new CustomEvent('mapSelectGov', { detail: '${gov.nameAr}' }));"
            >
              ${isRtl ? 'عرض معلومات المحافظة ←' : 'EXPLORE REGION →'}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: 'modern-leaflet-popup'
      });

      marker.addTo(markersGroup);
    });

    // 2. Plot exact incident markers if custom coordinates exist
    violationsList.forEach((v) => {
      if (!v || !v.latitude || !v.longitude) return;
      
      const isSevere = String(v.type).includes('جسيم') || String(v.type).toLowerCase().includes('severe');
      const pinColor = isSevere ? 'bg-red-600 text-white' : 'bg-slate-900 text-white';
      
      const pinHtml = `
        <div class="relative flex items-center justify-center">
          ${isSevere ? `
            <span class="absolute inline-flex h-6 w-6 rounded-full bg-rose-600 animate-ping opacity-60"></span>
          ` : ''}
          <div class="h-3.5 w-3.5 rounded-full border border-white shadow-xl ${pinColor}" />
        </div>
      `;

      const incidentIcon = L.divIcon({
        html: pinHtml,
        className: 'incident-map-pin',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const incMarker = L.marker([v.latitude, v.longitude], { icon: incidentIcon });
      
      const incPopup = `
        <div class="p-3 text-right ${isRtl ? '' : 'text-left'} font-sans">
          <small class="text-rose-600 font-black flex items-center gap-1 text-[9px] mb-1">
            ⚠️ ${isSevere ? (isRtl ? 'انتهاك جسيم' : 'SEVERE VIOLATION') : v.type}
          </small>
          <h5 class="font-extrabold text-slate-900 text-xs">${v.victimName}</h5>
          <p class="text-[10px] text-slate-500 mt-1">${v.governorate} | ${v.date}</p>
          ${v.description ? `<p class="text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 mt-1.5 leading-relaxed line-clamp-2">${v.description}</p>` : ''}
        </div>
      `;

      incMarker.bindPopup(incPopup, { closeButton: false });
      incMarker.addTo(markersGroup);
    });

    // Custom window listener dispatcher so click buttons in Leaflet popup work beautifully
    const handleSelectEnv = (e: any) => {
      onSelectGovernorate(e.detail);
    };
    window.addEventListener('mapSelectGov', handleSelectEnv);

    // Pan viewport to selected governorate coordinates smoothly
    if (selectedGovernorate) {
      const selectedGov = governorates.find(g => g.nameAr === selectedGovernorate || g.nameEn === selectedGovernorate);
      if (selectedGov) {
        mapInst.setView([selectedGov.coordinates[0], selectedGov.coordinates[1]], 8.5, { animate: true, duration: 1.2 });
      }
    } else {
      // Return to generic central view
      mapInst.setView([15.35, 47.50], 6.5, { animate: true, duration: 1 });
    }

    return () => {
      window.removeEventListener('mapSelectGov', handleSelectEnv);
    };
  }, [data, violationsList, selectedGovernorate, maxViolationsCount, severeGovernorates, governorates, isRtl]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Real Interactive Map Section */}
      <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 relative overflow-hidden flex flex-col justify-between min-h-[550px] md:min-h-[650px] shadow-sm">
        
        {/* Real-time details header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20 pb-4 border-b border-slate-100">
          <div className="space-y-1 text-right ltr:text-left">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
              <Activity className="animate-pulse text-red-500" size={12} />
              {isRtl ? 'خارطة جغرافية حقيقية لليمن' : 'Yemen Real Geographical Live Map Feed'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {isRtl ? 'رسم تخطيطي تفاعلي دقيق لتوثيق الانتهاكات في مواقعها الجغرافية الفعلية باليمن.' : 'Real GPS-referenced tracking of journalists violations across Yemen districts.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Map Imagery layers toggler */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setIsSatellite(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isSatellite ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'}`}
              >
                <Eye size={12} />
                {isRtl ? 'خريطة سياسية' : 'Streets'}
              </button>
              <button
                onClick={() => setIsSatellite(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSatellite ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'}`}
              >
                <ImageIcon size={12} />
                {isRtl ? 'خريطة قمر صناعي' : 'Satellite'}
              </button>
            </div>

            {selectedGovernorate && (
              <button
                onClick={() => onSelectGovernorate(null)}
                className="p-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border-none bg-slate-50 cursor-pointer flex items-center gap-1"
                title={isRtl ? 'إعادة تعيين' : 'Reset'}
              >
                <RefreshCw size={14} className="animate-spin-slow" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Leaflet Map Container DIV */}
        <div className="w-full flex-1 min-h-[420px] md:min-h-[480px] relative rounded-2xl overflow-hidden mt-4 border border-slate-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] md:min-h-[480px] z-10" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center justify-between border-t border-slate-100 pt-4 mt-4 relative z-20">
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 font-bold">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-rose-300"></span>
              </span>
              <span className="text-rose-600 font-extrabold">{isRtl ? 'تهديد جسيم نشط ⚠️' : 'Active Severe Threat ⚠️'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-200 animate-pulse" />
              <span>{isRtl ? 'مخاطر مرتفعة' : 'High Alert'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-200" />
              <span>{isRtl ? 'مخاطر متوسطة' : 'Medium Intensity'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-200" />
              <span>{isRtl ? 'مخاطر منخفضة' : 'Low Alert'}</span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 font-mono">
            {isRtl ? 'مستندة إلى إحداثيات GPS ونماذج GIS' : 'Sourced via GPS coordinate models'}
          </div>
        </div>
      </div>

      {/* Side Details Pane (cols-span-4) */}
      <div className="lg:col-span-4 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {selectedGovernorate && currentGovStats ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="bg-slate-900 text-white rounded-[32px] p-6 shadow-2xl space-y-6 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono">
                      {isRtl ? 'تفاصيل المحافظة المحددة' : 'Selected Province Report'}
                    </span>
                    <h4 className="text-2xl font-black text-white flex items-center gap-2">
                      <span>📍</span> {isRtl ? currentGovStats.nameAr : currentGovStats.nameEn}
                    </h4>
                  </div>
                  <button 
                    onClick={() => onSelectGovernorate(null)}
                    className="p-2 ml bg-white/10 hover:bg-white/20 transition-all rounded-full border-none outline-none cursor-pointer text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Main Stats Counter Badge */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {isRtl ? 'إجمالي الانتهاكات الموثقة' : 'Cumulative Documented Breaches'}
                    </span>
                    <p className="text-3xl font-black text-white font-mono">{currentGovStats.count}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-600/20 text-rose-400 rounded-full flex items-center justify-center border border-red-500/20">
                    <ShieldAlert size={22} className="animate-pulse" />
                  </div>
                </div>

                {/* Types breakdown percentage list inside selected governorate */}
                <div className="space-y-4">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={14} className="text-red-500" />
                    {isRtl ? 'تصنيف انتهاكات المحافظة' : 'Violation Types Breakdown'}
                  </h5>
                  
                  {currentGovStats.types.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentGovStats.types.map((type, i) => {
                        const percent = Math.round((type.value / currentGovStats.count) * 100);
                        return (
                          <div key={type.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-350">{type.name}</span>
                              <span className="font-bold text-slate-400">{type.value} ({percent}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-rose-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {isRtl ? 'لا يوجد تصنيف مسجل' : 'No types logged'}
                    </p>
                  )}
                </div>

                {/* Most Frequent Perpetrators inside clicked governorate */}
                <div className="space-y-4 mt-6">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={14} className="text-amber-500" />
                    {isRtl ? 'الجهات الأكثر ارتكاباً للانتهاكات' : 'Most Frequent Perpetrators'}
                  </h5>
                  
                  {currentGovStats.perpetrators && currentGovStats.perpetrators.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentGovStats.perpetrators.map((perp: any) => {
                        const percent = Math.round((perp.value / currentGovStats.count) * 100);
                        return (
                          <div key={perp.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300">{perp.name}</span>
                              <span className="font-bold text-slate-400 font-mono">{perp.value} ({percent}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-amber-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      {isRtl ? 'لا يوجد بيانات جهات فاعلة' : 'No performer data logged'}
                    </p>
                  )}
                </div>

                {/* Recent Items details */}
                <div className="space-y-3 mt-6 border-t border-white/5 pt-4">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Award size={14} className="text-blue-400" />
                    {isRtl ? 'الحالات المسجلة مؤخراً' : 'Recent Registered Cases'}
                  </h5>
                  
                  {currentGovStats.recent.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentGovStats.recent.map((inc) => (
                        <div key={inc.id} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all space-y-1">
                          <p className="text-xs font-bold text-slate-100 block truncate">
                            {inc.victimName}
                          </p>
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-semibold text-rose-300 bg-rose-950/40 border border-rose-950 px-1.5 py-0.5 rounded-md">
                              {inc.type}
                            </span>
                            <span className="font-mono flex items-center gap-1">
                              <Calendar size={10} />
                              {inc.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic block mt-1">
                      {isRtl ? 'لا يوجد حوادث مسجلة مؤخراً' : 'No recorded incidents'}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={() => onSelectGovernorate(null)}
                  className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                >
                  {isRtl ? 'إغلاق وعرض جميع المحافظات' : 'Close and View All Regions'}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                <ShieldAlert size={22} className="text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  {isRtl ? 'لم يتم تحديد محافظة' : 'No Governorate Selected'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {isRtl 
                    ? 'انقر على نقاط المحافظات في الخريطة التفاعلية لعرض الإحصائيات الفورية والانتهاكات الخاصة بكل منطقة.' 
                    : 'Click on any province pin on the interactive map to inspect immediate metrics, recent incidents and type distributions.'}
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
