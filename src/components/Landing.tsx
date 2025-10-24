import { useState } from "react";
import { PubHubLogo } from "./PubHubLogo";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { 
  Calendar, 
  Inbox, 
  BarChart3, 
  Sparkles, 
  Zap,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Video,
  FileText,
} from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  const [theme] = useState<"dark">("dark");

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Plan and schedule content across all platforms with our visual calendar. Never miss the perfect posting time.",
    },
    {
      icon: Inbox,
      title: "Unified Inbox",
      description: "Manage all your comments, messages, and mentions from every platform in one centralized inbox.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track performance metrics, engagement rates, and growth across all your connected platforms.",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Get content ideas, optimal posting times, and engagement tips powered by advanced AI.",
    },
    {
      icon: Video,
      title: "Content Remix",
      description: "Repurpose your best-performing content across different platforms with AI-powered transformations.",
    },
    {
      icon: FileText,
      title: "Template Library",
      description: "Save time with customizable templates for different content types and platforms.",
    },
  ];

  const platforms = [
    { id: "instagram", name: "Instagram" },
    { id: "twitter", name: "Twitter" },
    { id: "facebook", name: "Facebook" },
    { id: "youtube", name: "YouTube" },
    { id: "linkedin", name: "LinkedIn" },
    { id: "tiktok", name: "TikTok" },
    { id: "pinterest", name: "Pinterest" },
    { id: "reddit", name: "Reddit" },
    { id: "blog", name: "Blog" },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Save 10+ Hours Weekly",
      description: "Automate repetitive tasks and manage everything from one dashboard",
    },
    {
      icon: TrendingUp,
      title: "Boost Engagement",
      description: "Post at optimal times and respond faster to your audience",
    },
    {
      icon: Users,
      title: "Grow Your Reach",
      description: "Cross-post efficiently and maintain consistent presence across platforms",
    },
    {
      icon: Zap,
      title: "Work Smarter",
      description: "AI-powered insights help you create content that resonates",
    },
  ];

  const stats = [
    { value: "10+", label: "Hours Saved Weekly" },
    { value: "9", label: "Platforms Supported" },
    { value: "50%", label: "Faster Response Time" },
    { value: "3x", label: "More Engagement" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <PubHubLogo className="h-12 w-auto" />
          <Button onClick={onGetStarted} variant="outline">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500">The All-in-One Creator Platform</span>
            </div>
            
            <h1 className="text-6xl mb-6 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Publish Everywhere,<br />Manage from One Place
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              PubHub helps content creators publish, schedule, and manage their content across 9+ social platforms 
              with AI-powered insights and unified analytics.
            </p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-12 px-8"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-12 px-8"
              >
                Watch Demo
              </Button>
            </div>

            {/* Platform Icons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-muted-foreground mr-2">Supported Platforms:</span>
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center gap-2">
                  <PlatformIcon platform={platform.id as any} size="md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help content creators save time and grow their audience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-card/50 backdrop-blur border-border hover:bg-card/70 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500/5 to-teal-600/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4">Why Creators Choose PubHub</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of creators who are working smarter, not harder
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4">Simple Workflow, Powerful Results</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From creation to publishing in just a few clicks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Create Content", description: "Write once or use AI to generate ideas" },
              { step: "02", title: "Customize", description: "Adapt for each platform with templates" },
              { step: "03", title: "Schedule", description: "Pick optimal times or post immediately" },
              { step: "04", title: "Analyze", description: "Track performance and optimize" },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl mb-4 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 bg-clip-text text-transparent">
                  {item.step}
                </div>
                <h3 className="text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < 3 && (
                  <ArrowRight className="hidden md:block absolute top-12 -right-8 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500/5 to-teal-600/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Trusted by Content Creators</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "PubHub cut my content management time in half. The unified inbox is a game-changer!",
                author: "Sarah Johnson",
                role: "Lifestyle Blogger",
              },
              {
                quote: "Finally, a tool that understands multi-platform creators. The AI suggestions are incredibly helpful.",
                author: "Mike Chen",
                role: "Tech YouTuber",
              },
              {
                quote: "The analytics dashboard gives me insights I never had before. My engagement has tripled!",
                author: "Emma Davis",
                role: "Instagram Influencer",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 bg-card/50 backdrop-blur border-border">
                <div className="mb-4 text-muted-foreground italic">"{testimonial.quote}"</div>
                <div>
                  <div>{testimonial.author}</div>
                  <div className="text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20">
            <h2 className="text-4xl mb-4">Ready to Level Up Your Content Game?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join PubHub today and start managing all your social media from one powerful dashboard
            </p>
            
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-14 px-10"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="mt-6 flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Free forever plan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <PubHubLogo className="h-8 w-auto" />
              <span className="text-muted-foreground">© 2025 PubHub. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
