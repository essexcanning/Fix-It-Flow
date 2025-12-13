# 🍌 Fix-It Flow: The Living User Manual

**Powered by Gemini 3 & Nano Banana Pro**

Fix-It Flow is a React-based web application that generates bespoke, photorealistic 2K visual user manuals for literally anything. Simply upload a photo of a broken object, state your goal, and watch as AI generates a step-by-step guide tailored specifically to your item.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Gemini](https://img.shields.io/badge/AI-Gemini%203-hotpink)

## ✨ Features

-   **Visual Analysis**: Instantly identifies objects from uploaded photos using `gemini-3-pro-preview`.
-   **Custom Step Generation**: Creates logical, scientifically-backed repair steps based on your specific goal.
-   **Photorealistic Visuals**: Uses **Nano Banana Pro** (`gemini-3-pro-image-preview`) to generate 2K resolution instructional images that maintain the visual identity of your specific object using reference-based generation.
-   **Refinement Loop**: Users can "Adjust View" to refine image prompts (e.g., "Zoom in on the screw") or regenerate steps.
-   **Search Grounding**: Includes a "Give up & Buy New" feature that uses Google Search Grounding to find real-time pricing and retailers for replacements.
-   **PDF Export**: Compiles the generated guide into a professional-looking PDF manual.
-   **Interactive AR Overlay**: "Why?" mode reveals the logic behind each step with bounding box overlays.
-   **Mascot**: A chatty, context-aware mascot that reacts to the application state.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Tailwind CSS
-   **AI SDK**: Google GenAI SDK (`@google/genai`)
-   **Models Used**:
    -   `gemini-3-pro-preview`: Logic, reasoning, planning, and search.
    -   `gemini-3-pro-image-preview`: High-fidelity, reference-based image generation.
-   **Styling**: "Nano Banana" Aesthetic – Neo-brutalist, high contrast, pop colors.
-   **Utilities**: `jspdf` for document generation.

## 🚀 Getting Started

### Prerequisites

-   A paid Google Cloud Project with the Gemini API enabled (required for the image generation models).
-   Node.js (v18 or higher recommended).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/fix-it-flow.git
    cd fix-it-flow
    ```

2.  **Install dependencies**
    *Note: This project uses ES modules via CDN in the provided configuration, but standard npm install works if you migrate to a bundler like Vite.*

    If using a bundler:
    ```bash
    npm install
    ```

3.  **Run the application**
    ```bash
    npm start
    ```

### API Key Configuration

The application uses the Google AI Studio client library to securely handle API keys. When you launch the app, you will be prompted to "Insert Coin" (Select API Key) via the AI Studio overlay.

**Important**: You must select a key associated with a **paid GCP project** to access the `gemini-3-pro-image-preview` (Nano Banana Pro) model.

## 📖 Usage Guide

1.  **Upload**: Click the giant "Upload Junk" button and select an image of your broken item.
2.  **Verify**: The app will analyze the image. Confirm the object name.
3.  **Goal**: Type what you want to do (e.g., "Fix the wobble," "Replace the battery," "Turn it into a lamp").
4.  **Wait**: Gemini 3 plans the steps while Nano Banana Pro renders the visuals.
5.  **Interact**:
    -   **Why?**: Click to see reasoning and AR focus boxes.
    -   **Adjust View**: Click to refine the image generation prompt.
    -   **Retry**: Regenerate a specific step if it looks off.
6.  **Export**: Click "Share Manual (PDF)" to download your guide.

## 📂 Project Structure

```
/
├── components/          # UI Components
│   ├── StepCard.tsx     # Individual instruction card with logic
│   ├── Mascot.tsx       # Context-aware helper bot
│   └── ...
├── services/
│   └── geminiService.ts # All interactions with Google GenAI SDK
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main application logic
└── index.html           # Entry point & styles
```

## 🤖 AI Model Implementation Details

### Image Generation (Nano Banana Pro)
We use `gemini-3-pro-image-preview` with the `imageConfig` set to `2K` resolution. Critical to this workflow is passing the user's original uploaded image as an `inlineData` part alongside the text prompt. This ensures the generated instructional images look like the user's actual object, not a generic stock photo.

### Search Grounding
The "Buy New" feature utilizes the `googleSearch` tool within `gemini-3-pro-preview`. This allows the model to return structured JSON data containing real-time prices and retailer links, which are then rendered in a modal.

---

*Built with 🍌 and logic.*
