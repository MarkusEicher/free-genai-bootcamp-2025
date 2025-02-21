"""Tests for file privacy and security features."""
import pytest
import os
import io
import asyncio
from PIL import Image
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile
from app.core.file_handler import SecureFileHandler

@pytest.fixture
def test_image():
    """Create a test image with metadata."""
    img = Image.new('RGB', (100, 100), color='red')
    img_io = io.BytesIO()
    
    # Add EXIF metadata
    exif_data = {
        0x0110: 'Test Camera',  # Camera model
        0x927C: b'Test Location',  # MakerNote containing location
        0x9286: 'Test Comment',  # User Comment
        0x9003: datetime.now().strftime('%Y:%m:%d %H:%M:%S'),  # Original date
        0x8825: b'\x00\x00\x00\x00',  # GPS Info
    }
    
    img.save(img_io, 'JPEG', exif=exif_data)
    img_io.seek(0)
    return img_io

@pytest.fixture
def test_upload_file(test_image):
    """Create a FastAPI UploadFile object."""
    return UploadFile(
        filename="test.jpg",
        file=test_image,
        content_type="image/jpeg"
    )

@pytest.fixture
def file_handler(tmp_path):
    """Create a SecureFileHandler instance."""
    return SecureFileHandler(tmp_path / "uploads")

class TestFilePrivacy:
    @pytest.mark.asyncio
    async def test_file_extension_validation(self, file_handler, test_upload_file):
        """Test that only allowed file extensions are accepted."""
        # Test valid extensions
        for ext in ['.jpg', '.jpeg', '.png', '.gif']:
            test_upload_file.filename = f"test{ext}"
            saved_path = await file_handler.save_file(test_upload_file)
            assert saved_path.exists()
            assert saved_path.suffix.lower() == ext

        # Test invalid extensions
        for ext in ['.exe', '.php', '.js', '.html']:
            test_upload_file.filename = f"test{ext}"
            with pytest.raises(ValueError, match="File type not allowed"):
                await file_handler.save_file(test_upload_file)

    @pytest.mark.asyncio
    async def test_metadata_stripping(self, file_handler, test_upload_file):
        """Test that sensitive metadata is stripped from uploaded files."""
        # Save file with metadata stripping
        saved_path = await file_handler.save_file(test_upload_file, strip_metadata=True)
        
        # Verify metadata is removed
        with Image.open(saved_path) as img:
            assert not hasattr(img, '_getexif') or img._getexif() is None

        # Save file without metadata stripping
        saved_path = await file_handler.save_file(test_upload_file, strip_metadata=False)
        
        # Verify metadata is preserved
        with Image.open(saved_path) as img:
            assert hasattr(img, '_getexif')
            exif = img._getexif()
            assert exif is not None
            assert 0x0110 in exif  # Camera model should be present

    def test_secure_file_paths(self, file_handler):
        """Test that file paths are secure and cannot be manipulated."""
        unsafe_paths = [
            "../test.jpg",
            "../../etc/passwd",
            "/etc/shadow",
            "test/../../etc/hosts",
            "test.jpg;rm -rf /",
            "test.jpg\x00.exe",
            ".git/config",
            "..\\windows\\system32\\cmd.exe"
        ]

        for unsafe_path in unsafe_paths:
            assert not file_handler._is_safe_path(unsafe_path)

        safe_paths = [
            file_handler.base_dir / "test.jpg",
            file_handler.base_dir / "subfolder" / "test.jpg",
            file_handler.base_dir / "test_123.jpg",
            file_handler.base_dir / "test-file.jpg"
        ]

        for safe_path in safe_paths:
            assert file_handler._is_safe_path(safe_path)

    @pytest.mark.asyncio
    async def test_secure_file_deletion(self, file_handler, test_upload_file):
        """Test that files are securely deleted."""
        # Save file
        saved_path = await file_handler.save_file(test_upload_file)
        assert saved_path.exists()
        
        # Get file content for comparison
        with open(saved_path, 'rb') as f:
            original_content = f.read()
        
        # Securely delete file
        file_handler.secure_delete(saved_path)
        
        # Verify file is deleted
        assert not saved_path.exists()
        
        # If somehow file still exists, verify content is zeroed
        if saved_path.exists():
            with open(saved_path, 'rb') as f:
                content = f.read()
                assert content != original_content
                assert all(b == 0 for b in content)

    @pytest.mark.asyncio
    async def test_file_permissions(self, file_handler, test_upload_file):
        """Test that uploaded files have correct permissions."""
        # Save file
        saved_path = await file_handler.save_file(test_upload_file)
        
        # Verify directory permissions
        assert file_handler.base_dir.stat().st_mode & 0o777 == 0o700
        
        # Verify file permissions
        assert saved_path.stat().st_mode & 0o777 == 0o600

    @pytest.mark.asyncio
    async def test_concurrent_file_access(self, file_handler, test_upload_file):
        """Test that concurrent file access is handled securely."""
        async def save_file():
            try:
                saved_path = await file_handler.save_file(test_upload_file)
                assert saved_path.exists()
                return True
            except Exception as e:
                pytest.fail(f"Concurrent access failed: {e}")
                return False

        # Create multiple tasks
        tasks = [save_file() for _ in range(5)]
        
        # Run concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify all saves were successful
        assert all(results)

    @pytest.mark.asyncio
    async def test_filename_sanitization(self, file_handler, test_upload_file):
        """Test that filenames are properly sanitized."""
        unsafe_filenames = [
            "../../../../etc/passwd.jpg",
            "shell;command.jpg",
            "file with spaces.jpg",
            "file#with#symbols!@#$%^&*.jpg",
            "very" * 100 + ".jpg",  # Very long filename
        ]

        for unsafe_name in unsafe_filenames:
            test_upload_file.filename = unsafe_name
            saved_path = await file_handler.save_file(test_upload_file)
            
            # Check sanitized filename
            assert len(saved_path.name) <= 65  # timestamp(15) + underscore(1) + name(50) + ext
            assert all(c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_."
                      for c in saved_path.stem.split('_', 1)[1])  # Check after timestamp
            assert saved_path.suffix == '.jpg'

    @pytest.mark.asyncio
    async def test_subdirectory_handling(self, file_handler, test_upload_file):
        """Test handling of subdirectories."""
        # Test valid subdirectory
        saved_path = await file_handler.save_file(
            test_upload_file,
            subdirectory="valid_subdir"
        )
        assert saved_path.exists()
        assert saved_path.parent.name == "valid_subdir"
        assert saved_path.parent.stat().st_mode & 0o777 == 0o700

        # Test invalid subdirectory
        with pytest.raises(ValueError):
            await file_handler.save_file(
                test_upload_file,
                subdirectory="../invalid_subdir"
            ) 