import React, { useEffect, useState } from 'react';
import { siteConfig } from '../../data/data';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

type SecureImageProps = {
  uuid: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
};

const SecureImage: React.FC<SecureImageProps> = ({ uuid, className, style, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      const authToken = localStorage.getItem('authToken');
      const csrfToken = localStorage.getItem('csrfToken');

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = authToken;
      if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;

      try {
        // Fetch the bitstream (could be image or pdf)
        const response = await fetch(`${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content`, {
          method: 'GET',
          headers,
        });
        if (!response.ok) throw new Error('Failed to fetch bitstream');
        const blob = await response.blob();

        if (blob.type === 'application/pdf') {
          // ✅ Render first page of PDF
          const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
          const page = await pdf.getPage(1);

          const scale = 2; // Higher = higher quality
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          // Convert canvas to Blob URL
          canvas.toBlob((imgBlob) => {
            if (imgBlob) {
              const url = URL.createObjectURL(imgBlob);
              setImageUrl(url);
            }
          }, 'image/png');
        } else {
          // ✅ Otherwise just display as image (jpg/png)
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Error loading secure image:', error);
      }
    };

    fetchAndRender();

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [uuid]);

  if (!imageUrl) return null;

  return <img src={imageUrl} className={className} style={style} alt={alt || 'Secure thumbnail'} />;
};

export default SecureImage;
