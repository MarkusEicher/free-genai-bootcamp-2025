from fastapi import FastAPI, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.vocabulary import Vocabulary

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
