from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Float
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.base_class import Base
from app.models.associations import vocabulary_group_association

class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, nullable=False)
    translation = Column(String, nullable=False)
    language_pair_id = Column(
        Integer,
        ForeignKey("language_pairs.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    language_pair = relationship("LanguagePair", back_populates="vocabularies")
    groups = relationship(
        "VocabularyGroup",
        secondary=vocabulary_group_association,
        back_populates="vocabularies"
    )
    session_attempts = relationship("SessionAttempt", back_populates="vocabulary")
    
    # Define both sides of the relationship here
    progress = relationship(
        "VocabularyProgress",
        backref=backref("vocabulary", uselist=False),
        uselist=False,
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint('word', 'language_pair_id', name='uix_word_language_pair'),
    )

    @property
    def success_rate(self) -> float:
        """Calculate overall success rate across all attempts."""
        attempts = self.session_attempts
        if not attempts:
            return 0.0
        correct_count = sum(1 for a in attempts if a.is_correct)
        return round(correct_count / len(attempts), 3)

    @property
    def mastery_level(self) -> float:
        """Calculate mastery level based on recent performance and attempt count."""
        attempts = self.session_attempts
        if not attempts:
            return 0.0
        
        # Sort attempts by date
        recent_attempts = sorted(attempts, key=lambda x: x.created_at, reverse=True)[:10]
        if not recent_attempts:
            return 0.0
        
        # Recent performance weighted more heavily
        recent_success = sum(1 for a in recent_attempts if a.is_correct) / len(recent_attempts)
        
        # Overall success rate
        total_success = self.success_rate
        
        # Attempt count factor (max out at 50 attempts)
        attempt_factor = min(len(attempts) / 50, 1.0)
        
        # Weighted combination
        return round((0.7 * recent_success + 0.3 * total_success) * attempt_factor, 3)