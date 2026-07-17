import React from 'react';
import { MediaLibraryModal } from './MediaLibraryModal';

interface MediaPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({ onSelect, onClose }) => {
  return (
    <MediaLibraryModal 
      isOpen={true} 
      onClose={onClose} 
      onSelect={onSelect} 
    />
  );
};
