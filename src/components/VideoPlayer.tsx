import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, RotateCcw, RotateCw, SkipBack, SkipForward, Star, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface VideoPlayerProps {
  url: string;
  thumbnail?: string;
  title: string;
  onRate?: (rating: number) => void;
  onComment?: (comment: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, thumbnail, title, onRate, onComment }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) videoRef.current.volume = value;
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRate = (rating: number) => {
    setUserRating(rating);
    if (onRate) onRate(rating);
  };

  const handleSubmitComment = () => {
    if (commentText.trim() && onComment) {
      onComment(commentText);
      setCommentText('');
    }
  };

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  return (
    <div className="space-y-6">
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black rounded-3xl overflow-hidden group shadow-2xl"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {isYouTube ? (
          <iframe
            src={url.replace('watch?v=', 'embed/')}
            className="w-full h-full border-0"
            allowFullScreen
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={url}
              poster={thumbnail}
              className="w-full h-full object-contain"
              onClick={togglePlay}
            />
            
            {/* Overlay Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-6"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-bold text-lg drop-shadow-md">{title}</h3>
                    <div className="relative">
                      <button 
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="p-2 text-white/80 hover:text-white transition-colors"
                      >
                        <Settings size={20} />
                      </button>
                      {showQualityMenu && (
                        <div className="absolute top-full right-0 mt-2 bg-slate-900/90 backdrop-blur-md rounded-xl p-2 border border-white/10 min-w-[120px] z-50">
                          {['2160p', '1080p', '720p', '480p'].map(q => (
                            <button
                              key={q}
                              onClick={() => { setQuality(q); setShowQualityMenu(false); }}
                              className={`w-full text-start px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${quality === q ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Progress Bar */}
                    <div className="relative group/progress h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-hidden">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                      />
                      <div 
                        className="h-full bg-blue-500 relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center gap-2 group/volume">
                          <button onClick={toggleMute} className="text-white">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-0 group-hover/volume:w-20 transition-all accent-white h-1"
                          />
                        </div>

                        <span className="text-white/80 text-xs font-mono">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
                          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center Play Button Overlay */}
            {!isPlaying && (
              <button 
                onClick={togglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-600/90 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-20"
              >
                <Play size={40} fill="currentColor" className="ml-1" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Interactions Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {isRtl ? 'تقييم الفيديو' : 'Rate this video'}
            </h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className={`transition-all ${star <= userRating ? 'text-yellow-400 scale-110' : 'text-slate-200 hover:text-yellow-200'}`}
                >
                  <Star size={24} fill={star <= userRating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg">
              <Star size={16} className="text-yellow-400" fill="currentColor" />
              <span className="text-slate-900">4.8</span>
              <span>(120 {isRtl ? 'تقييم' : 'ratings'})</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg">
              <MessageSquare size={16} className="text-blue-500" />
              <span className="text-slate-900">45</span>
              <span>{isRtl ? 'تعليق' : 'comments'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={16} />
            {isRtl ? 'التعليقات' : 'Comments'}
          </h4>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isRtl ? 'أضف تعليقك هنا...' : 'Write your comment...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {isRtl ? 'إرسال التعليق' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
