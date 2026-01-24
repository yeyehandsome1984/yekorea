import React, { useEffect } from 'react';
import { Book, BookMarked, Calendar, LineChart, Play, Sparkles, Languages, GraduationCap } from 'lucide-react';
import FeatureCard from '@/components/home/FeatureCard';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';

// Define the URL for the spelling app
const SPELLING_APP_URL = "https://sscspell.lovable.app/";
const Index = () => {

  // Preload the spelling application immediately
  useEffect(() => {
    const preloadSpellingApp = () => {
      // Create an iframe to preload the application
      const iframe = document.createElement('iframe');
      iframe.src = SPELLING_APP_URL;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Remove the iframe after a certain time
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);

      // Also use link preload
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'document';
      link.href = SPELLING_APP_URL;
      document.head.appendChild(link);
      console.log('Preloading spelling application');
    };

    // Preload immediately on page load
    preloadSpellingApp();
  }, []);

  // Preload the spelling app on hover (additional preload)
  const handleSpellingHover = () => {
    const iframe = document.createElement('iframe');
    iframe.src = SPELLING_APP_URL;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Remove the iframe after loading is complete
    iframe.onload = () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };
  const features = [{
    title: 'My Chapters',
    description: 'Browse and manage Korean vocabulary chapters',
    icon: Book,
    to: '/chapters',
    gradient: 'gradient-blue'
  }, {
    title: 'Korean Sentences',
    description: 'Learn complete sentences with linked vocabulary',
    icon: Languages,
    to: '/sentences',
    gradient: 'gradient-teal'
  }, {
    title: 'Learning Plans',
    description: 'Create structured Korean learning paths',
    icon: Calendar,
    to: '/learning-plans',
    gradient: 'gradient-purple'
  }, {
    title: 'Daily Revision',
    description: 'Review Korean words with spaced repetition',
    icon: Play,
    to: '/daily-revision',
    gradient: 'gradient-green'
  }, {
    title: 'Spelling',
    description: 'Practice Korean spelling with interactive exercises',
    icon: Sparkles,
    to: SPELLING_APP_URL,
    gradient: 'gradient-red',
    isExternal: true,
    openInSamePage: true // Set this to true to open in same page
  }, {
    title: 'Bookmarks',
    description: 'Access your saved Korean words in one place',
    icon: BookMarked,
    to: '/bookmarks',
    gradient: 'gradient-orange'
  }, {
    title: 'Progress',
    description: 'Track your Korean learning stats and achievements',
    icon: LineChart,
    to: '/progress',
    gradient: 'gradient-pink'
  }, {
    title: 'TOPIK Resources',
    description: 'Sample questions, essays, topics, and idioms for TOPIK prep',
    icon: GraduationCap,
    to: '/topik-resources',
    gradient: 'gradient-indigo'
  }];
  return <div className="min-h-screen bg-gray-50 safe-area-inset">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {features.map(feature => <FeatureCard key={feature.title} title={feature.title} description={feature.description} icon={feature.icon} to={feature.to} gradient={feature.gradient} isExternal={feature.isExternal} openInSamePage={feature.openInSamePage} onHover={feature.title === 'Spelling' ? handleSpellingHover : undefined} />)}
        </div>
      </main>
    </div>;
};
export default Index;