import React, { useEffect, useRef } from 'react';
import { Book, BookMarked, Calendar, LineChart, Play, Sparkles, Save, ArchiveRestore, Settings, Download, Upload, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import FeatureCard from '@/components/home/FeatureCard';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

// Define the URL for the spelling app
const SPELLING_APP_URL = "https://sscspell.lovable.app/";
const Index = () => {
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preload the spelling application immediately
  useEffect(() => {
    // Initialize empty chapters for first-time users
    const chaptersExist = localStorage.getItem('lingualearn_chapters');
    if (!chaptersExist) {
      localStorage.setItem('lingualearn_chapters', JSON.stringify([]));
      console.log('Initialized empty chapters for first-time users');
    }

    // Preload the spelling application immediately
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
  const handleBackup = async () => {
    try {
      const backup: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          backup[key] = localStorage.getItem(key);
        }
      }
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Backup Failed",
          description: "You must be logged in to create a backup.",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('user_backups').upsert({
        user_id: session.user.id,
        backup_data: backup
      }, {
        onConflict: 'user_id'
      });
      if (error) {
        throw error;
      }
      const backupBlob = new Blob([JSON.stringify(backup)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(backupBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lingualearn_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Backup Created",
        description: "Your data has been successfully backed up to the cloud and downloaded."
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "There was an error creating your backup.",
        variant: "destructive"
      });
      console.error('Backup error:', error);
    }
  };
  const handleRestoreFromCloud = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Restore Failed",
          description: "You must be logged in to restore from cloud backup.",
          variant: "destructive"
        });
        return;
      }
      const {
        data: cloudBackupData,
        error: fetchError
      } = await supabase.from('user_backups').select('backup_data').eq('user_id', session.user.id).order('created_at', {
        ascending: false
      }).limit(1).single();
      if (fetchError) {
        throw fetchError;
      }
      if (!cloudBackupData) {
        toast({
          title: "No Backup Found",
          description: "No cloud backup was found for your account.",
          variant: "destructive"
        });
        return;
      }
      localStorage.clear();
      Object.entries(cloudBackupData.backup_data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });
      toast({
        title: "Backup Restored",
        description: "Your data has been successfully restored."
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "There was an error restoring your backup.",
        variant: "destructive"
      });
      console.error('Restore error:', error);
    }
  };
  const handleRestoreFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Restore Failed",
          description: "You must be logged in to restore from file backup.",
          variant: "destructive"
        });
        return;
      }
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: "Restore Failed",
          description: "No file selected.",
          variant: "destructive"
        });
        return;
      }
      const fileContent = await file.text();
      const backupData = {
        backup_data: JSON.parse(fileContent)
      };
      localStorage.clear();
      Object.entries(backupData.backup_data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });
      toast({
        title: "Backup Restored",
        description: "Your data has been successfully restored from file."
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "There was an error restoring your backup from file.",
        variant: "destructive"
      });
      console.error('Restore from file error:', error);
    }
  };

  // Function to backup chapters data to a JSON file
  const handleChapterBackup = () => {
    try {
      // Collect all chapter data from localStorage
      const data: Record<string, any> = {};

      // First get the chapter list
      const chapters = localStorage.getItem('lingualearn_chapters');
      if (chapters) {
        data['lingualearn_chapters'] = chapters;
      }

      // Then get individual chapter data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chapter_')) {
          const item = localStorage.getItem(key);
          if (item) {
            data[key] = item;
          }
        }
      }
      if (Object.keys(data).length === 0) {
        toast({
          title: "No chapters found",
          description: "There are no chapters to backup.",
          variant: "destructive"
        });
        return;
      }

      // Convert to JSON and download
      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lingualearn_chapters_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Backup successful",
        description: `${Object.keys(data).length - 1} chapters have been backed up.`
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Backup failed",
        description: "An error occurred while creating the backup.",
        variant: "destructive"
      });
    }
  };

  // Function to handle chapter restore from file
  const handleChapterRestoreFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (typeof data !== 'object' || data === null) {
          throw new Error("Invalid backup format");
        }
        
        let restoredCount = 0;

        // First restore the chapters list
        if (data.lingualearn_chapters) {
          localStorage.setItem('lingualearn_chapters', data.lingualearn_chapters);
        }

        // Then restore individual chapters
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'lingualearn_chapters' && key.startsWith('chapter_')) {
            localStorage.setItem(key, value as string);
            restoredCount++;
          }
        });
        toast({
          title: "Restore successful",
          description: `${restoredCount} chapters have been restored.`
        });

        // Reload the page to reflect changes
        window.location.reload();
      } catch (error) {
        console.error('Error restoring backup:', error);
        toast({
          title: "Restore failed",
          description: "The backup file appears to be invalid or corrupted.",
          variant: "destructive"
        });
      }

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

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
    icon: FileText,
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
  }];
  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <div className="flex justify-between items-center">
            <div></div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Backup & Restore
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground mb-3">
                    Data Management
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleChapterBackup} 
                    className="w-full justify-start gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Backup Chapters
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full justify-start gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Restore Chapters
                  </Button>
                  
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      Full Data Backup
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleBackup} 
                      className="w-full justify-start gap-2 mb-2"
                    >
                      <Save className="h-4 w-4" />
                      Full Backup
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleRestoreFromCloud} 
                      className="w-full justify-start gap-2"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      Restore from Cloud
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <input 
              type="file" 
              accept=".json" 
              onChange={handleChapterRestoreFromFile} 
              ref={fileInputRef} 
              className="hidden" 
            />
            <input 
              type="file" 
              accept=".json" 
              onChange={handleRestoreFromFile} 
              className="hidden" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(feature => <FeatureCard key={feature.title} title={feature.title} description={feature.description} icon={feature.icon} to={feature.to} gradient={feature.gradient} isExternal={feature.isExternal} openInSamePage={feature.openInSamePage} onHover={feature.title === 'Spelling' ? handleSpellingHover : undefined} />)}
        </div>
      </main>
    </div>;
};
export default Index;