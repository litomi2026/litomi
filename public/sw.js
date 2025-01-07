self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.startsWith('$/')) {
    const modifiedUrl = url.replace(
      location.origin,
      'https://cdn-nl-01.hasha.in',
    );
    event.respondWith(fetch(`${modifiedUrl}.webp`));
  }
});
