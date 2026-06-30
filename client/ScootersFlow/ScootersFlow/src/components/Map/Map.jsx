import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';

const createScooterIcon = (color, batteryLevel) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r="20" fill="#ffffff" stroke="${color}" stroke-width="3" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.15));" />
      
      <g transform="translate(1, -1)">
        <line x1="33" y1="18" x2="37" y2="18" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" />
        <line x1="35" y1="21" x2="39" y2="21" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" />
        <line x1="34" y1="24" x2="37" y2="24" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" />

        <path d="M 27,24 C 27,21 31,21 31,24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />

        <path d="M 29,25 L 17,25 C 15,25 14,24 14,22 L 16.5,13" 
              fill="none" 
              stroke="${color}" 
              stroke-width="3" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
              
        <line x1="16.5" y1="13" x2="17.5" y2="9" stroke="#475569" stroke-width="3" stroke-linecap="round" />
        
        <path d="M 15,9 L 20,9" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
              
        <circle cx="15.5" cy="26" r="3.5" fill="#1e293b" />
        <circle cx="15.5" cy="26" r="1" fill="#ffffff" />
        
        <circle cx="29" cy="26" r="3.5" fill="#1e293b" />
        <circle cx="29" cy="26" r="1" fill="#ffffff" />
      </g>
      
      <text x="23" y="41" text-anchor="middle" font-size="9" font-weight="800" fill="#1e293b">${batteryLevel}%</text>
    </svg>`;

    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -24]
    });
};

const getStatusColor = (status, battery) => {
    if (battery <= 10) return '#d63031';
    switch (status) {
        case 'AVAILABLE': return '#00cec9';
        case 'IN_USE':    return '#0984e3';
        case 'CHARGING':  return '#6c5ce7';
        case 'IN_REPAIR': return '#b2bec3';
        default:          return '#94a3b8';
    }
};

const statusLabel = {
    AVAILABLE:  '✅ זמין',
    IN_USE:     '🔵 בשימוש',
    CHARGING:   '⚡ בטעינה',
    IN_REPAIR:  '🔧 בתיקון'
};

const ScooterMap = forwardRef(({ scooters, focusedScooter, onResetFocus }, ref) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    
    // יצירת רפרנס לפונקציית האיפוס כדי שה-Control יוכל לגשת אליה תמיד
    const onResetFocusRef = useRef(onResetFocus);
    useEffect(() => {
        onResetFocusRef.current = onResetFocus;
    }, [onResetFocus]);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current).setView([32.0853, 34.7818], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // --- הוספת כפתור איפוס נייטיב של Leaflet כדי שלא ייבלע בשכבות ---
        const ResetControl = L.Control.extend({
            options: { position: 'topright' }, // מיקום: פינה ימנית עליונה
            onAdd: function () {
                const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
                button.innerHTML = 'אפס תצוגה';
                button.style.backgroundColor = '#ffffff';
                button.style.border = '2px solid rgba(0,0,0,0.2)';
                button.style.borderRadius = '4px';
                button.style.padding = '6px 10px';
                button.style.cursor = 'pointer';
                button.style.fontWeight = 'bold';
                button.style.fontFamily = 'Segoe UI, sans-serif';
                button.style.fontSize = '12px';
                button.style.color = '#1e293b';

                // אירוע לחיצה על הכפתור
                L.DomEvent.on(button, 'click', function (e) {
                    L.DomEvent.stopPropagation(e); // מונע מהלחיצה לעבור למפה
                    map.flyTo([32.0853, 34.7818], 13, { animate: true, duration: 1 });
                    map.closePopup();
                    if (onResetFocusRef.current) onResetFocusRef.current();
                });

                return button;
            }
        });

        map.addControl(new ResetControl());
        // -------------------------------------------------------------

        mapInstanceRef.current = map;

        const timer = setTimeout(() => { map.invalidateSize(); }, 300);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !scooters) return;

        const existingIds = new Set(Object.keys(markersRef.current).map(Number));
        const currentIds = new Set(scooters.map(s => s.id));

        existingIds.forEach(id => {
            if (!currentIds.has(id)) {
                markersRef.current[id]?.remove();
                delete markersRef.current[id];
            }
        });

        scooters.forEach(scooter => {
            const { id, latitude, longitude, batteryLevel, status } = scooter;
            if (!latitude || !longitude) return;

            const color = getStatusColor(status, batteryLevel);
            const icon = createScooterIcon(color, batteryLevel);

            const popupContent = `
                <div style="direction:rtl; font-family: 'Segoe UI', sans-serif; min-width: 160px;">
                    <b style="color:#0070f3;">🛴 קורקינט #${id}</b><br/>
                    <span style="color:#475569;">${statusLabel[status] || status}</span><br/>
                    <div style="margin-top:6px;">
                        <span style="font-size:0.8rem;">🔋 סוללה: <b style="color:${color};">${batteryLevel}%</b></span>
                    </div>
                    <div style="background:#f1f5f9; border-radius:6px; height:8px; margin-top:4px; overflow:hidden;">
                        <div style="width:${batteryLevel}%; background:${color}; height:100%; border-radius:6px;"></div>
                    </div>
                    <div style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
                        📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
                    </div>
                </div>
            `;

            if (markersRef.current[id]) {
                markersRef.current[id]
                    .setLatLng([latitude, longitude])
                    .setIcon(icon)
                    .getPopup()?.setContent(popupContent);
            } else {
                const marker = L.marker([latitude, longitude], { icon })
                    .addTo(map)
                    .bindPopup(popupContent);
                markersRef.current[id] = marker;
            }
        });

        map.invalidateSize();
    }, [scooters]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !focusedScooter) return;

        const { lat, lng, id } = focusedScooter;
        if (!lat || !lng) return;

        map.flyTo([lat, lng], 16, { animate: true, duration: 1.2, easeLinearity: 0.4 });

        setTimeout(() => {
            markersRef.current[id]?.openPopup();
        }, 1300);
    }, [focusedScooter]);

    useImperativeHandle(ref, () => ({
        flyTo: (lat, lng, zoom = 16) => {
            mapInstanceRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
        }
    }));

    return (
        <div
            ref={mapContainerRef}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                display: 'block'
            }}
        />
    );
});

ScooterMap.displayName = 'ScooterMap';
export default ScooterMap;