import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Circle, ArrowRight, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  required: boolean;
}

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { projects } = useProject();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const onboardingSteps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your name and profile picture to personalize your account',
        completed: !!(user.user_metadata?.name && user.user_metadata?.avatar_url),
        required: true,
      },
      {
        id: 'connect-platforms',
        title: 'Connect Social Media Platforms',
        description: 'Link your social media accounts to start managing content',
        completed: false, // This would need to be checked against actual connections
        required: true,
      },
      {
        id: 'create-project',
        title: 'Create Your First Project',
        description: 'Organize your content with projects and campaigns',
        completed: projects.length > 0,
        required: true,
      },
      {
        id: 'first-post',
        title: 'Create Your First Post',
        description: 'Write and schedule your first piece of content',
        completed: false, // This would need to be checked against actual posts
        required: true,
      },
      {
        id: 'explore-features',
        title: 'Explore PubHub Features',
        description: 'Take a tour of the dashboard and key features',
        completed: false,
        required: false,
      },
      {
        id: 'set-preferences',
        title: 'Configure Settings',
        description: 'Set up notifications and preferences',
        completed: false,
        required: false,
      },
    ];

    setSteps(onboardingSteps);
    
    // Show onboarding if user is new (created within last 7 days) and not all required steps are complete
    const isNewUser = user.created_at && 
      new Date(user.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000);
    const hasIncompleteRequiredSteps = onboardingSteps.some(step => step.required && !step.completed);
    
    setIsVisible(isNewUser && hasIncompleteRequiredSteps);
  }, [user, isAuthenticated, projects]);

  const handleStepAction = (stepId: string) => {
    switch (stepId) {
      case 'profile':
        // Navigate to profile settings
        window.location.href = '/settings/profile';
        break;
      case 'connect-platforms':
        // Navigate to platform connections
        window.location.href = '/settings/connections';
        break;
      case 'create-project':
        // Open create project dialog
        window.location.href = '/projects/new';
        break;
      case 'first-post':
        // Navigate to content composer
        window.location.href = '/compose';
        break;
      case 'explore-features':
        // Start feature tour
        window.location.href = '/tour';
        break;
      case 'set-preferences':
        // Navigate to settings
        window.location.href = '/settings';
        break;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to not show again
    localStorage.setItem('onboarding-dismissed', 'true');
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (!isVisible || steps.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-emerald-700 flex items-center gap-2">
              Welcome to PubHub! 🚀
              <span className="text-sm font-normal text-emerald-600">
                ({completedSteps}/{totalSteps} completed)
              </span>
            </CardTitle>
            <CardDescription className="text-emerald-600">
              Complete these steps to get the most out of your PubHub experience
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-emerald-600 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-emerald-100 rounded-full h-2 mt-3">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              step.completed 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <h4 className={`font-medium ${
                  step.completed ? 'text-emerald-700' : 'text-gray-900'
                }`}>
                  {step.title}
                  {step.required && (
                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      Required
                    </span>
                  )}
                </h4>
                <p className={`text-sm ${
                  step.completed ? 'text-emerald-600' : 'text-gray-600'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
            
            {!step.completed && (
              <Button
                size="sm"
                onClick={() => handleStepAction(step.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {step.id === 'explore-features' ? 'Start Tour' : 'Get Started'}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        
        {completedSteps === totalSteps && (
          <div className="text-center py-4 bg-emerald-100 rounded-lg">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-semibold text-emerald-700 mb-1">
              Congratulations! 🎉
            </h3>
            <p className="text-emerald-600 text-sm">
              You've completed the onboarding process. You're all set to create amazing content!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
