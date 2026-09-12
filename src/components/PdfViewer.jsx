import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function PdfViewer({ url, darkMode }) {
  const [pdf, setPdf] = useState(null);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        // Load PDF document
        // Fetch as arrayBuffer first to bypass Range header CORS issues with Supabase
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const loadedPdf = await loadingTask.promise;
        if (active) {
          setPdf(loadedPdf);
          setPages(loadedPdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    loadPdf();
    return () => { active = false; };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-8 text-center">
        <p className="text-red-500 font-bold mb-2">Could not load PDF in custom viewer</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-primary">Open in Default Viewer</a>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full overflow-y-auto bg-gray-200 flex flex-col items-center p-4 gap-4"
      style={{ filter: darkMode ? 'invert(1) hue-rotate(180deg) brightness(95%)' : 'none', transition: 'filter 0.3s ease' }}
    >
      {Array.from({ length: pages }, (_, i) => (
        <PdfPage key={i} pdf={pdf} pageNumber={i + 1} />
      ))}
    </div>
  );
}

function PdfPage({ pdf, pageNumber }) {
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '500px 0px' } // Load slightly before it scrolls into view
    );
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // Render Page
  useEffect(() => {
    if (!isVisible || isRendered || !pdf) return;

    let renderTask;
    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 }); // Good resolution for reading
        const canvas = canvasRef.current;
        if (!canvas || !isMounted) return;

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        
        if (isMounted) setIsRendered(true);
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("PDF Render Error:", err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      renderTask?.cancel();
    };
  }, [isVisible, isRendered, pdf, pageNumber]);

  return (
    <canvas 
      ref={canvasRef} 
      className="max-w-full bg-white shadow-lg"
      style={{ minHeight: '800px', width: 'auto' }} // Placeholder height to make scrolling work before render
    />
  );
}
