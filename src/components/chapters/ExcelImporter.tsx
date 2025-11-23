import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createWords, fetchWordsByChapter } from '@/lib/database';
import * as XLSX from 'xlsx';
interface ExcelImporterProps {
  chapterId: string;
  chapterTitle: string;
  onImportComplete: (wordCount: number) => void;
}
interface WordData {
  word: string;
  definition: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  duplicate?: boolean;
}
interface ChapterData {
  title?: string;
  words?: Array<{
    id: string;
    word: string;
    definition: string;
    phonetic?: string;
    example?: string;
    notes?: string;
    isBookmarked: boolean;
  }>;
}
const ExcelImporter = ({
  chapterId,
  chapterTitle,
  onImportComplete
}: ExcelImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<WordData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    if (!selectedFile) {
      setFile(null);
      setPreviewData([]);
      return;
    }

    // Check if file is an Excel file
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      e.target.value = '';
      return;
    }
    setFile(selectedFile);
    parseExcelFile(selectedFile);
  };
  const parseExcelFile = async (excelFile: File) => {
    try {
      setIsUploading(true);
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      if (jsonData.length === 0) {
        setError('The Excel file is empty');
        setPreviewData([]);
        setIsUploading(false);
        return;
      }

      // Validate data structure
      const firstRow = jsonData[0];
      if (!firstRow.word || !firstRow.definition) {
        setError('Excel file must have "word" and "definition" columns');
        setPreviewData([]);
        setIsUploading(false);
        return;
      }

      // Map data to word format
      const words = jsonData.map((row, index) => ({
        id: `imported_${Date.now()}_${index}`,
        word: row.word?.toString() || '',
        definition: row.definition?.toString() || '',
        phonetic: row.phonetic?.toString() || '',
        example: row.example?.toString() || '',
        notes: row.notes?.toString() || '',
        isBookmarked: false
      })).filter(word => word.word && word.definition); // Filter out rows without word or definition

      if (words.length === 0) {
        setError('No valid words found in the Excel file');
        setPreviewData([]);
        setIsUploading(false);
        return;
      }

      // Check existing words in chapter for potential duplicates in preview
      try {
        const existingWords = await fetchWordsByChapter(chapterId);
        const previewWords = words.slice(0, 5).map(word => {
          const isDuplicate = existingWords.some(existingWord => existingWord.word.toLowerCase() === word.word.toLowerCase());
          return { ...word, duplicate: isDuplicate };
        });
        setPreviewData(previewWords);
      } catch (err) {
        console.error('Error checking for duplicates:', err);
        setPreviewData(words.slice(0, 5));
      }
      setIsUploading(false);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setError('Failed to parse Excel file. Please check the format.');
      setPreviewData([]);
      setIsUploading(false);
    }
  };
  const handleImport = async () => {
    if (!file || !chapterId) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          const words = jsonData.map((row, index) => ({
            id: `imported_${Date.now()}_${index}`,
            word: row.word?.toString() || '',
            definition: row.definition?.toString() || '',
            phonetic: row.phonetic?.toString() || '',
            example: row.example?.toString() || '',
            notes: row.notes?.toString() || '',
            isBookmarked: false
          })).filter(word => word.word && word.definition);

          const existingWords = await fetchWordsByChapter(chapterId);
          const duplicates: string[] = [];
          const uniqueWords = words.filter(newWord => {
            const isDuplicate = existingWords.some(existingWord => existingWord.word.toLowerCase() === newWord.word.toLowerCase());
            if (isDuplicate) {
              duplicates.push(newWord.word);
              return false;
            }
            return true;
          });

          const wordsToInsert = uniqueWords.map(w => ({
            chapter_id: chapterId,
            word: w.word,
            definition: w.definition,
            phonetic: w.phonetic,
            example: w.example,
            notes: w.notes,
            is_bookmarked: false,
            is_known: false,
            difficulty: 3,
            tags: [],
            priority: 3
          }));

          await createWords(wordsToInsert);

          if (duplicates.length > 0) {
            toast({
              title: 'Import Completed with Warnings',
              description: `${uniqueWords.length} words imported. ${duplicates.length} duplicates were skipped.`
            });
          } else {
            toast({
              title: 'Import Successful',
              description: `${uniqueWords.length} words were imported to "${chapterTitle}"`
            });
          }

          setFile(null);
          setPreviewData([]);
          onImportComplete(uniqueWords.length);
        } catch (err) {
          console.error('Error importing words:', err);
          toast({
            title: 'Import Failed',
            description: 'There was an error importing the words',
            variant: 'destructive'
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error importing words:', err);
      toast({
        title: 'Import Failed',
        description: 'There was an error importing the words',
        variant: 'destructive'
      });
    }
  };
  return <Card className="w-full">
      <CardHeader className="px-[157px]">IMPORT EXCEL FILE </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="flex-1" id="excel-import" />
          </div>
          
          {error && <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>}
          
          {previewData.length > 0 && <div className="border rounded-md p-4">
              <h4 className="font-medium mb-2">Preview (first 5 words)</h4>
              <div className="space-y-2">
                {previewData.map((item: any, idx) => <div key={idx} className={`flex flex-col p-2 rounded-sm ${item.duplicate ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <span className="font-medium">{item.word}</span>
                        {item.duplicate && <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Duplicate</span>}
                      </div>
                      <span className="text-gray-600">{item.phonetic}</span>
                    </div>
                    <span className="text-gray-700">{item.definition}</span>
                    {item.example && <span className="text-sm italic text-gray-600">"{item.example}"</span>}
                    {item.duplicate && <span className="text-xs text-red-600 mt-1">This word already exists in the chapter and will be skipped.</span>}
                  </div>)}
              </div>
              
              
            </div>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleImport} disabled={!file || isUploading || previewData.length === 0} className="w-full">
          {isUploading ? 'Processing...' : <>
              <Upload className="mr-2 h-4 w-4" />
              Import Words
            </>}
        </Button>
      </CardFooter>
    </Card>;
};
export default ExcelImporter;