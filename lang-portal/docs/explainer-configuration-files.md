# Configuration Files Explanation

## Backend Configuration Files

### .env.example
- Template for environment variables
- Contains non-sensitive default values
- Used as reference to create actual .env file
- Includes database, API, and development settings

### alembic.ini
- Configuration for Alembic database migrations
- Defines database URL and migration settings
- Controls migration script locations
- Sets logging configuration for migrations

### pyproject.toml
- Project metadata and dependencies
- Build system requirements
- Development dependencies
- Tool configurations (pytest, black, etc.)

### .flake8
- Python code style checker configuration
- Line length settings
- Ignored rules
- File exclusions

### mypy.ini
- Python static type checker settings
- Type checking strictness level
- Import handling
- Custom type definitions

## Frontend Configuration Files

### .env.example
- Template for frontend environment variables
- API endpoint configurations
- Feature flags
- Development settings

### .eslintrc.json
- JavaScript/TypeScript linting rules
- Code style enforcement
- Plugin configurations
- Environment settings

### .prettierrc
- Code formatting rules
- Line length, quotes, spacing
- File type handling
- Integration with ESLint

### tailwind.config.js
- Tailwind CSS configuration
- Theme customization
- Plugin settings
- Content paths for purging

### postcss.config.js
- PostCSS plugin configuration
- CSS processing tools
- Tailwind CSS integration
- CSS optimization settings

## Root Level Configuration Files

### .editorconfig
- Cross-editor coding style definitions
- Ensures consistent coding styles
- Basic formatting rules
- Works across different IDEs

### docker-compose.yml
- Development environment configuration
- Service definitions
- Network settings
- Volume mappings

### .pre-commit-config.yaml
- Git pre-commit hook configuration
- Code formatting checks
- Linting rules
- Type checking before commits


## Initial content of these configuration files

### Backend Configuration Files

#### .env.example
```ini
# Database
DATABASE_URL=sqlite:///./app.db

# API
API_V1_STR=/api/v1
PROJECT_NAME=lang-portal

# Development
DEBUG=True
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

#### alembic.ini
```ini
[alembic]
script_location = alembic
sqlalchemy.url = sqlite:///./app.db
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

#### pyproject.toml
```toml
[tool.poetry]
name = "lang-portal"
version = "0.1.0"
description = "Language Learning Portal Backend"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.8"
fastapi = "^0.104.0"
uvicorn = "^0.24.0"
sqlalchemy = "^2.0.23"
alembic = "^1.12.1"
pydantic = "^2.4.2"
python-dotenv = "^1.0.0"

[tool.poetry.dev-dependencies]
pytest = "^7.4.3"
black = "^23.10.1"
flake8 = "^6.1.0"
mypy = "^1.6.1"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 88
target-version = ['py38']
include = '\.pyi?$'

[tool.mypy]
python_version = "3.8"
strict = true
```

#### .flake8
```ini
[flake8]
max-line-length = 88
extend-ignore = E203
exclude = .git,__pycache__,build,dist
per-file-ignores =
    __init__.py:F401
```

#### mypy.ini
```ini
[mypy]
python_version = 3.8
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_incomplete_defs = True
check_untyped_defs = True
disallow_untyped_decorators = True
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
warn_unreachable = True

[mypy.plugins.pydantic.*]
init_forbid_extra = True
init_typed = True
warn_required_dynamic_aliases = True
```

### Frontend Configuration Files

#### .env.example
```ini
VITE_API_URL=http://localhost:8000
VITE_API_VERSION=v1
```

#### .eslintrc.json
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": ["react", "@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // Add more shades as needed
        },
        // Add more color schemes as needed
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
```

#### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Root Level Configuration Files

#### .editorconfig
```ini
root = true

[*]
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
charset = utf-8

[*.{js,jsx,ts,tsx,css,json}]
indent_style = space
indent_size = 2

[*.{py}]
indent_style = space
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=sqlite:///./app.db
      - DEBUG=True
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
    command: npm run dev
```

#### .pre-commit-config.yaml
```yaml
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
    -   id: trailing-whitespace
    -   id: end-of-file-fixer
    -   id: check-yaml
    -   id: check-added-large-files

-   repo: https://github.com/psf/black
    rev: 23.10.1
    hooks:
    -   id: black

-   repo: https://github.com/pycqa/flake8
    rev: 6.1.0
    hooks:
    -   id: flake8
        additional_dependencies: [flake8-docstrings]

-   repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.6.1
    hooks:
    -   id: mypy
        additional_dependencies: [types-all]

-   repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.3
    hooks:
    -   id: prettier
        types_or: [javascript, jsx, ts, tsx, css, json]
```

