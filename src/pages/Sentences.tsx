import { useState, useEffect } from "react";
import { Plus, Search, Filter, BookOpen, X, Languages, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllWords } from "@/lib/database";

interface Sentence {
  id: string;
  korean: string;
  english: string;
  chinese: string;
  grammarPoints: string;
  topic: string;
  topikLevel: string;
  category: string;
  difficulty: number;
  notes: string;
  tags: string[];
  linkedVocabulary: string[]; // word IDs
  createdAt: string;
}

interface Word {
  id: string;
  word: string;
  definition: string;
  chapterId: string;
  chapterTitle: string;
}

const CATEGORIES = ["Listening", "Essay", "Grammar", "Others"];

const COMMON_TAGS = [
  "adjective", "advanced", "antonym", "beginner", "casual", "common",
  "formal", "grammar", "honorific", "informal", "intermediate", "noun",
  "phrase", "polite", "speaking", "synonym", "topik", "topik-1", "topik-2",
  "topik-3", "topik-4", "topik-5", "topik-6", "verb", "writing"
];

const Sentences = () => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTopik, setFilterTopik] = useState<string>("all");
  const [vocabSearchQuery, setVocabSearchQuery] = useState("");
  
  const [newSentence, setNewSentence] = useState<Omit<Sentence, 'id' | 'createdAt'>>({
    korean: "",
    english: "",
    chinese: "",
    grammarPoints: "",
    topic: "",
    topikLevel: "",
    category: "",
    difficulty: 3,
    notes: "",
    tags: [],
    linkedVocabulary: []
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadSentences();
    loadAvailableWords();
  }, []);

  const loadSentences = async () => {
    try {
      const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedSentences: Sentence[] = (data || []).map(s => ({
        id: s.id,
        korean: s.korean,
        english: s.english,
        chinese: s.chinese || '',
        grammarPoints: s.grammar_points || '',
        topic: s.topic || '',
        topikLevel: s.topik_level || '',
        category: s.category,
        difficulty: s.difficulty,
        notes: s.notes || '',
        tags: (s.tags as string[]) || [],
        linkedVocabulary: (s.linked_vocabulary as string[]) || [],
        createdAt: s.created_at
      }));

      setSentences(mappedSentences);
    } catch (error) {
      console.error('Error loading sentences:', error);
      toast.error('Failed to load sentences');
    }
  };

  const loadAvailableWords = async () => {
    try {
      const words = await fetchAllWords();
      const mappedWords: Word[] = words.map(w => ({
        id: w.id,
        word: w.word,
        definition: w.definition,
        chapterId: w.chapter_id,
        chapterTitle: ''
      }));
      setAvailableWords(mappedWords);
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const handleAddSentence = async () => {
    if (!newSentence.korean || !newSentence.english) {
      toast.error("Korean sentence and English translation are required");
      return;
    }

    if (!newSentence.category) {
      toast.error("Category is required");
      return;
    }

    try {
      if (editingSentence) {
        // Update existing sentence
        const { error } = await supabase
          .from('sentences')
          .update({
            korean: newSentence.korean,
            english: newSentence.english,
            chinese: newSentence.chinese || null,
            grammar_points: newSentence.grammarPoints || null,
            topic: newSentence.topic || null,
            topik_level: newSentence.topikLevel || null,
            category: newSentence.category,
            difficulty: newSentence.difficulty,
            notes: newSentence.notes || null,
            tags: newSentence.tags,
            linked_vocabulary: newSentence.linkedVocabulary
          })
          .eq('id', editingSentence.id);

        if (error) throw error;
        toast.success("Sentence updated successfully!");
      } else {
        // Add new sentence
        const { error } = await supabase
          .from('sentences')
          .insert({
            korean: newSentence.korean,
            english: newSentence.english,
            chinese: newSentence.chinese || null,
            grammar_points: newSentence.grammarPoints || null,
            topic: newSentence.topic || null,
            topik_level: newSentence.topikLevel || null,
            category: newSentence.category,
            difficulty: newSentence.difficulty,
            notes: newSentence.notes || null,
            tags: newSentence.tags,
            linked_vocabulary: newSentence.linkedVocabulary
          });

        if (error) throw error;
        toast.success("Sentence added successfully!");
      }

      // Reload sentences
      await loadSentences();
    } catch (error) {
      console.error('Error saving sentence:', error);
      toast.error('Failed to save sentence');
      return;
    }
    
    setNewSentence({
      korean: "",
      english: "",
      chinese: "",
      grammarPoints: "",
      topic: "",
      topikLevel: "",
      category: "",
      difficulty: 3,
      notes: "",
      tags: [],
      linkedVocabulary: []
    });
    setTagInput("");
    setEditingSentence(null);
    setIsDialogOpen(false);
  };

  const handleEditSentence = (sentence: Sentence) => {
    setEditingSentence(sentence);
    setNewSentence({
      korean: sentence.korean,
      english: sentence.english,
      chinese: sentence.chinese,
      grammarPoints: sentence.grammarPoints,
      topic: sentence.topic,
      topikLevel: sentence.topikLevel,
      category: sentence.category,
      difficulty: sentence.difficulty,
      notes: sentence.notes,
      tags: sentence.tags,
      linkedVocabulary: sentence.linkedVocabulary
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSentence = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sentences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSentences(sentences.filter(s => s.id !== id));
      toast.success("Sentence deleted");
    } catch (error) {
      console.error('Error deleting sentence:', error);
      toast.error('Failed to delete sentence');
    }
  };

  const handleAddTag = () => {
    if (tagInput && !newSentence.tags.includes(tagInput)) {
      setNewSentence({ ...newSentence, tags: [...newSentence.tags, tagInput] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewSentence({ ...newSentence, tags: newSentence.tags.filter(t => t !== tag) });
  };

  const handleToggleVocabulary = (wordId: string) => {
    const isLinked = newSentence.linkedVocabulary.includes(wordId);
    setNewSentence({
      ...newSentence,
      linkedVocabulary: isLinked
        ? newSentence.linkedVocabulary.filter(id => id !== wordId)
        : [...newSentence.linkedVocabulary, wordId]
    });
  };

  const getLinkedWords = (linkedVocabulary: string[]) => {
    return availableWords.filter(word => linkedVocabulary.includes(word.id));
  };

  const filteredSentences = sentences.filter(sentence => {
    const matchesSearch = 
      sentence.korean.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sentence.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sentence.chinese.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sentence.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === "all" || sentence.category === filterCategory;
    const matchesTopik = filterTopik === "all" || sentence.topikLevel === filterTopik;
    
    return matchesSearch && matchesCategory && matchesTopik;
  });

  const filteredVocabWords = availableWords.filter(word =>
    word.word.toLowerCase().includes(vocabSearchQuery.toLowerCase()) ||
    word.definition.toLowerCase().includes(vocabSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-teal-500 to-teal-600">
              <Languages className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Korean Sentences</h1>
              <p className="text-sm text-muted-foreground">Learn and practice Korean sentences with linked vocabulary</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSentence(null);
              setNewSentence({
                korean: "",
                english: "",
                chinese: "",
                grammarPoints: "",
                topic: "",
                topikLevel: "",
                category: "",
                difficulty: 3,
                notes: "",
                tags: [],
                linkedVocabulary: []
              });
              setTagInput("");
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add New Sentence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSentence ? "Edit Sentence" : "Add New Sentence"}</DialogTitle>
                <DialogDescription>
                  {editingSentence ? "Update the Korean sentence" : "Add a new Korean sentence with translations and details"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Korean Sentence */}
                <div className="space-y-2">
                  <Label htmlFor="korean">Korean Sentence *</Label>
                  <RichTextEditor
                    value={newSentence.korean}
                    onChange={(value) => setNewSentence({ ...newSentence, korean: value })}
                    placeholder="오늘 날씨가 정말 좋아요."
                  />
                </div>

                {/* English Translation */}
                <div className="space-y-2">
                  <Label htmlFor="english">English Translation *</Label>
                  <RichTextEditor
                    value={newSentence.english}
                    onChange={(value) => setNewSentence({ ...newSentence, english: value })}
                    placeholder="The weather is really nice today."
                  />
                </div>

                {/* Chinese Translation */}
                <div className="space-y-2">
                  <Label htmlFor="chinese">Chinese Translation (中文翻译)</Label>
                  <RichTextEditor
                    value={newSentence.chinese}
                    onChange={(value) => setNewSentence({ ...newSentence, chinese: value })}
                    placeholder="今天天气真好。"
                  />
                </div>

                {/* Grammar Points and Topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grammar">Grammar Points</Label>
                    <Input
                      id="grammar"
                      value={newSentence.grammarPoints}
                      onChange={(e) => setNewSentence({ ...newSentence, grammarPoints: e.target.value })}
                      placeholder="-이/가, -아/어요"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      value={newSentence.topic}
                      onChange={(e) => setNewSentence({ ...newSentence, topic: e.target.value })}
                      placeholder="weather, greeting, etc."
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={newSentence.category || ''} 
                    onValueChange={(value) => setNewSentence({ ...newSentence, category: value })}
                  >
                    <SelectTrigger className={!newSentence.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <Label>Difficulty Level: {newSentence.difficulty}/5</Label>
                  <Slider
                    value={[newSentence.difficulty]}
                    onValueChange={([value]) => setNewSentence({ ...newSentence, difficulty: value })}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSentence.notes}
                    onChange={(e) => setNewSentence({ ...newSentence, notes: e.target.value })}
                    placeholder="Additional context or usage notes..."
                    rows={2}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tag..."
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={newSentence.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (newSentence.tags.includes(tag)) {
                            handleRemoveTag(tag);
                          } else {
                            setNewSentence({ ...newSentence, tags: [...newSentence.tags, tag] });
                          }
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  {newSentence.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t">
                      {newSentence.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vocabulary Words Learned */}
                <div className="space-y-2">
                  <Label>Vocabulary Words Learned from this Sentence</Label>
                  <Input
                    value={vocabSearchQuery}
                    onChange={(e) => setVocabSearchQuery(e.target.value)}
                    placeholder="Search vocabulary to add..."
                    className="mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {filteredVocabWords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No vocabulary words that appear in or are taught by this sentence
                      </p>
                    ) : (
                      filteredVocabWords.map(word => (
                        <div
                          key={word.id}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            newSentence.linkedVocabulary.includes(word.id)
                              ? 'bg-primary/10 border border-primary'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => handleToggleVocabulary(word.id)}
                        >
                          <div>
                            <span className="font-medium">{word.word}</span>
                            <span className="text-sm text-muted-foreground ml-2">- {word.definition}</span>
                          </div>
                          {newSentence.linkedVocabulary.includes(word.id) && (
                            <Badge variant="default" className="text-xs">Linked</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSentence}>
                  {editingSentence ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sentences, tags..."
              className="pl-10"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* Sentences List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSentences.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No sentences yet</p>
                <p className="text-muted-foreground text-center mb-4">
                  Start adding Korean sentences to build your learning collection
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Sentence
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSentences.map(sentence => (
              <Card key={sentence.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-sm leading-relaxed line-clamp-2">
                        <span dangerouslySetInnerHTML={{ __html: sentence.korean }} />
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        <span dangerouslySetInnerHTML={{ __html: sentence.english }} />
                      </CardDescription>
                      {sentence.chinese && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          <span dangerouslySetInnerHTML={{ __html: sentence.chinese }} />
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSentence(sentence)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSentence(sentence.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {sentence.grammarPoints && (
                      <div>
                        <span className="text-muted-foreground">Grammar:</span>
                        <p className="font-medium">{sentence.grammarPoints}</p>
                      </div>
                    )}
                    {sentence.topic && (
                      <div>
                        <span className="text-muted-foreground">Topic:</span>
                        <p className="font-medium">{sentence.topic}</p>
                      </div>
                    )}
                    {sentence.category && (
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{sentence.category}</p>
                      </div>
                    )}
                    {sentence.topikLevel && (
                      <div>
                        <span className="text-muted-foreground">TOPIK:</span>
                        <p className="font-medium">{sentence.topikLevel}</p>
                      </div>
                    )}
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < sentence.difficulty ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Linked Vocabulary */}
                  {sentence.linkedVocabulary.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Linked Vocabulary:</p>
                      <div className="flex flex-wrap gap-1">
                        {getLinkedWords(sentence.linkedVocabulary).map(word => (
                          <Badge key={word.id} variant="secondary" className="text-xs px-2 py-0">
                            {word.word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {sentence.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sentence.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {sentence.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">{sentence.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sentences;
