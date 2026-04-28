'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import PriceTimeline from '@/components/PriceTimeline';
import ThemeToggle from '@/components/ThemeToggle';
import { API_BASE } from '@/lib/env';
import { Sector } from '@/types/property';
import { formatPriceCr } from '@/lib/format';
import { BorderBeam } from '@/components/ui/border-beam';
import Header from '@/components/Header';
import { Share2, Settings, User, ClipboardList, BarChart3, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, Building2, MapPin, Sparkles, Database, Brain, Target } from 'lucide-react';

// ── AI Analysis Loading Steps ──
const ANALYSIS_STEPS = [
  { icon: Database, text: 'Scanning market database...', duration: 800 },
  { icon: MapPin, text: 'Analyzing sector comparables...', duration: 900 },
  { icon: Building2, text: 'Evaluating builder premium...', duration: 700 },
  { icon: Brain, text: 'Running AI valuation model...', duration: 1000 },
  { icon: Target, text: 'Generating verdict...', duration: 600 },
];

// ── Count-up animation hook ──
function useCountUp(target: number, duration = 1200, enabled = true): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(eased * target);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

interface ValueEstimateResult {
  market_range: { low: number; high: number };
  verdict: string;
  reason_codes: string[];
  risk_flag: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  comparable_count?: number;
}

interface SectorIntelligence {
  key_growth_drivers: string[];
  rental_yield_avg: number | null;
  appreciation_5yr: number | null;
  map_center_lat: number | null;
  map_center_lng: number | null;
  map_zoom: number | null;
}

const REASON_CODE_LABELS: Record<string, string> = {
  RECENT_LOWER_DEALS: 'Recent deals in the sector have closed at lower prices',
  RECENT_HIGHER_DEALS: 'Some recent deals in the sector reflect higher pricing',
  HIGH_SUPPLY: 'High supply of similar properties in this sector',
  LOW_SUPPLY: 'Limited supply of similar properties in this sector',
  SIZE_PREMIUM: 'Larger-than-typical unit size for this BHK',
  FLOOR_PREMIUM: 'Higher floor contributes to pricing premium',
  BUILDER_PREMIUM: 'Builder commands a premium in this sector',
  LOCATION_ADVANTAGE: 'Location supports stronger pricing',
  UNDER_CONSTRUCTION_DISCOUNT: 'Under-construction properties typically trade at a discount',
  MARKET_ALIGNMENT: 'Pricing aligns with current market levels',
  PROJECT_LEVEL_PRICING: 'Based on project-specific price bands for this development',
  PRICE_DISPERSION: 'Notable variance in pricing within this project; treat range with care',
};

function getConfidenceExplanation(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  if (level === 'HIGH') return 'Strong availability of comparable properties in this sector.';
  if (level === 'MEDIUM') return 'Moderate availability of comparable data in this sector.';
  return 'Limited comparable data available; treat this range cautiously.';
}

// Hardcoded intelligence for Sector 150 MVP
const SECTOR_150_INTELLIGENCE: SectorIntelligence = {
  key_growth_drivers: [
    'Jewar International Airport (Upcoming)',
    'Noida–Greater Noida Expressway connectivity',
    'Presence of Fortune 500 IT hubs in Sector 142',
    'New planned Sector 150 Sports City',
    'Film City development nearby',
    'Metro extension planned (Aqua Line Phase 2)',
  ],
  rental_yield_avg: 3.8,
  appreciation_5yr: 28.2,
  map_center_lat: 28.5691,
  map_center_lng: 77.3943,
  map_zoom: 14,
};

