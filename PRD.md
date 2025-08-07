
# Product Requirements Document: Meedro WhiteBoard

## 1. Goal

The primary goal of Meedro WhiteBoard is to provide a dynamic, visual workspace designed for content creators, marketers, and creative agencies. The application aims to streamline the creative process by allowing users to aggregate various digital assets (videos, documents, social media content) on an infinite canvas. By integrating an AI assistant, Meedro helps users brainstorm, generate scripts, and summarize content, transforming disjointed information into actionable creative projects.

---

## 2. Planning

The development is planned in phased iterations to ensure a stable and scalable rollout.

*   **Phase 1: Core Functionality (Complete)**
    *   Develop the core whiteboard interface with an infinite, pannable, and zoomable canvas.
    *   Implement draggable and resizable "window" frames for content.
    *   Support embedding of various content types: YouTube (videos, playlists, channels), TikTok (profiles, reels), Instagram (profiles, reels), documents (PDF, DOCX, TXT), images, and general URLs.
    *   Integrate a contextual AI chatbot that can receive information from connected windows.
    *   Connect the AI chatbot to an external webhook (n8n) to process chat messages and context.

*   **Phase 2: Enhanced AI Capabilities**
    *   Implement dedicated Genkit flows for specific AI tasks (e.g., `summarizeYouTubeVideo`, `summarizeDocument`).
    *   Allow the AI Assistant to perform specific actions based on user commands, like summarizing a connected document or video.
    *   Introduce script generation based on multiple context sources (e.g., "Write a TikTok script based on this YouTube video and this PDF document").

*   **Phase 3: Collaboration & Sharing**
    *   Implement real-time multi-user collaboration, allowing several users to work on the same whiteboard simultaneously.
    *   Add user authentication and profiles.
    *   Introduce commenting features on windows.
    *   Enable sharing of whiteboards via a public link (read-only) or by inviting other users (edit access).

*   **Phase 4: Advanced Features & Monetization**
    *   Introduce premium features, such as advanced AI models, private team workspaces, and larger storage quotas.
    *   Develop subscription tiers for different levels of usage (e.g., Free, Pro, Agency).
    *   Implement a template library for common creative workflows (e.g., "Video Script Planner," "Marketing Campaign Board").

---

## 3. Requirements/System Components

### Functional Requirements:
*   **Whiteboard Canvas:** Users must be able to pan, zoom, and add content windows to the canvas.
*   **Content Windows:** Each window must be independently draggable, resizable, and deletable.
*   **Content Embedding:** The system must support embedding content from YouTube, TikTok, Instagram, websites, and handle uploads for documents and images.
*   **AI Assistant:** The AI chat window must be ableto send and receive messages.
*   **Context Management:** Users must be able to "connect" content windows to the AI assistant to provide context for prompts.

### Technical Components:
*   **Frontend:**
    *   **Framework:** Next.js with React (App Router)
    *   **Language:** TypeScript
    *   **Styling:** Tailwind CSS
    *   **UI Components:** ShadCN UI
*   **Backend / AI:**
    *   **AI Toolkit:** Genkit
    *   **AI Logic:** AI functionality is offloaded to an external service (n8n workflow) via webhook.
    *   **Deployment:** Firebase App Hosting
*   **Document Parsing:**
    *   PDFs are parsed using `pdfjs-dist`.
    *   Word documents (.docx) are parsed using `mammoth`.

---

## 4. Workflow

The primary user workflow is as follows:

1.  **Add Content:** The user adds various pieces of content to the whiteboard (e.g., a YouTube video, a competitor's Instagram reel, a PDF brief).
2.  **Organize:** The user arranges these windows on the canvas to create a visual overview of their project or idea.
3.  **Connect for Context:** The user connects relevant windows (e.g., the YouTube video and the PDF brief) to the AI Assistant window.
4.  **Interact with AI:** The user prompts the AI Assistant (e.g., "Summarize the attached video and create three key talking points based on the document.").
5.  **Process via Webhook:** The application sends the user's prompt and the content of the connected windows to the configured n8n webhook.
6.  **Generate Response:** The n8n workflow processes the information (using its own AI models) and generates a response.
7.  **Display Output:** The application receives the response from the webhook and displays it in the AI chat window.

---

## 5. Steps to Implement (Current State)

The implementation follows a component-based architecture.

1.  **`page.tsx` (Main Page):** Manages the state for all whiteboard items, zoom/pan controls, and handles the creation and deletion of windows.
2.  **`whiteboard-canvas.tsx`:** Renders the canvas, all the window frames, and the connection lines between them.
3.  **`sidebar.tsx`:** Provides the UI for adding new content windows of various types. It contains the dialogs for entering URLs or triggering file uploads.
4.  **`window-frame.tsx`:** A wrapper for each content item on the canvas. It handles dragging, resizing, and contains the window's header and controls.
5.  **Content-Specific Components (`youtube-embed.tsx`, `document-dropzone.tsx`, etc.):** These components are responsible for rendering the specific type of content within a window frame.
6.  **`ai-chat-window.tsx`:** Manages the chat interface. It gathers context from connected windows and calls the backend Genkit flow.
7.  **`generate-script-from-context.ts` (Genkit Flow):** This server-side flow acts as the bridge to the external webhook. It receives data from the chat window, makes a `POST` request to the n8n URL, and returns the response. It is designed to be independent of any specific AI provider within the webapp itself.
