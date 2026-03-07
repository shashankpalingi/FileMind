# FileMind: Files that understand themselves 🚀

<div align="center">
  <img src="project-screenshot.png" alt="FileMind Banner" width="100%">
  
  [![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Groq](https://img.shields.io/badge/Groq-Llama_3-f55036?logo=groq)](https://groq.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Netlify](https://img.shields.io/badge/Netlify-Frontend_Deploy-00AD9F?logo=netlify&logoColor=white)](https://www.netlify.com/)
  [![Lucide](https://img.shields.io/badge/Lucide-Icons-d7e0ff?logo=lucide)](https://lucide.dev/)

  ### [**探索 LIVE DEMO →**](https://filemind08.netlify.app/)
</div>

---

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

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend**: FastAPI (Python) + Supabase (Auth/DB)
- **AI/ML**: Groq (Llama 3) + Google GenAI (Embeddings)
- **Data**: PyPDF2 / PyMuPDF (PDF Processing) + JSON Vector Store

---

## 📂 Project Structure

```bash
FileMind/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Branded UI and Dashboard components
│   │   ├── context/    # Auth and Theme state management
│   │   ├── pages/      # Landing, Login, Sign Up, Dashboard
│   └── public/         # Branded assets and favicon
├── backend/            # FastAPI (Python) server
│   ├── ai_engine.py    # LLM and RAG logic
│   ├── cluster_engine.py # Embedding and clustering algorithms
│   ├── main.py         # API Endpoints
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
python main.py
```

### **3. Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

### Developed by **Shashank Palingi**
*3rd Year Project — 2026*
