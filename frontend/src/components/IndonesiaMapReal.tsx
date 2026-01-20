import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import type { ProvinceWithPartners } from "../types/partners";

type GeoFeatureProperties = {
  kode?: string | number;
  ID?: string | number;
  Propinsi?: string;
  NAME_1?: string;
  name?: string;
};

type GeoFeature = Feature<Geometry, GeoFeatureProperties>;

type SvgPathEntry = {
  feature: GeoFeature;
  provinceCode: string;
  provinceName: string;
  path: string;
};

type IndonesiaMapRealProps = {
  maxHeight?: string | number;
  provinces?: ProvinceWithPartners[];
  loading?: boolean;
};

export default function IndonesiaMapReal({
  maxHeight = "500px",
  provinces = [],
  loading = false,
}: IndonesiaMapRealProps) {
  const [geoData, setGeoData] = useState<GeoFeature[] | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceWithPartners | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data.features))
      .catch((err) => console.error("Failed to load GeoJSON:", err))
      .finally(() => setGeoLoading(false));
  }, []);

  const normalizeProvinceName = (name: string) => {
    return name.toUpperCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
  };

  const findProvinceByGeoData = useCallback(
    (provinceCode: string, provinceName: string, geoProperties: any) => {
      const normalizedGeoName = normalizeProvinceName(provinceName);
      return provinces.find(
        (p) =>
          p.id === provinceCode ||
          normalizeProvinceName(p.name) === normalizedGeoName ||
          normalizeProvinceName(p.name) === normalizeProvinceName(geoProperties.NAME_1 || "") ||
          normalizeProvinceName(p.name) === normalizeProvinceName(geoProperties.name || "") ||
          normalizeProvinceName(p.name) === normalizeProvinceName(geoProperties.Propinsi || "")
      );
    },
    [provinces]
  );

  const getProvinceColor = useCallback(
    (provinceCode: string, provinceName: string, geoProperties: any) => {
      const province = findProvinceByGeoData(provinceCode, provinceName, geoProperties);
      const partnerCount = province?.partners.length || 0;
      if (partnerCount === 0) return "#f3f4f6"; // gray-100
      if (partnerCount <= 3) return "#fef3c7"; // amber-100 (yellow)
      return "#d1fae5"; // emerald-100 (green)
    },
    [findProvinceByGeoData]
  );

  const handleProvinceClick = (provinceCode: string, provinceName: string, geoProperties: any) => {
    const province = findProvinceByGeoData(provinceCode, provinceName, geoProperties);
    if (province) {
      setSelectedProvince(province);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    
    setMousePos({ x: newX, y: newY });
  };

  const handleMouseEnter = (provinceCode: string) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setHoveredProvince(provinceCode);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setHoveredProvince(null);
  };

  const closePanel = () => {
    setSelectedProvince(null);
  };

  const getProvinceName = (geoProperties: GeoFeatureProperties) => {
    return geoProperties.Propinsi || geoProperties.NAME_1 || geoProperties.name || 'Unknown';
  };

  // Memoize projection and paths
  const projectionAndPath = useMemo(() => {
    const projection = geoMercator()
      .center([118, -2])
      .scale(800);
    const path = geoPath().projection(projection);
    return { projection, path };
  }, []);

  // Precompute all SVG paths
  const svgPaths = useMemo<SvgPathEntry[]>(() => {
    if (!geoData) return [];
    return geoData.map((feature: GeoFeature) => ({
      feature,
      provinceCode: feature.properties?.kode?.toString() || feature.properties?.ID?.toString() || "",
      provinceName: getProvinceName(feature.properties ?? {}),
      path: projectionAndPath.path(feature) || ""
    }));
  }, [geoData, projectionAndPath]);

  // Tooltip portal component
  const TooltipPortal = ({ children, x, y }: { children: React.ReactNode; x: number; y: number }) => {
    if (!children) return null;
    
    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: x + 20,
          top: y - 40,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
        className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg"
      >
        {children}
      </div>,
      document.body
    );
  };

  const showLoading = loading || geoLoading;

  return (
    <div className="relative w-full bg-white rounded-2xl overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="130 80 700 400"
        className="w-full h-full"
        style={{ maxHeight }}
        onMouseMove={handleMouseMove}
      >
        {svgPaths.map(({ feature, provinceCode, provinceName, path }, index: number) => {
          return (
            <g key={feature.properties?.ID || provinceCode || index} style={{ zIndex: index }}>
              <path
                d={path}
                fill={getProvinceColor(provinceCode, provinceName, feature.properties)}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                className="cursor-pointer transition-all duration-200 hover:stroke-slate-400 hover:stroke-1"
                onMouseEnter={() => handleMouseEnter(provinceCode)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleProvinceClick(provinceCode, provinceName, feature.properties)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip Portal */}
      {hoveredProvince && (() => {
        const hoveredFeature = geoData?.find(
          (f: GeoFeature) => (f.properties?.kode?.toString() || f.properties?.ID?.toString()) === hoveredProvince
        );
        if (hoveredFeature) {
          const provinceCode = hoveredFeature.properties?.kode?.toString() || hoveredFeature.properties?.ID?.toString() || "";
          const provinceName = getProvinceName(hoveredFeature.properties ?? {});
          return (
            <TooltipPortal x={mousePos.x} y={mousePos.y}>
              <div className="text-xs font-medium text-slate-700">
                {provinceName}: {findProvinceByGeoData(provinceCode, provinceName, hoveredFeature.properties)?.partners.length || 0} partners
              </div>
            </TooltipPortal>
          );
        }
        return null;
      })()}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
        <p className="text-xs font-semibold text-slate-700 mb-2">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
            <span className="text-xs text-slate-600">0-3 partners</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
            <span className="text-xs text-slate-600">&gt;3 partners</span>
          </div>
        </div>
      </div>

      {/* Partner Detail Panel */}
      {selectedProvince && (
        <div className="absolute inset-0 bg-white bg-opacity-95 rounded-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Partners in {selectedProvince.name}
            </h3>
            <button
              onClick={closePanel}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {selectedProvince.partners.map((partner) => (
              <div key={partner.id} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900">{partner.name}</h4>
                <p className="text-sm text-slate-600 mt-1">{partner.address}</p>
                <p className="text-xs text-slate-500 mt-2">Maintenance visits: {partner.maintenance}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLoading && (
        <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <svg
              className="h-8 w-8 animate-spin text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium">Loading map data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
