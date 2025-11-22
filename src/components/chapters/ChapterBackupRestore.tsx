import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
interface ChapterBackupRestoreProps {
  onRestore?: (data: Record<string, any>) => void;
}
const ChapterBackupRestore: React.FC<ChapterBackupRestoreProps> = ({
  onRestore
}) => {
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to backup chapters data to a JSON file
  const handleBackup = () => {
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
      const blob = new Blob([jsonString], {
        type: 'application/json'
      });
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

  // Function to handle file selection for restore
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        if (onRestore) {
          onRestore(data);
        } else {
          // Default restore behavior if no onRestore callback is provided
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
        }
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
  return <div className="flex gap-2">
      
      
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{
      display: 'none'
    }} />
    </div>;
};
export default ChapterBackupRestore;