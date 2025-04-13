
import React, { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImageDebuggerProps {
  imageUrl: string;
  fallbackUrl?: string;
  label?: string;
}

export function ImageDebugger({ imageUrl, fallbackUrl, label = 'Image' }: ImageDebuggerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [fixedUrl, setFixedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setStatus('error');
      setErrorDetails('No image URL provided');
      return;
    }

    const checkImage = async () => {
      try {
        // Try to fetch the image with HEAD request
        const response = await fetch(imageUrl, { method: 'HEAD' });
        
        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorDetails(`HTTP status: ${response.status} ${response.statusText}`);
          
          // Try to fix the URL
          if (imageUrl.includes('storage/v1/object/public/')) {
            // It's a Supabase URL, try to fix it
            try {
              // Check if URL is using old format
              const urlParts = new URL(imageUrl);
              const pathParts = urlParts.pathname.split('/');
              const bucketIndex = pathParts.findIndex(part => 
                part === 'covers' || part === 'beats' || part === 'avatars');
              
              if (bucketIndex !== -1) {
                // Reconstruct the URL with the proper format
                const bucket = pathParts[bucketIndex];
                const filePath = pathParts.slice(bucketIndex + 1).join('/');
                const origin = window.location.origin;
                const newUrl = `${origin}/storage/v1/object/public/${bucket}/${filePath}`;
                
                setFixedUrl(newUrl);
              }
            } catch (error) {
              console.error('Error trying to fix URL:', error);
            }
          }
        }
      } catch (error) {
        setStatus('error');
        setErrorDetails(`Network error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    checkImage();
  }, [imageUrl]);

  if (status === 'loading') {
    return (
      <div className="text-sm text-muted-foreground">
        Checking {label.toLowerCase()} URL...
      </div>
    );
  }

  if (status === 'success') {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Image URL Valid</AlertTitle>
        <AlertDescription className="text-green-600">
          The {label.toLowerCase()} URL is valid and accessible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Image URL Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>The {label.toLowerCase()} URL could not be accessed: {errorDetails}</p>
        {fixedUrl && (
          <div className="mt-2">
            <p className="font-medium">Suggested fix:</p>
            <code className="text-xs bg-gray-100 p-1 rounded block overflow-x-auto">
              {fixedUrl}
            </code>
            <button 
              className="text-sm mt-2 bg-blue-500 text-white px-2 py-1 rounded"
              onClick={() => window.open(fixedUrl, '_blank')}
            >
              Test Fixed URL
            </button>
          </div>
        )}
        {fallbackUrl && (
          <div className="mt-2">
            <p className="font-medium">Fallback URL:</p>
            <code className="text-xs bg-gray-100 p-1 rounded block overflow-x-auto">
              {fallbackUrl}
            </code>
          </div>
        )}
        
        <div className="mt-2">
          <p className="font-medium">Original URL:</p>
          <code className="text-xs bg-gray-100 p-1 rounded block overflow-x-auto">
            {imageUrl}
          </code>
        </div>
      </AlertDescription>
    </Alert>
  );
}
