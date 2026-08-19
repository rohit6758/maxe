import React from 'react';
import { X, Layers, Image as ImageIcon, Zap, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickScan() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col justify-between">
      
      {/* Background Image (Blurred Notes Placeholder) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600&h=800" 
          alt="Camera Preview" 
          className="w-full h-full object-cover opacity-80 mix-blend-luminosity blur-[2px]"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Top Controls */}
      <div className="relative z-10 flex justify-between items-center p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate(-1)} className="p-2 text-header hover:bg-white/10 rounded-full transition">
          <X size={24} />
        </button>
        <span className="text-header font-bold text-lg text-aberration">Exam Partner</span>
        <button className="p-2 text-header hover:bg-white/10 rounded-full transition">
          <Layers size={24} />
        </button>
      </div>

      {/* Camera Target Frame */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
        
        {/* Dynamic Text Prompt */}
        <div className="bg-black/70 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 mb-8 mt-[-100px]">
          <p className="text-header text-sm font-medium italic">Align your notes within the frame</p>
        </div>

        {/* Frame Markers */}
        <div className="relative w-full aspect-[3/4] max-h-[60vh] max-w-[300px]">
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />
          
          {/* Scan Line Animation (Optional detail) */}
          <div className="absolute top-[30%] left-0 w-full h-[1px] bg-primary/50 shadow-[0_0_8px_2px_rgba(79,93,83,0.5)] opacity-50" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 pb-[90px] pt-8 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center px-8">
        
        {/* Gallery Thumbnails */}
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-white/30">
            <img src="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=100&h=100" alt="Gallery" className="w-full h-full object-cover" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border border-black flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">2</span>
            </div>
          </div>
          <span className="text-[10px] text-body mt-1 font-medium">Gallery</span>
        </div>

        {/* Shutter Button */}
        <button className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center p-1 active:scale-95 transition-transform bg-black/30">
          <div className="w-full h-full bg-primary/40 rounded-full" />
        </button>

        {/* Flash Toggle */}
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-header hover:bg-white/10 transition">
            <Zap size={20} />
          </div>
          <span className="text-[10px] text-body mt-1 font-medium">Flash</span>
        </div>

      </div>

    </div>
  );
}
