# <img src="frontend/public/favicon.svg" width="32" height="32" style="vertical-align: middle; margin-right: 8px;"> FileMind

### **"Files that understand themselves."**

FileMind is an AI-powered document intelligence system designed to move beyond traditional folder-based storage. It reads every word, maps meaning into high-dimensional vectors, and clusters your related files automatically. 

Whether you need to search semantically across your entire knowledge base or chat with your documents using RAG (Retrieval-Augmented Generation), FileMind provides a modern, visual, and intelligent workspace.

---

## ✨ Core Features

- 🧠 **Semantic Clustering**: Automatically groups files by topic and meaning, not just filenames.
- 💬 **Knowledge Assistant**: Advanced RAG-based chat that answers questions based on your indexed documents.
- 📊 **Visual Workspace**: Interactive Dendrogram visualization to explore the hierarchy and relationships of your knowledge base.
- 🔍 **Zero Folders**: No more manual sorting. AI understands the context and manages the relationships for you.
- 🔐 **Secure Authentication**: Hybrid login system with Supabase (Email/Password & Google OAuth).
- 🎨 **Artisanal UI**: A clean, "Ink & Sketch" aesthetic with full Dark/Light mode support and fluid animations.
- 📱 **Fully Responsive**: Optimized experience across all devices, from desktop to the smallest mobile screens.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS & Vanilla CSS (Arisanal Sketch theme)
- **Icons**: Lucide React
- **Auth**: Supabase Auth
- **Deployment**: Netlify

### **Backend**
- **Framework**: FastAPI (Python)
- **AI Models**: Google GenAI & Groq (for Embeddings and LLM responses)
- **Extraction**: PyPDF2 / PyMuPDF (PDF intelligence)
- **Storage**: JSON-based local embeddings storage with Supabase database integration.

---

## 📂 Project Structure

```bash
FileMind/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Branded UI and Dashboard components
│   │   ├── context/    # Auth and Theme state management
│   │   ├── pages/      # Landing, Login, Sign Up, Dashboard
│   │   └── styles/     # Global and component-specific CSS
│   └── public/         # Branded assets and favicon
├── backend/            # FastAPI (Python) server
│   ├── ai_engine.py    # LLM and RAG logic
│   ├── cluster_engine.py # Embedding and clustering algorithms
│   ├── main.py         # API Endpoints
│   └── storage.py      # File and metadata handling
└── README.md
```

---

## 🚀 Getting Started

### **1. Clone the repository**
```bash
git clone https://github.com/shashankpalingi/FileMind.git
cd FileMind
```

### **2. Setup Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
# Configure your .env with GOOGLE_API_KEY, GROQ_API_KEY, and SUPABASE_URL
python main.py
```

### **3. Setup Frontend**
```bash
cd frontend
npm install
# Configure your .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

---

## 🎨 Design Philosophy

FileMind uses a unique **"Sketch & Ink"** aesthetic. The design relies on:
- **Handwritten Fonts**: Cedarville Cursive and Kalam for a natural, organic feel.
- **Micro-animations**: Subtle floating and pulsing effects to make the interface feel "alive."
- **Visual Clarity**: Using SVGs and vector axes to represent the "geometry of meaning" behind your data.

---

### Developed by **Shashank Palingi**
*3rd Year Project — 2026*
