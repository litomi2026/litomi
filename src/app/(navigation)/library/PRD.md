# Library Feature - Product Requirements Document

Creating a custom library feature for manually selected manga.

## Current User Journey Analysis

### 1. Discovery Phase

- Users browse manga through various lists/search results
- Each manga card displays preview images, metadata, and action buttons
- Users can click the bookmark button to save manga

### 2. Saving Phase

- Simple toggle mechanism (bookmark on/off)
- Visual feedback with toast notifications
- Must be logged in to bookmark
- Limited to 500 bookmarks per user

### 3. Management Phase

- Bookmarks viewable in chronological order only
- Import/export functionality for backup
- No organization or categorization options
- No way to add notes or custom metadata

## Identified Pain Points

### 1. **Lack of Organization** 🏷️

- Users cannot categorize or group their saved manga
- No way to create custom collections (e.g., "To Read", "Favorites", "Completed")
- Difficult to manage large bookmark collections

### 2. **Limited Context** 📝

- No ability to add personal notes or ratings
- Can't track reading progress
- No way to remember why a manga was saved

### 3. **Discovery Limitations** 🔍

- No filtering or sorting options within bookmarks
- Can't search within personal library
- No way to share specific collections

### 4. **Flat Structure** 📚

- All bookmarks in one chronological list
- No hierarchy or nested collections
- Can't prioritize or highlight certain manga

## Proposed Library Feature Enhancement

### 1. **Custom Collections System**

```typescript
// Proposed data structure
interface Library {
  id: number
  userId: number
  name: string
  description?: string
  color?: string // For visual differentiation
  icon?: string // Optional emoji/icon
  isPublic: boolean // Allow sharing specific libraries
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

interface LibraryItem {
  libraryId: number
  mangaId: number
  createdAt: Date
}
```

### 2. **Enhanced User Journey**

#### Phase 1: Quick Save (Minimal Friction)

- Keep current bookmark button for quick saves
- Auto-add to "Default Library" or "Quick Saves"
- Show "Add to folder(or library, or collection)" toast on bottom for power users to select library directly

#### Phase 2: Organization

- Create custom libraries with names, colors, and icons
- Drag-and-drop manga between libraries
- Bulk operations for moving/copying items
- Smart suggestions based on manga metadata

### 3. **Feature Priorities (MVP to Full)**

#### MVP (Phase 1) ✅ COMPLETED

1. ✅ Create multiple named libraries
2. ✅ Add manga to specific libraries
3. ✅ View libraries separately
4. ✅ Basic sorting (date added, manga id)

#### Phase 2 ✅ COMPLETED

1. ✅ Search within libraries
2. ✅ Bulk operations
3. ✅ Import existing bookmarks to libraries

#### Phase 3 (Future)

1. ⏳ Public library sharing
2. ⏳ Recommendations based on library content

### 4. **Migration Strategy**

1. **User Choice**: Automatically add manga to bookmark, and prompt users to organize their bookmarks into libraries
2. **Gradual Adoption**: Keep bookmark button working as before, add library features as enhancement

### 5. **Success Metrics**

- **Engagement**: Libraries created per user, items per library
- **Retention**: Return rate to library feature
- **Organization**: % of users with multiple libraries
- **Sharing**: Public libraries created and viewed

---

## Implementation Details (As Built)

### Database Schema

#### Implemented Tables

```sql
-- Library table with bigint IDs for scalability
CREATE TABLE library (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  color INT, -- Hex color
  icon VARCHAR(4), -- Emoji
  is_public BOOLEAN DEFAULT false NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Library items with composite primary key
CREATE TABLE library_item (
  library_id BIGINT NOT NULL REFERENCES library(id) ON DELETE CASCADE,
  manga_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (library_id, manga_id)
);

-- Indexes for performance
CREATE INDEX idx_library_user_id ON library(user_id);
CREATE INDEX idx_library_sort_order ON library(sort_order);
CREATE INDEX idx_library_item_library_id ON library_item(library_id);
CREATE INDEX idx_library_item_created_at ON library_item(created_at);
```

### API Endpoints

#### Libraries Management

- `GET /api/library` - Fetch user's libraries with item counts
- `POST /api/library` - Create new library
- `DELETE /api/library` - Delete a library

#### Library Items Management

- `GET /api/library/item` - Get items in a library (paginated, with search)
- `POST /api/library/item` - Add manga to library
- `DELETE /api/library/item` - Remove manga from library

### Server Actions

```typescript
// Implemented server actions
- createLibrary(formData: FormData)
- addMangaToLibrary(libraryId: number, mangaId: number)
- removeMangaFromLibrary(libraryId: number, mangaId: number)
- getOrCreateDefaultLibrary()
- migrateBookmarksToLibrary()
- bulkMoveToLibrary(formData: FormData)
- bulkCopyToLibrary(formData: FormData)
- bulkRemoveFromLibrary(formData: FormData)
```

### UI/UX Implementation

#### Desktop Experience

- Sidebar navigation showing all libraries
- Create library with inline button
- Search within libraries
- Bulk selection mode with toolbar
- Grid layout matching existing manga lists

#### Mobile Experience 📱

- Hamburger menu for library navigation
- Slide-in drawer pattern
- Responsive grid (1 column on mobile)
- Touch-optimized buttons (44px minimum)
- Full-width search and action buttons
- Simplified bulk operations toolbar

### Design Principles Applied

1. **Minimalist Aesthetic**
   - Clean, uncluttered interface
   - Focus on content over chrome
   - Consistent dark theme

2. **Simple and Readable Code**
   - Clear component separation
   - Reusable patterns
   - No excessive abstraction

3. **Functional Beauty**
   - Every element serves a purpose
   - Smooth transitions
   - Clear visual hierarchy

### Technical Decisions

1. **Database**
   - Used `bigint` for IDs to match user table
   - Composite primary key for library_item
   - Row Level Security (RLS) enabled

2. **State Management**
   - Zustand for global selection state
   - React Query for data fetching
   - Local state for UI interactions

3. **Component Architecture**
   - Reused existing manga card components
   - Created wrapper components for selection
   - Separate mobile/desktop layouts

4. **Performance**
   - Pagination with cursor-based loading
   - Optimistic updates with React Query
   - Efficient database queries with indexes

### Features Implemented

#### Core Library Management

- ✅ Create/delete libraries with custom names, colors, and icons
- ✅ View all libraries in grid layout
- ✅ Navigate between libraries
- ✅ Automatic bookmark migration

#### Manga Organization

- ✅ Add manga to specific libraries
- ✅ Remove manga from libraries
- ✅ Move manga between libraries
- ✅ Copy manga to multiple libraries
- ✅ Bulk operations (select multiple)

#### Search & Discovery

- ✅ Search within individual libraries
- ✅ Empty states for search results
- ✅ Item count display

#### Mobile Optimization

- ✅ Responsive layouts
- ✅ Touch-friendly interfaces
- ✅ Drawer navigation pattern
- ✅ Optimized grid columns

### Migration Implementation

- **Non-destructive**: Original bookmarks remain intact

### Key Deviations from Original Plan

1. **No Drag-and-Drop**: Implemented explicit bulk operations instead
2. **Search Implementation**: Basic manga ID search as MVP, full-text search deferred

### Future Enhancements

1. **Advanced Search**
   - Full-text search across manga metadata
   - Filter by tags, artists, series

2. **Sharing Features**
   - Public library URLs
   - Social sharing integration

3. **Smart Features**
   - Auto-categorization suggestions
   - Reading progress tracking
   - Personalized recommendations

4. **Export/Import**
   - Library-specific exports
