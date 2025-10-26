import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight, X, Play, Calendar, BarChart3, Settings, Users, FileText } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
}

export function FeatureTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const tourSteps: TourStep[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      description: 'Your command center for content management. Here you can see all your projects, recent activity, and key metrics at a glance.',
      icon: <BarChart3 className="h-6 w-6" />,
      target: '[data-tour="dashboard"]',
      position: 'bottom'
    },
    {
      id: 'compose',
      title: 'Content Composer',
      description: 'Create engaging content for all your social media platforms. Use our AI-powered tools to generate ideas and optimize your posts.',
      icon: <FileText className="h-6 w-6" />,
      target: '[data-tour="compose"]',
      position: 'right'
    },
    {
      id: 'calendar',
      title: 'Content Calendar',
      description: 'Plan and schedule your content with our visual calendar. Drag and drop to reschedule, and see your posting schedule at a glance.',
      icon: <Calendar className="h-6 w-6" />,
      target: '[data-tour="calendar"]',
      position: 'top'
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      description: 'Track your performance across all platforms. Get detailed insights into engagement, reach, and growth metrics.',
      icon: <BarChart3 className="h-6 w-6" />,
      target: '[data-tour="analytics"]',
      position: 'left'
    },
    {
      id: 'projects',
      title: 'Project Management',
      description: 'Organize your content with projects and campaigns. Keep everything organized and track progress towards your goals.',
      icon: <Users className="h-6 w-6" />,
      target: '[data-tour="projects"]',
      position: 'right'
    },
    {
      id: 'settings',
      title: 'Settings & Connections',
      description: 'Manage your account settings, connect social media platforms, and customize your PubHub experience.',
      icon: <Settings className="h-6 w-6" />,
      target: '[data-tour="settings"]',
      position: 'top'
    }
  ];

  useEffect(() => {
    if (isActive) {
      highlightCurrentStep();
    } else {
      removeHighlight();
    }
  }, [isActive, currentStep]);

  const highlightCurrentStep = () => {
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setHighlightedElement(element);
      element.style.position = 'relative';
      element.style.zIndex = '1000';
      element.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.3)';
      element.style.borderRadius = '8px';
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
      setHighlightedElement(null);
    }
  };

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('feature-tour-completed', 'true');
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('feature-tour-skipped', 'true');
  };

  if (!isActive) {
    return (
      <Button
        onClick={startTour}
        variant="outline"
        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      >
        <Play className="h-4 w-4 mr-2" />
        Take Feature Tour
      </Button>
    );
  }

  const currentStepData = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                {currentStepData.icon}
              </div>
              <div>
                <CardTitle className="text-lg text-emerald-700">
                  {currentStepData.title}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {tourSteps.length}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-gray-600 leading-relaxed">
            {currentStepData.description}
          </CardDescription>
          
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep === tourSteps.length - 1 ? (
                <Button
                  onClick={finishTour}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Finish Tour
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={skipTour}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to check if tour should be shown
export function useFeatureTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('feature-tour-completed');
    const tourSkipped = localStorage.getItem('feature-tour-skipped');
    
    if (!tourCompleted && !tourSkipped) {
      setShouldShowTour(true);
    }
  }, []);

  return shouldShowTour;
}
