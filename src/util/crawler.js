async function fetchMangaId({ page, sort, order }) {
  try {
    const response = await fetch('/api/manga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, sort, order }),
    });
    const result = await response.json();
    const mangaIds = result.data.map((d) => d.mangaId);
    return mangaIds;
  } catch (error) {
    console.log('👀 - error:', error);
    throw page;
  }
}

const id = {};

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((page) => {
  fetchMangaId({ page, sort: 'date', order: -1 })
    .then((mangaIds) => {
      id[page] = mangaIds;
    })
    .catch((page) => {
      console.log(`Failed to fetch page ${page}`);
    });
});
