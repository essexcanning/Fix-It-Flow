import React, { useEffect, useState } from 'react';
import { AppState } from '../types';

interface MascotProps {
  appState: AppState;
  hasKey: boolean;
}

const MESSAGES = {
  NO_KEY: [
    "I need a key to start my engine!",
    "Insert Coin (API Key) to continue.",
    "My brain is locked. Key please?",
    "I promise I'm cheap. Just a little key?",
    "No key, no fix.",
    "Unlock me!",
    "I'm stuck in neutral without a key.",
    "Feed me an API key.",
    "I can't see anything without a key.",
    "Key required for magic."
  ],
  IDLE: [
    "Break something? Let's fix it!",
    "I'm bored. Break something.",
    "My wrench is twitching.",
    "Send me a photo of chaos.",
    "I eat entropy for breakfast.",
    "Is that a toaster or a spaceship? Upload it.",
    "I can fix anything except a broken heart.",
    "Upload the junk.",
    "I judge your broken items silently.",
    "Ready to repair.",
    "Awaiting visual input.",
    "Don't worry, I won't tell anyone you broke it.",
    "Let's see the damage.",
    "My visual cortex is ready.",
    "Show me the mess.",
    "I love the smell of broken electronics.",
    "Have you tried turning it off and on ag... oh wait.",
    "Give me the entropy.",
    "I am the manuals.",
    "Let's get greasy (metaphorically).",
    "Upload a photo. I dare you.",
    "Fix-It Flow is ready to flow.",
    "Do you have a permit for that broken thing?",
    "I've seen worse. Probably.",
    "Let's make it work again.",
    "Entropy is inevitable. Fixing is optional. Let's fix.",
    "Stand back, I'm going to try science.",
    "Upload. Analyze. Repair.",
    "Feed me data.",
    "I bet I know what's wrong with it.",
    "Is it supposed to smoke like that?",
    "Let's void some warranties.",
    "I solemnly swear I am up to repair.",
    "Got a flat? A bricked phone? A sad plant?",
    "I specialize in 'oops'.",
    "Show me what you got.",
    "My circuits are humming with anticipation.",
    "Waiting for the patient.",
    "The doctor is in.",
    "Let's play 'What's that rattle?'.",
    "I can't fix stupid, but I can fix objects.",
    "Bring me your tired, your poor, your broken toasters.",
    "I speak fluent 'Repair Manual'.",
    "Let's decipher the ancient texts of assembly.",
    "No job too big, no GPU too small.",
    "I am trained in 6 million forms of repair.",
    "Let's do this.",
    "Upload button is right there.",
    "Stop staring and start uploading.",
    "I don't have all day. Actually, I do. I am software."
  ],
  ANALYZING: [
    "Consulting the ghost of engineers past...",
    "Judging your DIY skills...",
    "Identifying the thingamajig...",
    "Translating 'weird noise' into Python...",
    "Locating the 10mm socket (it is missing)...",
    "Scanning for duct tape residue...",
    "Is that rust or aesthetic patina?",
    "Calculating the frustration coefficient...",
    "Zooming in on the thingamabob...",
    "Consulting the sacred texts of DIY...",
    "Parsing the geometry of failure...",
    "Hmm. Interesting design choice.",
    "Wait, is that supposed to bend that way?",
    "Running identification algorithms...",
    "Enhance. Enhance. Enhance.",
    "Comparing against 5 million coffee machines...",
    "It appears to be... broken.",
    "Analyzing material composition...",
    "Detecting high levels of 'oops'...",
    "Identifying the doohickey...",
    "Is this a torture device or a chair?",
    "Processing visual data...",
    "Decoding the matrix of this object...",
    "Wait, I've seen this on Reddit...",
    "Searching for the manufacturer's apology...",
    "Calculating repair probability...",
    "Identifying screw types...",
    "Looking for the reset button...",
    "Analyzing potential for explosion...",
    "It's not a bug, it's a feature. Just kidding, it's broken.",
    "Scanning for user error...",
    "Downloading schematic #49201...",
    "Consulting Nano Banana Pro...",
    "Asking Gemini 3 for a second opinion...",
    "Measuring the entropy...",
    "Determining the 'yeet' potential...",
    "Is this vintage or just old?",
    "Identifying the shiny bit...",
    "Calculating torque specs...",
    "Looking for the warranty void seal...",
    "Analyzing grease patterns...",
    "Scanning for magic smoke leakage...",
    "Computing...",
    "Thinking...",
    "Still looking...",
    "Almost got it...",
    "Hmm...",
    "Wait for it...",
    "Processing pixels...",
    "Running neural networks...",
    "Asking the cloud...",
    "Reading the manual (fast)..."
  ],
  GOAL_INPUT: [
    "What's the plan, boss?",
    "Do we fix it or Yeet it?",
    "What is the mission, commander?",
    "I can fix it, or I can make it look like modern art.",
    "Tell me your deepest repair desires.",
    "Reset? Repair? Recycle? Regret?",
    "Give me the objective.",
    "Shall we rebuild it?",
    "We have the technology. What do you want to do?",
    "Just tell me what to do.",
    "Fix it? Smash it? Sell it?",
    "Awaiting instructions.",
    "What is the end state?",
    "Do you want it to work, or just look cool?",
    "Ready for your command.",
    "Input goal.",
    "What's the diagnosis, doctor?",
    "How can I assist?",
    "Do you want the 5-minute fix or the right fix?",
    "Instructions unclear, please specify goal.",
    "I'm listening.",
    "Type it in.",
    "Don't be shy.",
    "I can help with that.",
    "Let's make a plan.",
    "What's the desired outcome?",
    "Do you want to restore it to glory?",
    "Quick patch or full overhaul?",
    "I'm ready when you are.",
    "Tell me what to write.",
    "I need a goal to function.",
    "Guide me.",
    "What's the dream?",
    "Make it new? Make it work? Make it stop burning?",
    "I am at your service.",
    "Goal please.",
    "What are we doing today?",
    "The keyboard is yours.",
    "Awaiting input...",
    "Type something...",
    "I'm waiting...",
    "Don't leave me hanging...",
    "I need direction.",
    "Help me help you.",
    "Let's get specific.",
    "Details, please.",
    "What's the vibe?",
    "Fix or feature?",
    "Restoration or destruction?",
    "I'm all ears (sensors)."
  ],
  PLANNING: [
    "Reading the entire internet for instructions...",
    "Drawing the diagrams (I am not a great artist, wait)...",
    "Convincing the pixels to cooperate...",
    "Applying physics engines to your broken item...",
    "Generating pixels... one... by... one...",
    "Trying to find a screwdriver in the cloud...",
    "Simulating 2K resolution reality...",
    "Consulting Nano Banana Pro...",
    "Compiling the wisdom of 1000 grandpas...",
    "Writing the manual that should have come in the box...",
    "Calculating optimal hammer trajectory...",
    "Rendering bolts...",
    "Polishing the pixels...",
    "Injecting photorealism...",
    "Thinking about glue...",
    "Generating helpful arrows...",
    "Composing the symphony of repair...",
    "Asking Gemini 3 to focus...",
    "Drawing hands is hard, give me a sec...",
    "Rendering step 1...",
    "Rendering step 2...",
    "Thinking about torque...",
    "Consulting the oracle of maintenance...",
    "Downloading patience...",
    "Creating the ultimate guide...",
    "Visualizing the fix...",
    "Synthesizing instructions...",
    "Making it look easy...",
    "Adding some industrial chic...",
    "Calibrating the 'Why'...",
    "Finding the right words...",
    "Generating safety warnings...",
    "Looking up the price of replacement parts just in case...",
    "Estimating time to fix...",
    "Consulting the DIY gods...",
    "Formatting the output...",
    "Applying the Banana theme...",
    "Almost there...",
    "Generating...",
    "Processing...",
    "Thinking hard...",
    "Using 100% of my brain...",
    "Heating up the GPU...",
    "Spinning the fans...",
    "Crunching numbers...",
    "Drawing lines...",
    "Adding shadows...",
    "Perfecting the lighting...",
    "Checking for errors...",
    "Validating physics..."
  ],
  RESULTS: [
    "Ta-da! 2K visual manual ready.",
    "Nailed it.",
    "Look at those pixels.",
    "Better than the factory manual.",
    "I am a genius. You are welcome.",
    "Now, go forth and tinker.",
    "It's dangerous to go alone! Take this.",
    "Repair complete (theoretically).",
    "Go fix it!",
    "I did my part. Now you do yours.",
    "Look at that resolution.",
    "Nano Banana Pro delivered.",
    "Masterpiece generated.",
    "It's beautiful.",
    "I hope you have a screwdriver.",
    "Don't blame me if you have leftover screws.",
    "Instruction unclear? No, it's perfect.",
    "You got this.",
    "Good luck.",
    "May the torque be with you.",
    "Fix it good.",
    "Download the PDF for posterity.",
    "Share it with your mom.",
    "I deserve a raise (in electricity).",
    "Next object, please.",
    "Wasn't that easy?",
    "Gemini 3 is powerful.",
    "Check out the 'Why' button.",
    "You can refine the steps if I missed something.",
    "Did I mention the 2K resolution?",
    "Crispy images.",
    "Industrial design at its finest.",
    "I fixed the manual, now you fix the thing.",
    "Teamwork.",
    "High five!",
    "Success.",
    "Mission accomplished.",
    "Here you go.",
    "Served hot.",
    "Fresh from the GPU.",
    "Enjoy.",
    "Don't electrocute yourself.",
    "Safety third.",
    "Just kidding, safety first.",
    "Read carefully.",
    "Follow the arrows.",
    "Look at the detail.",
    "Zoom in.",
    "Enhance complete.",
    "I am proud of this one."
  ]
};

