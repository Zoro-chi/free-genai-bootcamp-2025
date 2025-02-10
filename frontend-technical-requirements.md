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
