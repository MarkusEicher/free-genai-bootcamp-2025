# Database Configuration

## Alembic Migration Tool

### Overview
Alembic is used for database migrations in our project. It:
- Tracks database schema changes
- Provides version control for database structure
- Allows rollback of changes
- Supports auto-generation of migrations

### Key Files
- `alembic.ini`: Main configuration file
- `migrations/env.py`: Environment configuration
- `migrations/versions/`: Contains migration files
- `migrations/script.py.mako`: Template for migrations

### Common Commands
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history --verbose
```

### Best Practices
1. Always review auto-generated migrations
2. Include meaningful descriptions
3. Test migrations before applying to production
4. Keep migrations atomic (one change per migration)
5. Back up database before applying migrations 