import os
from groq import Groq


def generate_cluster_label(file_texts):
    """
    Generates a concise, human-friendly semantic label for a group of files.
    
    Args:
        file_texts: dict of {filename: text_snippet}
                    e.g. {"dogs.txt": "Golden retrievers are friendly..."}
    
    Returns:
        An emoji-prefixed label like "🐕 Dog_Breeds"
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Naming Error: GROQ_API_KEY not found.")
        return _keyword_fallback(list(file_texts.keys()))

    client = Groq(api_key=api_key)
    GROQ_MODEL = "llama-3.3-70b-versatile"

    if not file_texts:
        return "📁 Empty_Cluster"

    # Build context from stored text snippets (no disk reads needed)
    context_samples = []
    for name, content in list(file_texts.items())[:5]:
        snippet = (content[:400] if content else "no content available")
        context_samples.append(f"File: {name}\nContent Snippet: {snippet}")

    context_str = "\n\n".join(context_samples)
    file_count = len(file_texts)

    prompt = f"""You must respond with ONLY a semantic folder name prefixed with a single relevant emoji.

Rules:
- Start with exactly ONE relevant emoji, then a space, then the name
- The name should be 1 to 3 words, joined by underscores
- Be SPECIFIC to the actual content theme, not just keywords
- Capture the PURPOSE or DOMAIN of the files
- NEVER use generic names like "Documents", "Files", "Mixed", "General", "Various"
- Use Title_Case with underscores after the emoji

Good examples: "🐕 Dog_Breeds", "📊 Data_Analysis", "🎓 Course_Notes", "💼 Resume", "🗄️ SQL_Fundamentals"

Files ({file_count} total):
{context_str}

Emoji + Semantic Folder Name:"""

    for attempt in range(3):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a file organization assistant. Output only emoji-prefixed folder names."},
                    {"role": "user", "content": prompt}
                ],
                model=GROQ_MODEL,
                temperature=0.1,
                max_tokens=25,
            )

            if chat_completion.choices and chat_completion.choices[0].message.content:
                label = chat_completion.choices[0].message.content.strip().strip("\"'`\n\r ")
                parts = label.split(" ", 1)
                if len(parts) == 2 and any(ord(c) > 127 for c in parts[0]):
                    emoji, text = parts[0], parts[1]
                else:
                    emoji, text = "", label

                text = text.replace(" ", "_")
                text = "".join(c for c in text if c.isalnum() or c in ("_", "-"))
                text = text[:30].strip("_-")

                label = f"{emoji} {text}" if emoji else text

                generic = {"Documents", "Files", "Mixed", "General", "Text_Files", "Various"}
                if text and text not in generic:
                    print(f"NAMING: Groq label -> {label}")
                    return label

            print("NAMING: Groq returned generic label, retrying...")
        except Exception as e:
            error_str = str(e)
            if "rate_limit" in error_str.lower() or "429" in error_str:
                if attempt < 2:
                    wait = (attempt + 1) * 2
                    print(f"NAMING: Rate limited ({attempt+1}/3), waiting {wait}s...")
                    import time
                    time.sleep(wait)
                else:
                    print("NAMING: API exhausted, using keyword fallback")
                    break
            else:
                print(f"NAMING: Error: {e}")
                break

    return _keyword_fallback(list(file_texts.keys()))


def _keyword_fallback(filenames):
    """Derive label from filenames when LLM is unavailable."""
    if not filenames:
        return "📁 Uncategorized"

    all_words = []
    for f in filenames[:10]:
        name = os.path.splitext(f)[0] if "." in f else f
        words = name.replace("-", "_").replace(" ", "_").split("_")
        words = [w.capitalize() for w in words if len(w) > 2 and w.isalpha()]
        all_words.extend(words)

    if not all_words:
        name = os.path.splitext(filenames[0])[0]
        label = "".join(c for c in name if c.isalnum() or c == "_")[:30].strip("_")
        return f"📄 {label}" if label else "📁 Uncategorized"

    from collections import Counter
    top_words = [w for w, _ in Counter(all_words).most_common(3)]
    return f"📂 {'_'.join(top_words)}"
