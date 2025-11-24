import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, Plus, Edit, Save, Trash2, FileSpreadsheet, Check, Search, FilterX, PlusCircle, ListPlus, Download, ChevronDown, Volume2, Copy, Loader2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import ExcelImporter from '@/components/chapters/ExcelImporter';
import FlashcardMode from '@/components/revision/FlashcardMode';
import { generatePDF } from '@/utils/pdfGenerator';
import { speakKorean } from '@/utils/textToSpeech';
import { getAllDuplicatesInChapter } from '@/utils/duplicateWordDetector';
import { fetchChapter, fetchWordsByChapter, createWord, updateWord, deleteWord, createWords, fetchAllChapters } from '@/lib/database';
import { fetchWordMeaningFromApi, getStoredWordMeaning } from '@/utils/geminiApi';
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
  difficulty?: number;
  topikLevel?: string;
  tags?: string[];
  createdAt?: string;
  priority?: number;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
}

const ChapterDetail = () => {
  const {
    chapterId
  } = useParams<{
    chapterId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [words, setWords] = useState<Word[]>([]);
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
  const [koreanDefinition, setKoreanDefinition] = useState('');
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [fetchTimeoutId, setFetchTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isFetchingForEdit, setIsFetchingForEdit] = useState(false);
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
  const [duplicatesMap, setDuplicatesMap] = useState<Map<string, any>>(new Map());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [copyTargetChapters, setCopyTargetChapters] = useState<string[]>([]);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [bulkFetchProgress, setBulkFetchProgress] = useState({ current: 0, total: 0, updated: 0, skipped: 0, failed: 0 });
  const [showBulkFetchDialog, setShowBulkFetchDialog] = useState(false);

  
  // Auto-fetch word data from Lovable AI
  const autoFetchWordData = useCallback(async (koreanWord: string) => {
    if (!koreanWord.trim() || koreanWord.length < 2) return;

    setIsAutoFetching(true);
    try {
      const cached = getStoredWordMeaning(koreanWord);
      const meaningData = cached || await fetchWordMeaningFromApi(koreanWord);
      
      // Only populate empty fields
      setNewWord(prev => ({
        ...prev,
        definition: prev.definition || meaningData.englishMeaning,
        phonetic: prev.phonetic || meaningData.pronunciation,
        example: prev.example || meaningData.exampleKorean,
        notes: prev.notes || meaningData.exampleEnglish,
      }));
      setKoreanDefinition(prev => prev || meaningData.koreanMeaning);
    } catch (error) {
      console.error('Error auto-fetching word data:', error);
    } finally {
      setIsAutoFetching(false);
    }
  }, []);

  // Debounced word input handler
  const handleWordInputChange = useCallback((value: string) => {
    setNewWord(prev => ({ ...prev, word: value }));
    
    // Clear existing timeout
    if (fetchTimeoutId) {
      clearTimeout(fetchTimeoutId);
    }
    
    // Set new timeout for auto-fetch
    const newTimeoutId = setTimeout(() => {
      autoFetchWordData(value);
    }, 1000); // 1 second debounce
    
    setFetchTimeoutId(newTimeoutId);
  }, [fetchTimeoutId, autoFetchWordData]);


  // Fetch definition for existing word (only populate empty fields)
  const fetchDefinitionForExistingWord = async () => {
    if (!editingWord || !editingWord.word.trim()) {
      toast({
        title: "No word to fetch",
        description: "Please enter a Korean word first.",
        variant: "destructive"
      });
      return;
    }

    setIsFetchingForEdit(true);
    try {
      const cached = getStoredWordMeaning(editingWord.word);
      const meaningData = cached || await fetchWordMeaningFromApi(editingWord.word);
      
      // Only populate empty fields - don't overwrite existing data
      setEditingWord(prev => {
        if (!prev) return prev;
        
        // Split existing definition to check if it has Korean meaning already
        const definitionParts = prev.definition?.split('\n\n') || [];
        const hasKoreanDefinition = definitionParts.length > 1;
        
        // Prepare combined definition
        let newDefinition = prev.definition;
        if (!prev.definition) {
          newDefinition = `${meaningData.koreanMeaning}\n\n${meaningData.englishMeaning}`;
        } else if (!hasKoreanDefinition && meaningData.koreanMeaning) {
          newDefinition = `${meaningData.koreanMeaning}\n\n${prev.definition}`;
        }
        
        return {
          ...prev,
          definition: newDefinition,
          phonetic: prev.phonetic || meaningData.pronunciation,
          example: prev.example || meaningData.exampleKorean,
          notes: prev.notes || meaningData.exampleEnglish,
        };
      });

      toast({
        title: "Definition fetched",
        description: "Word information has been populated for empty fields.",
      });
    } catch (error) {
      console.error('Error fetching word data:', error);
      toast({
        title: "Error fetching definition",
        description: error instanceof Error ? error.message : "Failed to fetch word data",
        variant: "destructive"
      });
    } finally {
      setIsFetchingForEdit(false);
    }
  };

  // Bulk fetch missing definitions for all words
  const handleBulkFetchDefinitions = async () => {
    // Find words with missing data
    const wordsNeedingUpdate = words.filter(word => 
      !word.definition || 
      !word.phonetic || 
      !word.example || 
      !word.notes
    );

    if (wordsNeedingUpdate.length === 0) {
      toast({
        title: "No words need updating",
        description: "All words in this chapter have complete definitions.",
      });
      return;
    }

    setShowBulkFetchDialog(true);
  };

  const confirmBulkFetch = async () => {
    const wordsNeedingUpdate = words.filter(word => 
      !word.definition || 
      !word.phonetic || 
      !word.example || 
      !word.notes
    );

    setIsBulkFetching(true);
    setBulkFetchProgress({ current: 0, total: wordsNeedingUpdate.length, updated: 0, skipped: 0, failed: 0 });

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < wordsNeedingUpdate.length; i++) {
      const word = wordsNeedingUpdate[i];
      setBulkFetchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // Check if word really needs updating
        const needsUpdate = !word.definition || !word.phonetic || !word.example || !word.notes;
        
        if (!needsUpdate) {
          skipped++;
          setBulkFetchProgress(prev => ({ ...prev, skipped: prev.skipped + 1 }));
          continue;
        }

        // Fetch from API or cache
        const cached = getStoredWordMeaning(word.word);
        const meaningData = cached || await fetchWordMeaningFromApi(word.word);

        // Check if definition has Korean meaning already
        const definitionParts = word.definition?.split('\n\n') || [];
        const hasKoreanDefinition = definitionParts.length > 1;

        // Prepare combined definition
        let newDefinition = word.definition;
        if (!word.definition) {
          newDefinition = `${meaningData.koreanMeaning}\n\n${meaningData.englishMeaning}`;
        } else if (!hasKoreanDefinition && meaningData.koreanMeaning) {
          newDefinition = `${meaningData.koreanMeaning}\n\n${word.definition}`;
        }

        // Update word with only missing fields
        await updateWord(word.id, {
          definition: newDefinition || word.definition,
          phonetic: word.phonetic || meaningData.pronunciation,
          example: word.example || meaningData.exampleKorean,
          notes: word.notes || meaningData.exampleEnglish,
        });

        updated++;
        setBulkFetchProgress(prev => ({ ...prev, updated: prev.updated + 1 }));

        // Add delay to avoid rate limiting (500ms between requests)
        if (i < wordsNeedingUpdate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error fetching definition for ${word.word}:`, error);
        failed++;
        setBulkFetchProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
        
        // Continue with next word even if this one failed
        continue;
      }
    }

    // Reload chapter to show updated words
    await loadChapter();

    setIsBulkFetching(false);
    setShowBulkFetchDialog(false);

    toast({
      title: "Bulk fetch complete",
      description: `Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`,
    });
  };
  
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
  const handleRemoveDuplicates = async () => {
    if (!chapter) return;
    const uniqueWords = words.reduce((acc: Word[], current) => {
      const normalizedCurrent = normalizeForComparison(current.word);
      const exists = acc.find(word => normalizeForComparison(word.word) === normalizedCurrent);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    if (uniqueWords.length === words.length) {
      toast({
        title: "No duplicates found",
        description: "There are no duplicate words in this chapter."
      });
      return;
    }
    const removedCount = words.length - uniqueWords.length;
    
    try {
      // Delete words that are duplicates
      const duplicateIds = words.filter(w => !uniqueWords.find(uw => uw.id === w.id)).map(w => w.id);
      for (const id of duplicateIds) {
        await deleteWord(id);
      }
      
      await loadChapter(); // Reload to get fresh data
      
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

  useEffect(() => {
    const fetchDuplicates = async () => {
      if (chapterId && words.length > 0) {
        try {
          // Fetch all words from all chapters to check for duplicates
          const allChaptersData = await fetchAllChapters();
          const allWordsPromises = allChaptersData.map(async (ch) => {
            const chWords = await fetchWordsByChapter(ch.id);
            return chWords.map(w => ({
              word: w.word,
              chapterId: ch.id,
              chapterTitle: ch.title,
              wordId: w.id
            }));
          });
          const allWordsArrays = await Promise.all(allWordsPromises);
          const allWords = allWordsArrays.flat();
          
          const duplicates = getAllDuplicatesInChapter(chapterId, words, allWords);
          setDuplicatesMap(duplicates);
        } catch (error) {
          console.error("Error fetching duplicates:", error);
        }
      }
    };
    
    fetchDuplicates();
  }, [chapterId, words]);

  const loadChapter = async () => {
    if (!chapterId) return;
    
    try {
      const [chapterData, wordsData, chaptersData] = await Promise.all([
        fetchChapter(chapterId),
        fetchWordsByChapter(chapterId),
        fetchAllChapters()
      ]);
      
      setChapter(chapterData);
      setAllChapters(chaptersData);
      setWords(wordsData.map(w => ({
        id: w.id,
        word: w.word,
        definition: w.definition,
        phonetic: w.phonetic || '',
        example: w.example || '',
        notes: w.notes || '',
        isBookmarked: w.is_bookmarked || false,
        isKnown: w.is_known || false,
        difficulty: w.difficulty || 3,
        topikLevel: w.topik_level || '',
        tags: (w.tags as string[]) || [],
        createdAt: w.created_at,
        priority: w.priority || 3
      })));
    } catch (error) {
      console.error("Error loading chapter:", error);
      toast({
        title: "Chapter not found",
        description: "The chapter you're looking for doesn't exist.",
        variant: "destructive"
      });
      navigate('/chapters');
    }
  };

  const handleBulkAddWords = async () => {
    if (!bulkWordsText.trim()) {
      toast({
        title: "No words to add",
        description: "Please enter some words to add.",
        variant: "destructive"
      });
      return;
    }
    if (!chapter) return;

    const lines = bulkWordsText.trim().split('\n').filter(line => line.trim());
    const wordsToAdd: any[] = [];
    const invalidEntries: string[] = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      const wordLine = lines[i]?.trim();
      const definitionLine = lines[i + 1]?.trim();
      if (!wordLine || !definitionLine) {
        if (wordLine) invalidEntries.push(wordLine);
        continue;
      }
      const cleanedWord = cleanWord(wordLine);
      
      wordsToAdd.push({
        chapter_id: chapterId,
        word: cleanedWord,
        definition: definitionLine,
        phonetic: '',
        example: '',
        notes: '',
        is_bookmarked: false,
        is_known: false,
        difficulty: 3,
        topik_level: '',
        tags: [],
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

    try {
      await createWords(wordsToAdd);
      await loadChapter(); // Reload to get fresh data
      
      setBulkWordsText('');
      setIsBulkAddingWords(false);
      
      let message = `${wordsToAdd.length} words have been added successfully.`;
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
  const handleAddWord = async () => {
    if (!newWord.word || !newWord.definition) {
      toast({
        title: "Missing information",
        description: "Word and definition are required.",
        variant: "destructive"
      });
      return;
    }
    if (!chapter) return;

    const cleanedWord = cleanWord(newWord.word as string);
    
    // Combine Korean and English definitions
    const combinedDefinition = koreanDefinition 
      ? `${koreanDefinition}\n\n${newWord.definition}`
      : newWord.definition;
    
    try {
      await createWord({
        chapter_id: chapterId!,
        word: cleanedWord,
        definition: combinedDefinition as string,
        phonetic: newWord.phonetic || '',
        example: newWord.example || '',
        notes: newWord.notes || '',
        is_bookmarked: false,
        is_known: false,
        difficulty: newWord.difficulty || 3,
        topik_level: newWord.topikLevel || '',
        tags: newWord.tags || [],
        priority: newWord.priority || 3
      });
      
      await loadChapter(); // Reload to get fresh data
      
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
      setKoreanDefinition('');
      setTagInput('');
      setIsAddingWord(false);
      
      toast({
        title: "Word added",
        description: `"${cleanedWord}" has been added to the chapter.`
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
  const handleQuickAddWord = async () => {
    if (!quickNewWord.word || !quickNewWord.definition) {
      toast({
        title: "Missing information",
        description: "Word and definition are required.",
        variant: "destructive"
      });
      return;
    }
    if (!chapter) return;

    const cleanedWord = cleanWord(quickNewWord.word);
    
    try {
      await createWord({
        chapter_id: chapterId!,
        word: cleanedWord,
        definition: quickNewWord.definition,
        phonetic: '',
        example: '',
        notes: '',
        is_bookmarked: false,
        is_known: false,
        difficulty: 3,
        topik_level: '',
        tags: [],
        priority: 3
      });
      
      await loadChapter();
      
      setQuickNewWord({
        word: '',
        definition: ''
      });
      setIsQuickAddingWord(false);
      
      toast({
        title: "Word added",
        description: `"${cleanedWord}" has been added to the chapter.`
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

  const handleSaveEditedWord = async () => {
    if (!editingWord || !chapter) return;

    const cleanedEditingWord = {
      ...editingWord,
      word: cleanWord(editingWord.word)
    };
    
    try {
      // Update the original word
      await updateWord(editingWord.id, {
        word: cleanedEditingWord.word,
        definition: cleanedEditingWord.definition,
        phonetic: cleanedEditingWord.phonetic,
        example: cleanedEditingWord.example,
        notes: cleanedEditingWord.notes,
        difficulty: cleanedEditingWord.difficulty,
        topik_level: cleanedEditingWord.topikLevel,
        tags: cleanedEditingWord.tags,
        priority: cleanedEditingWord.priority
      });

      // If target chapters selected, copy to those chapters
      if (copyTargetChapters.length > 0) {
        const wordsToCopy = copyTargetChapters.map(targetChapterId => ({
          chapter_id: targetChapterId,
          word: cleanedEditingWord.word,
          definition: cleanedEditingWord.definition,
          phonetic: cleanedEditingWord.phonetic || '',
          example: cleanedEditingWord.example || '',
          notes: cleanedEditingWord.notes || '',
          difficulty: cleanedEditingWord.difficulty || 3,
          topik_level: cleanedEditingWord.topikLevel || '',
          tags: cleanedEditingWord.tags || [],
          priority: cleanedEditingWord.priority || 3,
          is_bookmarked: editingWord.isBookmarked,
          is_known: editingWord.isKnown || false,
        }));

        await createWords(wordsToCopy);
        toast({
          title: "Success",
          description: `Word updated and copied to ${copyTargetChapters.length} chapter(s)`
        });
      } else {
        toast({
          title: "Word updated",
          description: `"${cleanedEditingWord.word}" has been updated.`
        });
      }

      await loadChapter();
      setIsEditingWord(false);
      setEditingWord(null);
      setCopyTargetChapters([]);
    } catch (e) {
      console.error("Error updating word:", e);
      toast({
        title: "Error updating word",
        description: "There was an error updating this word.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!chapter) return;
    const wordToDelete = words.find(w => w.id === wordId);
    if (!wordToDelete) return;
    
    try {
      await deleteWord(wordId);
      await loadChapter(); // Reload to get fresh data
      
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

  const handleMarkAsKnown = async (wordId: string) => {
    if (!chapter) return;
    
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    
    try {
      await updateWord(wordId, { is_known: !word.isKnown });
      await loadChapter(); // Reload to get fresh data
      
      const updatedWord = words.find(w => w.id === wordId);
      toast({
        title: updatedWord?.isKnown ? "Word unmarked" : "Word marked as known",
        description: `"${word.word}" has been ${updatedWord?.isKnown ? 'unmarked as known' : 'moved to Known Words'}.`
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

  const handleBulkCopy = async () => {
    if (selectedWordIds.size === 0 || copyTargetChapters.length === 0) {
      toast({
        title: "Missing selection",
        description: "Please select words and target chapters",
        variant: "destructive"
      });
      return;
    }

    setShowCopyConfirmation(true);
  };

  const confirmBulkCopy = async () => {
    try {
      const wordsToCopy = words
        .filter(w => selectedWordIds.has(w.id))
        .flatMap(word => 
          copyTargetChapters.map(targetChapterId => ({
            chapter_id: targetChapterId,
            word: word.word,
            definition: word.definition,
            phonetic: word.phonetic || '',
            example: word.example || '',
            notes: word.notes || '',
            difficulty: word.difficulty || 3,
            topik_level: word.topikLevel || '',
            tags: word.tags || [],
            priority: word.priority || 3,
            is_bookmarked: word.isBookmarked,
            is_known: word.isKnown || false,
          }))
        );

      await createWords(wordsToCopy);
      toast({
        title: "Copy complete",
        description: `Copied ${selectedWordIds.size} word(s) to ${copyTargetChapters.length} chapter(s)`
      });
      
      setSelectedWordIds(new Set());
      setBulkSelectMode(false);
      setCopyTargetChapters([]);
      setShowCopyConfirmation(false);
    } catch (error) {
      console.error("Error copying words:", error);
      toast({
        title: "Error copying words",
        description: "Failed to copy words",
        variant: "destructive"
      });
    }
  };

  const toggleWordSelection = (wordId: string) => {
    const newSelection = new Set(selectedWordIds);
    if (newSelection.has(wordId)) {
      newSelection.delete(wordId);
    } else {
      newSelection.add(wordId);
    }
    setSelectedWordIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedWordIds.size === filteredWords(unknownWords).length) {
      setSelectedWordIds(new Set());
    } else {
      setSelectedWordIds(new Set(filteredWords(unknownWords).map(w => w.id)));
    }
  };

  const handleStartQuiz = () => {
    if (!chapter || !words || words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before starting a quiz.",
        variant: "destructive"
      });
      return;
    }
    const availableWords = words.filter(word => !word.isKnown);
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
    if (!chapter || !words || words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before starting flashcards.",
        variant: "destructive"
      });
      return;
    }
    const availableWords = words.filter(word => !word.isKnown);
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
    if (!chapter || !words || words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before downloading PDF.",
        variant: "destructive"
      });
      return;
    }

    const wordsForPDF = words.map(word => ({
      id: word.id,
      word: word.word,
      translation: word.definition,
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
    if (!chapter || !words || words.length === 0) {
      toast({
        title: "No words available",
        description: "Add some words to this chapter before downloading Excel.",
        variant: "destructive"
      });
      return;
    }

    try {
      const worksheetData = [
        ['word', 'definition', 'phonetic', 'example', 'notes'],
        ...words.map(word => [
          word.word,
          word.definition,
          word.phonetic || '',
          word.example || '',
          word.notes || ''
        ])
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vocabulary');
      
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

  const handleBookmarkToggle = async (wordId: string) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    
    try {
      await updateWord(wordId, { is_bookmarked: !word.isBookmarked });
      await loadChapter();
    } catch (e) {
      console.error("Error updating bookmark:", e);
      toast({
        title: "Error",
        description: "Failed to update bookmark status.",
        variant: "destructive"
      });
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
  const knownWords = sortWordsAlphabetically(processWordsForDisplay(words.filter(w => w.isKnown) || []));
  const unknownWords = sortWordsAlphabetically(processWordsForDisplay(words.filter(w => !w.isKnown) || []));
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          {mode !== 'flashcards' && (
            <div className="flex items-center space-x-2">
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
            </div>
          )}
        </div>
        
        {chapter.description && mode !== 'flashcards' && <p className="text-gray-600 mb-6">{chapter.description}</p>}
        
        {mode === 'flashcards' ? (
          <div className="py-4">
            <FlashcardMode words={words.filter(w => !w.isKnown)} onComplete={handleFlashcardComplete} onBack={() => setMode('table')} onBookmark={handleBookmarkToggle} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setBulkSelectMode(!bulkSelectMode);
                    if (bulkSelectMode) {
                      setSelectedWordIds(new Set());
                      setCopyTargetChapters([]);
                    }
                  }} 
                  size="sm" 
                  variant={bulkSelectMode ? "secondary" : "outline"}
                >
                  {bulkSelectMode ? "Cancel Selection" : "Bulk Copy"}
                </Button>
                <Button onClick={() => setIsAddingWord(true)} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Word
                </Button>
                <Button onClick={() => setIsBulkAddingWords(true)} size="sm" variant="outline">
                  <ListPlus className="h-4 w-4 mr-2" />
                  Bulk Add Words
                </Button>
                <Button 
                  onClick={handleBulkFetchDefinitions} 
                  size="sm" 
                  variant="outline"
                  disabled={isBulkFetching}
                >
                  {isBulkFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Fetch Missing Data
                    </>
                  )}
                </Button>
                <Badge variant="outline">
                  {unknownWords.length} to learn
                </Badge>
                <Badge variant="outline" className="bg-green-50">
                  {knownWords.length} known
                </Badge>
              </div>
            </div>

            {bulkSelectMode && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedWordIds.size === filteredWords(unknownWords).length && filteredWords(unknownWords).length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedWordIds.size} word(s) selected
                    </span>
                  </div>
                  <Button
                    onClick={handleBulkCopy}
                    disabled={selectedWordIds.size === 0}
                    size="sm"
                  >
                    Copy Selected
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Copy to chapters:</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded bg-background">
                    {allChapters
                      .filter(ch => ch.id !== chapterId)
                      .map(ch => (
                        <label key={ch.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={copyTargetChapters.includes(ch.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCopyTargetChapters([...copyTargetChapters, ch.id]);
                              } else {
                                setCopyTargetChapters(copyTargetChapters.filter(id => id !== ch.id));
                              }
                            }}
                          />
                          {ch.title}
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            )}
            
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
                        {bulkSelectMode && <TableHead className="w-12"></TableHead>}
                        <TableHead>Korean</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWords(unknownWords).length > 0 ? filteredWords(unknownWords).map(word => {
                        const duplicateInfo = duplicatesMap.get(word.id);
                        return (
                          <TableRow key={word.id}>
                            {bulkSelectMode && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedWordIds.has(word.id)}
                                  onCheckedChange={() => toggleWordSelection(word.id)}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              <div>
                                <span className="text-base">{word.word}</span>
                                {word.phonetic && (
                                  <span className="text-xs text-muted-foreground ml-2">[{word.phonetic}]</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div>{word.definition}</div>
                                {word.example && (
                                  <div className="text-sm mt-2 pt-2 border-t border-border/30">
                                    <div className="text-muted-foreground">{word.example}</div>
                                    {word.notes && (
                                      <div className="text-xs text-muted-foreground/70 mt-1">{word.notes}</div>
                                    )}
                                  </div>
                                )}
                              </div>
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
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => speakKorean(word.word)} className="h-8 w-8 p-0" title="Pronounce">
                                  <Volume2 className="h-4 w-4" />
                                </Button>
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
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={bulkSelectMode ? 5 : 4} className="text-center py-6 text-muted-foreground">
                            {searchQuery || difficultyFilter !== 'all' || topikFilter !== 'all' ? 'No words match your filters' : 'No words to learn in this chapter'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="cards">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWords(unknownWords).map(word => {
                    const duplicateInfo = duplicatesMap.get(word.id);
                    return (
                      <div key={word.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{word.word}</h3>
                              {duplicateInfo && duplicateInfo.isDuplicate && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center text-orange-600">
                                        <Copy className="h-3.5 w-3.5" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs">
                                        <p className="font-semibold mb-1">Also appears in:</p>
                                        {duplicateInfo.otherChapters.map((ch: any, idx: number) => (
                                          <p key={idx}>• {ch.title}</p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {word.phonetic && <p className="text-sm text-muted-foreground">{word.phonetic}</p>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => speakKorean(word.word)} className="h-8 w-8 p-0">
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-700 mb-2">{word.definition}</p>
                        {word.example && (
                          <div className="text-sm text-gray-600 mb-2">
                            <p className="font-medium">Example:</p>
                            <p>{word.example}</p>
                          </div>
                        )}
                        {word.notes && (
                          <div className="text-sm text-gray-600 mb-2">
                            <p>{word.notes}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {'⭐'.repeat(word.difficulty || 3)}
                            </div>
                            {word.topikLevel && (
                              <Badge variant="secondary" className="text-xs">{word.topikLevel}</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsKnown(word.id)} className="h-8 w-8 p-0">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditWord(word)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteWord(word.id)} className="h-8 w-8 p-0 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {word.tags && word.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {word.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredWords(unknownWords).length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      {searchQuery || difficultyFilter !== 'all' || topikFilter !== 'all' ? 'No words match your filters' : 'No words to learn in this chapter'}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="known">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Korean</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWords(knownWords).length > 0 ? filteredWords(knownWords).map(word => (
                        <TableRow key={word.id}>
                          <TableCell className="font-medium">
                            <div>
                              <span>{word.word}</span>
                              {word.phonetic && (
                                <span className="text-sm text-muted-foreground ml-2">[{word.phonetic}]</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div>{word.definition}</div>
                              {word.example && (
                                <div className="text-sm mt-2 pt-2 border-t border-border/30">
                                  <div className="text-muted-foreground">{word.example}</div>
                                  {word.notes && (
                                    <div className="text-xs text-muted-foreground/70 mt-1">{word.notes}</div>
                                  )}
                                </div>
                              )}
                            </div>
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
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => speakKorean(word.word)} className="h-8 w-8 p-0" title="Pronounce">
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAsKnown(word.id)} className="h-8 w-8 p-0" title="Mark as unknown">
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditWord(word)} className="h-8 w-8 p-0" title="Edit word">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteWord(word.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Delete word">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            {searchQuery || difficultyFilter !== 'all' || topikFilter !== 'all' ? 'No known words match your filters' : 'No known words in this chapter'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <Dialog open={isEditingWord} onOpenChange={(open) => {
        setIsEditingWord(open);
        if (!open) {
          setCopyTargetChapters([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Vocabulary</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchDefinitionForExistingWord}
                disabled={isFetchingForEdit}
              >
                {isFetchingForEdit ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch Definition
                  </>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {editingWord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-word">Korean (Hangul)</Label>
                  <Input 
                    id="edit-word" 
                    value={editingWord.word} 
                    onChange={e => setEditingWord({ ...editingWord, word: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phonetic">Pronunciation (Hangul)</Label>
                  <Input 
                    id="edit-phonetic" 
                    value={editingWord.phonetic} 
                    onChange={e => setEditingWord({ ...editingWord, phonetic: e.target.value })} 
                    placeholder="Korean pronunciation guide"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-definition">Definition (Korean + English)</Label>
                  <span className="text-xs text-muted-foreground">Korean meaning appears first if available</span>
                </div>
                <Textarea 
                  id="edit-definition" 
                  value={editingWord.definition} 
                  onChange={e => setEditingWord({ ...editingWord, definition: e.target.value })} 
                  rows={3} 
                  placeholder="Korean meaning&#10;&#10;English meaning"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-example">Example (Korean)</Label>
                <Textarea 
                  id="edit-example" 
                  value={editingWord.example} 
                  onChange={e => setEditingWord({ ...editingWord, example: e.target.value })} 
                  rows={2} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Example (English)</Label>
                <Textarea 
                  id="edit-notes" 
                  value={editingWord.notes} 
                  onChange={e => setEditingWord({ ...editingWord, notes: e.target.value })} 
                  rows={2} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty: {editingWord.difficulty}/5</Label>
                  <Slider 
                    value={[editingWord.difficulty || 3]} 
                    onValueChange={(value) => setEditingWord({ ...editingWord, difficulty: value[0] })}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Priority: {editingWord.priority}/5</Label>
                  <Slider 
                    value={[editingWord.priority || 3]} 
                    onValueChange={(value) => setEditingWord({ ...editingWord, priority: value[0] })}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-topik">TOPIK Level</Label>
                <Select 
                  value={editingWord.topikLevel || 'none'} 
                  onValueChange={(value) => setEditingWord({ ...editingWord, topikLevel: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select TOPIK level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No TOPIK</SelectItem>
                    <SelectItem value="TOPIK-1">TOPIK-1</SelectItem>
                    <SelectItem value="TOPIK-2">TOPIK-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Also copy to chapters (optional):</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded bg-background">
                  {allChapters
                    .filter(ch => ch.id !== chapterId)
                    .map(ch => (
                      <label key={ch.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={copyTargetChapters.includes(ch.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCopyTargetChapters([...copyTargetChapters, ch.id]);
                            } else {
                              setCopyTargetChapters(copyTargetChapters.filter(chId => chId !== ch.id));
                            }
                          }}
                        />
                        {ch.title}
                      </label>
                    ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditingWord(false);
              setCopyTargetChapters([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedWord}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCopyConfirmation} onOpenChange={setShowCopyConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Copy</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to copy {selectedWordIds.size} word(s) to {copyTargetChapters.length} chapter(s).
              This will create {selectedWordIds.size * copyTargetChapters.length} new word entries.
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkCopy}>
              Copy Words
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddingWord} onOpenChange={setIsAddingWord}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vocabulary</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-word">Korean (Hangul) *</Label>
                  {isAutoFetching && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching data...
                    </span>
                  )}
                </div>
                <Input 
                  id="new-word" 
                  value={newWord.word} 
                  onChange={e => handleWordInputChange(e.target.value)} 
                  placeholder="안녕하세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phonetic">Pronunciation (Hangul)</Label>
                <Input 
                  id="new-phonetic" 
                  value={newWord.phonetic} 
                  onChange={e => setNewWord({ ...newWord, phonetic: e.target.value })} 
                  placeholder="Korean pronunciation guide"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-korean-definition">Korean Meaning</Label>
              <Textarea 
                id="new-korean-definition" 
                value={koreanDefinition} 
                onChange={e => setKoreanDefinition(e.target.value)} 
                placeholder="Korean language definition"
                rows={2} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-definition">English Meaning *</Label>
              <Textarea 
                id="new-definition" 
                value={newWord.definition} 
                onChange={e => setNewWord({ ...newWord, definition: e.target.value })} 
                placeholder="Hello"
                rows={2} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-example">Example (Korean)</Label>
              <Textarea 
                id="new-example" 
                value={newWord.example} 
                onChange={e => setNewWord({ ...newWord, example: e.target.value })} 
                placeholder="안녕하세요, 만나서 반갑습니다"
                rows={2} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-notes">Example (English)</Label>
              <Textarea 
                id="new-notes" 
                value={newWord.notes} 
                onChange={e => setNewWord({ ...newWord, notes: e.target.value })} 
                placeholder="Hello, nice to meet you"
                rows={2} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty: {newWord.difficulty}/5</Label>
                <Slider 
                  value={[newWord.difficulty || 3]} 
                  onValueChange={(value) => setNewWord({ ...newWord, difficulty: value[0] })}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Priority: {newWord.priority}/5</Label>
                <Slider 
                  value={[newWord.priority || 3]} 
                  onValueChange={(value) => setNewWord({ ...newWord, priority: value[0] })}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-topik">TOPIK Level</Label>
              <Select 
                value={newWord.topikLevel || 'none'} 
                onValueChange={(value) => setNewWord({ ...newWord, topikLevel: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select TOPIK level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No TOPIK</SelectItem>
                  <SelectItem value="TOPIK-1">TOPIK-1</SelectItem>
                  <SelectItem value="TOPIK-2">TOPIK-2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-tags">Tags</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-tags" 
                  value={tagInput} 
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      setNewWord({ 
                        ...newWord, 
                        tags: [...(newWord.tags || []), tagInput.trim()] 
                      });
                      setTagInput('');
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button 
                  type="button"
                  onClick={() => {
                    if (tagInput.trim()) {
                      setNewWord({ 
                        ...newWord, 
                        tags: [...(newWord.tags || []), tagInput.trim()] 
                      });
                      setTagInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {newWord.tags && newWord.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newWord.tags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        setNewWord({
                          ...newWord,
                          tags: newWord.tags?.filter((_, i) => i !== idx)
                        });
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
            <Button variant="outline" onClick={() => setIsAddingWord(false)}>
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
              Add a word with just the Korean and English translation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quick-word">Korean (Hangul) *</Label>
              <Input 
                id="quick-word" 
                value={quickNewWord.word} 
                onChange={e => setQuickNewWord({ ...quickNewWord, word: e.target.value })} 
                placeholder="안녕하세요"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quick-definition">English Meaning *</Label>
              <Input 
                id="quick-definition" 
                value={quickNewWord.definition} 
                onChange={e => setQuickNewWord({ ...quickNewWord, definition: e.target.value })} 
                placeholder="Hello"
              />
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
              Enter words in pairs: Korean word on one line, English definition on the next line
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-words">Words (Korean and English pairs)</Label>
              <Textarea 
                id="bulk-words" 
                value={bulkWordsText} 
                onChange={e => setBulkWordsText(e.target.value)} 
                placeholder="안녕하세요&#10;Hello&#10;감사합니다&#10;Thank you"
                rows={10}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Format: Korean word, then English definition on the next line. Repeat for each word.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddingWords(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddWords}>
              Add Words
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkFetchDialog} onOpenChange={setShowBulkFetchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Fetch Missing Definitions</DialogTitle>
            <DialogDescription>
              {isBulkFetching ? (
                "Fetching definitions from Gemini API..."
              ) : (
                `Found ${words.filter(w => !w.definition || !w.phonetic || !w.example || !w.notes).length} words with missing data. This will fetch and populate empty fields.`
              )}
            </DialogDescription>
          </DialogHeader>
          
          {isBulkFetching && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{bulkFetchProgress.current} / {bulkFetchProgress.total}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(bulkFetchProgress.current / bulkFetchProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{bulkFetchProgress.updated}</div>
                  <div className="text-muted-foreground">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{bulkFetchProgress.skipped}</div>
                  <div className="text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{bulkFetchProgress.failed}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Please wait... This may take a few minutes depending on the number of words.
              </p>
            </div>
          )}
          
          <DialogFooter>
            {!isBulkFetching ? (
              <>
                <Button variant="outline" onClick={() => setShowBulkFetchDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmBulkFetch}>
                  Start Fetching
                </Button>
              </>
            ) : (
              <Button variant="outline" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showExcelImport && (
        <ExcelImporter
          chapterId={chapterId!}
          chapterTitle={chapter.title}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

export default ChapterDetail;
