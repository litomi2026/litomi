async function fetchAllGalleryIds() {
  const allGalleryIds = []
  let page = 1
  const limit = 50

  while (true) {
    try {
      console.log(`Fetching page ${page}...`)

      const response = await fetch(`https://komi.la/api/library?page=${page}&limit=${limit}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const bookmarks = data.bookmarks?.data || []

      if (bookmarks.length === 0) {
        console.log('No more bookmarks found.')
        break
      }

      const galleryIds = bookmarks.map((b) => b.galleryId)
      allGalleryIds.push(...galleryIds)

      console.log(`Page ${page}: Retrieved ${galleryIds.length} IDs (Total so far: ${allGalleryIds.length})`)

      // If we got less than the limit, we've likely reached the end
      if (bookmarks.length < limit) {
        console.log('Received fewer items than limit, likely the last page.')
        break
      }

      page++

      // Optional: Add a small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Error on page ${page}:`, error)
      break
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total pages fetched: ${page}`)
  console.log(`Total gallery IDs collected: ${allGalleryIds.length}`)

  return allGalleryIds
}

fetchAllGalleryIds()
  .then((galleryIds) => console.log(galleryIds))
  .catch((error) => console.error(error))
