import React, { useState, ImgHTMLAttributes } from 'react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackSrc = '/api/placeholder/400/300',
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
    onError?.(event);
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(false);
    onLoad?.(event);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
};

export default ImageWithFallback;