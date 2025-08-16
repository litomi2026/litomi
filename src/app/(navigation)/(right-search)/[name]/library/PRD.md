# Library

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

### 3. **UI/UX Enhancements**

#### Library Management Page

```tsx
// Simplified component structure
<LibraryDashboard>
  <LibrarySidebar>
    <CreateLibraryButton />
    <LibraryList>
      <LibraryItem name="To Read" count={45} color="blue" />
      <LibraryItem name="Favorites" count={23} color="red" />
      <LibraryItem name="Completed" count={112} color="green" />
    </LibraryList>
  </LibrarySidebar>

  <LibraryContent>
    <LibraryHeader>
      <SearchBar placeholder="Search in library..." />
      <SortDropdown options={['Date Added', 'Rating', 'Title']} />
      <ViewToggle options={['Grid', 'List', 'Compact']} />
    </LibraryHeader>

    <MangaGrid>
      {/* Enhanced manga cards with library-specific info */}
      <EnhancedMangaCard
        manga={manga}
        libraryData={{
          notes: 'Great art style, similar to...',
          rating: 4,
          readingStatus: 'reading',
          progress: 65,
        }}
      />
    </MangaGrid>
  </LibraryContent>
</LibraryDashboard>
```

### 4. **Feature Priorities (MVP to Full)**

#### MVP (Phase 1)

1. Create multiple named libraries
2. Add manga to specific libraries
3. View libraries separately
4. Basic sorting (date added, manga id)

#### Phase 2

1. Search within libraries
1. Bulk operations
1. Import existing bookmarks to libraries

#### Phase 3

1. Public library sharing
1. Recommendations based on library content

### 5. **Migration Strategy**

1. **Automatic Migration**: Convert existing bookmarks to a "북마크" library
2. **User Choice**: Automatically add manga to bookmark, and prompt users to organize their bookmarks into libraries
3. **Gradual Adoption**: Keep bookmark button working as before, add library features as enhancement

### 6. **Success Metrics**

- **Engagement**: Libraries created per user, items per library
- **Retention**: Return rate to library feature
- **Organization**: % of users with multiple libraries
- **Sharing**: Public libraries created and viewed

This approach maintains the simplicity users expect while adding powerful organization features for users who need them. The dark theme default should be maintained throughout the new UI components.
