# StoryTeller: New Testament Visual Experience - Technical Specifications

## Project Overview

StoryTeller is a web-based application that presents New Testament biblical stories in Nigerian languages (Yoruba, Igbo and Pidgin English) with AI-generated imagery. The application focuses on providing cultural context and educational content through an accessible interface.

## Implementation Progress

### Completed Features

1. **Bible Content Viewing System**

   - Responsive Bible chapter viewing interface
   - Chapter navigation with dropdown selectors
   - Verse selection and highlighting
   - Split view layout for desktop with image+text side-by-side
   - Mobile-optimized layout with collapsible image

2. **Multi-Language Support**

   - English, Yoruba, Igbo, and Pidgin language options
   - Language switcher in navigation bar
   - Language-specific content loading

3. **Text-to-Speech Integration**

   - Custom YarnGPT TTS service for high-quality speech
   - Support for Nigerian languages (Yoruba, Igbo, Pidgin)
   - Play/pause/stop controls for audio playback
   - Book and chapter announcement at beginning of speech
   - 1-second silence padding at beginning and end of audio
   - Fallback to browser TTS when custom service unavailable

4. **UI Enhancements**

   - Dark mode support with theme toggle
   - Responsive design for mobile and desktop
   - Biblical style theme with custom colors
   - Loading indicators for content and image generation

5. **Docker Configuration**
   - Docker compose setup for frontend and TTS service
   - Volume mounting for audio cache persistence
   - Environment variable configuration

### In Progress Features

1. **Image Generation**

   - Pre-generated image library for key scenes
   - Integration with AI image generation
   - Nigerian cultural adaptation of biblical imagery

2. **Verse Explanation**
   - Interactive verse selection
   - AI-generated explanations of selected verses
   - Cultural context connections

## Technical Architecture

1. **Frontend**

   - Next.js React application
   - Tailwind CSS for styling
   - Mobile-first responsive design

2. **TTS Service**

   - YarnGPT-based text-to-speech service
   - Python FastAPI backend
   - Docker containerization
   - Speech caching system for performance

3. **Image Generation**
   - Integration with AI image generation
   - Prompt engineering system for consistent imagery
   - Cultural adaptation to Nigerian context

## How to Run

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Option 1: Running with Docker Compose (Recommended)

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd storyteller
   ```

2. Start the application using Docker Compose:

   ```bash
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - YarnGPT TTS Service: http://localhost:8000

### Option 2: Running Services Individually

#### Frontend (Next.js)

1. Navigate to the frontend directory:

   ```bash
   cd storyteller/nextjs-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env.local file with:

   ```
   NEXT_PUBLIC_YARN_TTS_SERVICE_URL=http://localhost:8000
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Access the frontend at http://localhost:3000

#### YarnGPT TTS Service

1. Navigate to the TTS service directory:

   ```bash
   cd storyteller/yarngpt-service
   ```

2. Create and activate a Python virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   pip install gdown
   ```

4. Download required model files:

   ```bash
   curl -L "https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml" -o wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml

   gdown 1-ASeEkrn4HY49yZWHTASgfGFNXdVnLTt
   ```

5. Start the service:

   ```bash
   uvicorn index:app --host 0.0.0.0 --port 8000 --reload
   ```

6. Test the TTS service:
   ```bash
   cd test
   python test-tts.py --test english_short
   ```

### Testing

- The TTS service can be tested using the provided test script:

  ```bash
  cd storyteller/yarngpt-service/test
  python test-tts.py --test yoruba
  ```

- Available test options:
  - `english_short`: Short English test phrase
  - `english_medium`: Medium-length English paragraph
  - `yoruba`: Sample Yoruba text
  - `--text "Custom text"`: Test with your own text
  - `--lang`: Specify language (english, yoruba, igbo, pidgin)

## Core Features

### 1. Language Support

- **Target Languages**:
  - Nigerian Pidgin English
  - Yoruba
  - Igbo
  - English (fallback)
- **Translation System**:
  - Utilize existing Bible translations APIs where available
  - Custom translations for UI elements and contextual content

### 2. New Testament Focus

- **Content Scope**: All 27 books of the New Testament
- **Book Selection**: Users can select any New Testament book to explore
- **Chapter Navigation**: Linear progression through chapters with contextual information
- **Cultural Context**: Additional information about historical and cultural elements

### 3. Visual Experience

- **Navigation**: Simple forward/backward progression through narrative
- **Scene Descriptions**: Contextual descriptions of settings and events
- **Interactive Elements**: Key terms highlighting with expanded explanations

## Image Generation Strategy

### Implementation

- **Scene Categorization**: Identify key scenes across the New Testament
  - Common settings (Jerusalem, Galilee, temples, boats)
  - Key events (miracles, sermons, crucifixion)
- **Cultural Adaptation**:
  - Include Nigerian architectural elements and landscapes
  - Adjust clothing and appearance to be culturally relevant
  - Create consistent Nigerian representation
