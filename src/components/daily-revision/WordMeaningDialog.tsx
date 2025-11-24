
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchWordMeaningFromApi, getStoredWordMeaning, storeWordMeaning } from '@/utils/geminiApi';

const TypingLoader = ({ word }: { word: string }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  const lines = [
    `Analyzing the word "${word}"...`,
    'Searching through language database...',
    'Gathering meanings and definitions...',
    'Finding relevant examples...',
    'Preparing translations...',
    'Almost ready!'
  ];

  useEffect(() => {
    if (currentLineIndex >= lines.length) return;

    const currentLine = lines[currentLineIndex];
    
    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setCurrentText(prev => prev + currentLine[charIndex]);
        setCharIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentText('');
        setCharIndex(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [charIndex, currentLineIndex, lines]);

  return (
    <div className="space-y-2">
      {lines.slice(0, currentLineIndex).map((line, index) => (
        <p key={index} className="text-sm text-gray-600 opacity-60">
          ✓ {line}
        </p>
      ))}
      {currentLineIndex < lines.length && (
        <p className="text-sm text-primary font-medium">
          {currentText}<span className="animate-pulse">|</span>
        </p>
      )}
      <div className="flex items-center space-x-2 mt-4">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <span className="text-xs text-gray-500 ml-2">Processing...</span>
      </div>
    </div>
  );
};

interface WordMeaning {
  englishMeaning: string;
  koreanMeaning: string;
  pronunciation: string;
  exampleKorean: string;
  exampleEnglish: string;
  loading: boolean;
  error: string | null;
}

interface WordMeaningDialogProps {
  word: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WordMeaningDialog = ({ word, open, onOpenChange }: WordMeaningDialogProps) => {
  const { toast } = useToast();
  const [wordMeaning, setWordMeaning] = useState<WordMeaning>({
    englishMeaning: '',
    koreanMeaning: '',
    pronunciation: '',
    exampleKorean: '',
    exampleEnglish: '',
    loading: false,
    error: null
  });
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  
  // Check if the word meaning already exists in localStorage when the dialog opens
  useEffect(() => {
    if (open && word) {
      // Reset state first
      setWordMeaning({
        englishMeaning: '',
        koreanMeaning: '',
        pronunciation: '',
        exampleKorean: '',
        exampleEnglish: '',
        loading: false,
        error: null
      });

      const cachedMeaning = getStoredWordMeaning(word);
      if (cachedMeaning) {
        // Validate cached data structure
        if (isValidWordMeaningData(cachedMeaning)) {
          setWordMeaning({
            ...cachedMeaning,
            loading: false,
            error: null
          });
          console.log("Retrieved valid cached meaning for:", word);
        } else {
          console.log("Invalid cached data found, clearing and fetching fresh data for:", word);
          // Clear corrupted cache
          clearStoredWordMeaning(word);
          // Fetch fresh data
          checkWordMeaning(word);
        }
      } else {
        // No cached data, fetch from API
        checkWordMeaning(word);
      }
    }
  }, [open, word]);

  // Store API key in localStorage when it changes
  useEffect(() => {
    if (apiKey && apiKey !== localStorage.getItem('gemini_api_key')) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  // Validate word meaning data structure
  const isValidWordMeaningData = (data: any): boolean => {
    try {
      return (
        data &&
        typeof data === 'object' &&
        typeof data.englishMeaning === 'string' &&
        typeof data.koreanMeaning === 'string' &&
        typeof data.pronunciation === 'string' &&
        typeof data.exampleKorean === 'string' &&
        typeof data.exampleEnglish === 'string' &&
        data.englishMeaning.length > 0 &&
        data.koreanMeaning.length > 0
      );
    } catch (error) {
      console.error("Error validating word meaning data:", error);
      return false;
    }
  };

  // Clear corrupted stored word meaning
  const clearStoredWordMeaning = (word: string): void => {
    try {
      localStorage.removeItem(`word_meaning_${word.toLowerCase()}`);
      console.log("Cleared corrupted cache for:", word);
    } catch (error) {
      console.error("Error clearing word meaning cache:", error);
    }
  };

  const checkWordMeaning = async (word: string): Promise<void> => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setWordMeaning(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const meaningData = await fetchWordMeaningFromApi(word, apiKey);
      
      // Validate API response before storing
      if (isValidWordMeaningData(meaningData)) {
        // Save to localStorage
        storeWordMeaning(word, meaningData);

        setWordMeaning({
          ...meaningData,
          loading: false,
          error: null
        });
      } else {
        throw new Error('Invalid data received from API');
      }
    } catch (error) {
      console.error("Error checking meaning:", error);
      setWordMeaning(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve meaning'
      }));
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
      setShowApiKeyInput(false);
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved."
      });
      checkWordMeaning(word);
    } else {
      toast({
        title: "Missing API Key",
        description: "Please enter a valid Gemini API key.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    // Clear any potentially corrupted cache and retry
    clearStoredWordMeaning(word);
    checkWordMeaning(word);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Explanation: {word}</DialogTitle>
          <DialogDescription>
            Detailed meaning and examples for this word
          </DialogDescription>
        </DialogHeader>
        
        {showApiKeyInput ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter your Gemini API key to fetch word meanings. You can get your API key from the Google AI Studio.
            </p>
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">Gemini API Key</label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your Gemini API key"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveApiKey}>
                Save & Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            {wordMeaning.loading ? (
              <TypingLoader word={word} />
            ) : wordMeaning.error ? (
              <div className="text-red-500">
                <p className="font-medium">Error retrieving meaning:</p>
                <p>{wordMeaning.error}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowApiKeyInput(true)}
                  >
                    Update API Key
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">
                    Word: {word}
                  </h3>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-700">English Meaning:</h4>
                  <p className="text-sm">{wordMeaning.englishMeaning}</p>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-700">Korean Meaning:</h4>
                  <p className="text-sm">{wordMeaning.koreanMeaning}</p>
                </div>

                {wordMeaning.pronunciation && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-700">Pronunciation:</h4>
                    <p className="text-sm">{wordMeaning.pronunciation}</p>
                  </div>
                )}

                {wordMeaning.exampleKorean && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-700">Example:</h4>
                    <p className="text-sm">{wordMeaning.exampleKorean}</p>
                    {wordMeaning.exampleEnglish && (
                      <p className="text-sm text-gray-600 italic mt-1">{wordMeaning.exampleEnglish}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WordMeaningDialog;
