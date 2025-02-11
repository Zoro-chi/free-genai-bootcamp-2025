# Frontend Technical Requirements

## Pages

### Dashboard `/dashboard`

#### Purpose

The purpose of the dashboard is to show the user a summary of their study progress and act as the default landing page.

#### Components

This page contains the following sections:

- Last study session

  - shows last activity used
  - shows when last activity was done
  - summarize wrong and right answers from last activity
  - has a link to the group

- Study progress

  - accross the whole study session, show the total words studied out of all possible words in database e.g 10/100
  - display a mastery progress bar e.g 10%

- Quick stats

  - success rate e.g 80%
  - total study session e.g 4
  - total active groups e.g 2
  - study streaks e.g 3 days

- Start studying button

#### Needed API Endpoints

- `GET /api/dashboard/last_study_session`
- `GET /api/dashboard/study_progress`
- `GET /api/dashboard/quick_stats`

### Study Activities `/study-activities`

#### Purpose

The purpoose of the study activities page is to show a collection of study activities
with a thumbnail image and a description of the activity, to either launch or view the activity.

#### Components

- Study activity card
  - thumbnail image
  - title
  - a launch button to take the user to the launch page
  - a view page to view more information about past study sessions.

#### Needed API Endpoints

- `GET /api/study-activities`
  - pagination

### Study Activity show `/study-activities/:id`

#### Purpose

The purpose of the study activity show page is to show the user more information about the study activity
and past study sessions.

#### Components

- Name of the study activity
- Thumbnail image of the study activity
- Description of the study activity
- Launch button to start the study activity
- Study activities paginated list
  - id
  - activity name
  - group name
  - start time
  - end time

#### Needed API Endpoints

- `GET /api/study-activities/:id`
- `GET /api/study-activities/:id/study-sessions`

### Study Activity Launch `/study-activities/:id/launch`

#### Purpose

The purpose of the study activity launch page is to launch the study activity and show the user the study session.

#### Components

- Name of study activity
- Launch form
  - select field for group
  - launch now button

#### Needed API Endpoints

- `POST /api/study-sessions`

### Words Index `/words`

#### Purpose

The purpose of this page is to show all words in our database.

#### Components

- Paginated Word List
  - Columns
    - Japanese
    - Romaji
    - English
    - Correct Count
    - Wrong Count
  - Pagination with 100 items per page
  - Clicking the Japanese word will take us to the word show page

#### Needed API Endpoints

- GET /api/words

### Word Show `/words/:id`

#### Purpose

The purpose of this page is to show information about a specific word.

#### Components

- Japanese
- Romaji
- English
- Study Statistics
  - Correct Count
  - Wrong Count
- Word Groups
  - show an a series of pills eg. tags
  - when group name is clicked it will take us to the group show page

#### Needed API Endpoints

- GET /API/words/:id

### Word Groups Index `/groups`

#### Purpose

The purpose of this page is to show a list of groups in our database.

#### Components

- Paginated Group List
  - Columns
    - Group Name
    - Word Count
  - Clicking the group name will take us to the group show page

#### Needed API Endpoints

- GET /api/groups

### Group Show `/groups/:id`

#### Purpose

The purpose of this page is to show information about a specific group.

#### Components

- Group Name
- Group Statistics
  - Total Word Count
- Words in Group (Paginateds List of Words)
  - Should use the same component as the words index page
- Study Sessions (Paginated List of Study Sessions)
  - Should use the same component as the study sessions index page

#### Needed API Endpoints

- GET /api/groups/:id (the name and groups stats)
- GET /api/groups/:id/words
- GET /api/groups/:id/study_sessions

## Study Sessions Index `/study_sessions`

#### Purpose

The purpose of this page is to show a list of study sessions in our database.

#### Components

- Paginated Study Session List
  - Columns
    - Id
    - Activity Name
    - Group Name
    - Start Time
    - End Time
    - Number of Review Items
  - Clicking the study session id will take us to the study session show page

#### Needed API Endpoints

- GET /api/study_sessions

### Study Session Show `/study_sessions/:id`

#### Purpose

The purpose of this page is to show information about a specific study session.

#### Components

- Study Sesssion Details
  - Activity Name
  - Group Name
  - Start Time
  - End Time
  - Number of Review Items
- Words Review Items (Paginated List of Words)
  - Should use the same component as the words index page

#### Needed API Endpoints

- GET /api/study_sessions/:id
- GET /api/study_sessions/:id/words

### Settings Page `/settings`

#### Purpose

The purpose of this page is to make configurations to the study portal.

#### Components

- Theme Selection eg. Light, Dark, System Default
- Reset History Button
  - this will delete all study sessions and word review items
- Full Reset Button
  - this will drop all tables and re-create with seed data

#### Needed API Endpoints

- POST /api/reset_history
- POST /api/full_reset
