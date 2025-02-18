#!/bin/bash

# Create new test directory structure
mkdir -p test/{api/v1/{activity,dashboard,language,progress,statistics,vocabulary},core/{auth,cache,config,logging},db/{migrations,models,seeders},integration/{flows,api},services/{activity,language,progress,vocabulary},utils/{fixtures,mocks,helpers}}

# Move API tests
mv tests/test_api/test_activities.py test/api/v1/activity/test_activities_api.py
mv tests/test_api/test_dashboard.py test/api/v1/dashboard/test_dashboard_api.py
mv tests/test_api/test_languages.py test/api/v1/language/test_languages_api.py
mv tests/test_api/test_progress.py test/api/v1/progress/test_progress_api.py
mv tests/test_api/test_statistics.py test/api/v1/statistics/test_statistics_api.py
mv tests/test_api/test_vocabulary.py test/api/v1/vocabulary/test_vocabulary_api.py
mv tests/test_api/test_vocabulary_groups.py test/api/v1/vocabulary/test_vocabulary_groups_api.py

# Move core tests
mv tests/test_core/test_cache.py test/core/cache/test_cache.py
mv tests/test_core/test_config.py test/core/config/test_config.py
mv tests/test_core/test_logging.py test/core/logging/test_logging.py

# Move DB tests
mv tests/test_db/test_base_model.py test/db/models/test_base_model.py
mv tests/test_db/test_db_pool.py test/db/models/test_db_pool.py
mv tests/test_db/test_migrations.py test/db/migrations/test_migrations.py

# Move model tests
mv tests/test_db/test_language_models.py test/db/models/test_language_models.py
mv tests/test_db/test_progress_models.py test/db/models/test_progress_models.py
mv tests/test_db/test_vocabulary_group_models.py test/db/models/test_vocabulary_group_models.py
mv tests/test_db/test_vocabulary.py test/db/models/test_vocabulary_models.py
mv tests/test_db/test_session_model.py test/db/models/test_session_models.py

# Move service tests
mv tests/test_services/test_activity_service.py test/services/activity/test_activity_service.py
mv tests/test_services/test_dashboard_service.py test/services/activity/test_dashboard_service.py
mv tests/test_services/test_vocabulary_service.py test/services/vocabulary/test_vocabulary_service.py
mv tests/test_services/test_vocabulary_group_service.py test/services/vocabulary/test_vocabulary_group_service.py

# Move test utilities
mv tests/conftest.py test/conftest.py
mv tests/test_data.py test/utils/fixtures/test_data.py
mv tests/test_language_data.py test/utils/fixtures/test_language_data.py
mv tests/test_progress_data.py test/utils/fixtures/test_progress_data.py
mv tests/test_vocabulary_groups.py test/utils/fixtures/test_vocabulary_groups.py

# Remove old test directories
rm -rf tests/

# Create empty __init__.py files in each directory
find test -type d -exec touch {}/__init__.py \;

echo "Test reorganization complete!" 