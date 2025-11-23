import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, Plus, Edit, Save, Trash2, FileSpreadsheet, Check, Search, FilterX, PlusCircle, ListPlus, Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import ExcelImporter from '@/components/chapters/ExcelImporter';
import FlashcardMode from '@/components/revision/FlashcardMode';
import { generatePDF } from '@/utils/pdfGenerator';
import * as XLSX from 'xlsx';
interface Word {
  id: string;
  word: string;
  definition: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  isBookmarked: boolean;
  isKnown?: boolean;
  difficulty?: number; // 1-5 scale
  topikLevel?: string; // TOPIK-1, TOPIK-2, or none
  tags?: string[];
  createdAt?: string;
  priority?: number; // 1-5, higher is more important
}
interface Chapter {
  title: string;
  description: string;
  words: Word[];
}
const ChapterDetail = () => {
  const {
    chapterId
  } = useParams<{
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isEditingWord, setIsEditingWord] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [isAddingWord, setIsAddingWord] = useState<boolean>(false);
  const [isQuickAddingWord, setIsQuickAddingWord] = useState<boolean>(false);
  const [isBulkAddingWords, setIsBulkAddingWords] = useState<boolean>(false);
  const [newWord, setNewWord] = useState<Partial<Word>>({
    word: '',
    definition: '',
    phonetic: '',
    example: '',
    notes: '',
    isBookmarked: false,
    difficulty: 3,
    topikLevel: '',
    tags: [],
    priority: 3
  });
  const [tagInput, setTagInput] = useState<string>('');
  const [quickNewWord, setQuickNewWord] = useState({
    word: '',
    definition: ''
  });
  const [bulkWordsText, setBulkWordsText] = useState('');
  const [showExcelImport, setShowExcelImport] = useState<boolean>(false);
  const [mode, setMode] = useState<'table' | 'cards' | 'known' | 'flashcards'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('alphabetical');
  const [topikFilter, setTopikFilter] = useState<string>('all');
  const sortWordsAlphabetically = (words: Word[]) => {
    return [...words].sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  };
  const cleanWord = (word: string) => {
    // Remove numbers, parentheses and their contents, normalize whitespace, and trim
    return word.replace(/\(\d+\)/g, '') // Remove (numbers)
    .replace(/\d+/g, '') // Remove standalone numbers
    .replace(/[()]/g, '') // Remove any remaining parentheses
    .replace(/\s+/g, ' ') // Replace multiple spaces/tabs with single space
    .trim(); // Remove leading/trailing spaces
  };
  const normalizeForComparison = (word: string) => {
    // More aggressive normalization for comparison purposes
    return cleanWord(word).toLowerCase().replace(/\s+/g, '') // Remove all spaces for comparison
    .replace(/[^\w]/g, ''); // Remove all non-word characters
  };
  const processWordsForDisplay = (words: Word[]) => {
    return words.map(word => ({
      ...word,
      word: cleanWord(word.word)
    }));
  };
  const handleRemoveDuplicates = () => {
    if (!chapter) return;
    const uniqueWords = chapter.words.reduce((acc: Word[], current) => {
      const normalizedCurrent = normalizeForComparison(current.word);
      const exists = acc.find(word => normalizeForComparison(word.word) === normalizedCurrent);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    if (uniqueWords.length === chapter.words.length) {
      toast({
        title: "No duplicates found",
        description: "There are no duplicate words in this chapter."
      });
      return;
    }
    const removedCount = chapter.words.length - uniqueWords.length;
    const updatedChapter = {
      ...chapter,
      words: uniqueWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      toast({
        title: "Duplicates removed",
        description: `${removedCount} duplicate word(s) have been removed.`
      });
    } catch (e) {
      console.error("Error removing duplicates:", e);
      toast({
        title: "Error removing duplicates",
        description: "There was an error removing duplicate words.",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    if (chapterId) {
      loadChapter();
    }
  }, [chapterId]);
  const loadChapter = () => {
    try {
      const chapterStr = localStorage.getItem(`chapter_${chapterId}`);
      if (chapterStr) {
        const chapterData = JSON.parse(chapterStr);
        setChapter(chapterData);
      } else {
        toast({
          title: "Chapter not found",
          description: "The chapter you're looking for doesn't exist.",
          variant: "destructive"
        });
        navigate('/chapters');
      }
    } catch (e) {
      console.error("Error loading chapter:", e);
      toast({
        title: "Error loading chapter",
        description: "There was an error loading this chapter.",
        variant: "destructive"
      });
    }
  };
  const handleBulkAddWords = () => {
    if (!bulkWordsText.trim()) {
      toast({
        title: "No words to add",
        description: "Please enter some words to add.",
        variant: "destructive"
      });
      return;
    }
    if (!chapter) return;

    // Parse the bulk text
    const lines = bulkWordsText.trim().split('\n').filter(line => line.trim());
    const wordsToAdd: Word[] = [];
    const duplicates: string[] = [];
    const invalidEntries: string[] = [];
    for (let i = 0; i < lines.length; i += 2) {
      const wordLine = lines[i]?.trim();
      const definitionLine = lines[i + 1]?.trim();
      if (!wordLine || !definitionLine) {
        if (wordLine) invalidEntries.push(wordLine);
        continue;
      }
      const cleanedWord = cleanWord(wordLine);
      const normalizedNewWord = normalizeForComparison(cleanedWord);

      // Check for duplicates in existing words
      const existsInChapter = chapter.words.some(existingWord => normalizeForComparison(existingWord.word) === normalizedNewWord);

      // Check for duplicates in current batch
      const existsInBatch = wordsToAdd.some(batchWord => normalizeForComparison(batchWord.word) === normalizedNewWord);
      if (existsInChapter || existsInBatch) {
        duplicates.push(cleanedWord);
        continue;
      }
      wordsToAdd.push({
        id: `word_${Date.now()}_${i}`,
        word: cleanedWord,
        definition: definitionLine,
        phonetic: '',
        example: '',
        notes: '',
        isBookmarked: false,
        isKnown: false,
        difficulty: 3,
        topikLevel: '',
        tags: [],
        createdAt: new Date().toISOString(),
        priority: 3
      });
    }
    if (wordsToAdd.length === 0) {
      toast({
        title: "No valid words to add",
        description: "Please check the format and try again.",
        variant: "destructive"
      });
      return;
    }

    // Add words to chapter
    const updatedWords = [...(chapter.words || []), ...wordsToAdd];
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      setBulkWordsText('');
      setIsBulkAddingWords(false);
      let message = `${wordsToAdd.length} words have been added successfully.`;
      if (duplicates.length > 0) {
        message += ` ${duplicates.length} duplicates were skipped.`;
      }
      if (invalidEntries.length > 0) {
        message += ` ${invalidEntries.length} invalid entries were skipped.`;
      }
      toast({
        title: "Bulk add completed",
        description: message
      });
    } catch (e) {
      console.error("Error adding bulk words:", e);
      toast({
        title: "Error adding words",
        description: "There was an error adding the words.",
        variant: "destructive"
      });
    }
  };
  const handleAddWord = () => {
    if (!newWord.word || !newWord.definition) {
      toast({
        title: "Missing information",
        description: "Word and definition are required.",
        variant: "destructive"
      });
      return;
    }
    if (!chapter) return;

    // Clean the word before checking for duplicates
    const cleanedWord = cleanWord(newWord.word as string);
    const normalizedNewWord = normalizeForComparison(cleanedWord);
    const wordExists = chapter.words.some(existingWord => normalizeForComparison(existingWord.word) === normalizedNewWord);
    if (wordExists) {
      toast({
        title: "Duplicate word",
        description: `The word "${cleanedWord}" already exists in this chapter.`,
        variant: "destructive"
      });
      return;
    }
    const wordToAdd: Word = {
      id: `word_${Date.now()}`,
      word: cleanedWord,
      definition: newWord.definition as string,
      phonetic: newWord.phonetic || '',
      example: newWord.example || '',
      notes: newWord.notes || '',
      isBookmarked: false,
      isKnown: false,
      difficulty: newWord.difficulty || 3,
      topikLevel: newWord.topikLevel || '',
      tags: newWord.tags || [],
      createdAt: new Date().toISOString(),
      priority: newWord.priority || 3
    };
    const updatedWords = [...(chapter.words || []), wordToAdd];
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      setNewWord({
        word: '',
        definition: '',
        phonetic: '',
        example: '',
        notes: '',
        isBookmarked: false,
        difficulty: 3,
        topikLevel: '',
        tags: [],
        priority: 3
      });
      setTagInput('');
      setIsAddingWord(false);
      toast({
        title: "Word added",
        description: `"${wordToAdd.word}" has been added to the chapter.`
      });
    } catch (e) {
      console.error("Error adding word:", e);
      toast({
        title: "Error adding word",
        description: "There was an error adding this word.",
        variant: "destructive"
      });
    }
  };
  const handleQuickAddWord = () => {
    if (!quickNewWord.word || !quickNewWord.definition) {
      toast({
        title: "Missing information",
        description: "Word and definition are required.",
        variant: "destructive"
      });
      return;
    }
    if (!chapter) return;

    // Clean the word before checking for duplicates
    const cleanedWord = cleanWord(quickNewWord.word);
    const normalizedNewWord = normalizeForComparison(cleanedWord);
    const wordExists = chapter.words.some(existingWord => normalizeForComparison(existingWord.word) === normalizedNewWord);
    if (wordExists) {
      toast({
        title: "Duplicate word",
        description: `The word "${cleanedWord}" already exists in this chapter.`,
        variant: "destructive"
      });
      return;
    }
    const wordToAdd: Word = {
      id: `word_${Date.now()}`,
      word: cleanedWord,
      definition: quickNewWord.definition,
      phonetic: '',
      example: '',
      notes: '',
      isBookmarked: false,
      isKnown: false,
      difficulty: 3,
      topikLevel: '',
      tags: [],
      createdAt: new Date().toISOString(),
      priority: 3
    };
    const updatedWords = [...(chapter.words || []), wordToAdd];
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      setQuickNewWord({
        word: '',
        definition: ''
      });
      setIsQuickAddingWord(false);
      toast({
        title: "Word added",
        description: `"${wordToAdd.word}" has been added to the chapter.`
      });
    } catch (e) {
      console.error("Error adding word:", e);
      toast({
        title: "Error adding word",
        description: "There was an error adding this word.",
        variant: "destructive"
      });
    }
  };
  const handleEditWord = (word: Word) => {
    setEditingWord(word);
    setIsEditingWord(true);
  };
  const handleSaveEditedWord = () => {
    if (!editingWord || !chapter) return;

    // Clean the word before saving
    const cleanedEditingWord = {
      ...editingWord,
      word: cleanWord(editingWord.word)
    };
    const updatedWords = chapter.words.map(w => w.id === editingWord.id ? cleanedEditingWord : w);
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      setIsEditingWord(false);
      setEditingWord(null);
      toast({
        title: "Word updated",
        description: `"${cleanedEditingWord.word}" has been updated.`
      });
    } catch (e) {
      console.error("Error updating word:", e);
      toast({
        title: "Error updating word",
        description: "There was an error updating this word.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteWord = (wordId: string) => {
    if (!chapter) return;
    const wordToDelete = chapter.words.find(w => w.id === wordId);
    if (!wordToDelete) return;
    const updatedWords = chapter.words.filter(w => w.id !== wordId);
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      toast({
        title: "Word deleted",
        description: `"${wordToDelete.word}" has been removed from the chapter.`
      });
    } catch (e) {
      console.error("Error deleting word:", e);
      toast({
        title: "Error deleting word",
        description: "There was an error deleting this word.",
        variant: "destructive"
      });
    }
  };
  const handleMarkAsKnown = (wordId: string) => {
    if (!chapter) return;
    const updatedWords = chapter.words.map(w => w.id === wordId ? {
      ...w,
      isKnown: !w.isKnown
    } : w);
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      toast({
        title: updatedWords.find(w => w.id === wordId)?.isKnown ? "Word marked as known" : "Word unmarked",
        description: `"${updatedWords.find(w => w.id === wordId)?.word}" has been ${updatedWords.find(w => w.id === wordId)?.isKnown ? 'moved to Known Words' : 'unmarked as known'}.`
      });
    } catch (e) {
      console.error("Error updating word known status:", e);
      toast({
        title: "Error updating word",
        description: "There was an error updating this word's status.",
        variant: "destructive"
      });
    }
  };
  const handleStartQuiz = () => {
    if (!chapter || !chapter.words || chapter.words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before starting a quiz.",
        variant: "destructive"
      });
      return;
    }
    const availableWords = chapter.words.filter(word => !word.isKnown);
    if (availableWords.length === 0) {
      toast({
        title: "No words to quiz",
        description: "All words in this chapter are marked as known.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/quiz/${chapterId}`);
  };
  const handleStartFlashcards = () => {
    if (!chapter || !chapter.words || chapter.words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before starting flashcards.",
        variant: "destructive"
      });
      return;
    }
    const availableWords = chapter.words.filter(word => !word.isKnown);
    if (availableWords.length === 0) {
      toast({
        title: "No words to review",
        description: "All words in this chapter are marked as known.",
        variant: "destructive"
      });
      return;
    }
    setMode('flashcards');
  };
  const handleImportComplete = (wordCount: number) => {
    setShowExcelImport(false);
    loadChapter();
  };
  const handleFlashcardComplete = (results: {
    correct: number;
    incorrect: number;
    skipped: number;
    total: number;
  }) => {
    toast({
      title: "Flashcard session completed",
      description: `You've completed reviewing ${results.total} words.`
    });
    setMode('table');
  };

  const handleDownloadPDF = () => {
    if (!chapter || !chapter.words || chapter.words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before downloading PDF.",
        variant: "destructive"
      });
      return;
    }

    // Convert words to the format expected by PDF generator
    const wordsForPDF = chapter.words.map(word => ({
      id: word.id,
      word: word.word,
      translation: word.definition, // Use definition as translation
      phonetic: word.phonetic,
      chapter: chapter.title
    }));

    try {
      generatePDF(wordsForPDF, `${chapter.title}-vocabulary`);
      toast({
        title: "PDF downloaded",
        description: "Your vocabulary PDF has been downloaded successfully."
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error generating PDF",
        description: "There was an error creating the PDF file.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadExcel = () => {
    if (!chapter || !chapter.words || chapter.words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before downloading Excel.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create worksheet data
      const worksheetData = [
        ['word', 'definition', 'phonetic', 'example', 'notes'], // Header
        ...chapter.words.map(word => [
          word.word,
          word.definition,
          word.phonetic || '',
          word.example || '',
          word.notes || ''
        ])
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vocabulary');
      
      // Download the file
      XLSX.writeFile(workbook, `${chapter.title}-vocabulary.xlsx`);
      
      toast({
        title: "Excel downloaded",
        description: "Your vocabulary Excel file has been downloaded successfully."
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast({
        title: "Error generating Excel",
        description: "There was an error creating the Excel file.",
        variant: "destructive"
      });
    }
  };

  const handleBookmarkToggle = (wordId: string) => {
    if (!chapter) return;
    const updatedWords = chapter.words.map(w => w.id === wordId ? {
      ...w,
      isBookmarked: !w.isBookmarked
    } : w);
    const updatedChapter = {
      ...chapter,
      words: updatedWords
    };
    try {
      localStorage.setItem(`chapter_${chapterId}`, JSON.stringify(updatedChapter));
      setChapter(updatedChapter);
      toast({
        title: "Bookmark updated",
        description: "Word bookmark status has been updated."
      });
    } catch (e) {
      console.error("Error updating bookmark:", e);
    }
  };
  const filteredWords = (words: Word[]) => {
    let filtered = processWordsForDisplay(words);
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
        word.definition.toLowerCase().includes(searchQuery.toLowerCase()) || 
        word.phonetic?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        word.example?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Difficulty filter
    if (difficultyFilter !== 'all') {
      const difficulty = parseInt(difficultyFilter);
      filtered = filtered.filter(word => word.difficulty === difficulty);
    }
    
    // TOPIK filter
    if (topikFilter !== 'all') {
      if (topikFilter === 'none') {
        filtered = filtered.filter(word => !word.topikLevel || word.topikLevel === '');
      } else {
        filtered = filtered.filter(word => word.topikLevel === topikFilter);
      }
    }
    
    // Sorting
    if (sortBy === 'alphabetical') {
      return sortWordsAlphabetically(filtered);
    } else if (sortBy === 'date-newest') {
      return [...filtered].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'date-oldest') {
      return [...filtered].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
    } else if (sortBy === 'priority') {
      return [...filtered].sort((a, b) => (b.priority || 3) - (a.priority || 3));
    } else if (sortBy === 'difficulty') {
      return [...filtered].sort((a, b) => (b.difficulty || 3) - (a.difficulty || 3));
    } else if (sortBy === 'unfamiliar-first') {
      return [...filtered].sort((a, b) => {
        // First sort by known status (unknown first)
        if (a.isKnown !== b.isKnown) {
          return a.isKnown ? 1 : -1;
        }
        // Then sort by priority (higher priority first)
        return (b.priority || 3) - (a.priority || 3);
      });
    }
    
    return sortWordsAlphabetically(filtered);
  };
  if (!chapter) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading chapter...</p>
      </div>;
  }
  const knownWords = sortWordsAlphabetically(processWordsForDisplay(chapter?.words.filter(w => w.isKnown) || []));
  const unknownWords = sortWordsAlphabetically(processWordsForDisplay(chapter?.words.filter(w => !w.isKnown) || []));
  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          {mode !== 'flashcards' && <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => setShowExcelImport(true)} className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Import from Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadExcel} className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>

              <Button variant="outline" onClick={handleRemoveDuplicates} className="h-10 w-10 p-0" title="Remove duplicate words">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>}
        </div>
        
        {chapter.description && mode !== 'flashcards' && <p className="text-gray-600 mb-6">{chapter.description}</p>}
        
        {mode === 'flashcards' ? <div className="py-4">
            
            <FlashcardMode words={chapter.words.filter(w => !w.isKnown)} onComplete={handleFlashcardComplete} onBack={() => setMode('table')} onBookmark={handleBookmarkToggle} />
          </div> : <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Words</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {unknownWords.length} to learn
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  {knownWords.length} known
                </Badge>
              </div>
            </div>

            <div className="mb-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input type="text" placeholder="Search words, definitions, tags..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Difficulty</Label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="1">⭐ Level 1</SelectItem>
                      <SelectItem value="2">⭐⭐ Level 2</SelectItem>
                      <SelectItem value="3">⭐⭐⭐ Level 3</SelectItem>
                      <SelectItem value="4">⭐⭐⭐⭐ Level 4</SelectItem>
                      <SelectItem value="5">⭐⭐⭐⭐⭐ Level 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">TOPIK Level</Label>
                  <Select value={topikFilter} onValueChange={setTopikFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="none">No TOPIK</SelectItem>
                      <SelectItem value="TOPIK-1">TOPIK-1</SelectItem>
                      <SelectItem value="TOPIK-2">TOPIK-2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alphabetical">A-Z</SelectItem>
                      <SelectItem value="date-newest">Newest First</SelectItem>
                      <SelectItem value="date-oldest">Oldest First</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="difficulty">Difficulty</SelectItem>
                      <SelectItem value="unfamiliar-first">Unfamiliar First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setDifficultyFilter('all');
                      setTopikFilter('all');
                      setSortBy('alphabetical');
                    }}
                    className="h-9 w-full"
                  >
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="table">
              <TabsList className="mb-4">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="cards">Card View</TabsTrigger>
                <TabsTrigger value="known">Known Words ({knownWords.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Korean</TableHead>
                        <TableHead>English</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>TOPIK</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWords(unknownWords).length > 0 ? filteredWords(unknownWords).map(word => <TableRow key={word.id}>
                            <TableCell className="font-medium">
                              <div>{word.word}</div>
                              {word.phonetic && <div className="text-xs text-muted-foreground">{word.phonetic}</div>}
                            </TableCell>
                            <TableCell>
                              <div>{word.definition}</div>
                              {word.tags && word.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {word.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {'⭐'.repeat(word.difficulty || 3)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {word.topikLevel && (
                                <Badge variant="secondary" className="text-xs">{word.topikLevel}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleMarkAsKnown(word.id)} className="h-8 w-8 p-0" title="Mark as known">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditWord(word)} className="h-8 w-8 p-0" title="Edit word">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteWord(word.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600" title="Delete word">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>) : <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            {searchQuery || difficultyFilter !== 'all' || topikFilter !== 'all' ? 'No words match your filters' : 'No words to learn in this chapter'}
                          </TableCell>
                        </TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="cards">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {filteredWords(unknownWords).length > 0 ? filteredWords(unknownWords).map(word => <div key={word.id} className="border rounded-md p-4 hover:shadow-sm transition-shadow bg-card">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium text-lg">{word.word}</h3>
                                {word.phonetic && <p className="text-sm text-muted-foreground mb-1">{word.phonetic}</p>}
                              </div>
                              <div className="flex gap-2 text-xs">
                                {'⭐'.repeat(word.difficulty || 3)}
                                {word.topikLevel && (
                                  <Badge variant="secondary" className="text-xs">{word.topikLevel}</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-foreground mb-2">{word.definition}</p>
                            {word.example && <p className="text-sm text-muted-foreground italic mb-2">"{word.example}"</p>}
                            {word.notes && <p className="text-sm text-muted-foreground">"{word.notes}"</p>}
                            {word.tags && word.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {word.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsKnown(word.id)} className="h-8 w-8 p-0" title="Mark as known">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditWord(word)} className="h-8 w-8 p-0" title="Edit word">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteWord(word.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Delete word">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>) : <div className="col-span-2 text-center py-10 border rounded-md bg-card">
                      <BookOpen className="h-10 w-10 text-muted mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        {searchQuery || difficultyFilter !== 'all' || topikFilter !== 'all' ? 'No words match your filters' : 'No words to learn in this chapter'}
                      </p>
                    </div>}
                </div>
              </TabsContent>
              
              <TabsContent value="known">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Korean</TableHead>
                        <TableHead>English</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>TOPIK</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWords(knownWords).length > 0 ? filteredWords(knownWords).map(word => <TableRow key={word.id}>
                            <TableCell className="font-medium">
                              <div>{word.word}</div>
                              {word.phonetic && <div className="text-xs text-muted-foreground">{word.phonetic}</div>}
                            </TableCell>
                            <TableCell>
                              <div>{word.definition}</div>
                              {word.tags && word.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {word.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {'⭐'.repeat(word.difficulty || 3)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {word.topikLevel && (
                                <Badge variant="secondary" className="text-xs">{word.topikLevel}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleMarkAsKnown(word.id)} className="h-8 w-8 p-0 text-green-500" title="Mark as unknown">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditWord(word)} className="h-8 w-8 p-0" title="Edit word">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteWord(word.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Delete word">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>) : <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            {searchQuery || difficultyFilter !== 'all' || topikFilter !== 'all' ? 'No words match your filters' : 'No known words in this chapter yet'}
                          </TableCell>
                        </TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={() => setIsAddingWord(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New Word
              </Button>
              
              <Button onClick={() => setIsBulkAddingWords(true)} variant="outline">
                <ListPlus className="h-4 w-4 mr-2" />
                Bulk Add Words
              </Button>
            </div>
          </div>}
      </main>
      
      <Dialog open={isAddingWord} onOpenChange={setIsAddingWord}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vocabulary</DialogTitle>
            <DialogDescription>
              Add Korean word or sentence with English translation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="word">Korean (Hangul) *</Label>
                <Input 
                  id="word" 
                  value={newWord.word} 
                  onChange={e => setNewWord({ ...newWord, word: e.target.value })} 
                  placeholder="안녕하세요" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phonetic">Romanization</Label>
                <Input 
                  id="phonetic" 
                  value={newWord.phonetic} 
                  onChange={e => setNewWord({ ...newWord, phonetic: e.target.value })} 
                  placeholder="annyeonghaseyo" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="definition">English Meaning *</Label>
              <Textarea 
                id="definition" 
                value={newWord.definition} 
                onChange={e => setNewWord({ ...newWord, definition: e.target.value })} 
                placeholder="Hello" 
                rows={2} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="example-korean">Example Sentence (Korean)</Label>
              <Textarea 
                id="example-korean" 
                value={newWord.example} 
                onChange={e => setNewWord({ ...newWord, example: e.target.value })} 
                placeholder="오늘 날씨가 좋아요" 
                rows={2} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="example-english">Example Sentence (English)</Label>
              <Textarea 
                id="example-english" 
                value={newWord.notes} 
                onChange={e => setNewWord({ ...newWord, notes: e.target.value })} 
                placeholder="The weather is nice today" 
                rows={2} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty Level: {newWord.difficulty}/5</Label>
                <Slider 
                  value={[newWord.difficulty || 3]} 
                  onValueChange={(value) => setNewWord({ ...newWord, difficulty: value[0] })}
                  min={1}
                  max={5}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Easy</span>
                  <span>Hard</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Priority: {newWord.priority}/5</Label>
                <Slider 
                  value={[newWord.priority || 3]} 
                  onValueChange={(value) => setNewWord({ ...newWord, priority: value[0] })}
                  min={1}
                  max={5}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topik">TOPIK Level</Label>
              <Select 
                value={newWord.topikLevel || 'none'} 
                onValueChange={(value) => setNewWord({ ...newWord, topikLevel: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select TOPIK level (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No TOPIK</SelectItem>
                  <SelectItem value="TOPIK-1">TOPIK-1</SelectItem>
                  <SelectItem value="TOPIK-2">TOPIK-2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input 
                  id="tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      const currentTags = newWord.tags || [];
                      if (!currentTags.includes(tagInput.trim())) {
                        setNewWord({ ...newWord, tags: [...currentTags, tagInput.trim()] });
                      }
                      setTagInput('');
                    }
                  }}
                  placeholder="Add tags (press Enter)"
                />
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (tagInput.trim()) {
                      const currentTags = newWord.tags || [];
                      if (!currentTags.includes(tagInput.trim())) {
                        setNewWord({ ...newWord, tags: [...currentTags, tagInput.trim()] });
                      }
                      setTagInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {newWord.tags && newWord.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newWord.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        const updatedTags = newWord.tags?.filter((_, i) => i !== index);
                        setNewWord({ ...newWord, tags: updatedTags });
                      }}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddingWord(false);
              setTagInput('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddWord}>
              Add Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickAddingWord} onOpenChange={setIsQuickAddingWord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Word</DialogTitle>
            <DialogDescription>
              Quickly add a word with just the word and definition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="quick-word" className="text-sm font-medium">Word*</label>
              <Input id="quick-word" value={quickNewWord.word} onChange={e => setQuickNewWord({
              ...quickNewWord,
              word: e.target.value
            })} placeholder="Enter word" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="quick-definition" className="text-sm font-medium">Definition*</label>
              <Textarea id="quick-definition" value={quickNewWord.definition} onChange={e => setQuickNewWord({
              ...quickNewWord,
              definition: e.target.value
            })} placeholder="Enter definition" rows={3} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddingWord(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickAddWord}>
              Add Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkAddingWords} onOpenChange={setIsBulkAddingWords}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Add Words</DialogTitle>
            <DialogDescription>
              Add multiple words at once. Enter each word on one line followed by its definition on the next line.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="bulk-words" className="text-sm font-medium">Words and Definitions</label>
              <Textarea id="bulk-words" value={bulkWordsText} onChange={e => setBulkWordsText(e.target.value)} placeholder={`Agitated\nFeeling or appearing troubled or nervous.\n\nAlive\nLiving, not dead\n\nAlluring\nHighly attractive or fascinating; seductive.`} rows={12} className="font-mono text-sm" />
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Format:</p>
              <p>• Enter each word on its own line</p>
              <p>• Follow with the definition on the next line</p>
              <p>• Leave a blank line between word pairs</p>
              <p>• Duplicates will be automatically skipped</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddingWords(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddWords}>
              <ListPlus className="h-4 w-4 mr-2" />
              Add Words
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditingWord} onOpenChange={setIsEditingWord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Word</DialogTitle>
            <DialogDescription>
              Make changes to this word.
            </DialogDescription>
          </DialogHeader>
          
          {editingWord && <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-word" className="text-sm font-medium">Word*</label>
                <Input id="edit-word" value={editingWord.word} onChange={e => setEditingWord({
              ...editingWord,
              word: e.target.value
            })} placeholder="Enter word" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-definition" className="text-sm font-medium">Definition*</label>
                <Textarea id="edit-definition" value={editingWord.definition} onChange={e => setEditingWord({
              ...editingWord,
              definition: e.target.value
            })} placeholder="Enter definition" rows={3} />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-phonetic" className="text-sm font-medium">Meaning</label>
                <Input id="edit-phonetic" value={editingWord.phonetic} onChange={e => setEditingWord({
              ...editingWord,
              phonetic: e.target.value
            })} placeholder="Enter hindi meaning" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="edit-example" className="text-sm font-medium">Example</label>
                <Textarea id="edit-example" value={editingWord.example} onChange={e => setEditingWord({
              ...editingWord,
              example: e.target.value
            })} placeholder="Enter example sentence" rows={2} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level: {editingWord.difficulty || 3}/5</Label>
                  <Slider 
                    value={[editingWord.difficulty || 3]} 
                    onValueChange={(value) => setEditingWord({ ...editingWord, difficulty: value[0] })}
                    min={1}
                    max={5}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Easy</span>
                    <span>Hard</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Priority: {editingWord.priority || 3}/5</Label>
                  <Slider 
                    value={[editingWord.priority || 3]} 
                    onValueChange={(value) => setEditingWord({ ...editingWord, priority: value[0] })}
                    min={1}
                    max={5}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingWord(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedWord}>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showExcelImport} onOpenChange={setShowExcelImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            
            
          </DialogHeader>
          
          <ExcelImporter chapterId={chapterId || ''} chapterTitle={chapter.title} onImportComplete={handleImportComplete} />
        </DialogContent>
      </Dialog>
    </div>;
};
export default ChapterDetail;