const getRandomMessage = (category: keyof typeof MESSAGES) => {
  const list = MESSAGES[category];
  return list[Math.floor(Math.random() * list.length)];
};

export const Mascot: React.FC<MascotProps> = ({ appState, hasKey }) => {
  const [message, setMessage] = useState("Hi! I'm Nano.");
  const [isVisible, setIsVisible] = useState(false);

  // Show mascot after a short delay on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasKey) {
      setMessage(getRandomMessage('NO_KEY'));
      return;
    }

    // Initialize with a random message for the current state
    const category = appState as keyof typeof MESSAGES;
    setMessage(getRandomMessage(category));

    let intervalId: number | undefined;
    let delay = 5000;

    // Set rotation speed based on state
    switch (appState) {
      case AppState.IDLE:
        delay = 8000;
        break;
      case AppState.ANALYZING:
        delay = 2000;
        break;
      case AppState.GOAL_INPUT:
        delay = 10000;
        break;
      case AppState.PLANNING:
        delay = 2500;
        break;
      case AppState.RESULTS:
        delay = 10000;
        break;
    }

    intervalId = window.setInterval(() => {
      setMessage(getRandomMessage(category));
    }, delay);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [appState, hasKey]);

  return (
    <div 
      className={`fixed bottom-0 right-4 z-50 flex flex-col items-end transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* Speech Bubble */}
      <div 
        key={message} // Key change triggers animation
        className="mr-12 mb-2 relative animate-in zoom-in slide-in-from-bottom-4 duration-300 origin-bottom-right"
      > 
        <div className="bg-white border-2 border-black shadow-hard px-4 py-3 rounded-xl max-w-[200px] text-sm font-mono font-bold">
          {message}
        </div>
        {/* Bubble Tail */}
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-black rotate-45 transform"></div>
      </div>

      {/* Mascot Image */}
      <div className="w-32 h-32 md:w-40 md:h-40 relative group">
        <img 
            src="https://storage.googleapis.com/not-exists-placeholder/mascot.png" 
            onError={(e) => {
                e.currentTarget.onerror = null; 
                e.currentTarget.src = "https://img.icons8.com/color/480/bot.png"; // Fallback
            }}
            alt="Nano Banana Mascot" 
            className="w-full h-full object-contain drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform cursor-pointer"
            onClick={() => setMessage(getRandomMessage(appState as keyof typeof MESSAGES))}
        />
        {/* Click hint */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-1 font-mono whitespace-nowrap">
           CLICK ME
        </div>
      </div>
    </div>
  );
};