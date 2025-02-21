"""Tests for file privacy and security features."""
import pytest
import os
import io
import asyncio
from PIL import Image
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile, HTTPException
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

@pytest.fixture
def test_audio():
    """Create a test audio file."""
    # Create a simple WAV file with 1 second of silence
    audio_data = bytes([
        # WAV header
        0x52, 0x49, 0x46, 0x46,  # "RIFF"
        0x24, 0x00, 0x00, 0x00,  # Chunk size
        0x57, 0x41, 0x56, 0x45,  # "WAVE"
        # Format chunk
        0x66, 0x6D, 0x74, 0x20,  # "fmt "
        0x10, 0x00, 0x00, 0x00,  # Chunk size
        0x01, 0x00,              # Audio format (PCM)
        0x01, 0x00,              # Num channels (1)
        0x44, 0xAC, 0x00, 0x00,  # Sample rate (44100)
        0x44, 0xAC, 0x00, 0x00,  # Byte rate
        0x01, 0x00,              # Block align
        0x08, 0x00,              # Bits per sample
        # Data chunk
        0x64, 0x61, 0x74, 0x61,  # "data"
        0x00, 0x00, 0x00, 0x00   # Chunk size
    ])
    return io.BytesIO(audio_data)

@pytest.fixture
def test_audio_file(test_audio):
    """Create a FastAPI UploadFile object for audio."""
    return UploadFile(
        filename="test.wav",
        file=test_audio,
        content_type="audio/wav"
    )

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

    @pytest.mark.asyncio
    async def test_audio_file_handling(self, file_handler, test_audio_file):
        """Test that audio files are handled correctly."""
        # Test valid audio extensions
        for ext in ['.mp3', '.wav', '.ogg', '.m4a']:
            test_audio_file.filename = f"test{ext}"
            saved_path = await file_handler.save_file(test_audio_file)
            assert saved_path.exists()
            assert saved_path.suffix.lower() == ext

    @pytest.mark.asyncio
    async def test_file_size_limit(self, file_handler, test_upload_file):
        """Test that files exceeding size limit are rejected."""
        # Create a large file
        large_data = b'0' * (file_handler.MAX_FILE_SIZE + 1)
        test_upload_file.file = io.BytesIO(large_data)
        
        with pytest.raises(HTTPException) as exc_info:
            await file_handler.save_file(test_upload_file)
        
        assert exc_info.value.status_code == 413
        assert "File size exceeds limit" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_storage_quota(self, file_handler, test_upload_file):
        """Test storage quota enforcement."""
        # Fill up storage to near quota
        large_data = b'0' * (file_handler.STORAGE_QUOTA - 1024)  # Leave 1KB free
        test_upload_file.file = io.BytesIO(large_data)
        saved_path = await file_handler.save_file(test_upload_file)
        
        # Try to save another file that would exceed quota
        test_upload_file.file = io.BytesIO(b'0' * 2048)  # 2KB file
        with pytest.raises(HTTPException) as exc_info:
            await file_handler.save_file(test_upload_file)
        
        assert exc_info.value.status_code == 413
        assert "Storage quota" in str(exc_info.value.detail)
        
        # Clean up
        file_handler.secure_delete(saved_path)

    def test_quota_info(self, file_handler, test_upload_file):
        """Test quota information reporting."""
        quota_info = file_handler.get_quota_info()
        
        assert quota_info["total_bytes"] == file_handler.STORAGE_QUOTA
        assert quota_info["used_bytes"] == 0
        assert quota_info["available_bytes"] == file_handler.STORAGE_QUOTA
        assert quota_info["used_percentage"] == 0

    @pytest.mark.asyncio
    async def test_quota_calculation(self, file_handler, test_upload_file):
        """Test that quota calculation is accurate."""
        # Save multiple files
        files = []
        file_size = 1024  # 1KB
        num_files = 5
        
        for i in range(num_files):
            test_upload_file.file = io.BytesIO(b'0' * file_size)
            saved_path = await file_handler.save_file(test_upload_file)
            files.append(saved_path)
        
        # Check quota info
        quota_info = file_handler.get_quota_info()
        assert quota_info["used_bytes"] == file_size * num_files
        assert quota_info["available_bytes"] == file_handler.STORAGE_QUOTA - (file_size * num_files)
        assert quota_info["used_percentage"] == (file_size * num_files / file_handler.STORAGE_QUOTA) * 100
        
        # Clean up
        for path in files:
            file_handler.secure_delete(path)

    @pytest.mark.asyncio
    async def test_quota_after_deletion(self, file_handler, test_upload_file):
        """Test that quota is updated after file deletion."""
        # Save a file
        test_upload_file.file = io.BytesIO(b'0' * 1024)
        saved_path = await file_handler.save_file(test_upload_file)
        
        # Check initial quota
        initial_quota = file_handler.get_quota_info()
        assert initial_quota["used_bytes"] == 1024
        
        # Delete the file
        file_handler.secure_delete(saved_path)
        
        # Check updated quota
        final_quota = file_handler.get_quota_info()
        assert final_quota["used_bytes"] == 0
        assert final_quota["used_percentage"] == 0 