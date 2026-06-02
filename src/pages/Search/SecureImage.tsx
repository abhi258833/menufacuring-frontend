import React, { useEffect, useState } from 'react';
import { siteConfig } from '../../data/data';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

type SecureImageProps = {
  uuid?: string;
  srcPath?: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
};

const SecureImage: React.FC<SecureImageProps> = ({ uuid, srcPath, className, style, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid && !srcPath) {
      setImageUrl(null);
      return;
    }

    let objectUrl: string | null = null;

    const fetchAndRender = async () => {
      const authToken = localStorage.getItem('authToken');
      const csrfToken = localStorage.getItem('csrfToken');

      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;

      try {
        const requestUrl = srcPath
          ? `${siteConfig.apiEndpoint}${srcPath}`
          : `${siteConfig.apiEndpoint}/api/core/bitstreams/${uuid}/content`;

        const response = await fetch(requestUrl, {
          method: 'GET',
          headers,
        });
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();

        if (blob.type === 'application/pdf') {
          const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
          const page = await pdf.getPage(1);

          const scale = 2;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          canvas.toBlob((imgBlob) => {
            if (imgBlob) {
              objectUrl = URL.createObjectURL(imgBlob);
              setImageUrl(objectUrl);
            }
          }, 'image/png');
        } else {
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        }
      } catch (error) {
        console.error('Error loading secure image:', error);
        setImageUrl(null);
      }
    };

    fetchAndRender();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [srcPath, uuid]);

  if (!imageUrl) return null;

  return <img src={imageUrl} className={className} style={style} alt={alt || 'Secure thumbnail'} />;
};

export default SecureImage;
