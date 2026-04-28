'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import { Property, Sector } from '@/types/property';
import { API_BASE } from '@/lib/env';
import { formatPriceCr } from '@/lib/format';
import AmenityIcon from '@/components/AmenityIcon';
import ThemeToggle from '@/components/ThemeToggle';
import { BorderBeam } from '@/components/ui/border-beam';
import { GlareCard } from '@/components/ui/glare-card';
import Header from '@/components/Header';
import { Share2, Settings, User, ChevronDown, ChevronUp, Award } from 'lucide-react';

interface VerdictTag {
  label: string;
  winner: string | null; // property id or null for informational
  color: 'green' | 'blue' | 'yellow';
}

interface ComparisonResult {
  property_1: {
    id: string;
    price: number;
    price_per_sqft: number;
    size_sqft: number;
    status: string;
    amenities: string[];
  };
  property_2: {
    id: string;
    price: number;
    price_per_sqft: number;
    size_sqft: number;
    status: string;
    amenities: string[];
  };
  differences: {
    price_diff: number;
    price_per_sqft_diff: number;
    size_diff: number;
    amenities_diff: {
      only_in_1: string[];
      only_in_2: string[];
      common: string[];
    };
    status_diff: boolean;
  };
  verdicts?: VerdictTag[];
  overall_winner?: string | null;
}

