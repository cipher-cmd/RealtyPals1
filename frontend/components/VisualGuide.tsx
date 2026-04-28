'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronRight, ChevronLeft, Map, MessageSquare, Zap, Target, RotateCcw } from 'lucide-react';

interface GuideStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: GuideStep[] = [
  {
    id: 'welcome',
    targetId: 'chat-input-guide',
    title: 'Welcome to RealtyPal!',
    description: 'I am your intelligent real estate advisor. Just type what you are looking for—like "3BHK in Sector 150" or "Schools near Sector 44".',
    icon: <MessageSquare className="text-blue-500" />,
    position: 'top'
  },
  {
    id: 'visuals',
    targetId: 'theme-toggle-guide',
    title: 'Premium Appearance',
    description: 'Switch between Light and Dark mode here. Our "Glassmorphism" design looks stunning in both!',
    icon: <Zap className="text-yellow-500" />,
    position: 'bottom'
  },
  {
    id: 'reset',
    targetId: 'new-chat-guide',
    title: 'Fresh Start',
    description: 'Want to search in a different area? Click here to clear the current context and start a brand new search.',
    icon: <RotateCcw className="text-red-500" />,
    position: 'bottom'
  }
];

export default function VisualGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('realtypal_guide_seen');
    if (!seen) {
      setHasSeenGuide(false);
      // Auto-open after a short delay for new users
      setTimeout(() => setIsOpen(true), 2000);
    }
  }, []);

  const closeGuide = () => {
    setIsOpen(false);
    localStorage.setItem('realtypal_guide_seen', 'true');
    setHasSeenGuide(true);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeGuide();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen && hasSeenGuide) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full glass-surface border border-white/50 shadow-lg flex items-center justify-center text-blue-600 hover:scale-110 transition-transform z-50 group"
      >
        <HelpCircle size={24} />
        <span className="absolute right-14 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md border border-gray-100 dark:border-gray-700">Guide</span>
      </button>
    );
  }

  const step = STEPS[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Overlay mask to highlight the target */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={closeGuide} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute z-[101] pointer-events-auto flex flex-col items-center justify-center w-full h-full"
          >
            <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-white/20 p-8 max-w-sm w-[90%] relative overflow-hidden">
              {/* Animated background pulse */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
              
              <button 
                onClick={closeGuide}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 shadow-inner">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-blue-500' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} 
                    />
                  ))}
                </div>
                
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button 
                      onClick={prevStep}
                      className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                  >
                    {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
                    {currentStep < STEPS.length - 1 && <ChevronRight size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

