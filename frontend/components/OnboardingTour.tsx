'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Heart, GitCompare, DollarSign, X, ArrowRight } from 'lucide-react';

interface TourStep {
  target: string; // description of the area
  title: string;
  description: string;
  icon: React.ReactNode;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  arrowDirection: 'left' | 'right' | 'up' | 'down';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'chat',
    title: 'Chat with AI',
    description: 'Tell the AI your requirements — budget, BHK, sector — and get personalized property recommendations instantly.',
    icon: <MessageSquare size={20} />,
    position: { top: '40%', left: '35%' },
    arrowDirection: 'left',
  },
  {
    target: 'save',
    title: 'Save Favorites',
    description: 'Tap the heart icon on any property card to save it. Access all saved properties from the sidebar.',
    icon: <Heart size={20} />,
    position: { top: '35%', right: '15%' },
    arrowDirection: 'right',
  },
  {
    target: 'compare',
    title: 'Compare Properties',
    description: 'Select two properties and get an AI-powered side-by-side analysis with smart verdict tags.',
    icon: <GitCompare size={20} />,
    position: { top: '25%', left: '12%' },
    arrowDirection: 'left',
  },
  {
    target: 'value',
    title: 'Price Validation',
    description: 'Enter any property details and get an AI market estimate. Know if you are overpaying before you buy.',
    icon: <DollarSign size={20} />,
    position: { top: '32%', left: '12%' },
    arrowDirection: 'left',
  },
];

const STORAGE_KEY = 'ic_onboarding_complete';

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if onboarding already completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Show after a short delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300" />

      {/* Tooltip */}
      <div
        className="fixed z-[101] animate-fade-in-up"
        style={{
          ...step.position,
          maxWidth: '340px',
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 relative">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            {step.icon}
          </div>

          {/* Content */}
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{step.description}</p>

          {/* Progress & Actions */}
          <div className="flex items-center justify-between">
            {/* Dots */}
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'bg-blue-600 w-6'
                      : i < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Reset onboarding (for testing)
 */
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
