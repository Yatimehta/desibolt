import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useOrders } from '../../context/OrderContext';
import { DESI_BOLT_HUB } from '../../data/maltaLocalities';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight,
  ArrowLeft,
  Zap,
  Package,
  Bike
} from 'lucide-react';

// Custom Map Bounds Updater Helper
const MapRecenter: React.FC<{ hubPos: [number, number]; destPos: [number, number]; driverPos?: [number, number] }> = ({
  hubPos,
  destPos,
  driverPos
}) => {
  const map = useMap();

  useEffect(() => {
    try {
      const bounds = L.latLngBounds([hubPos, destPos]);
      if (driverPos) bounds.extend(driverPos);
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (e) {
      console.error(e);
    }
  }, [map, hubPos, destPos, driverPos]);

  return null;
};

// Custom SVG Leaflet Icons
const hubIcon = L.divIcon({
  className: 'custom-hub-icon',
  html: `<div style="background-color: #1D2A44; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const driverIcon = L.divIcon({
  className: 'custom-driver-icon',
  html: `<div style="background-color: #E63946; color: white; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 6px rgba(230,57,70,0.25), 0 4px 14px rgba(230,57,70,0.5); border: 3px solid white; transform: scale(1.05);">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path></svg>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

const destIcon = L.divIcon({
  className: 'custom-dest-icon',
  html: `<div style="background-color: #27AE60; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(39,174,96,0.3); border: 3px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

interface LiveOrderTrackingProps {
  onBackToStore: () => void;
}

export const LiveOrderTracking: React.FC<LiveOrderTrackingProps> = ({ onBackToStore }) => {
  const { activeOrder, orders } = useOrders();
  const [callAlert, setCallAlert] = useState(false);

  const order = activeOrder || orders[0];

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No active deliveries found</h2>
        <button
          onClick={onBackToStore}
          className="px-6 py-2.5 bg-[#E63946] text-white rounded-xl text-xs font-bold"
        >
          Return to Store
        </button>
      </div>
    );
  }

  const hubPos: [number, number] = [DESI_BOLT_HUB.coordinates.lat, DESI_BOLT_HUB.coordinates.lng];
  const destPos: [number, number] = [
    order.address.coordinates?.lat || 35.9122,
    order.address.coordinates?.lng || 14.5042
  ];
  const driverPos: [number, number] = [
    order.driver?.currentLocation.lat || 35.9065,
    order.driver?.currentLocation.lng || 14.4920
  ];

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed', time: '12:30 PM', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'packing', label: 'Packing in Dark Store', time: '12:33 PM', icon: <Package className="w-4 h-4" /> },
    { key: 'dispatched', label: 'Dispatched from Hub', time: '12:38 PM', icon: <Truck className="w-4 h-4" /> },
    { key: 'out_for_delivery', label: 'Out for Delivery (Bike)', time: '12:41 PM', icon: <Bike className="w-4 h-4" /> },
    { key: 'delivered', label: 'Delivered to Doorstep', time: '12:50 PM', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  const getStatusIndex = (st: string) => {
    switch (st) {
      case 'confirmed': return 0;
      case 'packing': return 1;
      case 'dispatched': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentStepIdx = getStatusIndex(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Back & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStore}
          className="flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-[#E63946] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="bg-[#E63946] text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-current" />
            LIVE BOLT TRACKING
          </span>
          <span className="text-xs font-mono font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            #{order.orderNumber}
          </span>
        </div>
      </div>

      {/* Main Grid: Map on Left, Timeline & Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Map Container (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-3 border border-slate-200 shadow-lg flex flex-col h-[480px] lg:h-[620px] relative overflow-hidden">
          {/* Top Map Floating ETA Badge */}
          <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E63946] text-white flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Estimated Delivery ETA</div>
              <div className="text-sm font-black text-slate-900">
                {order.status === 'delivered' ? 'Delivered' : order.estimatedDeliveryTime}
              </div>
            </div>
          </div>

          <MapContainer
            center={driverPos}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full rounded-2xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Dark Store Hub Marker */}
            <Marker position={hubPos} icon={hubIcon}>
              <Popup>
                <div className="text-xs font-bold">
                  <div>DESI BOLT Central Hub</div>
                  <div className="text-[10px] text-slate-500">Msida / Birkirkara Dark Store</div>
                </div>
              </Popup>
            </Marker>

            {/* Rider Location Marker */}
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>
                <div className="text-xs font-bold">
                  <div className="text-[#E63946]">{order.driver?.name} (Courier)</div>
                  <div className="text-[10px] text-slate-500">{order.driver?.vehicle}</div>
                </div>
              </Popup>
            </Marker>

            {/* Customer Destination Marker */}
            <Marker position={destPos} icon={destIcon}>
              <Popup>
                <div className="text-xs font-bold">
                  <div className="text-emerald-700">Delivery Address</div>
                  <div className="text-[10px] text-slate-500">{order.address.street}, {order.address.locality}</div>
                </div>
              </Popup>
            </Marker>

            {/* Route Polyline */}
            <Polyline
              positions={[hubPos, driverPos, destPos]}
              color="#E63946"
              weight={4}
              dashArray="6, 8"
              opacity={0.8}
            />

            <MapRecenter hubPos={hubPos} destPos={destPos} driverPos={driverPos} />
          </MapContainer>
        </div>

        {/* Status, Courier, and Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Courier Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Driver</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Courier
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#E63946] flex items-center justify-center font-black text-sm border border-red-200">
                  {order.driver?.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{order.driver?.name}</h4>
                  <p className="text-xs text-slate-500">{order.driver?.vehicle}</p>
                  <p className="text-[10px] font-mono text-slate-400">Plate: {order.driver?.plateNumber}</p>
                </div>
              </div>

              {/* Call & Chat Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCallAlert(true);
                    setTimeout(() => setCallAlert(false), 3000);
                  }}
                  className="w-10 h-10 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors border border-emerald-200 shadow-xs"
                  title="Call Courier"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCallAlert(true);
                    setTimeout(() => setCallAlert(false), 3000);
                  }}
                  className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors border border-slate-200 shadow-xs"
                  title="Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {callAlert && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl font-medium border border-emerald-200">
                Calling courier at {order.driver?.phone}...
              </div>
            )}
          </div>

          {/* Step-by-Step Delivery Timeline */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              Live Order Progress
            </h4>

            <div className="space-y-4 pt-1">
              {steps.map((st, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={st.key} className="flex items-start gap-3 relative">
                    {/* Connecting Vertical line */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-4 top-7 bottom-0 w-0.5 -mb-4 ${
                        idx < currentStepIdx ? 'bg-[#E63946]' : 'bg-slate-200'
                      }`} />
                    )}

                    {/* Step Icon Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 z-10 transition-all ${
                      isCurrent 
                        ? 'bg-[#E63946] text-white ring-4 ring-red-100 scale-110 shadow-md shadow-red-500/30 animate-pulse' 
                        : isPassed 
                        ? 'bg-[#E63946] text-white' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {st.icon}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-[#E63946]' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                          {st.label}
                        </span>
                        {isPassed && (
                          <span className="text-[10px] text-slate-400 font-medium">{st.time}</span>
                        )}
                      </div>
                      {isCurrent && (
                        <p className="text-[11px] text-[#E63946] font-semibold mt-0.5">
                          In progress • Estimated arrival {order.estimatedDeliveryTime}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Location & Order Items preview */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E63946]" />
                <span>Delivering to {order.address.locality}</span>
              </span>
              <span className="text-[#E63946] font-black">€{order.total.toFixed(2)}</span>
            </div>

            <p className="text-xs text-slate-500">
              {order.address.street}, {order.address.locality} ({order.address.postalCode})
            </p>

            <div className="pt-2 border-t border-slate-100 divide-y divide-slate-100 max-h-36 overflow-y-auto">
              {order.items.map((it) => (
                <div key={it.productId} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <img src={it.image} alt={it.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    <span className="text-slate-800 font-medium truncate">{it.quantity}x {it.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">€{(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
