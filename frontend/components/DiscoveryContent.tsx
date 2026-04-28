'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Property, ChatMessage } from '@/types/property';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetailView from '@/components/PropertyDetailView';
import AIThinkingIndicator from '@/components/AIThinkingIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import VisualGuide from './VisualGuide';
import Image from 'next/image';
import Toast from '@/components/Toast';
import { API_BASE } from '@/lib/env';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/Header';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import {
  MessageSquare, User, RotateCcw, AlertTriangle, Send, Mic, ExternalLink, Activity, Info, TrendingUp,
  Share2, Settings, Plus, Search, GitCompare, HelpCircle
} from 'lucide-react';

interface DiscoveryContentProps {
  properties: Property[];
  loading: boolean;
  onLoadProperties: (filters: any) => void;
  onUpdateProperties: (properties: Property[]) => void;
  userId: string | null;
  onResetChat?: () => void;
}

export default function DiscoveryContent({ properties, loading, onLoadProperties, onUpdateProperties, userId, onResetChat }: DiscoveryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [chatTurnCount, setChatTurnCount] = useState(0);
  const [hasShownLengthWarning, setHasShownLengthWarning] = useState(false);
  const [chatPhase, setChatPhase] = useState<'DISCOVERY' | 'SHORTLIST' | 'ADVISOR' | 'PROPERTY_DETAIL' | 'DECISION'>('DISCOVERY');
  const [resolvedFields, setResolvedFields] = useState<{
    property_type?: boolean;
    bhk?: boolean;
    budget?: boolean;
    purpose?: boolean;
    timeline?: boolean;
    status?: boolean;
  }>({});
  const [nextExpectedField, setNextExpectedField] = useState<'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status' | undefined>(undefined);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ── Image carousel state for in-chat galleries ──
  const [carouselIndexes, setCarouselIndexes] = useState<Record<number, number>>({});

  // ── Mobile property card carousel state ──
  const [mobileCardIndexes, setMobileCardIndexes] = useState<Record<number, number>>({});
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // ── Voice input (Web Speech API) ──
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition once
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setChatInput(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setToast({ message: 'Microphone access denied. Please allow microphone in browser settings.' });
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setToast({ message: 'Voice input is not supported in this browser. Try Chrome or Edge.' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setChatInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = useCallback(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Auto-scroll when chat changes or when submitting
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isSubmitting, scrollToBottom]);

  // ── Mobile keyboard handling via Visual Viewport API ──
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const vv = window.visualViewport;
    const onResize = () => {
      if (!vv) return;
      const isOpen = vv.height < window.innerHeight * 0.75;
      setKeyboardOpen(isOpen);
      setViewportHeight(`${vv.height}px`);
      
      if (isOpen) {
        setTimeout(scrollToBottom, 50);
      }
    };

    if (vv) {
      vv.addEventListener('resize', onResize);
      vv.addEventListener('scroll', onResize);
      return () => {
        vv.removeEventListener('resize', onResize);
        vv.removeEventListener('scroll', onResize);
      };
    }
  }, [scrollToBottom]);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollBtn(distanceFromBottom > 150);
      
      // Minimize input if scrolled up significantly (on mobile)
      if (window.innerWidth < 768) {
        if (distanceFromBottom > 200) {
          setIsInputMinimized(true);
        } else if (distanceFromBottom < 50) {
          setIsInputMinimized(false);
        }
      } else {
        // Desktop behavior - maybe just keep it visible or a less aggressive minimize
        setIsInputMinimized(false);
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Ctrl+K keyboard shortcut to focus chat input ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        chatInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── "Ask AI" button on PropertyCard injects text via CustomEvent ──
  useEffect(() => {
    const handler = (e: Event) => {
      const { text } = (e as CustomEvent<{ text: string }>).detail;
      setChatInput(text);
      setTimeout(() => chatInputRef.current?.focus(), 50);
    };
    window.addEventListener('realtypals:ask-ai', handler);
    return () => window.removeEventListener('realtypals:ask-ai', handler);
  }, []);

  const performReset = async () => {
    setChatHistory([]);
    setChatInput('');
    setShowRecommendations(false);
    setIsInitialized(false);
    setChatPhase('DISCOVERY');
    setChatTurnCount(0);
    setHasShownLengthWarning(false);
    setResolvedFields({});
    setNextExpectedField(undefined);
    setIsSubmitting(false);
    setCarouselIndexes({});
    if (userId) {
      try {
        await fetch(`${API_BASE}/chat/intent`, {
          method: 'DELETE',
          headers: { 'X-User-Id': userId },
        });
      } catch (e) {
        console.error('Failed to reset intent:', e);
      }
    }
    const welcomeMessage: ChatMessage = {
      type: 'ai',
      content: "Hey, I am RealtyPal at your assistance, tell me how can I help you?",
      timestamp: new Date().toISOString(),
    };
    setChatHistory([welcomeMessage]);
    setIsInitialized(true);
  };

  // Handle ?new=1
  useEffect(() => {
    if (searchParams.get('new') !== '1' || !userId) return;
    (async () => {
      await performReset();
      router.replace('/discover');
    })();
  }, [searchParams, userId]);

  // Initialize with welcome message
  useEffect(() => {
    if (!isInitialized && userId && searchParams.get('new') !== '1') {
      const welcomeMessage: ChatMessage = {
        type: 'ai',
        content: "Hey, I am RealtyPal at your assistance, tell me how can I help you?",
        timestamp: new Date().toISOString(),
      };
      setChatHistory([welcomeMessage]);
      setIsInitialized(true);
    }
  }, [userId, isInitialized, searchParams]);

  // Expose reset function for Sidebar "New Chat"
  useEffect(() => {
    (window as any).__resetDiscoveryChat = async () => {
      await performReset();
    };
    return () => {
      delete (window as any).__resetDiscoveryChat;
    };
  }, [userId]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !userId || isSubmitting || submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    const userMessage: ChatMessage = {
      type: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatTurnCount((count) => count + 1);
    const currentInput = chatInput;
    setChatInput('');

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get chat response';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (typeof data.message === 'string' && data.message.trim().length === 0) {
        if (data.next_expected_field !== undefined) {
          setNextExpectedField(data.next_expected_field);
        }
        return;
      }

      const safeMessage =
        typeof data.message === 'string' && data.message.trim().length > 0
          ? data.message
          : "I'll ask a few quick questions to narrow this down.";

      if (data.chatPhase) setChatPhase(data.chatPhase);
      if (data.next_expected_field !== undefined) setNextExpectedField(data.next_expected_field);
      if (data.resolvedFields) setResolvedFields(data.resolvedFields);

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: safeMessage,
        properties: data.showRecommendations ? (data.properties || []) : undefined,
        images: data.images || undefined,
        highlights: data.highlights || undefined,
        amenities: data.amenities || undefined,
        propertyDetail: data.propertyDetail || undefined,
        showSectorIntelligence: data.showSectorIntelligence || undefined,
        timestamp: new Date().toISOString(),
        intent: data.intent,
      };

      setChatHistory((prev) => {
        const nextHistory = [...prev, aiMessage];
        if (!hasShownLengthWarning && chatTurnCount + 1 >= 10) {
          nextHistory.push({
            type: 'ai',
            content: "We've covered a lot. Starting a fresh chat may give clearer recommendations.",
            timestamp: new Date().toISOString(),
          });
          setHasShownLengthWarning(true);
        }
        return nextHistory;
      });

      if (data.showRecommendations && data.properties) {
        setShowRecommendations(true);
        onUpdateProperties(data.properties);
      } else {
        setShowRecommendations(false);
      }
    } catch (error: any) {
      console.error('Error in chat:', error);
      const errorMessage: ChatMessage = {
        type: 'ai',
        content: `Sorry, I encountered an error. ${error.message ? `(${error.message})` : ''} Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  // ── Regenerate: resend the last user message to get a fresh AI response ──
  const handleRegenerate = async (aiMsgIndex: number) => {
    if (!userId || isSubmitting || regeneratingIdx !== null) return;

    // Find the user message immediately before this AI message
    let userMsg = '';
    for (let i = aiMsgIndex - 1; i >= 0; i--) {
      if (chatHistory[i].type === 'user') {
        userMsg = chatHistory[i].content;
        break;
      }
    }
    if (!userMsg) return;

    setRegeneratingIdx(aiMsgIndex);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) throw new Error('Failed to regenerate');

      const data = await response.json();
      const safeMessage = typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message
        : 'Let me try that again...';

      if (data.chatPhase) setChatPhase(data.chatPhase);

      // Replace the AI message at this index
      setChatHistory(prev => {
        const updated = [...prev];
        updated[aiMsgIndex] = {
          type: 'ai',
          content: safeMessage,
          properties: data.showRecommendations ? (data.properties || []) : undefined,
          images: data.images || undefined,
          highlights: data.highlights || undefined,
          amenities: data.amenities || undefined,
          propertyDetail: data.propertyDetail || undefined,
          showSectorIntelligence: data.showSectorIntelligence || undefined,
          timestamp: new Date().toISOString(),
          intent: data.intent,
        };
        return updated;
      });
    } catch (error: any) {
      console.error('Regenerate error:', error);
      setToast({ message: 'Failed to regenerate. Please try again.' });
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const handleQuickReply = async (field: 'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status', value: string) => {
    if (!userId || isSubmitting) return;

    const previousNext = nextExpectedField;
    setResolvedFields(prev => ({ ...prev, [field]: true }));
    setNextExpectedField(undefined);
    setIsSubmitting(true);

    let message = '';
    switch (field) {
      case 'property_type': message = value; break;
      case 'bhk': message = `${parseInt(value)} BHK`; break;
      case 'budget': message = value; break;
      case 'purpose': message = value; break;
      case 'timeline': message = value; break;
      case 'status': message = value; break;
    }

    const userMessage: ChatMessage = { type: 'user', content: message, timestamp: new Date().toISOString() };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatTurnCount((count) => count + 1);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ message, quickReply: { field, value } }),
      });

      if (!response.ok) throw new Error('Failed to get chat response');

      const data = await response.json();

      if (typeof data.message === 'string' && data.message.trim().length === 0) {
        if (data.next_expected_field !== undefined) setNextExpectedField(data.next_expected_field);
        return;
      }

      const safeMessage =
        typeof data.message === 'string' && data.message.trim().length > 0
          ? data.message
          : "I'll ask a few quick questions to narrow this down.";

      if (data.chatPhase) setChatPhase(data.chatPhase);
      if (data.next_expected_field !== undefined) setNextExpectedField(data.next_expected_field);
      if (data.resolvedFields) setResolvedFields(data.resolvedFields);

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: safeMessage,
        properties: data.showRecommendations ? (data.properties || []) : undefined,
        images: data.images || undefined,
        highlights: data.highlights || undefined,
        amenities: data.amenities || undefined,
        propertyDetail: data.propertyDetail || undefined,
        showSectorIntelligence: data.showSectorIntelligence || undefined,
        timestamp: new Date().toISOString(),
        intent: data.intent,
      };
      setChatHistory((prev) => [...prev, aiMessage]);

      if (data.showRecommendations && data.properties) {
        setShowRecommendations(true);
        onUpdateProperties(data.properties);
      } else {
        setShowRecommendations(false);
      }
    } catch (error: any) {
      console.error('Error in quick reply:', error);
      setResolvedFields(prev => { const next = { ...prev }; delete next[field]; return next; });
      setNextExpectedField(previousNext);
      setChatHistory((prev) => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error processing your selection. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPresetOptions = (field: 'property_type' | 'bhk' | 'budget' | 'purpose' | 'timeline' | 'status' | 'sector'): Array<{ field: any, value: string, label: string }> => {
    return []; // Removed all default option buttons per user request
  };

  const hasUserReplied = chatHistory.some((m) => m.type === 'user');

  const suggestionChips: any[] = [];

  // ── ADVISOR mode follow-up chips (smart, context-aware) ──
  const getAdvisorChips = (): string[] => {
    return []; // Removed default buttons per user request
  };

  // ── Carousel navigation helper ──
  const setCarouselIndex = (msgIndex: number, imgIndex: number) => {
    setCarouselIndexes(prev => ({ ...prev, [msgIndex]: imgIndex }));
  };

  // ── Render a single chat message ──
  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.type === 'user';

    return (
      <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-message-in`}>
        <div className={`flex ${isUser ? 'items-end gap-3 flex-row-reverse' : 'items-start gap-3'}`}>
          {/* Avatar */}
          {isUser ? (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <User size={24} className="text-white" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full glass-surface flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-white/50 dark:border-white/10">
              <Image
                src="/images/logo/realtypals.png"
                alt="RP"
                width={40}
                height={40}
              />
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`max-w-[85%] rounded-[24px] px-6 py-4 shadow-sm transition-all duration-300 ${isUser
              ? 'bg-[#0064E5] text-white shadow-blue-500/10'
              : 'glass-surface text-gray-900 dark:text-gray-100 border border-white/40 dark:border-white/5 relative overflow-hidden shadow-lg'
              }`}
          >
            {/* Added a subtle glow to AI bubbles */}
            {!isUser && <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none"></div>}

            {!isUser ? (
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-blue-700 dark:prose-headings:text-blue-400 prose-a:text-blue-500 prose-strong:text-blue-600 dark:prose-strong:text-blue-400 relative z-10 prose-table:w-full prose-table:my-4 prose-table:rounded-xl prose-table:overflow-hidden prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-800 prose-th:bg-blue-50 dark:prose-th:bg-blue-900/40 prose-th:p-3 prose-th:text-left prose-th:text-blue-900 dark:prose-th:text-blue-200 prose-td:p-3 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-[16px] font-medium leading-relaxed relative z-10">{message.content}</p>
            )}
          </div>
        </div>

        {/* ── Regenerate button (only on AI messages in ADVISOR mode) ── */}
        {!isUser && chatPhase === 'ADVISOR' && index > 0 && !message.properties?.length && (
          <button
            onClick={() => handleRegenerate(index)}
            disabled={regeneratingIdx === index || isSubmitting}
            className="ml-12 mt-1 inline-flex items-center gap-1 px-3 py-1.5 text-[11px] text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-white/50 dark:hover:bg-gray-800 disabled:opacity-40 touch-target-min"
            title="Regenerate response"
          >
            <RotateCcw size={11} className={regeneratingIdx === index ? 'animate-spin' : ''} />
            {regeneratingIdx === index ? 'Regenerating...' : 'Regenerate'}
          </button>
        )}

        {/* ── Rich Property Detail View (3-panel: amenities + floor plan + specs) ── */}
        {message.propertyDetail && (
          <PropertyDetailView
            propertyDetail={message.propertyDetail}
            onToast={(msg) => setToast({ message: msg })}
          />
        )}

        {/* ── In-chat image gallery (standalone floor plan / interior / images) ── */}
        {!message.propertyDetail && message.images && message.images.length > 0 && (
          <div className="mt-3 ml-12 w-full max-w-[80%]">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm">
              {/* Image type badge */}
              {message.images[carouselIndexes[index] || 0]?.type && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium capitalize">
                    {(message.images[carouselIndexes[index] || 0].type || '').replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              <Image
                src={message.images[carouselIndexes[index] || 0]?.url || message.images[0].url}
                alt={message.images[carouselIndexes[index] || 0]?.caption || 'Property image'}
                width={680}
                height={400}
                className="w-full h-72 object-cover"
                unoptimized
              />
              {/* Carousel dots */}
              {message.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {message.images.map((_, imgIdx) => (
                    <button
                      key={imgIdx}
                      onClick={() => setCarouselIndex(index, imgIdx)}
                      className={`carousel-dot ${(carouselIndexes[index] || 0) === imgIdx ? 'active' : ''}`}
                    />
                  ))}
                </div>
              )}
              {/* Caption */}
              {message.images[carouselIndexes[index] || 0]?.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2">
                  <p className="text-white text-xs">{message.images[carouselIndexes[index] || 0].caption}</p>
                </div>
              )}
            </div>
            {/* Image count indicator */}
            {message.images.length > 1 && (
              <p className="text-xs text-gray-400 mt-1.5 text-center">{carouselIndexes[index] ? carouselIndexes[index] + 1 : 1} / {message.images.length}</p>
            )}
          </div>
        )}

        {/* ── Highlights bullets (standalone when no propertyDetail) ── */}
        {!message.propertyDetail && message.highlights && message.highlights.length > 0 && (
          <div className="mt-3 ml-12 max-w-[80%] bg-[#F7F7F7] dark:bg-gray-800 border border-[#E8E8E8] dark:border-gray-700 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Key Highlights</p>
            <ul className="space-y-2">
              {message.highlights.map((h, hIdx) => (
                <li key={hIdx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Amenities Cards (standalone when no propertyDetail) ── */}
        {!message.propertyDetail && message.amenities && message.amenities.length > 0 && (
          <div className="mt-4 ml-12 sm:ml-14 w-full max-w-[95%] sm:max-w-[85%] md:max-w-[75%]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {message.amenities.map((amenity, idx) => (
                <div key={idx} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                  <span className="text-[12px] sm:text-[13px] font-semibold text-blue-800 dark:text-blue-300 group-hover:text-blue-600 dark:group-hover:text-blue-200">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Property cards grid ── */}
        {message.properties && message.properties.length > 0 && (() => {
          const msgCardIndex = mobileCardIndexes[index] || 0;
          const totalCards = message.properties.length;

          const goToCard = (newIdx: number) => {
            setMobileCardIndexes(prev => ({ ...prev, [index]: Math.max(0, Math.min(newIdx, totalCards - 1)) }));
          };

          return (
            <div className="mt-4 w-full relative">
              {/* ── Mobile: Single card carousel with dots ── */}
              <div className="md:hidden">
                <div
                  className="relative overflow-visible"
                  onTouchStart={(e) => {
                    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }}
                  onTouchEnd={(e) => {
                    if (!touchStartRef.current) return;
                    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
                    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
                    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
                      if (deltaX < 0 && msgCardIndex < totalCards - 1) goToCard(msgCardIndex + 1);
                      if (deltaX > 0 && msgCardIndex > 0) goToCard(msgCardIndex - 1);
                    }
                    touchStartRef.current = null;
                  }}
                >
                  {/* Card container with overflow visible to show peaks */}
                  <div className="flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`card-${index}-${msgCardIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-[88vw] flex-shrink-0 pr-2"
                      >
                        <PropertyCard property={message.properties[msgCardIndex]} userId={userId} />
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Peak of next card */}
                    {msgCardIndex < totalCards - 1 && (
                      <div 
                        className="w-[12vw] flex-shrink-0 opacity-40 grayscale blur-[1px] transform scale-90 origin-left transition-all duration-300"
                        onClick={() => goToCard(msgCardIndex + 1)}
                      >
                        <PropertyCard property={message.properties[msgCardIndex + 1]} userId={userId} autoPlay={false} />
                      </div>
                    )}
                  </div>

                  {/* Navigation Arrows with better styling */}
                  {totalCards > 1 && (
                    <>
                      {msgCardIndex > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); goToCard(msgCardIndex - 1); }}
                          className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-700 active:scale-90 transition-all"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                      )}
                      {msgCardIndex < totalCards - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); goToCard(msgCardIndex + 1); }}
                          className="absolute right-[4vw] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-700 active:scale-90 transition-all"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Dots with dynamic width */}
                {totalCards > 1 && (
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="flex items-center gap-1.5 h-2">
                      {message.properties.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          onClick={() => goToCard(dotIdx)}
                          className={`rounded-full transition-all duration-300 ${dotIdx === msgCardIndex
                            ? 'w-5 h-2 bg-blue-600 shadow-sm shadow-blue-500/50'
                            : 'w-2 h-2 bg-gray-300 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {msgCardIndex + 1} / {totalCards} Found
                    </span>
                  </div>
                )}
              </div>

              {/* ── Desktop/Tablet: Grid layout (unchanged) ── */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-5 stagger-cards px-1">
                {message.properties.map((property) => (
                  <div key={property.id}>
                    <PropertyCard property={property} userId={userId} />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Preset quick-reply buttons ── */}
        {message.type === 'ai' &&
          index === chatHistory.length - 1 &&
          chatPhase === 'DISCOVERY' &&
          nextExpectedField &&
          getPresetOptions(nextExpectedField).length > 0 && (
            <div className="mt-3 ml-12 flex flex-wrap gap-2">
              {getPresetOptions(nextExpectedField).map((button, btnIndex) => (
                <button
                  key={btnIndex}
                  type="button"
                  onClick={() => handleQuickReply(button.field, button.value)}
                  disabled={isSubmitting}
                  className="px-4 py-2 glass-surface hover:bg-white/80 dark:hover:bg-gray-700/80 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 dark:text-gray-200 rounded-full text-sm font-medium transition-all duration-200 border-transparent hover:scale-105 active:scale-95 touch-target-min"
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
      </div>
    );
  };

  // ── Chat input form ──
  const chatInputForm = (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative flex items-center gap-3">
        {/* Reset / New Chat Button */}
        <div id="new-chat-guide">
          <button
            onClick={performReset}
            className="w-10 h-10 rounded-full glass-surface border border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow-md active:scale-95 group flex items-center justify-center"
            title="Reset conversation"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div id="chat-input-guide" className="relative flex-1 group">
          <PlaceholdersAndVanishInput
            placeholders={
              chatPhase === 'ADVISOR'
                ? ['Ask anything about these properties...', 'Any risks associated?', 'Compare prices...']
                : ["Tell me what you're looking for...", "Find me a 3 BHK in Sector 150...", "Show me properties under 2 Crores..."]
            }
            onChange={(e) => setChatInput(e.target.value)}
            onSubmit={handleChatSubmit}
            value={chatInput}
          />
        </div>

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 shadow-sm bg-white dark:bg-gray-800 border-transparent dark:border-gray-600 touch-target-min ${isListening
            ? 'text-red-500 animate-pulse scale-105 border-red-200 shadow-red-500/20 bg-red-50'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-100'
            }`}
          title="Voice Input"
        >
          {isListening ? (
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 -m-1 rounded-full bg-red-100 dark:bg-red-900/30 animate-ping opacity-50" />
              <Mic size={18} className="relative text-red-500 fill-current" />
            </div>
          ) : (
            <Mic size={18} className="text-gray-500 dark:text-gray-400" />
          )}
        </button>
        
        {/* Help / Guide Button */}
        <div id="help-guide">
          <VisualGuide />
        </div>
      </div>
      {isListening && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-500 font-medium">Listening... Speak now</span>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4 text-center">
        AI can make mistakes. Verify Critical property details.
      </p>
    </div>
  );

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-[#E6E6E6] dark:bg-gray-900 overflow-hidden" 
      style={isMobile ? { height: viewportHeight } : undefined}
    >
      <Header title="RealtyPal Intelligence Engine™" onToast={(msg: string) => setToast({ message: msg })} />

      {/* Main: centered input when no chat, scrollable messages + bottom input when chat started */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative z-10 ${!hasUserReplied ? 'justify-center' : ''}`}>

        {/* Animated Orbs Overlay Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" />
          <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-purple-400/20 dark:bg-purple-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] bg-teal-400/10 dark:bg-teal-600/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "4s" }} />
        </div>

        {!hasUserReplied ? (
          <>
            <div className="flex-1" />
            <div className="flex flex-col items-center justify-center px-6 md:px-8 py-8 w-full max-w-5xl mx-auto flex-shrink-0">
              <div className="w-full space-y-4 mb-6">
                {chatHistory.map((message, index) => renderMessage(message, index))}
              </div>
              <div className="w-full flex-shrink-0">
                {chatInputForm}

              </div>
            </div>
            <div className="flex-1" />
          </>
        ) : (
          <>
            <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-3 md:py-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {chatHistory.map((message, index) => renderMessage(message, index))}

                {/* AI Thinking Indicator */}
                {isSubmitting && (
                  <AIThinkingIndicator 
                    query={chatHistory.slice().reverse().find(m => m.type === 'user')?.content} 
                  />
                )}

                {/* ── ADVISOR smart follow-up chips ── */}
                {chatPhase === 'ADVISOR' && !isSubmitting && !nextExpectedField && getAdvisorChips().length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-12 animate-message-in">
                    {getAdvisorChips().map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setChatInput(chip);
                          // Auto-submit the chip
                          setTimeout(() => {
                            const form = document.querySelector('form');
                            if (form) form.requestSubmit();
                          }, 50);
                        }}
                        className="px-4 py-2 glass-surface hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-sm hover:scale-[1.02] active:scale-95 touch-target-min"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={chatEndRef} />
              </div>

              {/* Floating Action Button (Minimized Input) */}
              <AnimatePresence>
                {isInputMinimized && !isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 md:hidden"
                  >
                    <button
                      onClick={() => {
                        setIsInputMinimized(false);
                        scrollToBottom();
                        // Focus the input once the animation likely completes
                        setTimeout(() => chatInputRef.current?.focus(), 300);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all font-semibold border border-blue-400 group whitespace-nowrap"
                    >
                      <MessageSquare size={18} />
                      <span>Send Message</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-6 w-9 h-9 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-all animate-fade-in-up z-10"
                  aria-label="Scroll to bottom"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bottom Input Field - no separator, margins aligned with sidebar/header */}
            <AnimatePresence initial={false}>
              {!isInputMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`px-4 md:px-8 bg-[#E6E6E6] dark:bg-gray-900 flex-none flex flex-col justify-center overflow-hidden ${
                    keyboardOpen ? 'pb-safe' : ''
                  }`}
                  style={keyboardOpen ? { paddingBottom: 'env(safe-area-inset-bottom, 8px)' } : undefined}
                >
                  <div className="py-2 md:py-6 min-h-[80px] md:min-h-[100px] flex flex-col justify-center">
                    {chatInputForm}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}

    </div>
  );
}
