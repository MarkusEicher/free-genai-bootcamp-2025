from fastapi import FastAPI, status, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.vocabulary import Vocabulary
from app.schemas.vocabulary import VocabularyCreate, VocabularyUpdate, VocabularyInDB
from app.api.v1.endpoints import languages, vocabulary_groups, progress, statistics

app = FastAPI(
    title="Language Learning Portal",
    description="Backend API for the Language Learning Portal",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(languages.router, prefix="/api/v1", tags=["languages"])
app.include_router(vocabulary_groups.router, prefix="/api/v1", tags=["vocabulary-groups"])
app.include_router(progress.router, prefix="/api/v1", tags=["progress"])
app.include_router(statistics.router, prefix="/api/v1", tags=["statistics"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0"
    }

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

@app.get("/vocabularies")
def get_vocabularies(db: Session = Depends(get_db)):
    return db.query(Vocabulary).all()

@app.post("/vocabularies/", response_model=VocabularyInDB)
def create_vocabulary(vocab: VocabularyCreate, db: Session = Depends(get_db)):
    db_vocab = Vocabulary(**vocab.model_dump())
    db.add(db_vocab)
    db.commit()
    db.refresh(db_vocab)
    return db_vocab

@app.get("/vocabularies/{vocab_id}", response_model=VocabularyInDB)
def read_vocabulary(vocab_id: int, db: Session = Depends(get_db)):
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocab

@app.put("/vocabularies/{vocab_id}", response_model=VocabularyInDB)
def update_vocabulary(vocab_id: int, vocab: VocabularyUpdate, db: Session = Depends(get_db)):
    db_vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if db_vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    for key, value in vocab.model_dump(exclude_unset=True).items():
        setattr(db_vocab, key, value)
    
    db.commit()
    db.refresh(db_vocab)
    return db_vocab

@app.delete("/vocabularies/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocabulary(vocab_id: int, db: Session = Depends(get_db)):
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    db.delete(vocab)
    db.commit()
    return None

@app.get("/vocabularies/search/", response_model=List[VocabularyInDB])
def search_vocabularies(
    query: str = Query(None, description="Search in words and translations"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    search = f"%{query}%" if query else None
    
    db_query = db.query(Vocabulary)
    
    if search:
        db_query = db_query.filter(
            (Vocabulary.word.ilike(search)) |
            (Vocabulary.translation.ilike(search))
        )
    
    total = db_query.count()
    vocabularies = db_query.offset(skip).limit(limit).all()
    
    return vocabularies

@app.get("/vocabularies/", response_model=List[VocabularyInDB])
def list_vocabularies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    vocabularies = db.query(Vocabulary).offset(skip).limit(limit).all()
    return vocabularies
