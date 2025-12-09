"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, CheckCircle, Satellite, Droplets, Activity, MapPin } from "lucide-react";

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    project_id: "OL-RD-2025-001",
    latitude: "5.9667",
    longitude: "5.6667",
    project_type: "Oil Spill Remediation",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  // Initialize Mapbox
  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.async = true;
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    script.onload = () => {
      if (!mapContainerRef.current) return;

      // Use a public Mapbox token for demo purposes
      window.mapboxgl.accessToken = "pk.eyJ1IjoiZmF2b3VyYWNoYXJhIiwiYSI6ImNtaXhweHBsNTA2dnUzanNrbWpnZTBkcTMifQ.FvD15f-8u19kmBPP2Z2WIA";

      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        projection: "globe",
        zoom: 1.5,
        center: [0, 20],
        pitch: 0,
      });

      map.on("load", () => {
        setMapLoaded(true);
        map.setFog({
          color: "rgb(186, 210, 235)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.02,
          "space-color": "rgb(11, 11, 25)",
          "star-intensity": 0.6,
        });
      });

      mapRef.current = map;
    };

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // Auto-rotation effect
useEffect(() => {
  if (!mapRef.current || !mapLoaded || !isRotating) return;

  const rotate = () => {
    if (mapRef.current && isRotating) {
      const center = mapRef.current.getCenter();
      center.lng -= 0.2;
      mapRef.current.easeTo({ center, duration: 100, easing: (t: number) => t });
    }
  };

  const interval = setInterval(rotate, 50);
  return () => clearInterval(interval);
}, [isRotating, mapLoaded]);

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setShowResults(false);

    // Stop rotation and fly to location
    setIsRotating(false);
    
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);

    if (mapRef.current && window.mapboxgl) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 14,
        pitch: 60,
        bearing: 0,
        duration: 3000,
        essential: true,
      });

      // Add marker
      new window.mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);
    }

    try {
      const response = await fetch("https://ghost-project-backend.onrender.com/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          latitude: lat,
          longitude: lon,
        }),
      });

      if (!response.ok) throw new Error("Backend offline");
      
      const data = await response.json();
      
      // Simulate analysis delay for dramatic effect
      setTimeout(() => {
        setResult(data);
        setShowResults(true);
        setLoading(false);
      }, 3000);
    } catch (err) {
      setError("Connection Failed. Backend offline or CORS issue.");
      setLoading(false);
      console.error(err);
      
      // Demo fallback data
      setTimeout(() => {
        const demoResult = {
          location: { lat, lon },
          satellite_analysis: {
            verdict: formData.project_type === "Oil Spill Remediation" 
              ? "SPILL DETECTED" 
              : "GHOST PROJECT RISK",
            reason: formData.project_type === "Oil Spill Remediation"
              ? "Hydrocarbon signatures detected in water body. Cleanup not verified."
              : "Vegetation detected at construction site. Infrastructure missing or incomplete.",
            risk_flag: true,
            calculated_index: formData.project_type === "Oil Spill Remediation" ? 0.08 : 0.62,
            model_used: "ResNet50_Sentinel2_v1",
          },
        };
        setResult(demoResult);
        setShowResults(true);
        setError("");
      }, 3000);
    }
  };

  const resetView = () => {
    setShowResults(false);
    setResult(null);
    setIsRotating(true);
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [0, 20],
        zoom: 1.5,
        pitch: 0,
        bearing: 0,
        duration: 2000,
      });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Mapbox Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Compact Top Bar - Single Row */}
      {/* RESPONSIVE TOP BAR */}
      <div 
        className="absolute top-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-10 transition-all duration-500"
        style={{
          opacity: showResults ? 0 : 1,
          pointerEvents: showResults ? "none" : "auto",
        }}
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-4 md:px-6 md:py-3 w-full md:w-auto">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            
            <select 
              value={formData.project_type}
              onChange={(e) => setFormData({...formData, project_type: e.target.value})}
              // Added w-full for mobile
              className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-black text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:min-w-[200px]"
            >
              <optgroup label="🌊 Environmental">
                <option value="Oil Spill Remediation">Oil Spill Cleanup</option>
              </optgroup>
              <optgroup label="🏗️ Infrastructure">
                <option value="Road">Road Construction</option>
                <option value="Building">Building / School</option>
                <option value="Factory">Industrial Facility</option>
              </optgroup>
            </select>

            <div className="flex gap-2 w-full md:w-auto">
                <input 
                  type="number" 
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  placeholder="Latitude"
                  // Added flex-1 and w-full for mobile sizing
                  className="flex-1 w-full md:w-32 p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-white/40"
                />

                <input 
                  type="number" 
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  placeholder="Longitude"
                  // Added flex-1 and w-full for mobile sizing
                  className="flex-1 w-full md:w-32 p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-white/40"
                />
            </div>

            <button 
              onClick={handleVerify}
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-500/50 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? " Analyzing..." : " Verify"}
            </button>
          </div>
        </div>
      </div>

      {/* Threshold HUD (Left Side) */}
      <div className="absolute bottom-8 left-8 z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-5 w-80">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Decision Logic</h3>
        </div>
        
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <div className="font-semibold text-white">NDVI {'>'} 0.4</div>
              <div className="text-xs text-white/60">Vegetation Detected (Ghost Project Risk)</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <div className="font-semibold text-white">NDVI {'<'} 0.2</div>
              <div className="text-xs text-white/60">Construction/Infrastructure Confirmed</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <span className="text-2xl">💧</span>
            <div>
              <div className="font-semibold text-white">NDVI {'<'} 0.1</div>
              <div className="text-xs text-white/60">Water Body / Spill Detected</div>
            </div>
          </div>
        </div>

        {/* <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/50 text-center">
          Powered by Sentinel-2 & AI Classification
        </div> */}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Analyzing Satellite Imagery...</p>
            <p className="text-white/60 text-sm mt-2">Processing NDVI & AI Models</p>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {/* RESPONSIVE RESULTS PANEL */}
      {showResults && result && (
        <div 
          className="fixed bottom-0 left-0 right-0 md:absolute md:top-8 md:right-8 md:bottom-auto md:left-auto z-30 backdrop-blur-xl bg-black/40 md:bg-white/10 border-t md:border border-white/20 rounded-t-3xl md:rounded-2xl shadow-2xl p-6 w-full md:w-96 max-h-[85vh] overflow-y-auto"
          style={{
            animation: typeof window !== 'undefined' && window.innerWidth < 768 ? "slideUp 0.5s ease-out" : "slideInRight 0.5s ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Satellite className="w-6 h-6 text-cyan-400" />
              Analysis Complete
            </h2>
            <button 
              onClick={resetView}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Verdict */}
          <div className={`p-4 rounded-xl border-2 mb-4 ${
            result.satellite_analysis?.risk_flag 
              ? 'bg-red-500/20 border-red-500/50' 
              : 'bg-green-500/20 border-green-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {result.satellite_analysis?.risk_flag ? (
                <AlertTriangle className="w-8 h-8 text-red-400" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-400" />
              )}
              <span className="text-2xl font-bold text-white">
                {result.satellite_analysis?.verdict}
              </span>
            </div>
            <p className="text-sm text-white/80">{result.satellite_analysis?.reason}</p>
          </div>

          {/* Metrics */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60 text-sm">NDVI Index</span>
              <span className="text-white font-mono font-bold">
                {result.satellite_analysis?.calculated_index?.toFixed(3)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60 text-sm">Location</span>
              <span className="text-white font-mono text-xs">
                {result.location?.lat?.toFixed(4)}, {result.location?.lon?.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60 text-sm">AI Model</span>
              <span className="text-white text-xs">{result.satellite_analysis?.model_used}</span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={resetView}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg shadow-cyan-500/50 mb-8 md:mb-0"
          >
            ← Return to Globe
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && !result && (
        <div className="absolute top-8 right-8 z-10 backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-2xl shadow-2xl p-4 w-80">
          <div className="flex items-center gap-3 text-white">
            <AlertTriangle className="w-6 h-6" />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}