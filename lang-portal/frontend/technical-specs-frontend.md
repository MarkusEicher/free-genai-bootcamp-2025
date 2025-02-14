# Technical Specs for Frontend

## Business Goal: 
A language learning school wants to build a prototype of learning portal which will act as three things:
1. Inventory of possible vocabulary that can be learned
2. Act as a  Learning record store (LRS), providing correct and wrong score on practice vocabulary
3. A unified launchpad to launch different learning apps

## Core Functionalities


## Pages and Components

### Home Page / Dashboard at /

On the home page, the user will see Quick Stats, The Study progress and the last session details. It will also have a button to start a new session.

- Quick Stats will show the overall score of all sessions and the total number of sessions and the total number of activities. It will also show the streak of concurrent days of practice.

- The Study Progress will show the total number of words practiced and the total number of words remaining. It will also show the percentage of words practiced vs the total number of words available for practice.

- The Last Session details will show the details of the last session, including the date, the activities practiced and the scores of these activities. It will show a link to the sessions page with an overview of all sessions.

### Sessions Page at /sessions

This page will show a list of all sessions, including the date, the activities practiced and the combined score of all activities done in that session. It will also show a link to the session details page.  

#### Session Details Page at /sessions/:session_id

This page will show the details of a specific session, including the date, the activities practiced and the individual scores of these activities.

##### Activity Details Page at /sessions/:session_id/activities/:activity_id

This page will show the details of a specific activity, including the date, the vocabulary-groups and vocabulary items practiced and the individual scores of these vocabulary items.

### Study at /launchpad

This page will show a list of all activities that can be practiced. It will have links to the pages that will launch the activities.

### Vocabulary Inventory at /vocabulary

This page will show a list of all vocabulary that can be learned. It will have links to the vocabulary details page.

#### Vocabulary Details Page at /vocabulary/:vocabulary_id

This page will show the details of a specific vocabulary, including the word, the translation and the groups it belongs to.

### Vocabulary Groups at /vocabulary-groups

This page will show a list of all vocabulary groups, including the name of the group and the number of vocabulary items it contains. It will have links to the vocabulary details page.

### Settings at /settings

This page will show the settings of the like the theme and the notification settings. It will also have a button to reset the session history and all activity reviews.




