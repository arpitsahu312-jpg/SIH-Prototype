"""Build a local ChromaDB index from manuals/*.txt (run once, not part of FastAPI)."""

from __future__ import annotations

from pathlib import Path

from chromadb import PersistentClient
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parent
_EDGE_MANUALS = ROOT / "antarctic-edge-server" / "manuals"
MANUALS_DIR = _EDGE_MANUALS if _EDGE_MANUALS.is_dir() else ROOT / "manuals"
CHROMA_PATH = str(ROOT / "chroma_db")
COLLECTION_NAME = "manuals"
MODEL_NAME = "all-MiniLM-L6-v2"
CHUNK_WORDS = 300
OVERLAP_WORDS = 50


def chunk_words(text: str, chunk_size: int = CHUNK_WORDS, overlap: int = OVERLAP_WORDS) -> list[str]:
    words = text.split()
    if not words:
        return []

    chunks: list[str] = []
    step = max(chunk_size - overlap, 1)
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(words):
            break
        start += step
    return chunks


def main() -> None:
    if not MANUALS_DIR.is_dir():
        raise SystemExit(
            f"No '{MANUALS_DIR}' folder found. Create it and add .txt manuals, then re-run."
        )

    txt_files = sorted(MANUALS_DIR.glob("*.txt"))
    if not txt_files:
        raise SystemExit(f"No .txt files in '{MANUALS_DIR}'. Add manuals and re-run.")

    print(f"Loading embedding model '{MODEL_NAME}'...")
    model = SentenceTransformer(MODEL_NAME)

    print(f"Opening ChromaDB at '{CHROMA_PATH}'...")
    client = PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    files_processed = 0
    chunks_created = 0
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []
    embeddings: list[list[float]] = []

    for path in txt_files:
        text = path.read_text(encoding="utf-8")
        chunks = chunk_words(text)
        if not chunks:
            print(f"  skip {path.name} (empty)")
            continue

        vectors = model.encode(chunks, show_progress_bar=False).tolist()
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            ids.append(f"{path.name}::{idx}")
            documents.append(chunk)
            metadatas.append({"source": path.name, "chunk_index": idx})
            embeddings.append(vector)

        files_processed += 1
        chunks_created += len(chunks)
        print(f"  {path.name}: {len(chunks)} chunk(s)")

    if not documents:
        raise SystemExit("No chunks to index (all files were empty).")

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings,
    )

    print()
    print("Ingest complete.")
    print(f"  Files processed: {files_processed}")
    print(f"  Chunks created:  {chunks_created}")
    print(f"  ChromaDB collection: {COLLECTION_NAME}")
    print(f"  Persist path: {CHROMA_PATH}")


if __name__ == "__main__":
    main()
