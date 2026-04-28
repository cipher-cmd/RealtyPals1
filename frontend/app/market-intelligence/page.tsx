'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import Header from '@/components/Header';
import { Share2, Settings, User, Bell, Map as MapIcon, TrendingUp, TrendingDown, Target, Clock, ArrowRight, Activity, Percent, ArrowUpRight } from 'lucide-react';
import { API_BASE } from '@/lib/env';
import PriceTimeline from '@/components/PriceTimeline';

export default function MarketIntelligencePage() {
    const [userId] = useState<string | null>('demo-user');
    const [stats, setStats] = useState({
        avgPrice: 12450,
        threeBhkPct: 45,
        fourBhkPct: 32,
        plotsPct: 15,
        commercialPct: 8,
        topProjects: [] as { name: string, price: number, score: number }[]
    });

    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        if (!storedUserId) {
            window.location.href = '/';
            return;
        }

        fetch(`${API_BASE}/properties`)
            .then(res => res.json())
            .then(data => {
                if (data && data.properties && data.properties.length > 0) {
                    const props = data.properties;
                    let totalPriceSqft = 0;
                    let count = 0;

                    let threeBhk = 0;
                    let fourBhk = 0;
                    let plots = 0;
                    let other = 0;

                    props.forEach((p: any) => {
                        if (p.price && p.size_sqft && p.price > 0 && p.size_sqft > 0) {
                            totalPriceSqft += (p.price / p.size_sqft);
                            count++;
                        }
                        if (p.property_type === 'plot') plots++;
                        else if (p.property_type === 'commercial' || p.property_type === 'shop') other++;
                        else if (p.bhk === 3) threeBhk++;
                        else if (p.bhk && p.bhk >= 4) fourBhk++;
                        else other++;
                    });

                    if (count > 0) {
                        const avg = Math.round(totalPriceSqft / count);
                        const totalProps = props.length;

                        // Mock project scoring based on price and a random factor
                        const projectsMap = new Map<string, { name: string, price: number, score: number }>();
                        props.forEach((p: any) => {
                            if (p.project_name && !projectsMap.has(p.project_name)) {
                                const score = 7.5 + (Math.random() * 1.5); // Random score between 7.5 and 9.0
                                projectsMap.set(p.project_name, { name: p.project_name, price: p.price, score: score });
                            }
                        });
                        const topProjects = Array.from(projectsMap.values()).sort((a, b) => b.score - a.score).slice(0, 3);

                        setStats({
                            avgPrice: avg,
                            threeBhkPct: Math.round((threeBhk / totalProps) * 100),
                            fourBhkPct: Math.round((fourBhk / totalProps) * 100),
                            plotsPct: Math.round((plots / totalProps) * 100),
                            commercialPct: Math.round((other / totalProps) * 100),
                            topProjects: topProjects
                        });
                    }
                }
            })
            .catch(err => console.error("Error fetching market stats", err));
    }, []);

    return (
        <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#121212] overflow-hidden text-gray-900 dark:text-white transition-colors duration-200">
            {/* Dynamic Sidebar */}
            <Sidebar activeView="market-intelligence" userId={userId} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header title="RealtyPal – Market Intelligence" />

                <div className="flex-1 overflow-y-auto w-full px-6 md:px-8 py-6 pb-24 space-y-8 scrollbar-hide bg-gray-50 dark:bg-black/20">

                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Header / Top Nav */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Noida Sector 150 <span className="text-blue-600 dark:text-blue-500">Overview</span></h2>
                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Activity size={16} /> Live Data &bull; Updated 2 hrs ago
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex text-sm font-medium">
                                <button className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white shadow-sm">Sector 150</button>
                                <button className="px-4 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Greater Noida W</button>
                                <button className="px-4 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Yamuna Expressway</button>
                            </div>
                        </div>

                        <BentoGrid className="md:auto-rows-[10rem] grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <BentoGridItem
                                title={<span className="text-2xl font-bold font-sans">₹{stats.avgPrice.toLocaleString()}</span>}
                                description={<span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Price / Sq.ft</span>}
                                header={
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1"><TrendingUp size={12} /> +18.2%</span>
                                    </div>
                                }
                                className="col-span-1"
                            />
                            <BentoGridItem
                                title={<span className="text-2xl font-bold font-sans">Very High</span>}
                                description={<span className="text-sm font-medium text-gray-500 dark:text-gray-400">Demand Movement</span>}
                                header={
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                            <Activity size={20} className="text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1"><TrendingUp size={12} /> +42%</span>
                                    </div>
                                }
                                className="col-span-1"
                            />
                            <BentoGridItem
                                title={<span className="text-2xl font-bold font-sans">42 Days</span>}
                                description={<span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Time to Sell</span>}
                                header={
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                            <Clock size={20} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full flex items-center gap-1"><TrendingDown size={12} /> -15 days</span>
                                    </div>
                                }
                                className="col-span-1"
                            />
                            <BentoGridItem
                                title={<span className="text-2xl font-bold font-sans">4.8%</span>}
                                description={<span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Rental Yield</span>}
                                header={
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                            <Percent size={20} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1">Stable</span>
                                    </div>
                                }
                                className="col-span-1"
                            />
                        </BentoGrid>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 12-Month Trend Graph */}
                            <div className="col-span-2 overflow-hidden relative flex flex-col justify-stretch">
                                <PriceTimeline className="h-full w-full p-6 pb-2 rounded-3xl" />
                            </div>

                            {/* Composition / Heatmap */}
                            <div className="col-span-1 flex flex-col gap-6">

                                {/* Supply Concentration */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
                                    <h3 className="text-lg font-bold mb-1">Supply Concentration</h3>
                                    <p className="text-sm text-gray-500 mb-6">Inventory split by segment</p>

                                    <div className="space-y-5">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">3 BHK Premium</span>
                                                <span className="font-bold">{stats.threeBhkPct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${stats.threeBhkPct}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">4 BHK Luxury</span>
                                                <span className="font-bold">{stats.fourBhkPct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${stats.fourBhkPct}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">Plots / Villas</span>
                                                <span className="font-bold">{stats.plotsPct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${stats.plotsPct}%` }}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">Other & Commercial</span>
                                                <span className="font-bold">{stats.commercialPct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                                <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${stats.commercialPct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Noida Sector 150 Growth Dashboard - Local Replacement for Globe */}
                                <div className="bg-gradient-to-br from-[#050505] to-[#111] text-white p-6 rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform flex flex-col" style={{ minHeight: '350px' }}>

                                    <div className="relative z-10 w-full flex justify-between items-start mb-4">
                                        <div className="bg-blue-500/20 border border-blue-400/50 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded backdrop-blur-md flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            Sector 150 Pulse
                                        </div>
                                        <Target size={18} className="text-gray-400" />
                                    </div>

                                    <div className="relative z-10 space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Growth Corridor</h3>
                                            <p className="text-xs text-gray-500">Noida-Greater Noida Expressway Zone</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mt-4">
                                            {[
                                                { label: 'Jewar Airport Impact', value: 'High', color: 'text-emerald-400' },
                                                { label: 'Sports City Status', value: 'Active', color: 'text-blue-400' },
                                                { label: 'Aqua Line Proximity', value: '0.8 km', color: 'text-purple-400' },
                                                { label: 'Institutional Score', value: '9.2 / 10', color: 'text-amber-400' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                                    <span className="text-[11px] text-gray-400 font-medium">{item.label}</span>
                                                    <span className={`text-[11px] font-bold ${item.color}`}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Abstract Map Background Decoration */}
                                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                                        <svg className="absolute w-[200%] h-[200%] top-0 left-0 -rotate-12 translate-x-[-10%] translate-y-[-10%]" viewBox="0 0 100 100">
                                            <path d="M0,20 Q20,25 40,20 T80,25 T120,20" fill="none" stroke="white" strokeWidth="0.2" />
                                            <path d="M0,40 Q20,45 40,40 T80,45 T120,40" fill="none" stroke="white" strokeWidth="0.2" />
                                            <path d="M0,60 Q20,65 40,60 T80,65 T120,60" fill="none" stroke="white" strokeWidth="0.2" />
                                            <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
                                            <circle cx="50" cy="50" r="15" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 2" />
                                        </svg>
                                    </div>

                                    <div className="relative z-10 mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Intelligence Feed</span>
                                        <ArrowRight size={14} className="text-blue-500" />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Top Projects Ranking */}
                        {stats.topProjects.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm mt-6 mb-8 group overflow-hidden relative">
                                <div className="absolute inset-0 bg-blue-50/30 dark:bg-blue-900/10 pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <h3 className="text-xl font-bold mb-5 flex items-center gap-2 relative z-10"><Target size={22} className="text-blue-500" /> Top Projects in Sector 150 <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-md ml-2 font-medium">Ranked by Demand</span></h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                                    {stats.topProjects.map((proj, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm cursor-default hover:border-blue-200 dark:hover:border-blue-900/50 group/item hover:-translate-y-1 duration-300">
                                            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/80 shadow-sm group-hover/item:scale-110 transition-transform">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors text-[15px]">{proj.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex text-amber-500">
                                                        <Activity size={12} className="mr-1" />
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold tracking-wide flex items-center gap-1">
                                                        Demand: <span className="text-gray-700 dark:text-white">{proj.score.toFixed(1)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
