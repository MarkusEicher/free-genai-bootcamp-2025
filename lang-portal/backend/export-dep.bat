@echo off
REM Export dependencies to requirements files

REM Create requirements files directly from Poetry
poetry export --format requirements.txt --output requirements.txt --without-hashes
poetry export --format requirements.txt --output requirements-dev.txt --with dev --without-hashes