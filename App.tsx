import React, { useState, useEffect, useRef } from 'react';
import { Step, AppState } from './types';
import { analyzeImage, generateGuideSteps, generateStepImage, checkApiKey, promptApiKey, searchForReplacement } from './services/geminiService';
import { Button } from './components/Button';
import { StepCard } from './components/StepCard';
import { Mascot } from './components/Mascot';
import { jsPDF } from "jspdf";

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string>("");
  const [userGoal, setUserGoal] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Buy New Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyInfo, setBuyInfo] = useState<{ summary: string, options: { retailer: string, product: string, price: string, url?: string }[], sources: { title: string, uri: string }[] } | null>(null);
  const [loadingBuyInfo, setLoadingBuyInfo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check key on mount
    checkApiKey().then(setHasKey);
  }, []);

  const handleConnect = async () => {
    try {
      await promptApiKey();
      const has = await checkApiKey();
      setHasKey(has);
    } catch (e) {
      console.error(e);
      setError("Failed to connect to AI Studio.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setAppState(AppState.ANALYZING);
      
      try {
        const analysis = await analyzeImage(base64);
        setObjectName(analysis.objectName);
        setAppState(AppState.GOAL_INPUT);
      } catch (err) {
        console.error(err);
        setError("Could not analyze image. Please try again.");
        setAppState(AppState.IDLE);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGoalSubmit = async () => {
    if (!uploadedImage || !userGoal) return;
    setAppState(AppState.PLANNING);
    
    try {
      const generatedSteps = await generateGuideSteps(uploadedImage, objectName, userGoal);
      setSteps(generatedSteps);
      setAppState(AppState.RESULTS);
      
      // Kick off image generation for each step
      generatedSteps.forEach(step => {
        triggerImageGeneration(step.id, step.visualPrompt);
      });
      
    } catch (err) {
      console.error(err);
      setError("Failed to generate instructions.");
      setAppState(AppState.GOAL_INPUT);
    }
  };

  const triggerImageGeneration = async (stepId: number, prompt: string) => {
    if (!uploadedImage) return;

    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, isGeneratingImage: true } : s));

    try {
      const imageUrl = await generateStepImage(uploadedImage, prompt);
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, imageUrl, isGeneratingImage: false } : s));
    } catch (err) {
      console.error(`Failed to generate image for step ${stepId}`, err);
      // Optional: Add error state to specific step
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, isGeneratingImage: false } : s));
    }
  };

  const handleRefine = (stepId: number, refinement: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    // Append refinement to the visual prompt
    const newVisualPrompt = `${step.visualPrompt}. Adjustment: ${refinement}`;
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, visualPrompt: newVisualPrompt } : s));
    triggerImageGeneration(stepId, newVisualPrompt);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setUploadedImage(null);
    setObjectName("");
    setUserGoal("");
    setSteps([]);
    setError(null);
    setBuyInfo(null);
    setShowBuyModal(false);
  };

  const handleBuyNew = async () => {
    setShowBuyModal(true);
    if (buyInfo) return; // Don't refetch if we already have it for this session

    setLoadingBuyInfo(true);
    try {
        const info = await searchForReplacement(objectName);
        setBuyInfo(info);
    } catch (e) {
        console.error("Failed to fetch buy info", e);
        setError("Could not check prices. Gemini might be busy.");
    } finally {
        setLoadingBuyInfo(false);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemWidth = container.firstElementChild?.clientWidth || 300;
      // Mobile gap is 16px (1rem), Desktop is 32px (2rem). 
      // Using a slightly larger scroll to ensure snap triggers comfortably.
      const gap = window.innerWidth >= 768 ? 32 : 16;
      const scrollAmount = direction === 'left' ? -(itemWidth + gap) : (itemWidth + gap);
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSharePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Styling Helpers
    const setBlack = () => doc.setTextColor(0, 0, 0);
    const setWhite = () => doc.setTextColor(255, 255, 255);
    const setBanana = () => doc.setFillColor(255, 215, 0); // Gold
    const setPink = () => doc.setFillColor(255, 105, 180); // Hot Pink
    const setOffWhite = () => doc.setFillColor(245, 245, 245);
    
    // Helper functions for drawing
    const setFill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b);
    
    // --- HEADER (Page 1) ---
    // Yellow Banner
    setBanana();
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(1.5);
    doc.line(0, 40, pageWidth, 40);

    // Title
    setBlack();
    doc.setFont("courier", "bold");
    doc.setFontSize(32);
    doc.text("FIX-IT FLOW", margin, 25);
    
    // Badge in Header
    setFill(255, 255, 255);
    doc.rect(pageWidth - margin - 80, 15, 80, 10, 'FD');
    doc.setFontSize(8);
    doc.text("POWERED BY GEMINI 3", pageWidth - margin - 40, 21, { align: "center" });

    // --- METADATA SECTION ---
    let yPos = 55;
    
    // SUBJECT CALCULATION
    doc.setFontSize(16);
    setBlack();
    const subjectLines = doc.splitTextToSize(objectName.toUpperCase(), contentWidth - 10);
    const subjectBoxHeight = Math.max(25, (subjectLines.length * 7) + 12);

    // Subject Box - Shadow effect
    setFill(0, 0, 0);
    doc.rect(margin + 2, yPos + 2, contentWidth, subjectBoxHeight, 'F'); 
    setFill(255, 255, 255);
    doc.rect(margin, yPos, contentWidth, subjectBoxHeight, 'FD');

    // "SUBJECT" Label
    setFill(0, 0, 0);
    doc.rect(margin, yPos - 3, 30, 6, 'F');
    setWhite();
    doc.setFontSize(8);
    doc.text("SUBJECT", margin + 15, yPos + 1, { align: "center" });

    // Subject Text
    setBlack();
    doc.setFontSize(16);
    doc.text(subjectLines, margin + 5, yPos + 16);
    
    yPos += subjectBoxHeight + 10;

    // MISSION CALCULATION
    doc.setFontSize(12);
    const missionLines = doc.splitTextToSize(userGoal.toUpperCase(), contentWidth - 10);
    const missionBoxHeight = Math.max(20, (missionLines.length * 6) + 12);

    // Mission Box - Shadow effect
    setFill(0, 0, 0);
    doc.rect(margin + 2, yPos + 2, contentWidth, missionBoxHeight, 'F');
    setFill(255, 255, 255);
    doc.rect(margin, yPos, contentWidth, missionBoxHeight, 'FD');
    
    // "MISSION" Label (Pink)
    setPink();
    doc.rect(margin, yPos - 3, 30, 6, 'FD');
    setBlack();
    doc.setFontSize(8);
    doc.text("MISSION", margin + 15, yPos + 1, { align: "center" });
    
    // Content
    doc.setFontSize(12);
    doc.text(missionLines, margin + 5, yPos + 13);
    
    yPos += missionBoxHeight + 15;
    
    // --- STEPS ---
    steps.forEach((step, index) => {
        const imgH = 80;
        const textH = 60; 
        const blockHeight = Math.max(imgH, textH) + 20;

        // Page break check
        if (yPos + blockHeight > pageHeight - 20) {
            doc.addPage();
            yPos = 30;
            
            // Mini Header
            setBanana();
            doc.rect(0, 0, pageWidth, 15, 'F');
            doc.setDrawColor(0);
            doc.line(0, 15, pageWidth, 15);
            setBlack();
            doc.setFontSize(10);
            doc.text(`FIX-IT FLOW // ${objectName.toUpperCase()}`, margin, 10);
        }

        // --- Step Header ---
        // Step Number Badge
        setFill(0, 0, 0);
        doc.rect(margin, yPos, 14, 14, 'F');
        setWhite();
        doc.setFontSize(12);
        doc.setFont("courier", "bold");
        doc.text((index + 1).toString(), margin + 7, yPos + 10, { align: "center" });
        
        // Title Strip
        setOffWhite();
        doc.rect(margin + 14, yPos, contentWidth - 14, 14, 'F');
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(margin + 14, yPos, contentWidth - 14, 14, 'S');

        setBlack();
        doc.setFontSize(12);
        doc.text(step.title.toUpperCase(), margin + 20, yPos + 9);
        
        yPos += 20;
        
        // --- Step Content ---
        const imageWidth = 90;
        let finalSectionHeight = 0;

        if (step.imageUrl) {
             try {
                 const imgProps = doc.getImageProperties(step.imageUrl);
                 const pdfImgHeight = (imgProps.height * imageWidth) / imgProps.width;
                 
                 // Image Shadow
                 setFill(0, 0, 0);
                 doc.rect(margin + 2, yPos + 2, imageWidth, pdfImgHeight, 'F');
                 
                 // Image Frame
                 doc.addImage(step.imageUrl, 'PNG', margin, yPos, imageWidth, pdfImgHeight);
                 doc.setDrawColor(0);
                 doc.setLineWidth(1);
                 doc.rect(margin, yPos, imageWidth, pdfImgHeight, 'S'); // Border
                 
                 finalSectionHeight = pdfImgHeight;

             } catch (e) {
                 finalSectionHeight = 20;
             }
        } else {
             finalSectionHeight = 0;
        }

        // Text Column
        const textX = margin + imageWidth + 10;
        const textW = contentWidth - imageWidth - 10;
        let textY = yPos;
        
        // Description
        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        setBlack();
        const descLines = doc.splitTextToSize(step.description, textW);
        doc.text(descLines, textX, textY + 5);
        
        textY += (descLines.length * 5) + 10;
        
        // Reasoning (Pink Box)
        const reasoningLines = doc.splitTextToSize(step.reasoning, textW - 6);
        const boxH = (reasoningLines.length * 4) + 12;
        
        // Pink Box Shadow
        setFill(0, 0, 0);
        doc.rect(textX + 1, textY + 1, textW, boxH, 'F');
        // Pink Box Main
        setPink();
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(textX, textY, textW, boxH, 'FD');
        
        // "WHY?" Label
        setBlack();
        doc.setFontSize(8);
        doc.setFont("courier", "bold");
        doc.text("GEMINI LOGIC:", textX + 3, textY + 6);
        
        doc.setFont("courier", "normal");
        doc.text(reasoningLines, textX + 3, textY + 12);
        
        textY += boxH;
        
        // Advance Y pos based on the taller of Image or Text
        yPos += Math.max(finalSectionHeight, textY - yPos) + 15;
    });
    
    // Page Numbers Footer
    // Using internal.pages.length - 1 to get page count safely in 2.5.1
    const pageCount = doc.internal.pages.length - 1;
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        setBlack();
        doc.text(`PAGE ${i} OF ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
        doc.text(`GENERATED BY NANO BANANA PRO`, margin, pageHeight - 10);
    }
    
    doc.save(`fix-it-flow-${objectName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#F0F0F0]">
        
        <div className="relative z-10 max-w-md w-full text-center space-y-6 md:space-y-8 bg-white p-6 md:p-10 border-4 border-black shadow-hard-xl">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-banana border-4 border-black mx-auto flex items-center justify-center text-black mb-4 md:mb-6 shadow-hard">
            <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black mb-4 uppercase italic">Fix-It Flow</h1>
            <p className="text-black font-mono border-y-2 border-black py-4 text-sm md:text-base">
              THE LIVING USER MANUAL.<br/>
              [POWERED BY GEMINI 3]
            </p>
          </div>
          <div className="pt-2">
             <Button onClick={handleConnect} className="w-full text-base md:text-lg">
               INSERT COIN (API KEY)
             </Button>
             <p className="mt-4 md:mt-6 text-[10px] md:text-xs text-gray-500 font-mono">
               * PAID G-CLOUD PROJECT REQUIRED FOR NANO BANANA PRO.
             </p>
          </div>
        </div>
        
        {/* Footer Badge for Landing Page */}
        <div className="absolute bottom-0 left-0 right-0 py-3 md:py-4 text-center bg-banana border-t-4 border-black">
          <p className="text-[10px] md:text-xs text-black uppercase tracking-widest font-black font-mono">
             Powered by the magical wizardry of Nano Banana Pro & Gemini 3
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen font-sans flex flex-col overflow-hidden relative">
      <Mascot appState={appState} hasKey={hasKey} />

      {/* Navbar */}
      <header className="h-16 md:h-24 bg-white border-b-4 border-black flex items-center px-4 md:px-8 justify-between z-40 sticky top-0 shadow-hard shrink-0">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={handleReset}>
          <div className="w-8 h-8 md:w-12 md:h-12 bg-banana border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
             <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <span className="font-black italic tracking-tighter text-xl md:text-3xl text-black uppercase">Fix-It Flow</span>
        </div>
        {uploadedImage && (
           <div className="hidden md:flex items-center gap-6 text-sm font-bold text-black bg-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             <span className="flex items-center gap-2 font-mono uppercase">
                <span className="w-3 h-3 bg-green-500 border border-black"></span>
                {objectName || "SCANNING..."}
             </span>
             {userGoal && <span className="border-l-2 border-black pl-6 uppercase">Obj: {userGoal}</span>}
           </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow relative flex flex-col p-2 md:p-4 overflow-hidden">
        
        {/* Error Banner */}
        {error && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-[90%] md:w-auto bg-hot-pink text-black px-4 md:px-6 py-3 md:py-4 border-4 border-black shadow-hard-lg z-50 flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <span className="font-bold font-mono uppercase text-xs md:text-base">ERROR: {error}</span>
            <button onClick={() => setError(null)} className="font-black hover:scale-125 transition-transform px-2">X</button>
          </div>
        )}
        
        {/* Buy New Modal */}
        {showBuyModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
             <div className="bg-white border-4 border-black p-4 md:p-8 w-full max-w-lg shadow-hard-xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="absolute top-2 right-2 md:-top-6 md:-right-6">
                    <button 
                        onClick={() => setShowBuyModal(false)} 
                        className="bg-hot-pink border-4 border-black w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-lg md:text-xl hover:scale-110 transition-transform shadow-hard"
                    >X</button>
                </div>
                
                <div className="text-center mb-4 md:mb-6 border-b-2 border-black pb-4 mt-2 md:mt-0">
                    <h2 className="text-xl md:text-3xl font-black uppercase italic bg-banana inline-block px-2 transform -rotate-2 border border-black shadow-[2px_2px_0px_0px_#000]">
                        Give up & Buy New?
                    </h2>
                </div>

                {loadingBuyInfo ? (
                   <div className="flex flex-col items-center justify-center py-8 gap-4">
                       <div className="text-4xl md:text-6xl animate-spin">🍌</div>
                       <p className="font-mono font-bold animate-pulse text-sm md:text-base">SCORING THE INTERNET...</p>
                       <span className="text-[10px] md:text-xs bg-black text-white px-2 py-1 font-mono">USING GOOGLE SEARCH GROUNDING</span>
                   </div>
                ) : buyInfo ? (
                   <div className="space-y-4">
                       <p className="font-mono font-bold text-sm md:text-lg mb-4 md:mb-6 leading-relaxed border-b-2 border-black pb-4">
                          {buyInfo.summary}
                       </p>
                       
                       <div className="space-y-3 mb-6">
                          {buyInfo.options.map((opt, i) => (
                              <a 
                                key={i} 
                                href={opt.url || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`block bg-off-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-colors gap-2 md:gap-0 ${!opt.url ? 'pointer-events-none' : 'cursor-pointer'}`}
                              >
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                      <div className="flex-1 pr-4">
                                          <div className="font-black text-[10px] md:text-xs uppercase bg-banana inline-block px-1 border border-black mb-1">{opt.retailer}</div>
                                          <div className="font-mono text-sm font-bold leading-tight group-hover:underline">{opt.product}</div>
                                      </div>
                                      <div className="font-black text-lg md:text-xl text-hot-pink whitespace-nowrap self-end md:self-center">{opt.price}</div>
                                  </div>
                              </a>
                          ))}
                       </div>
                       
                       {buyInfo.sources.length > 0 && (
                          <div className="mt-6">
                              <h4 className="font-black text-sm uppercase mb-2 border-b border-black inline-block">Sourced From:</h4>
                              <div className="flex flex-col gap-2">
                                  {buyInfo.sources.map((source, idx) => (
                                      <a 
                                        key={idx} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs font-mono bg-off-white border border-black p-2 hover:bg-hot-pink transition-colors truncate"
                                      >
                                          <span className="font-bold">[{idx+1}]</span>
                                          <span className="truncate underline">{source.title || source.uri}</span>
                                      </a>
                                  ))}
                              </div>
                          </div>
                       )}
                   </div>
                ) : (
                   <div className="text-center font-mono text-red-500">
                       Could not find pricing information. Try again later.
                   </div>
                )}
             </div>
           </div>
        )}

        {/* State: IDLE / Upload */}
        {appState === AppState.IDLE && (
          <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-xl bg-white border-4 border-black p-6 md:p-12 text-center hover:bg-yellow-50 transition-all cursor-pointer group shadow-hard-xl active:shadow-none active:translate-x-1 active:translate-y-1"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
              <div className="w-20 h-20 md:w-32 md:h-32 bg-banana border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:rotate-12 transition-transform text-black shadow-hard">
                <svg className="w-10 h-10 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-black mb-3 uppercase italic transform -rotate-2">Upload Junk</h2>
              <p className="text-black font-mono text-xs md:text-base font-bold bg-hot-pink inline-block px-2 border border-black">WE'LL FIX IT IN POST (LITERALLY)</p>
            </div>
          </div>
        )}

        {/* State: Analyzing */}
        {appState === AppState.ANALYZING && (
          <div className="flex-grow flex flex-col items-center justify-center p-6">
             <div className="flex flex-col items-center gap-8">
                <div className="w-48 h-48 relative border-4 border-black bg-black p-2 shadow-hard-lg rotate-3">
                   <img src={uploadedImage!} alt="Analyzing" className="w-full h-full object-cover grayscale opacity-80" />
                   <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>
                   {/* Scanning line effect */}
                   <div className="absolute top-0 left-0 right-0 h-2 bg-hot-pink border-y border-black animate-[scan_1.5s_ease-in-out_infinite]"></div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white border-2 border-black p-4 shadow-hard">
                   <div className="text-xl font-black text-black uppercase">Analyzing...</div>
                   <div className="text-sm text-black font-mono">IDENTIFYING ENTROPY LEVELS</div>
                </div>
             </div>
          </div>
        )}

        {/* State: Goal Input */}
        {appState === AppState.GOAL_INPUT && (
          <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 max-w-2xl mx-auto w-full">
            <div className="bg-white p-6 md:p-10 border-4 border-black w-full animate-in slide-in-from-bottom-12 duration-500 shadow-hard-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6 md:-ml-14">
                 <span className="bg-banana border-2 border-black text-black px-4 py-2 text-xs md:text-sm font-black uppercase shadow-hard transform -rotate-3 self-start md:self-auto">Identified</span>
                 <h2 className="text-2xl md:text-3xl font-black text-black uppercase underline decoration-4 decoration-hot-pink break-words w-full">{objectName}</h2>
              </div>
              
              <p className="text-black mb-6 md:mb-8 text-lg md:text-xl font-bold font-mono">So, what's the plan?</p>
              
              <div className="space-y-4 md:space-y-6">
                <input 
                  type="text" 
                  value={userGoal}
                  onChange={(e) => setUserGoal(e.target.value)}
                  placeholder="e.g. FIX THE FLAT, RESET IT..."
                  className="w-full bg-off-white border-4 border-black p-4 md:p-6 text-black placeholder:text-gray-400 focus:bg-white focus:outline-none focus:shadow-hard text-lg md:text-xl font-mono uppercase"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleGoalSubmit()}
                />
                <Button onClick={handleGoalSubmit} className="w-full text-lg md:text-xl py-4 md:py-6 uppercase tracking-widest" disabled={!userGoal}>
                  Generate Manual
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* State: Planning / Generating Text */}
        {appState === AppState.PLANNING && (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
            <div className="space-y-8">
               <div className="inline-flex gap-4 p-8 bg-white border-4 border-black shadow-hard-xl rotate-2">
                   <div className="w-6 h-6 bg-banana border-2 border-black animate-bounce"></div>
                   <div className="w-6 h-6 bg-hot-pink border-2 border-black animate-bounce" style={{animationDelay: '0.1s'}}></div>
                   <div className="w-6 h-6 bg-black animate-bounce" style={{animationDelay: '0.2s'}}></div>
               </div>
               <div className="bg-white border-2 border-black p-4 inline-block shadow-hard">
                  <h2 className="text-2xl md:text-3xl font-black text-black uppercase">Thinking...</h2>
                  <p className="text-black font-mono text-sm md:text-base">Gemini 3 is consulting the manual.</p>
               </div>
            </div>
          </div>
        )}

        {/* State: Results (Horizontal Scroll) */}
        {appState === AppState.RESULTS && (
           <div className="flex-grow flex flex-col overflow-hidden">
              <div 
                  ref={scrollContainerRef}
                  className="flex-grow flex items-center overflow-x-auto overflow-y-hidden px-4 md:px-16 py-6 md:py-12 gap-4 md:gap-8 no-scrollbar snap-x snap-mandatory pb-12 md:pb-20"
              >
                 {steps.map((step, idx) => (
                    <StepCard 
                      key={step.id} 
                      step={step} 
                      index={idx} 
                      onRegenerate={(id) => triggerImageGeneration(id, step.visualPrompt)}
                      onRefine={handleRefine}
                    />
                 ))}
                 
                 {/* End Card */}
                 <div className="flex-shrink-0 w-[90vw] md:w-[600px] h-full flex flex-col items-center justify-center bg-white border-4 border-black shadow-hard-lg snap-center text-center p-6 md:p-10 mx-2 md:mx-4 rotate-2">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-green-500 border-4 border-black rounded-full flex items-center justify-center mb-4 md:mb-6 text-black shadow-hard">
                       <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-black mb-2 uppercase italic">Mission Complete!</h3>
                    <p className="mb-6 text-black font-mono text-xs md:text-sm">Download your custom manual.</p>
                    
                    <div className="w-full space-y-3">
                        <Button variant="pink" onClick={handleSharePDF} className="w-full text-xs">
                          SHARE MANUAL (PDF)
                        </Button>
                        <Button variant="outline" onClick={handleBuyNew} className="w-full text-xs">
                           ERM... JUST BUY NEW?
                        </Button>
                        <Button variant="secondary" onClick={handleReset} className="w-full text-xs">
                          NEW FIX
                        </Button>
                    </div>
                 </div>
              </div>
              
              {/* Progress Indicators & Nav Buttons */}
              <div className="h-16 md:h-24 flex items-center px-4 md:px-12 border-t-4 border-black bg-white z-30 shrink-0 gap-4">
                 
                 {/* Navigation Controls Grouped Left */}
                 <div className="flex items-center gap-3 shrink-0">
                     <Button 
                       variant="outline" 
                       onClick={() => handleScroll('left')}
                       className="w-12 h-12 !px-0 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000] active:shadow-none bg-white hover:bg-off-white"
                       aria-label="Previous Step"
                     >
                       ←
                     </Button>

                     <Button 
                       variant="primary" 
                       onClick={() => handleScroll('right')}
                       className="w-12 h-12 !px-0 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000] active:shadow-none"
                       aria-label="Next Step"
                     >
                       →
                     </Button>
                 </div>
                 
                 {/* Centered Dots */}
                 <div className="flex-grow flex justify-center overflow-hidden">
                     <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar px-2 py-2">
                        {steps.map((_, idx) => (
                           <div key={idx} className="w-3 h-3 md:w-4 md:h-4 border-2 border-black bg-gray-200 shrink-0"></div>
                        ))}
                        {/* End card dot */}
                        <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-black bg-gray-200 shrink-0"></div>
                     </div>
                 </div>

                 {/* Spacer for Mascot (Right side) */}
                 <div className="w-12 md:w-24 shrink-0"></div>
              </div>
           </div>
        )}

      </main>

      {/* Footer Badge */}
      <div className="py-2 md:py-3 text-center bg-banana border-t-4 border-black shrink-0 relative z-30">
          <p className="text-[10px] md:text-xs text-black uppercase tracking-widest font-black font-mono">
             Powered by the magical wizardry of Nano Banana Pro & Gemini 3
          </p>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 1; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;