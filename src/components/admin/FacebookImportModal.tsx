import React, { useState } from 'react';
import { X, Loader2, Wand2 } from 'lucide-react';
import { formatFacebookPost } from '../../services/AIService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (article: any) => void;
}

export const FacebookImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!postText.trim()) return;
    setLoading(true);
    try {
      const article = await formatFacebookPost(postText);
      onImport(article);
      onClose();
    } catch (error) {
      alert('Failed to import article');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Import from Facebook</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          className="w-full h-64 p-4 border rounded-xl mb-4"
          placeholder="Paste Facebook post text here..."
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Wand2 size={20} /> Import</>}
        </button>
      </div>
    </div>
  );
};