export default function ComparePage() {
  const [activeView, setActiveView] = useState<'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot'>('compare');
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const router = useRouter();
  const selectorRef = useRef<HTMLDivElement>(null);

  const [property1Id, setProperty1Id] = useState<string>('');
  const [property2Id, setProperty2Id] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [showAiVerdict, setShowAiVerdict] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    setUserId(storedUserId);
    if (!storedUserId) {
      window.location.href = '/';
      return;
    }
    loadSectors();

    // Pre-load property IDs from Quick Compare chip URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p1 = params.get('p1');
      const p2 = params.get('p2');
      if (p1) setProperty1Id(p1);
      if (p2) setProperty2Id(p2);
    }
  }, [router]);

  const loadSectors = async () => {
    try {
      const response = await fetch(`${API_BASE}/sectors`);
      if (!response.ok) return;
      const data = await response.json();
      const list: Sector[] = data.sectors || [];
      setSectors(list);
      if (list.length > 0) setSelectedSector(list[0].name);
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };

  const loadProperties = async (sectorName?: string) => {
    const sectorToUse = sectorName ?? selectedSector;
    if (!sectorToUse) return;
    try {
      const response = await fetch(`${API_BASE}/properties?sector=${encodeURIComponent(sectorToUse)}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  useEffect(() => {
    if (selectedSector) {
      loadProperties(selectedSector);
      // Only reset if no URL params were provided
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('p1') && !params.get('p2')) {
          setProperty1Id('');
          setProperty2Id('');
          setComparison(null);
        }
      }
    }
  }, [selectedSector]);

  // Auto-compare when both URL params are set
  useEffect(() => {
    if (property1Id && property2Id && !comparison && !loading && properties.length > 0) {
      // Check if these are from URL params
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('p1') && params.get('p2')) {
          handleCompare();
          // Clean up URL params
          window.history.replaceState({}, '', '/compare');
        }
      }
    }
  }, [property1Id, property2Id, properties]);

  const handleCompare = async () => {
    if (!property1Id || !property2Id) {
      setToast({ message: 'Please select two properties to compare' });
      return;
    }
    if (property1Id === property2Id) {
      setToast({ message: 'Cannot compare property with itself' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id_1: property1Id, property_id_2: property2Id }),
      });
      if (!response.ok) throw new Error('Failed to compare properties');
      const data = await response.json();
      setComparison(data);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to compare properties' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    // Scroll back to selector without resetting selections
    selectorRef.current?.scrollIntoView({ behavior: 'smooth' });
    setComparison(null);
  };

  const getPropertyDetails = (id: string) => properties.find(p => p.id === id);

  const formatSectorLabel = (propertyId: string) => {
    const property = getPropertyDetails(propertyId);
    if (!property?.sector) return 'Sector information unavailable';
    return `${property.sector.name}, ${property.sector.city}`;
  };

  const selectClass =
    'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 transition-shadow duration-200';
  const property1 = comparison ? getPropertyDetails(comparison.property_1.id) : undefined;
  const property2 = comparison ? getPropertyDetails(comparison.property_2.id) : undefined;

  // ── Generate AI verdicts from data ──
  const generateVerdicts = (): { verdicts: VerdictTag[]; overall_winner: string | null } => {
    if (!comparison || !property1 || !property2) return { verdicts: [], overall_winner: null };

    const verdicts: VerdictTag[] = [];
    let p1Score = 0;
    let p2Score = 0;

    // Better Value per Sq.Ft
    if (comparison.differences.price_per_sqft_diff !== 0) {
      const winner = comparison.differences.price_per_sqft_diff > 0 ? property2.id : property1.id;
      verdicts.push({ label: 'Better Value per Sq.Ft', winner, color: 'green' });
      if (winner === property1.id) p1Score++; else p2Score++;
    }

    // More Space
    if (Math.abs(comparison.differences.size_diff) > 50) {
      const winner = comparison.differences.size_diff > 0 ? property1.id : property2.id;
      verdicts.push({ label: 'More Space', winner, color: 'green' });
      if (winner === property1.id) p1Score++; else p2Score++;
    }

    // Ready to Move Advantage
    if (comparison.differences.status_diff) {
      const readyProp = property1.status === 'ready' ? property1 : property2.status === 'ready' ? property2 : null;
      if (readyProp) {
        verdicts.push({ label: 'Ready to Move Advantage', winner: readyProp.id, color: 'green' });
        if (readyProp.id === property1.id) p1Score++; else p2Score++;
      }
    }

    // Premium Builder
    const premiumBuilders = ['Godrej Properties', 'Tata Value Homes', 'DLF', 'Prestige'];
    const p1Premium = premiumBuilders.some(b => property1.builder.toLowerCase().includes(b.toLowerCase()));
    const p2Premium = premiumBuilders.some(b => property2.builder.toLowerCase().includes(b.toLowerCase()));
    if (p1Premium && !p2Premium) {
      verdicts.push({ label: 'Premium Builder', winner: property1.id, color: 'blue' });
      p1Score++;
    } else if (p2Premium && !p1Premium) {
      verdicts.push({ label: 'Premium Builder', winner: property2.id, color: 'blue' });
      p2Score++;
    }

    // More Amenities
    if (comparison.differences.amenities_diff.only_in_1.length > comparison.differences.amenities_diff.only_in_2.length + 1) {
      verdicts.push({ label: 'More Amenities', winner: property1.id, color: 'blue' });
      p1Score++;
    } else if (comparison.differences.amenities_diff.only_in_2.length > comparison.differences.amenities_diff.only_in_1.length + 1) {
      verdicts.push({ label: 'More Amenities', winner: property2.id, color: 'blue' });
      p2Score++;
    }

    // Lower Price
    if (Math.abs(comparison.differences.price_diff) > 500000) {
      const winner = comparison.differences.price_diff > 0 ? property2.id : property1.id;
      verdicts.push({ label: 'Lower Price Point', winner, color: 'green' });
      if (winner === property1.id) p1Score++; else p2Score++;
    }

    // High floor advantage
    if (property1.floor && property2.floor && Math.abs(property1.floor - property2.floor) > 3) {
      const winner = property1.floor > property2.floor ? property1.id : property2.id;
      verdicts.push({ label: 'Higher Floor Advantage', winner, color: 'blue' });
      if (winner === property1.id) p1Score++; else p2Score++;
    }

    const overall_winner = p1Score > p2Score ? property1.id : p2Score > p1Score ? property2.id : null;
    return { verdicts, overall_winner };
  };

  const { verdicts, overall_winner } = comparison ? generateVerdicts() : { verdicts: [], overall_winner: null };

  // Generate AI summary text based on verdicts
  const getAiSummary = (): string => {
    if (!comparison || !property1 || !property2 || verdicts.length === 0) return '';

    const p1Name = property1.project_name || property1.builder;
    const p2Name = property2.project_name || property2.builder;

    if (overall_winner === property1.id) {
      const p1Wins = verdicts.filter((v) => v.winner === property1.id).map((v) => v.label.toLowerCase());
      return `Based on our analysis, ${p1Name} edges ahead with advantages in ${p1Wins.slice(0, 3).join(', ')}. However, ${p2Name} may still be the better choice depending on your priorities.`;
    } else if (overall_winner === property2.id) {
      const p2Wins = verdicts.filter((v) => v.winner === property2.id).map((v) => v.label.toLowerCase());
      return `Based on our analysis, ${p2Name} has the edge with advantages in ${p2Wins.slice(0, 3).join(', ')}. That said, ${p1Name} has its own strengths worth considering.`;
    }
    return `Both properties are closely matched. Your personal preferences (location, builder trust, timeline) should guide the final decision.`;
  };

  const getVerdictColor = (color: 'green' | 'blue' | 'yellow') => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#E6E6E6]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />

      <div className="flex-1 flex flex-col min-h-0 bg-[#E6E6E6] dark:bg-gray-900 relative">
        <Header title="RealtyPal – Market Compare" onToast={(msg: string) => setToast({ message: msg })} />

        {/* Animated Orbs Overlay Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" />
          <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] bg-purple-400/5 dark:bg-purple-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "4s" }} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-4 md:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Property Comparison</h2>
                <p className="text-sm text-gray-600">Side-by-side analysis of your shortlisted residences.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setToast({ message: 'Coming soon' })} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700">
                  Share Report
                </button>
                <button onClick={handleAddProperty} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium">
                  Add property
                </button>
              </div>
            </div>

            {/* Selector */}
            {!comparison && (
              <div ref={selectorRef} className="glass-surface rounded-2xl p-6 md:p-8 mb-6 transition-shadow duration-200 hover:shadow-md">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                    <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className={selectClass}>
                      <option value="" disabled>Select sector...</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.name}>{sector.name}, {sector.city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property 1</label>
                      <select value={property1Id} onChange={(e) => setProperty1Id(e.target.value)} className={selectClass}>
                        <option value="">Select property...</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>{p.project_name || p.builder} · {p.bhk} BHK · {formatPriceCr(p.price)} · {p.size_sqft} sqft</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property 2</label>
                      <select value={property2Id} onChange={(e) => setProperty2Id(e.target.value)} className={selectClass}>
                        <option value="">Select property...</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>{p.project_name || p.builder} · {p.bhk} BHK · {formatPriceCr(p.price)} · {p.size_sqft} sqft</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleCompare}
                      disabled={loading || !property1Id || !property2Id}
                      className="relative px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium text-sm rounded-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70 overflow-hidden"
                    >
                      {loading ? 'Comparing...' : 'Compare'}
                      {!loading && property1Id && property2Id && <BorderBeam size={80} duration={8} anchor={90} delay={0} colorFrom="#ffffff" colorTo="#3b82f6" borderWidth={2} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Results */}
            {comparison && (
              <div className="glass-surface rounded-2xl p-6 md:p-8 animate-fade-in-up">
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Visual Compare</h3>
                  <div className="grid grid-cols-2 gap-4 h-[300px] md:h-[400px]">
                    <div className="relative rounded-2xl overflow-hidden group bg-gray-100 dark:bg-gray-800">
                      {property1?.image_url ? (
                        <div className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] animate-[pan_25s_ease-in-out_infinite_alternate]" style={{ animation: 'pan 25s ease-in-out infinite alternate' }}>
                          <Image src={property1.image_url} alt="P1" fill className="object-cover" unoptimized />
                        </div>
                      ) : <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold drop-shadow-sm">Property 1</div>}
                    </div>
                    <div className="relative rounded-2xl overflow-hidden group bg-gray-100 dark:bg-gray-800">
                      {property2?.image_url ? (
                        <div className="absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] animate-[pan_25s_ease-in-out_infinite_alternate-reverse]" style={{ animation: 'pan 25s ease-in-out infinite alternate-reverse' }}>
                          <Image src={property2.image_url} alt="P2" fill className="object-cover" unoptimized />
                        </div>
                      ) : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold drop-shadow-sm">Property 2</div>}
                    </div>
                  </div>
                  <style>{`
                    @keyframes pan {
                      0% { transform: translate(0, 0) scale(1); }
                      25% { transform: translate(-2%, 2%) scale(1.05); }
                      50% { transform: translate(2%, -2%) scale(1.1); }
                      75% { transform: translate(-2%, -2%) scale(1.05); }
                      100% { transform: translate(0, 0) scale(1); }
                    }
                  `}</style>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {[{ key: 'p1', property: property1, data: comparison.property_1 }, { key: 'p2', property: property2, data: comparison.property_2 }].map((item) => {
                    const isWinner = overall_winner === item.data.id;
                    return (
                      <GlareCard key={item.key} className="flex flex-col h-full w-full justify-start items-start p-4">
                        <div className="w-full h-full flex flex-col justify-center items-center text-center p-2">
                          {/* Winner badge */}
                          {showAiVerdict && isWinner && (
                            <div className="mb-4 inline-flex bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg items-center gap-1.5 pulse-glow animate-fade-in-up">
                              <Award size={16} />
                              AI Recommended
                            </div>
                          )}

                          <div className="w-full">
                            <p className="text-3xl lg:text-4xl font-extralight tracking-tight text-gray-900 dark:text-white leading-tight">{item.property?.project_name || item.property?.builder || 'Property'}</p>
                            <p className="text-sm font-medium tracking-widest text-blue-600 dark:text-blue-400 mt-3 uppercase opacity-80">{formatSectorLabel(item.data.id)}</p>
                          </div>
                        </div>
                      </GlareCard>
                    )
                  })}
                </div>

                {/* PRODUCT DETAILS table */}
                <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Product Details</div>
                {/* AI Verdict - Collapsible */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowAiVerdict(!showAiVerdict)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <Award size={18} className="text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">AI Recommendation</span>
                      {verdicts.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">{verdicts.length}</span>
                      )}
                    </div>
                    {showAiVerdict ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-blue-600" />}
                  </button>

                  {showAiVerdict && (
                    <div className="mt-3 space-y-4 animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr] gap-4 items-start">
                        <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          AI Recommendation
                        </div>
                        {/* Property 1 verdicts */}
                        <div className="flex flex-wrap gap-2 stagger-children">
                          {verdicts.filter(v => v.winner === property1?.id).map((v, i) => (
                            <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${getVerdictColor(v.color)} flex items-center gap-1.5`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              {v.label}
                            </span>
                          ))}
                          {verdicts.filter(v => v.winner === property1?.id).length === 0 && (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </div>
                        {/* Property 2 verdicts */}
                        <div className="flex flex-wrap gap-2 stagger-children">
                          {verdicts.filter(v => v.winner === property2?.id).map((v, i) => (
                            <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${getVerdictColor(v.color)} flex items-center gap-1.5`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              {v.label}
                            </span>
                          ))}
                          {verdicts.filter(v => v.winner === property2?.id).length === 0 && (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </div>
                      </div>

                      {/* AI Summary */}
                      {getAiSummary() && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                            </span>
                            <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{getAiSummary()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comparison Table */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  {[
                    { label: 'Price', v1: formatPriceCr(comparison.property_1.price), v2: formatPriceCr(comparison.property_2.price) },
                    { label: 'Price/Sq.Ft', v1: `₹ ${comparison.property_1.price_per_sqft.toLocaleString('en-IN')}`, v2: `₹ ${comparison.property_2.price_per_sqft.toLocaleString('en-IN')}` },
                    { label: 'Configuration', v1: `${property1?.bhk ?? '—'} BHK${property1?.bathrooms ? ` · ${property1.bathrooms} Bath` : ''}${property1?.balconies ? ` · ${property1.balconies} Bal.` : ''}`, v2: `${property2?.bhk ?? '—'} BHK${property2?.bathrooms ? ` · ${property2.bathrooms} Bath` : ''}${property2?.balconies ? ` · ${property2.balconies} Bal.` : ''}` },
                    { label: 'Area', v1: `${comparison.property_1.size_sqft.toLocaleString('en-IN')} sq.ft`, v2: `${comparison.property_2.size_sqft.toLocaleString('en-IN')} sq.ft` },
                    { label: 'Builder', v1: property1?.builder ?? '—', v2: property2?.builder ?? '—' },
                    { label: 'Possession', v1: comparison.property_1.status === 'ready' ? 'Ready to Move' : 'Under Construction', v2: comparison.property_2.status === 'ready' ? 'Ready to Move' : 'Under Construction' },
                    ...(property1?.floor || property2?.floor ? [{ label: 'Floor', v1: property1?.floor ? String(property1.floor) : '—', v2: property2?.floor ? String(property2.floor) : '—' }] : []),
                  ].map((row) => (
                    <div key={row.label} className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-6 py-10 border-b border-gray-100 dark:border-gray-800 items-center">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{row.label}</div>
                      <div className="text-xl md:text-3xl font-extralight tracking-tight text-gray-900 dark:text-white">{row.v1}</div>
                      <div className="text-xl md:text-3xl font-extralight tracking-tight text-gray-900 dark:text-white">{row.v2}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-6 py-10 items-start border-b border-gray-100 dark:border-gray-800">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">Key Amenities</div>
                    <div className="flex flex-wrap gap-5">
                      {(comparison.property_1.amenities || []).slice(0, 9).map((a: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          <AmenityIcon amenity={a} size="lg" showLabel={true} />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-5">
                      {(comparison.property_2.amenities || []).slice(0, 9).map((a: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          <AmenityIcon amenity={a} size="lg" showLabel={true} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights comparison */}
                  {(property1?.highlights?.length || property2?.highlights?.length) ? (
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-6 py-10">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Highlights</div>
                      <div className="space-y-6">
                        {(property1?.highlights || []).slice(0, 6).map((h, idx) => (
                          <p key={idx} className="text-lg font-light tracking-tight text-gray-800 dark:text-gray-200 flex items-start gap-5">
                            <span className="text-blue-500 mt-2 text-[8px] opacity-70">●</span>
                            <span className="leading-relaxed">{h}</span>
                          </p>
                        ))}
                      </div>
                      <div className="space-y-6">
                        {(property2?.highlights || []).slice(0, 6).map((h, idx) => (
                          <p key={idx} className="text-lg font-light tracking-tight text-gray-800 dark:text-gray-200 flex items-start gap-5">
                            <span className="text-blue-500 mt-2 text-[8px] opacity-70">●</span>
                            <span className="leading-relaxed">{h}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {!comparison && !loading && (
              <div className="glass-surface rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 md:p-14 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[250px] bg-white/50 dark:bg-black/50">
                <div className="z-10 relative flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-base font-medium">Activate Intelligence Engine</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-sm mx-auto">Choose two properties above and click Compare to run a deep-dive AI analysis.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
