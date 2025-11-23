import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createChapter, createWords } from '@/lib/database';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LocalStorageMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [migrationDetails, setMigrationDetails] = useState<string>('');
  const { toast } = useToast();

  const migrateData = async () => {
    setIsMigrating(true);
    setMigrationStatus('idle');
    setMigrationDetails('');

    try {
      // Get chapters from localStorage
      const chaptersJson = localStorage.getItem('lingualearn_chapters');
      if (!chaptersJson) {
        setMigrationStatus('error');
        setMigrationDetails('No chapters found in localStorage');
        toast({
          title: "No Data Found",
          description: "No chapters found in localStorage to migrate.",
          variant: "destructive"
        });
        setIsMigrating(false);
        return;
      }

      const localChapters = JSON.parse(chaptersJson);
      
      if (!Array.isArray(localChapters) || localChapters.length === 0) {
        setMigrationStatus('error');
        setMigrationDetails('No valid chapters found');
        toast({
          title: "No Data Found",
          description: "No valid chapters found to migrate.",
          variant: "destructive"
        });
        setIsMigrating(false);
        return;
      }

      let migratedChapters = 0;
      let migratedWords = 0;

      // Migrate each chapter
      for (const localChapter of localChapters) {
        try {
          // Create chapter in database
          const newChapter = await createChapter(
            localChapter.title,
            localChapter.description || ''
          );
          migratedChapters++;

          // Get words for this chapter from localStorage
          const wordsJson = localStorage.getItem(`chapter_${localChapter.id}`);
          if (wordsJson) {
            const localWords = JSON.parse(wordsJson);
            
            if (Array.isArray(localWords) && localWords.length > 0) {
              // Transform words to match database schema
              const wordsToInsert = localWords.map((word: any) => ({
                chapter_id: newChapter.id,
                word: word.word || '',
                definition: word.definition || '',
                phonetic: word.phonetic || '',
                example: word.example || '',
                notes: word.notes || '',
                is_bookmarked: word.isBookmarked || false,
                is_known: word.isKnown || false,
                difficulty: word.difficulty || 3,
                topik_level: word.topikLevel || null,
                tags: word.tags || [],
                priority: word.priority || 3
              }));

              // Insert all words for this chapter
              await createWords(wordsToInsert);
              migratedWords += wordsToInsert.length;
            }
          }
        } catch (error) {
          console.error(`Error migrating chapter ${localChapter.title}:`, error);
        }
      }

      setMigrationStatus('success');
      setMigrationDetails(`Migrated ${migratedChapters} chapters and ${migratedWords} words`);
      
      toast({
        title: "Migration Successful",
        description: `Successfully migrated ${migratedChapters} chapters and ${migratedWords} words to the cloud database.`
      });

    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      setMigrationDetails(error instanceof Error ? error.message : 'Unknown error occurred');
      
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Migrate Local Data to Cloud</CardTitle>
        <CardDescription>
          This will copy your chapters and words from browser storage to the shared cloud database.
          This is a one-time migration and won't affect your local data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {migrationStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {migrationDetails}
            </AlertDescription>
          </Alert>
        )}

        {migrationStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {migrationDetails}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={migrateData} 
          disabled={isMigrating || migrationStatus === 'success'}
          className="w-full"
          size="lg"
        >
          {isMigrating ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Migrating...
            </>
          ) : migrationStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Migration Complete
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Start Migration
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          After migration, all users will see the same chapters across all devices.
        </p>
      </CardContent>
    </Card>
  );
};

export default LocalStorageMigration;
