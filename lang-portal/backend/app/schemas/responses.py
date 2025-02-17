from typing import TypeVar, Generic, Optional
from pydantic import BaseModel

T = TypeVar('T')

class BaseResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[dict] = None
    metadata: Optional[dict] = None

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None

class PaginationMetadata(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int