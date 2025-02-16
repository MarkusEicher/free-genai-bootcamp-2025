@echo off
REM Export dependencies to requirements files

REM Create .in files from Poetry
poetry show --only main | findstr /R /C:".*" > requirements.in
poetry show | findstr /R /C:".*" > requirements-dev.in

REM Generate locked requirements files
pip-compile requirements.in > requirements.txt
pip-compile requirements-dev.in > requirements-dev.txt

REM Clean up .in files
del requirements.in requirements.dev.in 