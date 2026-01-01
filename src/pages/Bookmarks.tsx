import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import WordCard from '@/components/bookmarks/WordCard';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bookmark, Search, RefreshCw, Download, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { generatePDF } from '@/utils/pdfGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface BookmarkedWord {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  chapter: string;
}

const Bookmarks = () => {
  const [bookmarkedWords, setBookmarkedWords] = useState<BookmarkedWord[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWords, setFilteredWords] = useState<BookmarkedWord[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [groupedWords, setGroupedWords] = useState<Record<string, BookmarkedWord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [startRange, setStartRange] = useState('1');
  const [endRange, setEndRange] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for dark mode preference
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark') || 
                      document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(darkMode);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Load bookmarked words from localStorage
  useEffect(() => {
    loadBookmarkedWords();
    setIsLoading(false);
  }, []);

  const loadBookmarkedWords = () => {
    try {
      // Get bookmarked words from localStorage
      const bookmarksStr = localStorage.getItem('bookmarked_words');
      let loadedBookmarks: BookmarkedWord[] = [];

      if (bookmarksStr) {
        loadedBookmarks = JSON.parse(bookmarksStr);
        console.log('Loaded bookmarks:', loadedBookmarks);

        // Get unique chapter names and count words per chapter
        const chapterSet = new Set<string>();
        const counts: Record<string, number> = {};
        const grouped: Record<string, BookmarkedWord[]> = {};

        loadedBookmarks.forEach(word => {
          if (word.chapter) {
            chapterSet.add(word.chapter);
            counts[word.chapter] = (counts[word.chapter] || 0) + 1;

            // Group words by chapter
            if (!grouped[word.chapter]) {
              grouped[word.chapter] = [];
            }
            grouped[word.chapter].push(word);
          }
        });

        setChapters(Array.from(chapterSet));
        setChapterCounts(counts);
        setGroupedWords(grouped);
      } else {
        console.log('No bookmarks found in localStorage');
      }

      setBookmarkedWords(loadedBookmarks);
      setFilteredWords(loadedBookmarks);
      setEndRange(loadedBookmarks.length.toString());
    } catch (error) {
      console.error('Error loading bookmarked words:', error);
      toast({
        title: "Error loading bookmarks",
        description: "There was a problem loading your bookmarked words.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshBookmarks = () => {
    loadBookmarkedWords();
    toast({
      title: "Bookmarks refreshed",
      description: "Your bookmarks have been refreshed."
    });
  };

  // Filter words when search query changes
  useEffect(() => {
    let filtered = bookmarkedWords;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = bookmarkedWords.filter(word => 
        word.word.toLowerCase().includes(query) || 
        word.translation.toLowerCase().includes(query)
      );
    }

    if (selectedTab !== 'all') {
      filtered = filtered.filter(word => word.chapter === selectedTab);
    }

    setFilteredWords(filtered);

    // Update grouped words for filtered results
    const newGrouped: Record<string, BookmarkedWord[]> = {};
    filtered.forEach(word => {
      if (word.chapter) {
        if (!newGrouped[word.chapter]) {
          newGrouped[word.chapter] = [];
        }
        newGrouped[word.chapter].push(word);
      }
    });
    setGroupedWords(newGrouped);
  }, [searchQuery, bookmarkedWords, selectedTab]);

  const handleRemoveBookmark = (id: string) => {
    // Remove from state
    const updatedBookmarks = bookmarkedWords.filter(word => word.id !== id);
    setBookmarkedWords(updatedBookmarks);

    // Update localStorage
    try {
      localStorage.setItem('bookmarked_words', JSON.stringify(updatedBookmarks));
      // Reload to update grouping
      loadBookmarkedWords();
    } catch (error) {
      console.error('Error updating bookmarked words:', error);
    }
  };

  const handleGeneratePDF = async () => {
    const wordsToExport = selectedTab === 'all' ? bookmarkedWords : filteredWords;

    if (wordsToExport.length === 0) {
      toast({
        title: "No bookmarks",
        description: "No bookmarked words to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileName = selectedTab === 'all' ? 'all-bookmarked-vocabulary' : `${selectedTab}-vocabulary`;
      await generatePDF(wordsToExport, fileName);
      toast({
        title: "PDF Downloaded",
        description: `Downloaded ${wordsToExport.length} words from ${selectedTab === 'all' ? 'All Bookmarks' : selectedTab} as PDF.`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startQuizWithBookmarks = () => {
    const wordsToQuiz = selectedTab === 'all' ? bookmarkedWords : filteredWords;
    
    if (wordsToQuiz.length === 0) {
      toast({
        title: "No bookmarks",
        description: "No bookmarked words available for quiz.",
        variant: "destructive"
      });
      return;
    }

    if (wordsToQuiz.length < 5) {
      toast({
        title: "Not enough words",
        description: "You need at least 5 bookmarked words to start a quiz.",
        variant: "destructive"
      });
      return;
    }

    setShowQuizDialog(true);
  };

  const confirmStartQuiz = () => {
    const wordsToQuiz = selectedTab === 'all' ? bookmarkedWords : filteredWords;
    const start = parseInt(startRange);
    const end = parseInt(endRange);

    if (start < 1 || end > wordsToQuiz.length || start > end) {
      toast({
        title: "Invalid range",
        description: `Please enter a valid range between 1 and ${wordsToQuiz.length}.`,
        variant: "destructive"
      });
      return;
    }

    // Get words in the specified range (subtract 1 for 0-based indexing)
    const selectedWords = wordsToQuiz.slice(start - 1, end);

    // Transform bookmarked words to the format expected by QuizMode
    const quizWords = selectedWords.map((word) => ({
      id: word.id,
      word: word.word, // Remove numbering from here
      definition: word.translation,
      phonetic: word.phonetic,
      isBookmarked: true
    }));

    // Store quiz words in session storage
    sessionStorage.setItem('quiz_words', JSON.stringify(quizWords));
    sessionStorage.setItem('quiz_source', 'bookmarks');
    sessionStorage.setItem('quiz_range', `${start}-${end}`);
    sessionStorage.setItem('quiz_section', selectedTab);

    // Navigate to the quiz page
    navigate('/quiz/bookmarks');
    setShowQuizDialog(false);
    
    toast({
      title: "Quiz Starting",
      description: `Starting quiz with words ${start}-${end} from ${selectedTab === 'all' ? 'All Bookmarks' : selectedTab} (${selectedWords.length} words).`
    });
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Bookmark className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-primary'}`} />
            <h1 className={`text-3xl font-bold text-left ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              My Bookmarks
            </h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative max-w-md flex-grow">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : ''}`}
            />
          </div>
          <div className="flex gap-2">
            {(selectedTab === 'all' ? bookmarkedWords.length > 0 : filteredWords.length > 0) && (
              <>
                <Button onClick={handleGeneratePDF} className="flex items-center gap-2" variant="outline">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={startQuizWithBookmarks} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Quiz
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quiz Range Dialog */}
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Quiz Range</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-600">
                Choose which words to practice from {selectedTab === 'all' ? 'All Bookmarks' : selectedTab} 
                (Total: {selectedTab === 'all' ? bookmarkedWords.length : filteredWords.length} words)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-range">From word #</Label>
                  <Input
                    id="start-range"
                    type="number"
                    min="1"
                    max={selectedTab === 'all' ? bookmarkedWords.length : filteredWords.length}
                    value={startRange}
                    onChange={(e) => setStartRange(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-range">To word #</Label>
                  <Input
                    id="end-range"
                    type="number"
                    min="1"
                    max={selectedTab === 'all' ? bookmarkedWords.length : filteredWords.length}
                    value={endRange}
                    onChange={(e) => setEndRange(e.target.value)}
                    placeholder={(selectedTab === 'all' ? bookmarkedWords.length : filteredWords.length).toString()}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmStartQuiz}>
                Start Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-12">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading bookmarks...</p>
          </div>
        ) : bookmarkedWords.length === 0 ? (
          <div className="text-center py-12">
            <div className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <Bookmark className="h-full w-full" />
            </div>
            <h3 className={`mt-2 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No bookmarks yet
            </h3>
          </div>
        ) : (
          <Tabs defaultValue="all" className="mb-6" value={selectedTab} onValueChange={setSelectedTab}>
            <div className="overflow-x-auto">
              <TabsList className={`mb-6 flex w-max min-w-full gap-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
                <TabsTrigger value="all" className={`flex items-center gap-2 whitespace-nowrap ${isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}`}>
                  All Bookmarks
                  <Badge variant="outline" className="ml-1">{bookmarkedWords.length}</Badge>
                </TabsTrigger>
                
                {/* Chapter specific tabs */}
                {['OWS', 'SYNO', 'ANTO', 'IDIOMS'].map((chapterName) => {
                  const count = chapterCounts[chapterName] || 0;
                  return count > 0 ? (
                    <TabsTrigger 
                      key={chapterName} 
                      value={chapterName} 
                      className={`flex items-center gap-2 whitespace-nowrap ${isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}`}
                    >
                      {chapterName}
                      <Badge variant="outline" className="ml-1">{count}</Badge>
                    </TabsTrigger>
                  ) : null;
                })}
                
                {/* Other chapters that are not in the main 4 */}
                {chapters.filter(chapter => !['OWS', 'SYNO', 'ANTO', 'IDIOMS'].includes(chapter)).map((chapter) => (
                  <TabsTrigger 
                    key={chapter} 
                    value={chapter} 
                    className={`flex items-center gap-2 whitespace-nowrap ${isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}`}
                  >
                    {chapter}
                    <Badge variant="outline" className="ml-1">{chapterCounts[chapter]}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <TabsContent value={selectedTab}>
              {filteredWords.length > 0 ? (
                <div className="space-y-4">
                  {selectedTab === 'all' ? (
                    // Show accordion grouped by chapters for "All Bookmarks"
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedWords).map(([chapterName, chapterWords]) => (
                        <AccordionItem 
                          key={chapterName} 
                          value={chapterName} 
                          className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <AccordionTrigger className={`px-4 py-3 ${isDarkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{chapterName}</span>
                              <Badge variant="outline" className="ml-2">{chapterWords.length}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {chapterWords.map((word) => (
                                <WordCard
                                  key={word.id}
                                  id={word.id}
                                  word={word.word}
                                  translation={word.translation}
                                  phonetic={word.phonetic}
                                  chapter={word.chapter}
                                  onRemoveBookmark={handleRemoveBookmark}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    // Show simple grid for specific chapter tabs
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredWords.map((word) => (
                        <WordCard
                          key={word.id}
                          id={word.id}
                          word={word.word}
                          translation={word.translation}
                          phonetic={word.phonetic}
                          chapter={word.chapter}
                          onRemoveBookmark={handleRemoveBookmark}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {searchQuery ? "No bookmarks match your search query." : "No bookmarked words found."}
                  </p>
                  <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? "Try a different search term." : "Bookmark words during your learning sessions to see them here."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Bookmarks;