function ValueEstimatorContent() {
  const [activeView, setActiveView] = useState<'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot'>('value-estimator');
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [propertyType, setPropertyType] = useState<'flat' | 'plot'>('flat');
  const [sector, setSector] = useState('');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sizeSqft, setSizeSqft] = useState(1850);
  const [bhk, setBhk] = useState(3);
  const [floor, setFloor] = useState<number | undefined>(undefined);
  const [age, setAge] = useState(0);
  const [propertyStatus, setPropertyStatus] = useState<'ready' | 'under_construction'>('ready');
  const [builder, setBuilder] = useState('');
  const [projectName, setProjectName] = useState('');
  const [quotedPrice, setQuotedPrice] = useState<number | undefined>(undefined);

  // Connectivity perks (locked for MVP)
  const [metroNearby, setMetroNearby] = useState(false);
  const [expresswayAccess, setExpresswayAccess] = useState(false);
  const [corporateHubProximity, setCorporateHubProximity] = useState(false);

  // Advanced options toggle
  // Advanced options visible by default
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ValueEstimateResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    setUserId(storedUserId);
    if (!storedUserId) {
      window.location.href = '/';
      return;
    }
    loadSectors();
  }, [router]);

  const loadSectors = async () => {
    try {
      const response = await fetch(`${API_BASE}/sectors`);
      if (!response.ok) return;
      const data = await response.json();
      const list: Sector[] = data.sectors || [];
      setSectors(list);
      if (list.length > 0) setSector(list[0].name);
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };

  // Prefill from query params
  useEffect(() => {
    if (!searchParams) return;
    const propertyId = searchParams.get('propertyId');
    if (propertyId) {
      fetch(`${API_BASE}/properties/${propertyId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.property) {
            const p = data.property;
            if (p.bhk !== undefined && p.bhk !== null) setBhk(p.bhk);
            if (p.size_sqft) setSizeSqft(p.size_sqft);
            if (p.builder) setBuilder(p.builder);
            if (p.floor !== undefined && p.floor !== null) setFloor(p.floor);
            if (p.status === 'ready' || p.status === 'under_construction') setPropertyStatus(p.status);
            if (p.price) setQuotedPrice(p.price);
            if (p.project_name) setProjectName(p.project_name);
            if (p.sector?.name) setSector(p.sector.name);
            if (p.property_type === 'flat' || p.property_type === 'plot') setPropertyType(p.property_type);

            // Auto-run estimate with these exact parameters
            handleEstimate({
              sector: p.sector?.name || '',
              bhk: p.bhk,
              size_sqft: p.size_sqft,
              property_type: p.property_type || 'flat',
              property_status: p.status || 'ready',
              quoted_price: p.price,
              builder: p.builder,
              project_name: p.project_name,
              floor: p.floor
            });
          }
        })
        .catch(err => console.error("Failed to fetch property details for estimator", err));
    } else {
      const bhkParam = searchParams.get('bhk');
      const sizeParam = searchParams.get('size_sqft');
      const builderParam = searchParams.get('builder');
      const floorParam = searchParams.get('floor');
      const statusParam = searchParams.get('status') as 'ready' | 'under_construction' | null;
      const quotedPriceParam = searchParams.get('quoted_price');
      const projectNameParam = searchParams.get('project_name');

      if (bhkParam) { const p = parseInt(bhkParam, 10); if (!isNaN(p) && p >= 1 && p <= 10) setBhk(p); }
      if (sizeParam) { const p = parseInt(sizeParam, 10); if (!isNaN(p) && p >= 500 && p <= 5000) setSizeSqft(p); }
      if (builderParam) setBuilder(builderParam);
      if (floorParam) { const p = parseInt(floorParam, 10); if (!isNaN(p) && p >= 0) setFloor(p); }
      if (statusParam === 'ready' || statusParam === 'under_construction') setPropertyStatus(statusParam);
      if (quotedPriceParam) { const p = parseInt(quotedPriceParam, 10); if (!isNaN(p) && p > 0) setQuotedPrice(p); }
      if (projectNameParam) setProjectName(projectNameParam);
    }
  }, [searchParams]);

  const handleEstimate = async (overrideParams?: any) => {
    // Prevent React Synthetic Events from being treated as property parameters
    if (overrideParams && (overrideParams.nativeEvent || typeof overrideParams.preventDefault === 'function' || overrideParams.target)) {
      overrideParams = undefined;
    }
    const activeSector = overrideParams?.sector || sector;
    if (!activeSector) { setToast({ message: 'Please select a sector' }); return; }
    setLoading(true);
    setResults(null);
    setShowResults(false);
    setAnalysisStep(0);

    // Start analysis step animation
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < ANALYSIS_STEPS.length) {
        setAnalysisStep(stepIdx);
      }
    }, 800);

    try {
      const requestBody: any = overrideParams || {
        sector,
        bhk,
        size_sqft: sizeSqft,
        property_type: propertyType,
        property_status: propertyStatus,
      };
      if (!overrideParams) {
        if (quotedPrice !== undefined && quotedPrice > 0) requestBody.quoted_price = quotedPrice;
        if (builder && builder.trim()) requestBody.builder = builder.trim();
        if (projectName && projectName.trim()) requestBody.project_name = projectName.trim();
        if (floor !== undefined && floor >= 0) requestBody.floor = floor;
      }

      const response = await fetch(`${API_BASE}/value-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to estimate value' }));
        throw new Error(errorData.error || 'Failed to estimate value');
      }

      const data = await response.json();

      // Ensure at least 3 seconds of animation for visual effect
      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 600));

      setResults(data);
      setShowResults(true);

      // Auto-scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Value estimation error:', error);
      setToast({ message: error.message || 'Failed to estimate value.' });
      clearInterval(stepInterval);
    } finally {
      setLoading(false);
    }
  };

  const intelligence = SECTOR_150_INTELLIGENCE;

  // Calculate price per sq.ft from results
  const pricePerSqft = results
    ? Math.round(((results.market_range.low + results.market_range.high) / 2) / sizeSqft)
    : null;

  // Count-up animations for market values
  const lowCrRaw = results ? results.market_range.low / 10000000 : 0;
  const highCrRaw = results ? results.market_range.high / 10000000 : 0;
  const animatedLow = useCountUp(lowCrRaw, 1400, showResults);
  const animatedHigh = useCountUp(highCrRaw, 1400, showResults);
  const animatedPpsf = useCountUp(pricePerSqft || 0, 1200, showResults);
  const formatAnimatedCr = (v: number) => v < 1 ? `${Math.round(v * 100)} L` : `${v.toFixed(2)} Cr`;

  return (
    <div className="flex h-screen bg-[#E6E6E6]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />

      <div className="flex-1 flex flex-col bg-[#E6E6E6] dark:bg-gray-900 relative">
        <Header title="RealtyPal – Value Estimator" onToast={(msg: string) => setToast({ message: msg })} />

        {/* Animated Orbs Overlay Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" />
          <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] bg-purple-400/5 dark:bg-purple-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "4s" }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Property Value Estimator</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimate the real value of property in Noida</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Left Panel: Form ── */}
              <div className="glass-surface rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ClipboardList size={20} className="text-blue-600 dark:text-blue-400" /> Property details
                </h3>

                {/* Property Type and Sector */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Type</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as 'flat' | 'plot')} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800">
                      <option value="flat">Apartment / Flat</option>
                      <option value="plot">Plot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location/Sector</label>
                    <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {sectors.length === 0 && <option>Loading sectors...</option>}
                      {sectors.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}, {s.city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Super Area Slider */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Super Area (sq.ft.) <span className="text-blue-600 dark:text-blue-400 font-semibold">{sizeSqft.toLocaleString('en-IN')} sq.ft</span>
                  </label>
                  <input type="range" min="500" max="5000" step="50" value={sizeSqft} onChange={(e) => setSizeSqft(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1"><span>500</span><span>5000</span></div>
                </div>

                {/* BHK Configuration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">BHK Configuration</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button key={num} onClick={() => setBhk(num)} className={`px-4 py-2 rounded-lg border transition-all ${bhk === num ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/30' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                        {num === 5 ? '5 BHK+' : `${num} BHK`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Options - Visible by default, styled as part of the form */}
                <div className="mb-6 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Possession Status</label>
                      <select value={propertyStatus} onChange={(e) => setPropertyStatus(e.target.value as 'ready' | 'under_construction')} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800">
                        <option value="ready">Ready to Move</option>
                        <option value="under_construction">Under Construction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Floor Number</label>
                      <input type="number" min="0" value={floor !== undefined ? floor : ''} onChange={(e) => { const v = e.target.value; if (v === '') { setFloor(undefined); return; } const n = parseInt(v, 10); if (!isNaN(n) && n >= 0) setFloor(n); }} placeholder="e.g. 12" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Builder (Optional)</label>
                      <input type="text" value={builder} onChange={(e) => setBuilder(e.target.value)} placeholder="e.g. Godrej" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name (Optional)</label>
                      <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Palm Retreat" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Estimate Button */}
                <button onClick={handleEstimate} disabled={loading} className="group relative overflow-hidden w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-300 dark:hover:shadow-blue-900/40 active:scale-[0.97] hover:scale-[1.02] hover:-translate-y-0.5">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      <Sparkles size={18} className="animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      <Brain size={18} className="group-hover:animate-bounce transition-transform" />
                      Estimate Property Value
                    </span>
                  )}
                  {!loading && <BorderBeam size={80} duration={8} anchor={90} delay={0} colorFrom="#ffffff" colorTo="#3b82f6" borderWidth={2} />}
                </button>
              </div>

              {/* ── Right Panel: Results ── */}
              <div className="space-y-4" ref={resultsRef}>
                {/* ── AI Analysis Animation (shown during loading) ── */}
                {loading && (
                  <div className="glass-surface rounded-2xl p-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                        <Brain size={20} className="text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Valuation Engine</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Analyzing property data...</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {ANALYSIS_STEPS.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isActive = idx === analysisStep;
                        const isDone = idx < analysisStep;
                        return (
                          <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-500 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : isDone ? 'opacity-60' : 'opacity-30'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? 'bg-blue-600 shadow-md shadow-blue-300 dark:shadow-blue-800' : isDone ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                              {isDone ? (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <StepIcon size={14} className={`${isActive ? 'text-white animate-pulse' : 'text-white/70'}`} />
                              )}
                            </div>
                            <span className={`text-sm transition-all duration-300 ${isActive ? 'text-blue-700 dark:text-blue-300 font-medium' : isDone ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-400 dark:text-gray-500'}`}>
                              {step.text}
                            </span>
                            {isActive && <div className="ml-auto w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* ── Results (shown after loading) ── */}
                {results && showResults ? (
                  <>
                    {/* Estimated Market Value - Blue card (no sq.ft) */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg p-6 animate-fade-in-up">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium opacity-90 uppercase tracking-wide">Estimated Market Value</h3>
                        {results.comparable_count && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-medium backdrop-blur-sm">
                            <Database size={11} />
                            {results.comparable_count} comparables
                          </span>
                        )}
                      </div>
                      <div className="text-3xl font-bold tabular-nums">
                        {formatAnimatedCr(animatedLow)} – {formatAnimatedCr(animatedHigh)}
                      </div>

                      {/* Price Position Bar */}
                      {quotedPrice && quotedPrice > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/20">
                          <div className="flex items-center justify-between text-xs opacity-80 mb-1.5">
                            <span>{formatPriceCr(results.market_range.low)}</span>
                            <span className="font-semibold">Your Price: {formatPriceCr(quotedPrice)}</span>
                            <span>{formatPriceCr(results.market_range.high)}</span>
                          </div>
                          <div className="relative h-2.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full opacity-60" />
                            {/* Quoted price marker */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all duration-1000"
                              style={{
                                left: `${Math.max(2, Math.min(96, ((quotedPrice - results.market_range.low) / (results.market_range.high - results.market_range.low)) * 100))}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price per sq.ft - separate blue box same style */}
                    {pricePerSqft != null && (
                      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg p-6 animate-fade-in-up">
                        <h3 className="text-sm font-medium opacity-90 uppercase tracking-wide mb-2">Price per sq.ft</h3>
                        <div className="text-2xl font-bold tabular-nums">
                          ₹ {Math.round(animatedPpsf).toLocaleString('en-IN')}/sq.ft
                        </div>
                      </div>
                    )}

                    {/* Verdict & Risk Flag */}
                    <div className="glass-surface rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Verdict</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Signal based on market range fit and comparable density.</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${results.risk_flag === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' :
                          results.risk_flag === 'MEDIUM' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                          }`}>
                          {results.risk_flag === 'HIGH' && <ShieldAlert size={14} />}
                          {results.risk_flag === 'MEDIUM' && <AlertTriangle size={14} />}
                          {results.risk_flag === 'LOW' && <ShieldCheck size={14} />}
                          {results.risk_flag === 'LOW' ? 'Low Risk' : results.risk_flag === 'MEDIUM' ? 'Moderate Risk' : 'High Risk'}
                        </span>
                      </div>
                      <div className="mb-4 rounded-xl border border-[#EAEAEA] dark:border-gray-700 bg-[#FAFAFA] dark:bg-gray-800/50 p-4">
                        <p className="text-gray-800 dark:text-gray-200 font-semibold mb-2 flex items-center gap-2">
                          {results.verdict === 'Within market' && <><ShieldCheck size={18} className="text-green-600" /> Price is within market range</>}
                          {results.verdict === 'Slightly high' && <><AlertTriangle size={18} className="text-amber-600" /> Price is slightly above market range</>}
                          {results.verdict === 'Aggressive' && <><ShieldAlert size={18} className="text-red-600" /> Price is significantly above market range</>}
                          {results.verdict === 'Market range only' && <><BarChart3 size={18} className="text-blue-600" /> Market range estimation (no price provided)</>}
                        </p>
                        {results.confidence_level && (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence: <span className="font-semibold">{results.confidence_level.charAt(0)}{results.confidence_level.slice(1).toLowerCase()}</span></p>
                              {/* Visual confidence dots */}
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className={`w-2 h-2 rounded-full ${(results.confidence_level === 'HIGH' || (results.confidence_level === 'MEDIUM' && i <= 2) || (results.confidence_level === 'LOW' && i <= 1))
                                    ? (results.confidence_level === 'HIGH' ? 'bg-green-500' : results.confidence_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500')
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    }`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{getConfidenceExplanation(results.confidence_level)}</p>
                          </>
                        )}
                      </div>

                      {results.reason_codes.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Factors:</h4>
                          <div className="flex flex-wrap gap-2">
                            {results.reason_codes.map((code, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-[#F2F2F2] dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-[#E0E0E0] dark:border-gray-700">
                                {REASON_CODE_LABELS[code] || code.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Investment Intelligence */}
                    <div className="glass-surface rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Investment Intelligence</h3>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <TrendingUp size={13} />
                          High Growth
                        </span>
                      </div>

                      {/* Market Pulse */}
                      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Market Pulse — Sector 150</span>
                          <span className="text-[10px] text-gray-400">Updated Feb 2026</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{intelligence.appreciation_5yr}%</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">5Y Appreciation</p>
                          </div>
                          <div className="text-center border-x border-emerald-200 dark:border-emerald-800">
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{intelligence.rental_yield_avg}%</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Rental Yield</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">8.2</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Sector Score</p>
                          </div>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Key Growth Drivers</h4>
                      <ul className="space-y-2.5 stagger-children">
                        {intelligence.key_growth_drivers.map((driver, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                              {idx + 1}
                            </span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* ── 12-Month Forecast (Zestimate-inspired) ── */}
                    <div className="glass-surface rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">12-Month Forecast</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Projected value based on sector growth trends</p>
                        </div>
                        <TrendingUp size={20} className="text-emerald-500" />
                      </div>
                      {(() => {
                        const midValue = (results.market_range.low + results.market_range.high) / 2;
                        const growthRate = (intelligence.appreciation_5yr || 20) / 5; // annualized
                        const forecast12m = midValue * (1 + growthRate / 100);
                        const forecastGain = forecast12m - midValue;
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated value in 12 months</p>
                                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatPriceCr(Math.round(forecast12m))}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                                  <TrendingUp size={12} />
                                  +{growthRate.toFixed(1)}%
                                </span>
                                <p className="text-[11px] text-gray-400 mt-1">+{formatPriceCr(Math.round(forecastGain))}</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                              Based on {intelligence.appreciation_5yr}% 5-year appreciation trend for Sector 150. Actual results may vary.
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* ── Estimated Accuracy & Improve Prompt (Zestimate-inspired) ── */}
                    <div className="glass-surface rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Target size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Improve This Estimate</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Accuracy depends on available data. Provide the <strong>builder name</strong>, <strong>project name</strong>, and <strong>floor number</strong> in Advanced Options for a more precise valuation. Properties with full details have up to <strong>40% tighter</strong> estimate ranges.
                          </p>
                          {!showAdvanced && (
                            <button
                              onClick={() => setShowAdvanced(true)}
                              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              <ClipboardList size={12} />
                              Open Advanced Options
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : !loading ? (
                  /* ── Better Empty State ── */
                  <div className="glass-surface rounded-2xl p-8 text-center relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                        <Brain size={32} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Property Valuation</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Fill in the property details on the left and we will analyze market data to estimate the fair value.
                      </p>
                      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                        {[
                          { icon: Database, label: 'Market Data' },
                          { icon: Building2, label: 'Comparables' },
                          { icon: Target, label: 'AI Verdict' },
                        ].map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                              <Icon size={18} className="text-blue-500" />
                              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Price Timeline */}
                <PriceTimeline currentPricePerSqft={pricePerSqft ?? undefined} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function ValueEstimatorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ValueEstimatorContent />
    </Suspense>
  );
}
