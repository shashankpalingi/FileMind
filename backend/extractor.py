import fitz  # PyMuPDF
import os

def chunk_text(text, chunk_size=1000, overlap=200):
    """
    Splits text into chunks, attempting to keep sentences and paragraphs together.
    Uses character-based heuristic for semantic boundaries.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        # Initial end point
        end = min(start + chunk_size, text_len)
        
        # If we're not at the very end, try to find a better breakpoint
        if end < text_len:
            # Look for paragraph breaks, then sentence breaks, then space
            # Search backwards from the end up to the overlap amount
            search_area = text[max(start, end - 200):end]
            
            # 1. Paragraph (double newline)
            p_break = search_area.rfind("\n\n")
            if p_break != -1:
                end = max(start, end - 200) + p_break + 2
            else:
                # 2. Sentence or Line
                last_dot = search_area.rfind(". ")
                if last_dot != -1:
                    end = max(start, end - 200) + last_dot + 2
                else:
                    last_newline = search_area.rfind("\n")
                    if last_newline != -1:
                        end = max(start, end - 200) + last_newline + 1
                    else:
                        # 3. Last word
                        last_space = search_area.rfind(" ")
                        if last_space != -1:
                            end = max(start, end - 200) + last_space + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # Move forward, minus the overlap/residual
        start = end - overlap if end < text_len else text_len
        # Ensure we actually made progress
        if start >= end:
            start = end
            
    return chunks

def extract_metadata(file_path):
    """
    Extracts metadata for TXT and PDF files.
    """
    try:
        stats = os.stat(file_path)
        metadata = {
            "size": stats.st_size,
            "created": stats.st_ctime,
            "filename": os.path.basename(file_path)
        }

        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".txt":
            content = extract_txt(file_path)
            metadata["type"] = "txt"
            metadata["words"] = len(content.split()) if content else 0
        elif ext == ".pdf":
            doc = fitz.open(file_path)
            metadata["type"] = "pdf"
            metadata["pages"] = len(doc)
            
            # Extract basic title if exists
            metadata["title"] = doc.metadata.get("title") or os.path.basename(file_path)
            
            # Word count summary
            total_words = 0
            for page in doc:
                total_words += len(page.get_text().split())
            metadata["words"] = total_words
            doc.close()
        
        return metadata
    except Exception as e:
        print(f"Metadata Extraction Error for {file_path}: {e}")
        return {}

def extract_text(file_path):
    try:
        if not os.path.exists(file_path):
            return ""
            
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".txt":
            return extract_txt(file_path) or ""
        elif ext == ".pdf":
            return extract_pdf(file_path) or ""
        else:
            return ""
    except Exception:
        return ""


def extract_txt(path):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        print(f"Error reading txt {path}: {e}")
        return None


def extract_pdf(path):
    try:
        doc = fitz.open(path)
        text = ""
        for page in doc:
            # sort=True helps with multi-column PDFs often found in reports/records
            text += page.get_text(sort=True) + "\n\n"
        doc.close()
        return text
    except Exception as e:
        print(f"Error reading pdf {path}: {e}")
        return None
