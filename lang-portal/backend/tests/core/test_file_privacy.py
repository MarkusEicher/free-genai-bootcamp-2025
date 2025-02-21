"""Tests for file privacy and security features."""
import pytest
import os
import io
from PIL import Image
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile
from app.core.config import settings

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
def temp_upload_dir(tmp_path):
    """Create a temporary upload directory."""
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    return upload_dir

class TestFilePrivacy:
    def test_file_extension_validation(self, test_image, temp_upload_dir):
        """Test that only allowed file extensions are accepted."""
        # Test valid extensions
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        for ext in valid_extensions:
            file_path = temp_upload_dir / f"test{ext}"
            with open(file_path, 'wb') as f:
                f.write(test_image.getvalue())
            assert self._is_valid_extension(file_path)

        # Test invalid extensions
        invalid_extensions = ['.exe', '.php', '.js', '.html']
        for ext in invalid_extensions:
            file_path = temp_upload_dir / f"test{ext}"
            with open(file_path, 'wb') as f:
                f.write(test_image.getvalue())
            assert not self._is_valid_extension(file_path)

    def test_metadata_stripping(self, test_image):
        """Test that sensitive metadata is stripped from uploaded files."""
        # Save image with metadata
        img_with_metadata = Image.open(test_image)
        assert hasattr(img_with_metadata, '_getexif')
        exif_data = img_with_metadata._getexif()
        assert exif_data is not None

        # Strip metadata
        img_io = io.BytesIO()
        img_with_metadata.save(img_io, 'JPEG', exif=None)
        img_io.seek(0)

        # Verify metadata is removed
        img_stripped = Image.open(img_io)
        assert not hasattr(img_stripped, '_getexif') or img_stripped._getexif() is None

    def test_secure_file_paths(self, temp_upload_dir):
        """Test that file paths are secure and cannot be manipulated."""
        unsafe_paths = [
            "../test.jpg",
            "../../etc/passwd",
            "/etc/shadow",
            "test/../../etc/hosts",
            "test.jpg;rm -rf /",
            "test.jpg\x00.exe"
        ]

        for unsafe_path in unsafe_paths:
            assert not self._is_safe_path(temp_upload_dir, unsafe_path)

        safe_paths = [
            "test.jpg",
            "subfolder/test.jpg",
            "test_123.jpg",
            "test-file.jpg"
        ]

        for safe_path in safe_paths:
            assert self._is_safe_path(temp_upload_dir, safe_path)

    def test_secure_file_deletion(self, test_image, temp_upload_dir):
        """Test that files are securely deleted."""
        file_path = temp_upload_dir / "test.jpg"
        
        # Write test file
        with open(file_path, 'wb') as f:
            f.write(test_image.getvalue())
        
        # Verify file exists
        assert file_path.exists()
        
        # Securely delete file
        self._secure_delete(file_path)
        
        # Verify file is deleted
        assert not file_path.exists()
        
        # Verify no data remnants
        if file_path.exists():
            with open(file_path, 'rb') as f:
                content = f.read()
                assert content == b'' or all(b == 0 for b in content)

    def test_file_permissions(self, test_image, temp_upload_dir):
        """Test that uploaded files have correct permissions."""
        file_path = temp_upload_dir / "test.jpg"
        
        # Write test file
        with open(file_path, 'wb') as f:
            f.write(test_image.getvalue())
        
        # Set secure permissions
        os.chmod(file_path, 0o600)  # User read/write only
        
        # Verify permissions
        stat = os.stat(file_path)
        assert stat.st_mode & 0o777 == 0o600

    def test_concurrent_file_access(self, test_image, temp_upload_dir):
        """Test that concurrent file access is handled securely."""
        import threading
        import time
        
        file_path = temp_upload_dir / "test.jpg"
        access_count = 0
        lock = threading.Lock()
        
        def access_file():
            nonlocal access_count
            try:
                with lock:
                    with open(file_path, 'wb') as f:
                        f.write(test_image.getvalue())
                    time.sleep(0.1)  # Simulate processing
                    with open(file_path, 'rb') as f:
                        assert f.read() == test_image.getvalue()
                    access_count += 1
            except Exception as e:
                pytest.fail(f"Concurrent access failed: {e}")
        
        # Create multiple threads to access the file
        threads = []
        for _ in range(5):
            t = threading.Thread(target=access_file)
            threads.append(t)
            t.start()
        
        # Wait for all threads to complete
        for t in threads:
            t.join()
        
        assert access_count == 5  # All accesses successful

    @staticmethod
    def _is_valid_extension(file_path: Path) -> bool:
        """Check if file has an allowed extension."""
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
        return file_path.suffix.lower() in allowed_extensions

    @staticmethod
    def _is_safe_path(base_dir: Path, file_path: str) -> bool:
        """Check if file path is safe and within base directory."""
        try:
            full_path = (base_dir / file_path).resolve()
            return full_path.is_relative_to(base_dir) and '..' not in file_path
        except (ValueError, RuntimeError):
            return False

    @staticmethod
    def _secure_delete(file_path: Path) -> None:
        """Securely delete a file by overwriting with zeros."""
        if not file_path.exists():
            return

        # Get file size
        file_size = file_path.stat().st_size
        
        # Overwrite with zeros
        with open(file_path, 'wb') as f:
            f.write(b'\0' * file_size)
        
        # Delete the file
        file_path.unlink() 