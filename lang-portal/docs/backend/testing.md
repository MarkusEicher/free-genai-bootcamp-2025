# Testing Vocabulary Endpoints

## Basic CRUD Operations
1. Create (POST /vocabularies/):
   ```json
   {
     "word": "goodbye",
     "translation": "adiós"
   }
   ```

2. Read (GET /vocabularies/{id}):
   - Use ID from create response

3. Update (PUT /vocabularies/{id}):
   ```json
   {
     "translation": "adiós, hasta luego"
   }
   ```

4. Delete (DELETE /vocabularies/{id}) 