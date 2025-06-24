
import React, { useRef, useState } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onError: (e: any) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onPlay,
  onPause,
  onEnded,
  onError
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      onEnded={onEnded}
      onPause={onPause}
      onPlay={onPlay}
      onError={onError}
      className="hidden"
    />
  );
};

export default AudioPlayer;
