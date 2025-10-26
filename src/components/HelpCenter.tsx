import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, HelpCircle, BookOpen, MessageCircle, Mail, ChevronRight, ExternalLink } from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  popular: boolean;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  articles: HelpArticle[];
}

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Learn the basics of PubHub',
      icon: <BookOpen className="h-5 w-5" />,
      articles: [
        {
          id: 'account-setup',
          title: 'Setting Up Your Account',
          content: 'Learn how to create your PubHub account and complete your profile setup...',
          category: 'getting-started',
          tags: ['account', 'profile', 'setup'],
          popular: true
        },
        {
          id: 'first-project',
          title: 'Creating Your First Project',
          content: 'Step-by-step guide to creating and managing your first content project...',
          category: 'getting-started',
          tags: ['project', 'creation', 'management'],
          popular: true
        },
        {
          id: 'platform-connections',
          title: 'Connecting Social Media Platforms',
          content: 'How to connect your social media accounts to PubHub...',
          category: 'getting-started',
          tags: ['platforms', 'connections', 'oauth'],
          popular: false
        }
      ]
    },
    {
      id: 'content-creation',
      name: 'Content Creation',
      description: 'Create and manage your content',
      icon: <BookOpen className="h-5 w-5" />,
      articles: [
        {
          id: 'composer-basics',
          title: 'Using the Content Composer',
          content: 'Master the content composer to create engaging posts...',
          category: 'content-creation',
          tags: ['composer', 'writing', 'content'],
          popular: true
        },
        {
          id: 'scheduling',
          title: 'Scheduling Posts',
          content: 'Learn how to schedule your content for optimal engagement...',
          category: 'content-creation',
          tags: ['scheduling', 'calendar', 'timing'],
          popular: false
        },
        {
          id: 'media-upload',
          title: 'Uploading Media Files',
          content: 'How to upload and manage images, videos, and other media...',
          category: 'content-creation',
          tags: ['media', 'upload', 'files'],
          popular: false
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics & Insights',
      description: 'Track your performance',
      icon: <BookOpen className="h-5 w-5" />,
      articles: [
        {
          id: 'analytics-overview',
          title: 'Understanding Your Analytics',
          content: 'Learn how to read and interpret your performance metrics...',
          category: 'analytics',
          tags: ['analytics', 'metrics', 'performance'],
          popular: true
        },
        {
          id: 'reports',
          title: 'Generating Reports',
          content: 'Create custom reports to track your progress...',
          category: 'analytics',
          tags: ['reports', 'custom', 'tracking'],
          popular: false
        }
      ]
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Common issues and solutions',
      icon: <HelpCircle className="h-5 w-5" />,
      articles: [
        {
          id: 'connection-issues',
          title: 'Platform Connection Problems',
          content: 'Troubleshoot issues with connecting your social media accounts...',
          category: 'troubleshooting',
          tags: ['connection', 'platforms', 'issues'],
          popular: true
        },
        {
          id: 'posting-errors',
          title: 'Post Publishing Errors',
          content: 'Common errors when publishing content and how to fix them...',
          category: 'troubleshooting',
          tags: ['publishing', 'errors', 'posts'],
          popular: false
        }
      ]
    }
  ];

  const filteredArticles = useMemo(() => {
    let articles: HelpArticle[] = [];
    
    if (selectedCategory) {
      const category = helpCategories.find(cat => cat.id === selectedCategory);
      articles = category ? category.articles : [];
    } else {
      articles = helpCategories.flatMap(cat => cat.articles);
    }

    if (searchQuery) {
      articles = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return articles;
  }, [searchQuery, selectedCategory]);

  const popularArticles = useMemo(() => {
    return helpCategories
      .flatMap(cat => cat.articles)
      .filter(article => article.popular)
      .slice(0, 5);
  }, []);

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mb-4 text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Help Center
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedArticle.title}
          </h1>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              {helpCategories.find(cat => cat.id === selectedArticle.category)?.name}
            </Badge>
            {selectedArticle.popular && (
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                Popular
              </Badge>
            )}
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {selectedArticle.content}
              </p>
              {/* In a real implementation, this would contain the full article content */}
              <div className="mt-8 p-4 bg-emerald-50 rounded-lg">
                <h3 className="font-semibold text-emerald-800 mb-2">Need More Help?</h3>
                <p className="text-emerald-700 text-sm">
                  If this article didn't answer your question, try searching for related topics or contact our support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Help Center
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find answers to your questions and learn how to get the most out of PubHub
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Popular Articles */}
      {!searchQuery && !selectedCategory && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 hover:border-emerald-200"
                onClick={() => handleArticleClick(article)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {article.title}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {article.content}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {article.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {helpCategories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all ${
                selectedCategory === category.id
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-200 hover:shadow-md'
              }`}
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
            >
              <CardContent className="p-6 text-center">
                <div className="text-emerald-600 mb-3 flex justify-center">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {category.description}
                </p>
                <Badge variant="outline" className="text-xs">
                  {category.articles.length} articles
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {(searchQuery || selectedCategory) && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Articles'}
          </h2>
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 hover:border-emerald-200"
                onClick={() => handleArticleClick(article)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {article.content}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.popular && (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or browse by category
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contact Support */}
      <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-emerald-800 mb-4">
              Still Need Help?
            </h2>
            <p className="text-emerald-700 mb-6">
              Our support team is here to help you succeed with PubHub
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                Live Chat
              </Button>
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <ExternalLink className="h-4 w-4 mr-2" />
                Community Forum
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
