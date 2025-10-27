# Ebook Generator Feature

## Overview
The Ebook Generator is a comprehensive feature that allows PubHub users to create complete ebooks from start to finish, with AI assistance throughout the process. Users can export their finished ebooks for publishing on platforms like Amazon KDP.

## Features

### 1. Book Details Form
Users can input or select:
- **Title** (text input)
- **Description** (textarea)
- **Genre** (dropdown with 18+ options including "Other")
- **Sub-Genre** (dropdown that adapts based on selected genre)
- **Tone** (dropdown with 13+ options)
- **Intended Length** (dropdown with predefined ranges or custom)
- **Target Audience** (dropdown with 12+ options)
- **Writing Style** (dropdown with 11+ options)

Each dropdown category includes an "Other" option that reveals a custom text input field.

### 2. AI Suggestions
- Analyzes partially filled book details
- Considers project niche and previous books
- Automatically fills in empty fields with appropriate suggestions
- Uses Azure OpenAI to provide contextual recommendations

### 3. Outline Generation
- Generates comprehensive chapter-by-chapter outline
- Each chapter includes:
  - Chapter title
  - Detailed description of content
  - Estimated word count
- Provides total estimated word count for the entire book

### 4. Content Generation
Two generation modes:
- **Individual Chapters**: Generate chapters one at a time for review
- **Batch Generation**: Generate all chapters at once

Features:
- Progress tracking for generated vs pending chapters
- AI maintains context from previous chapters
- Real-time word count tracking

### 5. Content Editing
- Full editing capability for each chapter
- Live word count updates
- Preview mode for reading chapters
- Save functionality for edits

### 6. Cover Art Generation
- AI-generated cover art based on:
  - Book title
  - Genre
  - Description
- Regenerate option for different variations
- Preview before finalizing

### 7. Export
Supported formats:
- **DOCX** (Microsoft Word)
- **PDF** (Portable Document Format)

Export includes:
- Complete book content
- All chapters in order
- Formatted for publishing
- Book summary with statistics

## Workflow

### Step 1: Details
1. Fill out book information
2. Use "AI Suggestions" to auto-complete empty fields
3. Click "Generate Outline" when all fields are complete

### Step 2: Outline
1. Review generated chapter outline
2. See estimated word counts per chapter
3. Generate chapters individually or all at once
4. Track generation progress

### Step 3: Content
1. Review generated content for each chapter
2. Edit any chapter by clicking the edit button
3. Preview chapters in a dialog
4. Save changes as needed
5. View total word count

### Step 4: Cover
1. Generate AI cover art
2. Preview the cover
3. Regenerate if desired
4. Proceed to export

### Step 5: Export
1. Choose export format (DOCX or PDF)
2. Review book summary
3. Download completed ebook

## Backend Implementation

### API Endpoints

#### `GET /ebooks/previous`
Retrieves user's previously created ebooks from KV store.

#### `POST /ebooks/suggestions`
Generates AI suggestions for incomplete book fields.

**Request:**
```json
{
  "currentDetails": { /* partial book details */ },
  "projectNiche": "string",
  "previousBooks": [ /* array of previous books */ ]
}
```

**Response:**
```json
{
  "genre": "string",
  "subGenre": "string",
  "tone": "string",
  "intendedLength": "string",
  "targetAudience": "string",
  "writingStyle": "string"
}
```

#### `POST /ebooks/outline`
Generates complete chapter outline for the book.

**Request:**
```json
{
  "bookDetails": { /* complete book details */ }
}
```

**Response:**
```json
{
  "chapters": [
    {
      "id": "chapter-1",
      "title": "string",
      "description": "string",
      "wordCount": 2500
    }
  ],
  "totalEstimatedWords": 25000
}
```

#### `POST /ebooks/chapter`
Generates content for a single chapter.

**Request:**
```json
{
  "bookDetails": { /* book details */ },
  "chapter": {
    "title": "string",
    "description": "string"
  },
  "previousChapters": [ /* array of previous chapters for context */ ]
}
```

**Response:**
```json
{
  "content": "string",
  "wordCount": 2500
}
```

#### `POST /ebooks/cover`
Generates cover art for the book.

**Request:**
```json
{
  "title": "string",
  "genre": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "imageUrl": "string"
}
```

#### `POST /ebooks/export`
Exports the completed ebook and saves to user's collection.

**Request:**
```json
{
  "bookDetails": { /* book details */ },
  "chapters": [ /* array of chapters with content */ ],
  "coverArtUrl": "string",
  "format": "docx" | "pdf"
}
```

**Response:**
Binary file download with appropriate Content-Type and Content-Disposition headers.

## Data Storage

### KV Store Keys

- `user:{userId}:ebooks` - Array of user's created ebooks (metadata only)
- `ebook:{ebookId}` - Full ebook data including all chapters

### Book Metadata Structure
```typescript
{
  id: string;
  title: string;
  description: string;
  genre: string;
  subGenre: string;
  tone: string;
  intendedLength: string;
  targetAudience: string;
  writingStyle: string;
  chapters: number;
  totalWords: number;
  coverArtUrl: string;
  createdAt: string;
}
```

## UI Components

### Main Component
- `EbookGenerator.tsx` - Main component with tabbed interface

### Key UI Features
- Progress bar showing completion status
- Tabbed navigation between workflow steps
- Badge showing total books created
- Real-time word count tracking
- Loading states for all async operations
- Toast notifications for user feedback

## Keyboard Shortcuts
- `Cmd/Ctrl + E` - Open Ebook Generator

## Future Enhancements
- Multiple language support
- Advanced formatting options
- Chapter reordering
- Collaboration features
- Template library for different genres
- Integration with publishing platforms
- SEO optimization suggestions
- Market research integration
- Pricing recommendations
