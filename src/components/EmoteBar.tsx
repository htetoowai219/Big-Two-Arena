import React from 'react';
import { Smile } from 'lucide-react';

interface EmoteBarProps {
  onSendEmote: (emote: string) => void;
}

const EMOTES = ['🔥', '😎', '🃏', '😱', '👏', '💨', '🎉', '💔'];

export const EmoteBar: React.FC<EmoteBarProps> = ({ onSendEmote }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-full border border-slate-800 shadow-md">
      <Smile className="w-3.5 h-3.5 text-slate-400 mr-0.5 ml-1" />
      {EMOTES.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSendEmote(emoji)}
          className="hover:scale-125 active:scale-95 text-base transition-transform px-1 py-0.5 rounded cursor-pointer select-none"
          title={`Send ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
