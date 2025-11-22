import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChapterCard from '@/components/chapters/ChapterCard';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ChapterBackupRestore from '@/components/chapters/ChapterBackupRestore';
import { supabase } from '@/integrations/supabase/client';
import { useEffect as useAuthEffect, useState as useAuthState } from 'react';
interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  progress: number;
  isBookmarked: boolean;
}
interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
}
const LOCAL_STORAGE_KEY = 'lingualearn_chapters';
const Chapters = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importChapterId, setImportChapterId] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [importTab, setImportTab] = useState("file");
  const [manualImportText, setManualImportText] = useState("");
  const [user, setUser] = useAuthState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const savedChapters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedChapters) {
      try {
        return JSON.parse(savedChapters);
      } catch (e) {
        console.error("Error parsing chapters from localStorage:", e);
      }
    }
    return [{
      id: '1',
      title: 'Basic Greetings',
      wordCount: 25,
      progress: 80,
      isBookmarked: true
    }, {
      id: '2',
      title: 'Food and Drinks',
      wordCount: 40,
      progress: 45,
      isBookmarked: false
    }, {
      id: '3',
      title: 'Travel Phrases',
      wordCount: 35,
      progress: 20,
      isBookmarked: true
    }];
  });
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chapters));
  }, [chapters]);

  useAuthEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('Current user:', user?.email);
      setUser(user);
    });
  }, []);
  useEffect(() => {
    const updatedChapters = chapters.map(chapter => {
      const chapterDataKey = `chapter_${chapter.id}`;
      const savedChapter = localStorage.getItem(chapterDataKey);
      if (savedChapter) {
        try {
          const chapterData = JSON.parse(savedChapter);
          const progress = calculateChapterProgress(chapterData.words || []);
          return {
            ...chapter,
            wordCount: chapterData.words ? chapterData.words.length : chapter.wordCount,
            progress: progress
          };
        } catch (e) {
          console.error(`Error parsing chapter data for ${chapter.id}:`, e);
        }
      }
      return chapter;
    });
    setChapters(updatedChapters);
  }, []);
  const calculateChapterProgress = (words: Word[]): number => {
    if (!words || words.length === 0) return 0;
    const knownWords = words.filter(word => word.isBookmarked).length;
    return Math.round(knownWords / words.length * 100);
  };
  const handleToggleBookmark = (id: string) => {
    setChapters(chapters.map(chapter => chapter.id === id ? {
      ...chapter,
      isBookmarked: !chapter.isBookmarked
    } : chapter));
    const chapter = chapters.find(c => c.id === id);
    toast({
      title: chapter?.isBookmarked ? "Bookmark removed" : "Chapter bookmarked",
      description: `${chapter?.title} has been ${chapter?.isBookmarked ? "removed from" : "added to"} your bookmarks.`
    });
  };
  const handleCreateChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "Error",
        description: "Chapter title cannot be empty",
        variant: "destructive"
      });
      return;
    }
    const newId = (Math.max(0, ...chapters.map(c => parseInt(c.id))) + 1).toString();
    const newChapter = {
      id: newId,
      title: newChapterTitle.trim(),
      wordCount: 0,
      progress: 0,
      isBookmarked: false
    };
    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
    setNewChapterTitle('');
    setShowCreateDialog(false);
    toast({
      title: "Chapter created",
      description: `"${newChapter.title}" has been created.`
    });
    const chapterData = {
      id: newId,
      title: newChapter.title,
      words: []
    };
    localStorage.setItem(`chapter_${newId}`, JSON.stringify(chapterData));
    navigate(`/chapters/${newId}`);
  };
  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChapterToDelete(id);
    setShowDeleteDialog(true);
  };
  const handleDeleteChapter = () => {
    if (!chapterToDelete) return;
    const chapterToRemove = chapters.find(c => c.id === chapterToDelete);
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterToDelete);
    setChapters(updatedChapters);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
    localStorage.removeItem(`chapter_${chapterToDelete}`);
    setShowDeleteDialog(false);
    setChapterToDelete(null);
    toast({
      title: "Chapter deleted",
      description: `"${chapterToRemove?.title}" has been deleted.`
    });
  };
  const openImportDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImportChapterId(id);
    setShowImportDialog(true);
    setCsvFile(null);
    setCsvPreview([]);
    setManualImportText("");
    setImportTab("file");
  };
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSV(text);
          setCsvPreview(rows.slice(0, 5));
        } catch (error) {
          console.error("Error parsing CSV file:", error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };
  const parseCSV = (text: string): string[][] => {
    const rows = text.split(/\r?\n/).filter(row => row.trim());
    return rows.map(row => {
      const delimiter = row.includes('\t') ? '\t' : ',';
      return row.split(delimiter).map(cell => cell.trim());
    });
  };
  const processManualImport = (): string[][] => {
    if (!manualImportText.trim()) return [];
    const rows = manualImportText.split(/\r?\n/).filter(row => row.trim());
    return rows.map(row => {
      const delimiter = row.includes('\t') ? '\t' : ',';
      return row.split(delimiter).map(cell => cell.trim());
    });
  };
  const handleImportWords = () => {
    if (!importChapterId) return;
    let rows: string[][] = [];
    if (importTab === "file" && csvFile) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          rows = parseCSV(text);
          completeImport(rows);
        } catch (error) {
          console.error("Error processing CSV file:", error);
          toast({
            title: "Error",
            description: "Failed to process the CSV file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(csvFile);
    } else if (importTab === "text" && manualImportText.trim()) {
      rows = processManualImport();
      completeImport(rows);
    } else {
      toast({
        title: "Error",
        description: "No data to import.",
        variant: "destructive"
      });
      return;
    }
  };
  const completeImport = (rows: string[][]) => {
    if (!importChapterId || rows.length === 0) return;
    const chapterDataKey = `chapter_${importChapterId}`;
    const savedChapterJson = localStorage.getItem(chapterDataKey);
    let chapterData = {
      id: importChapterId,
      title: chapters.find(c => c.id === importChapterId)?.title || "Chapter",
      words: [] as Word[]
    };
    if (savedChapterJson) {
      try {
        chapterData = JSON.parse(savedChapterJson);
      } catch (e) {
        console.error("Error parsing chapter data:", e);
      }
    }
    const newWords: Word[] = [];
    let skippedCount = 0;
    rows.forEach((row, index) => {
      if (index === 0 && (row[0].toLowerCase() === "word" || row[0].toLowerCase() === "vocabulary" || row[0].toLowerCase() === "term")) {
        return;
      }
      if (row.length < 2 || !row[0].trim() || !row[1].trim()) {
        skippedCount++;
        return;
      }
      newWords.push({
        id: crypto.randomUUID(),
        word: row[0].trim(),
        definition: row[1].trim(),
        example: row.length > 2 ? row[2].trim() : undefined,
        notes: row.length > 3 ? row[3].trim() : undefined,
        phonetic: row.length > 4 ? row[4].trim() : undefined,
        isBookmarked: false
      });
    });
    if (newWords.length === 0) {
      toast({
        title: "Import Failed",
        description: "No valid vocabulary words found in the file.",
        variant: "destructive"
      });
      return;
    }
    const updatedWords = [...chapterData.words, ...newWords];
    chapterData.words = updatedWords;
    localStorage.setItem(chapterDataKey, JSON.stringify(chapterData));
    const updatedChapters = chapters.map(chapter => chapter.id === importChapterId ? {
      ...chapter,
      wordCount: updatedWords.length
    } : chapter);
    setChapters(updatedChapters);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
    setShowImportDialog(false);
    toast({
      title: "Import Successful",
      description: `Added ${newWords.length} new vocabulary words${skippedCount > 0 ? ` (${skippedCount} entries skipped)` : ''}.`
    });
  };
  const handleFetchFromGoogleDrive = async () => {
    try {
      // Using a CORS proxy to bypass the CORS restriction
      const originalUrl = 'https://drive.usercontent.google.com/u/0/uc?id=1przBQwmkW4AaqulrcCIhpLoTlWlgqYzh&export=download';
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(originalUrl)}`;
      toast({
        title: "Fetching chapters",
        description: "Downloading chapter data from Google Drive..."
      });
      console.log('Attempting to fetch from:', proxyUrl);

      // Fetch the file through CORS proxy
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const proxyData = await response.json();
      if (!proxyData.contents) {
        throw new Error('No data received from proxy');
      }
      const jsonData = JSON.parse(proxyData.contents);
      if (!jsonData) {
        toast({
          title: "Fetch failed",
          description: "Invalid data format in the file",
          variant: "destructive"
        });
        return;
      }
      console.log('Received data:', jsonData);

      // Process the data similar to the existing restore functionality
      const chaptersData = jsonData.lingualearn_chapters ? JSON.parse(jsonData.lingualearn_chapters) : [];
      if (!Array.isArray(chaptersData)) {
        toast({
          title: "Fetch failed",
          description: "Invalid chapters format in the file",
          variant: "destructive"
        });
        return;
      }

      // Clear existing data and set new data
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chaptersData));

      // Restore individual chapter data
      chaptersData.forEach(chapter => {
        const chapterId = chapter.id;
        if (chapterId) {
          const chapterKey = `chapter_${chapterId}`;
          if (jsonData[chapterKey]) {
            localStorage.setItem(chapterKey, jsonData[chapterKey]);
          }
        }
      });
      setChapters(chaptersData);
      toast({
        title: "Fetch successful",
        description: `Fetched ${chaptersData.length} chapters from Google Drive.`
      });
    } catch (error) {
      console.error('Error fetching from Google Drive:', error);
      toast({
        title: "Fetch failed",
        description: `There was an error fetching the chapters: ${error instanceof Error ? error.message : 'Unknown error'}. The file might not be publicly accessible or there may be a network issue.`,
        variant: "destructive"
      });
    }
  };
  const handleRestoreFromSupabase = async () => {
    try {
      toast({
        title: "Fetching chapters",
        description: "Downloading chapter data from Supabase database..."
      });

      // First try to fetch from the database table
      const {
        data: dbData,
        error: dbError
      } = await supabase.from('chapter_vocabulary').select('data').limit(1);
      if (dbError) {
        console.error('Database error:', dbError);
        // Fallback to storage if database fails
        return await handleRestoreFromStorage();
      }
      if (dbData && dbData.length > 0 && dbData[0].data) {
        const parsedData = dbData[0].data as any;
        await processChapterData(parsedData, "database");
        return;
      }

      // If no data in database, try storage as fallback
      await handleRestoreFromStorage();
    } catch (error) {
      console.error('Error restoring chapters:', error);
      toast({
        title: "Restore failed",
        description: "There was an error restoring the chapters. Check console for details.",
        variant: "destructive"
      });
    }
  };
  const handleRestoreFromStorage = async () => {
    const {
      data,
      error
    } = await supabase.storage.from('chapters').download('Chaptersandvocab.json');
    if (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Restore failed",
        description: `Error downloading file: ${error.message}`,
        variant: "destructive"
      });
      return;
    }
    const jsonData = await data.text();
    const parsedData = JSON.parse(jsonData);
    await processChapterData(parsedData, "storage");
  };
  const processChapterData = async (parsedData: any, source: string) => {
    if (!parsedData) {
      toast({
        title: "Restore failed",
        description: "Invalid data format in backup file",
        variant: "destructive"
      });
      return;
    }
    const chaptersData = parsedData.lingualearn_chapters ? JSON.parse(parsedData.lingualearn_chapters) : [];
    if (!Array.isArray(chaptersData)) {
      toast({
        title: "Restore failed",
        description: "Invalid chapters format in backup file",
        variant: "destructive"
      });
      return;
    }

    // Clear existing chapters first
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    // Remove all existing chapter data
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chapter_')) {
        localStorage.removeItem(key);
      }
    }

    // Set new chapters data
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chaptersData));

    // Restore individual chapter data
    chaptersData.forEach(chapter => {
      const chapterId = chapter.id;
      if (chapterId) {
        const chapterKey = `chapter_${chapterId}`;
        if (parsedData[chapterKey]) {
          localStorage.setItem(chapterKey, parsedData[chapterKey]);
        }
      }
    });
    setChapters(chaptersData);
    toast({
      title: "Restore successful",
      description: `Restored ${chaptersData.length} chapters from Supabase ${source}.`
    });
  };
  const handleRestoreChapters = (data: Record<string, any>) => {
    try {
      // First restore the chapters list
      if (data.lingualearn_chapters) {
        localStorage.setItem(LOCAL_STORAGE_KEY, data.lingualearn_chapters);
      }

      // Then restore individual chapters
      let restoredCount = 0;
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'lingualearn_chapters' && key.startsWith('chapter_')) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          restoredCount++;
        }
      });

      // Reload chapters from localStorage after restore
      const savedChapters = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedChapters) {
        try {
          setChapters(JSON.parse(savedChapters));
        } catch (e) {
          console.error("Error parsing chapters from localStorage:", e);
        }
      }
      toast({
        title: "Restore successful",
        description: `${restoredCount} chapters have been restored.`
      });

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error during restore:', error);
      toast({
        title: "Restore failed",
        description: "There was an error restoring the chapters.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateChapters = async () => {
    try {
      toast({
        title: "Updating chapters",
        description: "Uploading current chapter data to storage..."
      });

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
          title: "Update failed",
          description: "No chapter data found to upload.",
          variant: "destructive"
        });
        return;
      }

      // Convert to JSON
      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Upload to Supabase storage
      console.log('Attempting to upload to storage bucket "chapters"...');
      const { error } = await supabase.storage
        .from('chapters')
        .upload('Chaptersandvocab.json', blob, {
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Storage upload successful!');

      toast({
        title: "Update successful",
        description: `Chapter data has been updated in storage.`
      });
    } catch (error) {
      console.error('Error updating chapters:', error);
      toast({
        title: "Update failed",
        description: `Error updating chapters: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  const filteredChapters = chapters.filter(chapter => chapter.title.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="min-h-screen bg-gray-50 mx-[3px] px-[3px] py-[5px]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Chapters</h1>
          </div>
          <div className="flex gap-2">
            <ChapterBackupRestore onRestore={handleRestoreChapters} />
            
            <Button variant="outline" onClick={handleRestoreFromSupabase} className="flex items-center gap-2 bg-green-400 hover:bg-green-300">
              <Download className="h-4 w-4" />
              Fetch Chapters
            </Button>
            {user?.email === 'dhirajsahani8541@gmail.com' && (
              <Button variant="outline" onClick={handleUpdateChapters} className="flex items-center gap-2 bg-blue-400 hover:bg-blue-300">
                <Upload className="h-4 w-4" />
                Update Storage
              </Button>
            )}
            <Button className="sm:self-end" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Chapter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map(chapter => <div key={chapter.id} className="relative">
              <ChapterCard id={chapter.id} title={chapter.title} wordCount={chapter.wordCount} progress={chapter.progress} isBookmarked={chapter.isBookmarked} onToggleBookmark={handleToggleBookmark} onClick={() => navigate(`/chapters/${chapter.id}`)} />
              <div className="absolute top-2 right-2 flex gap-2">
                
                <Button variant="ghost" size="sm" onClick={e => openDeleteDialog(chapter.id, e)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Delete chapter">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>)}
        </div>

        {filteredChapters.length === 0 && <div className="text-center py-12">
            <p className="text-gray-500">No chapters found. Create your first chapter to get started!</p>
          </div>}

        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Chapter</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a name for your new chapter. You can add words to it after creation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input placeholder="Chapter title (e.g., Biology Unit 1, GRE High Frequency)" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateChapter}>Create</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this chapter? This action cannot be undone and all words in this chapter will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChapterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChapter} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Import Vocabulary</AlertDialogTitle>
              <AlertDialogDescription>
                Import vocabulary words into this chapter from a CSV file or by pasting text.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <Tabs value={importTab} onValueChange={setImportTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">From File</TabsTrigger>
                <TabsTrigger value="text">Paste Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-2">Select CSV or Text File</p>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      <span>Format: Word, Definition, Example, Notes, Phonetic</span>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p>Your CSV file should have the following columns:<br />
                        <span className="font-medium">Word</span>, <span className="font-medium">Definition</span>, Example (optional), Notes (optional), Phonetic (optional)</p>
                        <p className="mt-1">Example: <code>Apple,A fruit,The apple is red.,Common fruit,/ˈæpəl/</code></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="border-2 border-dashed border-gray-200 rounded-md p-6 text-center">
                  <Input type="file" id="csv-upload" onChange={handleCsvFileChange} accept=".csv,.txt,.tsv" className="mb-4" />
                  <p className="text-sm text-gray-500">Supports CSV, TSV, or TXT files</p>
                </div>
                
                {csvPreview.length > 0 && <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
                    <div className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-40">
                      <table className="min-w-full">
                        <tbody>
                          {csvPreview.map((row, idx) => <tr key={idx} className={idx === 0 ? "font-medium" : ""}>
                              {row.map((cell, cellIdx) => <td key={cellIdx} className="p-1 border-b border-gray-200">{cell}</td>)}
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>}
              </TabsContent>
              
              <TabsContent value="text">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-2">Paste Vocabulary</p>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      <span>One word per line: Word, Definition, Example, Notes</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-md">
                  <textarea className="w-full h-40 p-3 text-sm resize-none border-0 rounded-md focus:ring-0" placeholder="vocabulary, meaning, example, notes
apple, a round fruit, The apple is red, Common fruit" value={manualImportText} onChange={e => setManualImportText(e.target.value)} />
                </div>
              </TabsContent>
            </Tabs>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImportWords}>Import Words</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>;
};
export default Chapters;