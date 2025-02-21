"""Secure file handling utilities for the application."""
import os
import io
import threading
from pathlib import Path
from typing import Set, Optional, Union, BinaryIO
from PIL import Image
from fastapi import UploadFile, HTTPException
from datetime import datetime
from app.core.config import settings

class SecureFileHandler:
    """Handles file operations with security and privacy in mind."""
    
    # Class-level lock for thread safety
    _file_lock = threading.Lock()
    
    # Allowed file extensions
    ALLOWED_IMAGE_EXTENSIONS: Set[str] = {'.jpg', '.jpeg', '.png', '.gif'}
    ALLOWED_DOCUMENT_EXTENSIONS: Set[str] = {'.pdf', '.txt', '.md'}
    ALLOWED_AUDIO_EXTENSIONS: Set[str] = {'.mp3', '.wav', '.ogg', '.m4a'}
    
    # File size limits (in bytes)
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    STORAGE_QUOTA: int = 20 * 1024 * 1024  # 20MB
    
    def __init__(self, base_dir: Union[str, Path]):
        """Initialize the file handler with a base directory."""
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        # Ensure base directory has secure permissions
        os.chmod(self.base_dir, 0o700)  # Owner read/write/execute only
    
    async def save_file(
        self,
        file: UploadFile,
        subdirectory: Optional[str] = None,
        strip_metadata: bool = True
    ) -> Path:
        """
        Securely save an uploaded file.
        
        Args:
            file: The uploaded file
            subdirectory: Optional subdirectory within base_dir
            strip_metadata: Whether to strip metadata from images
        
        Returns:
            Path to the saved file
        
        Raises:
            ValueError: If file type is not allowed or path is unsafe
            HTTPException: If file size exceeds limit or quota would be exceeded
        """
        # Validate file extension
        if not self._is_allowed_extension(file.filename):
            raise ValueError(f"File type not allowed: {file.filename}")
        
        # Check file size
        content = await file.read()
        if len(content) > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds limit of {self.MAX_FILE_SIZE // 1024 // 1024}MB"
            )
        
        # Check quota
        current_size = self._get_current_storage_size()
        if current_size + len(content) > self.STORAGE_QUOTA:
            raise HTTPException(
                status_code=413,
                detail=f"Storage quota of {self.STORAGE_QUOTA // 1024 // 1024}MB would be exceeded"
            )
        
        # Create secure filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        secure_filename = f"{timestamp}_{self._sanitize_filename(file.filename)}"
        
        # Get target directory
        target_dir = self.base_dir
        if subdirectory:
            target_dir = self.base_dir / subdirectory
            if not self._is_safe_path(target_dir):
                raise ValueError(f"Invalid subdirectory path: {subdirectory}")
            target_dir.mkdir(parents=True, exist_ok=True)
            os.chmod(target_dir, 0o700)
        
        file_path = target_dir / secure_filename
        
        # Save file with thread safety
        with self._file_lock:
            if strip_metadata:
                if self._is_image_file(file_path):
                    content = self._strip_image_metadata(content)
                elif self._is_audio_file(file_path):
                    content = self._strip_audio_metadata(content)
            
            with open(file_path, 'wb') as f:
                f.write(content)
            
            # Set secure file permissions
            os.chmod(file_path, 0o600)
        
        return file_path
    
    def get_quota_info(self) -> dict:
        """Get current storage quota information."""
        current_size = self._get_current_storage_size()
        return {
            "used_bytes": current_size,
            "total_bytes": self.STORAGE_QUOTA,
            "available_bytes": self.STORAGE_QUOTA - current_size,
            "used_percentage": (current_size / self.STORAGE_QUOTA) * 100
        }
    
    def _get_current_storage_size(self) -> int:
        """Calculate total size of all files in storage."""
        total_size = 0
        with self._file_lock:
            for path in self.base_dir.rglob("*"):
                if path.is_file():
                    total_size += path.stat().st_size
        return total_size
    
    def _is_allowed_extension(self, filename: str) -> bool:
        """Check if file has an allowed extension."""
        if not filename:
            return False
        ext = Path(filename).suffix.lower()
        return ext in (
            self.ALLOWED_IMAGE_EXTENSIONS |
            self.ALLOWED_DOCUMENT_EXTENSIONS |
            self.ALLOWED_AUDIO_EXTENSIONS
        )
    
    def _is_image_file(self, file_path: Path) -> bool:
        """Check if file is an image based on extension."""
        return file_path.suffix.lower() in self.ALLOWED_IMAGE_EXTENSIONS
    
    def _is_audio_file(self, file_path: Path) -> bool:
        """Check if file is an audio file based on extension."""
        return file_path.suffix.lower() in self.ALLOWED_AUDIO_EXTENSIONS
    
    def _is_safe_path(self, path: Union[str, Path]) -> bool:
        """
        Check if a path is safe and within base directory.
        
        Args:
            path: Path to check
        
        Returns:
            bool: True if path is safe
        """
        try:
            full_path = Path(path).resolve()
            return (
                full_path.is_relative_to(self.base_dir) and
                '..' not in str(path) and
                not any(part.startswith('.') for part in full_path.parts)
            )
        except (ValueError, RuntimeError):
            return False
    
    @staticmethod
    def _strip_image_metadata(image_data: bytes) -> bytes:
        """Strip metadata from image."""
        image = Image.open(io.BytesIO(image_data))
        output = io.BytesIO()
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Save without metadata
        image.save(
            output,
            format=image.format or 'JPEG',
            quality=95,
            optimize=True,
            exif=None,
            icc_profile=None
        )
        
        return output.getvalue()
    
    @staticmethod
    def _strip_audio_metadata(audio_data: bytes) -> bytes:
        """Strip metadata from audio file."""
        # For now, return the original data
        # TODO: Implement audio metadata stripping using mutagen or similar
        return audio_data
    
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Create a safe filename."""
        # Keep only alphanumeric chars, dash, underscore, and dot
        safe_chars = set("abcdefghijklmnopqrstuvwxyz"
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        "0123456789-_.")
        
        # Split extension
        name, ext = os.path.splitext(filename)
        
        # Sanitize name
        safe_name = ''.join(c for c in name if c in safe_chars)
        
        # Ensure safe length and return with extension
        return f"{safe_name[:50]}{ext.lower()}"
    
    def secure_delete(self, file_path: Union[str, Path]) -> None:
        """
        Securely delete a file by overwriting before deletion.
        
        Args:
            file_path: Path to the file to delete
        """
        file_path = Path(file_path)
        if not self._is_safe_path(file_path):
            raise ValueError(f"Invalid file path: {file_path}")
        
        with self._file_lock:
            if not file_path.exists():
                return
            
            # Get file size
            file_size = file_path.stat().st_size
            
            # Overwrite with zeros
            with open(file_path, 'wb') as f:
                f.write(b'\0' * file_size)
            
            # Delete the file
            file_path.unlink() 