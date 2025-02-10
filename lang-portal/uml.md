```mermaid
classDiagram
    class Dashboard {
        +getStats()
        +getProgress()
        +getLatestSession()
    }

    class StudyActivities {
        +getActivityList()
        +startActivity(activityId)
        +completeActivity()
        +getProgress(activityId)
    }

    class Words {
        +getWordsList()
        +createWord()
        +updateWord(wordId)
        +deleteWord(wordId)
        +searchWords()
        +getWord(wordId)
    }

    class WordGroups {
        +getGroupsList()
        +createGroup()
        +updateGroup(groupId)
        +deleteGroup(groupId)
        +getGroupWords(groupId)
        +addWordToGroup(groupId)
        +removeWordFromGroup(groupId, wordId)
        +searchGroups()
    }

    class Sessions {
        +getSessionsList()
        +getSession(sessionId)
        +filterSessions()
        +deleteSession(sessionId)
    }

    class Settings {
        +getSettings()
        +updateTheme()
        +resetHistory()
    }

    class SharedComponents {
        +Navigation
        +Header
        +LoadingStates
        +ErrorStates
        +Notifications
    }

    Dashboard --> SharedComponents
    StudyActivities --> SharedComponents
    Words --> SharedComponents
    WordGroups --> SharedComponents
    Sessions --> SharedComponents
    Settings --> SharedComponents
    
    WordGroups --> Words : manages
    Sessions --> StudyActivities : records
    Dashboard --> Sessions : displays latest
    Dashboard --> WordGroups : shows stats
