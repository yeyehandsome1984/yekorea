import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfThumbnailProps {
  url: string;
  className?: string;
}

export const PdfThumbnail = ({ url, className = '' }: PdfThumbnailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const renderPdf = async () => {
      if (!canvasRef.current) return;

      try {
        setLoading(true);
        setError(false);

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Set scale to fit the thumbnail area (128px height)
        const viewport = page.getViewport({ scale: 1 });
        const scale = 128 / viewport.height;
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError(true);
        setLoading(false);
      }
    };

    renderPdf();
  }, [url]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
        <FileText className="h-12 w-12 text-primary mb-2" />
        <span className="text-xs text-muted-foreground">PDF Certificate</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <FileText className="h-12 w-12 text-primary mb-2 animate-pulse" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};
