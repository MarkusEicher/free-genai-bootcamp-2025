#!/bin/bash
# Export dependencies to requirements files

# Create .in files from Poetry
poetry show --only main | awk '{print $1 "==" $2}' > requirements.in
poetry show | awk '{print $1 "==" $2}' > requirements-dev.in

# Generate locked requirements files using Poetry to run pip-compile
poetry run pip-compile requirements.in > requirements.txt
poetry run pip-compile requirements-dev.in > requirements-dev.txt

# Clean up .in files
rm requirements.in requirements-dev.in 
