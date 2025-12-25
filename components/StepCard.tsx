import React, { useState, useRef } from 'react';
import { Step } from '../types';
import { Button } from './Button';
import { getRefinementSuggestions } from '../services/geminiService';

interface StepCardProps {
  step: Step;
  onRegenerate: (stepId: number) => void;
  onRefine: (stepId: number, prompt: string) => void;
  index: number;
}

export const StepCard: React.FC<StepCardProps> = ({ step, onRegenerate, onRefine, index }) => {
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  
  // Suggestion state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Randomize rotation slightly for the "messy polaroid" look, but stable based on index
  const rotation = index % 2 === 0 ? 'rotate-1' : '-rotate-1';

  const handleOpenRefine = async () => {
    setIsRefining(true);
    setRefinePrompt("");
    setSuggestions([]);
    
    if (step.imageUrl) {
      setIsLoadingSuggestions(true);
      try {
        const chips = await getRefinementSuggestions(step.imageUrl, step.description);
        setSuggestions(chips);
      } catch (e) {
        console.error("Could not fetch suggestions", e);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }
  };

  const handleChipClick = (chip: string) => {
    const newText = refinePrompt.trim() ? `${refinePrompt.trim()} ${chip}` : chip;
    setRefinePrompt(newText);
    
    // Focus textarea after click so user can type immediately
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newText.length, newText.length);
        }
    }, 10);
  };

  const handleRefineSubmit = () => {
    if (refinePrompt.trim()) {
      onRefine(step.id, refinePrompt);
      setIsRefining(false);
      setRefinePrompt("");
    }
  };

  // Safe destructuring with fallback for focusBox
  const [ymin, xmin, ymax, xmax] = step.focusBox && step.focusBox.length === 4 
    ? step.focusBox 
    : [20, 20, 80, 80];

  return (
    <div 
        className={`flex-shrink-0 w-[90vw] md:w-[600px] h-full flex flex-col bg-white border-2 border-black shadow-hard-lg snap-center relative group overflow-hidden transition-transform duration-300 hover:rotate-0 hover:z-10 ${rotation}`}
    >
      <style>{`
        @keyframes progress-loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        @keyframes stripe-move {
          0% { background-position: 0 0; }
          100% { background-position: 20px 20px; }
        }
      `}</style>

      {/* Header */}
      <div className="p-3 md:p-4 border-b-2 border-black flex justify-between items-center bg-banana flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 border-2 border-black bg-white text-black font-black font-mono text-sm md:text-lg shadow-[2px_2px_0px_0px_#000]">
            {index + 1}
          </span>
          <h3 className="font-bold text-sm md:text-lg text-black font-mono tracking-tight uppercase truncate max-w-[140px] md:max-w-[200px]">{step.title}</h3>
        </div>
        
        {/* Gemini 3 Reasoning Toggle - Neo Pop Pink */}
        <button 
          onClick={() => setShowReasoning(!showReasoning)}
          className={`px-2 md:px-3 py-1 md:py-1.5 border-2 border-black text-[10px] md:text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
            showReasoning 
            ? 'bg-hot-pink text-black' 
            : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          {showReasoning ? 'HIDE LOGIC' : 'WHY?'}
        </button>
      </div>

      {/* Image Area - Changed min-h to min-h-0 to allow shrinking if text needs space */}
      <div className="relative flex-grow flex-shrink bg-white flex items-center justify-center overflow-hidden min-h-0 group border-b-2 border-black">
        {step.imageUrl ? (
          <img 
            src={step.imageUrl} 
            alt={step.title} 
            className="w-full h-full object-contain p-4 md:p-8 mix-blend-multiply" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center w-full h-full bg-[#fcfcfc]">
            {/* Neo-Pop Loading State */}
            <div className="relative mb-8">
                <div className="text-4xl md:text-6xl animate-spin drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{animationDuration: '3s'}}>
                  🍌
                </div>
            </div>
            
            <div className="w-32 md:w-48 h-6 md:h-8 border-4 border-black bg-white relative mb-4 shadow-hard overflow-hidden">
                <div 
                    className="h-full bg-hot-pink border-r-4 border-black" 
                    style={{
                        animation: 'progress-loading 2.5s ease-in-out infinite'
                    }}
                ></div>
                {/* Stripe Pattern Overlay */}
                <div className="absolute inset-0 w-full h-full opacity-20" style={{
                    backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)',
                    backgroundSize: '10px 10px'
                }}></div>
            </div>

            <p className="text-black font-black font-mono text-sm md:text-lg uppercase animate-pulse tracking-widest">
              RENDERING 2K...
            </p>
            
            <div className="mt-4 flex gap-2">
                 <span className="text-[8px] md:text-[10px] font-bold bg-banana border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_#000] rotate-[-2deg]">
                    NANO BANANA PRO
                 </span>
                 <span className="text-[8px] md:text-[10px] font-bold bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_#000] rotate-[2deg]">
                    GEMINI 3
                 </span>
            </div>
          </div>
        )}
        
        {/* Loading Overlay (Regenerating) */}
        {step.isGeneratingImage && step.imageUrl && (
             <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-[2px]">
                <div className="bg-white p-6 border-4 border-black shadow-hard-lg flex flex-col items-center gap-4 rotate-2 animate-in fade-in zoom-in duration-200">
                    <div className="text-4xl animate-spin" style={{animationDuration: '2s'}}>🍌</div>
                    <div className="w-32 h-4 border-2 border-black bg-white relative overflow-hidden">
                        <div className="h-full bg-banana animate-[progress-loading_1.5s_linear_infinite]"></div>
                    </div>
                    <span className="text-black font-black font-mono text-xs bg-hot-pink px-2 py-1 border-2 border-black -rotate-2">
                        REFINING PIXELS...
                    </span>
                </div>
             </div>
        )}
        
        {/* Reasoning AR Overlay */}
        {showReasoning && !step.isGeneratingImage && step.imageUrl && (
          <div className="absolute inset-0 z-10 pointer-events-none animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>
             
             {/* Bounding Box - Hot Pink */}
             <div 
               className="absolute border-4 border-hot-pink shadow-[0_0_0_2px_black]"
               style={{
                 top: `${ymin}%`,
                 left: `${xmin}%`,
                 height: `${ymax - ymin}%`,
                 width: `${xmax - xmin}%`,
               }}
             >
                {/* Corner Markers */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-black"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-black"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black"></div>
             </div>
             
             {/* Reasoning Bubble */}
             <div 
                className="absolute"
                style={{
                  top: `${ymax}%`,
                  left: `${Math.max(0, Math.min(60, xmin))}%`, 
                }}
             >
                <div className="mt-6 ml-6 bg-white border-2 border-black p-2 md:p-4 max-w-[200px] md:max-w-xs shadow-hard relative">
                   {/* Connector */}
                   <div className="absolute -top-4 -left-0 w-1 h-6 bg-black"></div>
                   <div className="absolute -top-4 -left-0 w-6 h-1 bg-black"></div>
                   
                   <div className="flex items-center gap-2 mb-2 bg-hot-pink border border-black inline-block px-2 py-0.5 transform -rotate-2">
                      <span className="text-[10px] md:text-xs font-black text-black uppercase">GEMINI 3 LOGIC</span>
                   </div>
                   <p className="text-xs md:text-sm text-black font-mono leading-tight">
                     {step.reasoning}
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Adjust View Button (Always visible on mobile, Hover on Desktop) */}
        {!isRefining && !showReasoning && !step.isGeneratingImage && step.imageUrl && (
          <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <div className="relative group/adjust">
                <Button 
                  variant="secondary" 
                  onClick={handleOpenRefine}
                  className="text-[10px] md:text-xs py-1.5 md:py-2"
                >
                  ADJUST VIEW
                </Button>
                {/* Tooltip */}
                <div className="hidden md:block absolute top-full right-0 mt-2 px-2 py-1 bg-black text-white text-[10px] font-mono font-bold whitespace-nowrap opacity-0 group-hover/adjust:opacity-100 transition-opacity pointer-events-none shadow-[2px_2px_0px_0px_#fff] z-50">
                    Fine-tune this step's image
                </div>
            </div>
          </div>
        )}

        {/* Refine Overlay */}
        {isRefining && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 md:p-8 z-20 animate-in fade-in duration-200">
            <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between items-end border-b-2 border-black pb-2">
                  <h4 className="text-black font-black font-mono text-base md:text-lg uppercase">Refine Visuals</h4>
                  <span className="text-[10px] md:text-xs text-black font-bold bg-banana border border-black px-2 py-1 shadow-[2px_2px_0px_0px_#000]">AI TIPS</span>
              </div>
              
              {/* Quick Chips Area */}
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {isLoadingSuggestions ? (
                    <div className="text-xs font-mono animate-pulse">Scanning with Gemini...</div>
                ) : (
                    suggestions.map((chip, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleChipClick(chip)}
                            className="bg-white text-black hover:bg-hot-pink border border-black px-2 py-1 md:px-3 md:py-1 text-[10px] md:text-xs font-bold font-mono transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                        >
                            {chip}
                        </button>
                    ))
                )}
                {!isLoadingSuggestions && suggestions.length === 0 && (
                    <span className="text-xs text-gray-500 font-mono italic">No tips. DIY mode.</span>
                )}
              </div>

              <textarea
                ref={textareaRef}
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="e.g. ZOOM IN ON SCREW..."
                className="w-full bg-off-white border-2 border-black p-4 text-black font-mono focus:bg-white focus:outline-none focus:shadow-hard text-sm h-24 md:h-32 resize-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end w-full">
                <Button variant="outline" onClick={() => setIsRefining(false)} className="text-xs">
                  CANCEL
                </Button>
                <Button variant="primary" onClick={handleRefineSubmit} disabled={!refinePrompt.trim()} className="text-xs">
                  UPDATE
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description & Action - Changed to flex-shrink-0 to prioritize text visibility */}
      <div className="p-4 md:p-6 bg-white flex-shrink-0 flex flex-col justify-between">
        <p className="text-black font-medium text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-mono">
          {step.description}
        </p>
        
        <div className="flex justify-between items-center pt-4 border-t-2 border-black border-dashed">
           <div className="text-[10px] md:text-xs font-mono text-gray-500 w-1/2 truncate uppercase">
              PROMPT: {step.visualPrompt}
           </div>
           
           <div className="relative group/retry">
               <Button 
                 variant="outline" 
                 onClick={() => onRegenerate(step.id)}
                 isLoading={step.isGeneratingImage}
                 className="text-[10px] md:text-xs py-1.5 md:py-2 px-3 md:px-4"
               >
                 RETRY
               </Button>
               {/* Tooltip */}
               <div className="hidden md:block absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-[10px] font-mono font-bold whitespace-nowrap opacity-0 group-hover/retry:opacity-100 transition-opacity pointer-events-none shadow-[2px_2px_0px_0px_#000] z-50">
                    Re-generate this step's image
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};