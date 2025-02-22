from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.language_pair import LanguagePair

router = APIRouter()

@router.delete("/{pair_id}")
def delete_language_pair(pair_id: int, db: Session = Depends(get_db)):
    db_pair = db.query(LanguagePair).filter(LanguagePair.id == pair_id).first()
    if not db_pair:
        raise HTTPException(status_code=404, detail="Language pair not found")
    
    db.delete(db_pair)
    db.commit()
    return {"ok": True}

@router.get("/")
async def get_language_pairs(db: Session = Depends(get_db)):
    """Get all available language pairs."""
    # Implementation here
    pass

@router.get("/{pair_id}")
async def get_language_pair(pair_id: int, db: Session = Depends(get_db)):
    """Get a specific language pair."""
    # Implementation here
    pass 