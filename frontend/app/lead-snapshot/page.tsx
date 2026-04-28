'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import NumberTicker from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { AuroraBackground } from '@/components/ui/aurora-background';
import Header from '@/components/Header';
import { Share2, Settings, User, Bell, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Phone, Calendar, BadgeCheck, FileText, ArrowRight, TrendingUp, BarChart3, Database, Info, Star, Target, Activity } from 'lucide-react';

export default function LeadSnapshotPage() {
    const [userId, setUserId] = useState<string | null>('demo-user');

    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');
        if (!storedUserId) {
            window.location.href = '/';
            return;
        }
        setUserId(storedUserId);
    }, []);

    return (
        <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#121212] overflow-hidden text-gray-900 dark:text-white transition-colors duration-200">
            <Sidebar activeView="lead-snapshot" userId={userId} />

            <div className="flex-1 flex flex-col min-w-0">
                <Header title="RealtyPal – Lead Snapshot" />

                <div className="flex-1 overflow-y-auto w-full scrollbar-hide">
                    <AuroraBackground className="px-6 md:px-8 py-6 pb-24 space-y-6">
                        <div className="max-w-7xl mx-auto space-y-6 relative z-10 w-full">

                            {/* Profile Header Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-8 ring-blue-50 dark:ring-blue-900/20">
                                        RK
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold flex items-center gap-2">Rohan Kumar <BadgeCheck className="text-blue-500" size={24} /></h2>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">Sr. Engineering Manager • Gurgaon</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="relative overflow-hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20">
                                                <Phone size={16} className="shrink-0 relative z-10" /> <span className="relative z-10">Contact Lead</span>
                                                <BorderBeam size={80} duration={8} anchor={90} delay={0} colorFrom="#ffffff" colorTo="#3b82f6" borderWidth={2} className="z-0" />
                                            </button>
                                            <button className="flex items-center justify-center w-11 h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors shrink-0">
                                                <Mail size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Contact</span>
                                            <span className="text-sm font-medium">+91 98765 43210</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Email</span>
                                            <span className="text-sm font-medium">r.kumar***@gmail.com</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Last Active</span>
                                            <span className="text-sm font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 12 mins ago</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Source</span>
                                            <span className="text-sm font-medium flex items-center gap-1.5"><Database size={14} className="text-indigo-400" /> RealtyPal AI Chatbot</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Intelligence Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                                {/* Intent Level */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center mb-3">
                                        <Target size={20} strokeWidth={2} />
                                    </div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Intent Level</h4>
                                    <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                                        <span className="text-lg">High</span>
                                    </div>
                                </div>

                                {/* Budget / Price Check */}
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm col-span-2 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> Financial Qualification</h3>
                                        <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-green-200/50">Verified</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-700/50 pb-3">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">Indicated Budget</p>
                                                <p className="text-lg font-bold">₹1.8 Cr - ₹2.5 Cr</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                                                <CheckCircle2 size={16} /> Verified
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5 font-medium uppercase tracking-wider">AI Price Check</p>
                                                <p className="text-sm font-medium">Performed for Sector 150</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                <FileText size={16} /> Report Generated
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Engagement Score */}
                                <div className="bg-gradient-to-br from-gray-900 via-[#1A233A] to-[#0A101D] text-white p-6 rounded-2xl border border-gray-800 shadow-2xl col-span-2 relative flex flex-col items-center justify-center group overflow-hidden">
                                    {/* Background Glows */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 blur-[40px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

                                    <div className="w-full flex items-center justify-between relative z-10 mb-2">
                                        <h3 className="font-bold flex items-center gap-2 text-gray-200 tracking-wide"><BarChart3 size={16} className="text-blue-400" /> Engagement Score</h3>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></div>
                                    </div>

                                    <div className="relative flex items-center justify-center w-36 h-36 mt-1 mb-3 z-10">
                                        {/* Glowing SVG Ring */}
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(31, 41, 55, 0.5)" strokeWidth="6" />
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="263.89" strokeDashoffset={263.89 - (263.89 * 82) / 100} className="drop-shadow-[0_0_6px_rgba(59,130,246,0.5)] animate-[strokePulse_2s_ease-in-out_infinite_alternate]" />
                                            <defs>
                                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#818CF8" />
                                                    <stop offset="100%" stopColor="#3B82F6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <style>{`
                                        @keyframes strokePulse {
                                          0% { filter: drop-shadow(0 0 4px rgba(59,130,246,0.3)); }
                                          100% { filter: drop-shadow(0 0 10px rgba(59,130,246,0.7)); }
                                        }
                                      `}</style>
                                        <div className="flex flex-col items-center justify-center z-10 pt-1">
                                            <div className="flex items-baseline text-4xl font-black drop-shadow-[0_4px_12px_rgba(59,130,246,0.6)] tracking-tight">
                                                <NumberTicker value={82} delay={0.2} className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500" />
                                            </div>
                                            <span className="text-[10px] text-blue-100 font-black tracking-[0.2em] uppercase mt-2 drop-shadow-lg opacity-80">Score Units</span>
                                        </div>
                                    </div>

                                    <div className="w-full text-center relative z-10 mt-auto pt-3 border-t border-gray-800/50">
                                        <span className="text-[11px] font-semibold text-emerald-400 tracking-widest uppercase">Top 15% Activity Level</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chatbot Extraction Data */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">

                                {/* Extracted Requirements */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 flex-none pb-4"><Settings size={18} className="text-gray-400" /> Verified Requirements</h3>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Property Type</p>
                                            <p className="text-base font-semibold">3 BHK Premium Flat</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Primary Purpose</p>
                                            <p className="text-base font-semibold">End Use & Investment</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Location Pref</p>
                                            <p className="text-base font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 -ml-3 inline-block rounded-md border border-transparent">Sector 150, Noida</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Possession</p>
                                            <p className="text-base font-semibold">Ready / 3-6 Months</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200/60 dark:border-gray-700/50 flex items-start gap-3">
                                        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                            User specifically asked about <span className="text-gray-900 dark:text-white font-bold">Tata Eureka Park</span> floor plans and ran a market valuation on <span className="text-gray-900 dark:text-white font-bold">Ace Golfshire</span>. High emphasis on builder reputation and amenities.
                                        </p>
                                    </div>
                                </div>

                                {/* Shortlisted Projects */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                                        <h3 className="font-bold text-lg flex items-center gap-2"><Star size={18} className="text-amber-500 fill-amber-500/20" /> Shortlisted</h3>
                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm">3</span>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Item 1 */}
                                        <div className="group p-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative shrink-0">
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400">IMG</div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">Tata Eureka Park</p>
                                                    <p className="text-xs text-gray-500 font-medium">3 BHK • ₹1.85 Cr</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </div>

                                        {/* Item 2 */}
                                        <div className="group p-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative shrink-0">
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400">IMG</div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">Ace Golfshire</p>
                                                    <p className="text-xs text-gray-500 font-medium">3 BHK • ₹2.10 Cr</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </div>

                                        {/* Item 3 */}
                                        <div className="group p-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative shrink-0">
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400">IMG</div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">Samridhi Luxuriya</p>
                                                    <p className="text-xs text-gray-500 font-medium">3 BHK • ₹1.90 Cr</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-300 transition-colors">
                                            View Full Chat Transcript
                                        </button>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </AuroraBackground>
                </div>
            </div>
        </div>
    );
}
