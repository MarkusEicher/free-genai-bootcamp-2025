from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect

class Base(DeclarativeBase):
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
    
    def __init__(self, *args, **kwargs):
        """Initialize model with validation."""
        mapper = inspect(self.__class__)
        required_cols = [col.key for col in mapper.columns 
                        if not col.nullable and not col.default and not col.server_default]
        
        for col in required_cols:
            if col not in kwargs and col != 'id':
                raise ValueError(f"Missing required field: {col}")
        
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def __str__(self) -> str:
        """String representation of the model."""
        return f"{self.__class__.__name__}(id={getattr(self, 'id', None)})"
    
    def __repr__(self) -> str:
        """Detailed string representation of the model."""
        mapper = inspect(self.__class__)
        attrs = [f"{key}={repr(getattr(self, key))}" 
                for key in mapper.columns.keys()]
        return f"{self.__class__.__name__}({', '.join(attrs)})"
    
    def __eq__(self, other) -> bool:
        """Equality comparison."""
        if not isinstance(other, self.__class__):
            return False
        mapper = inspect(self.__class__)
        for key in mapper.columns.keys():
            if getattr(self, key) != getattr(other, key):
                return False
        return True
    
    def to_dict(self) -> dict:
        """Convert model instance to dictionary."""
        mapper = inspect(self.__class__)
        return {key: getattr(self, key) 
                for key in mapper.columns.keys()}