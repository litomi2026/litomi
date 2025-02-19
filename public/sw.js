self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const prefix = `${location.origin}/$/`;

  if (url.startsWith(prefix)) {
    const modifiedUrl = url.replace(prefix, 'https://cdn-nl-01.hasha.in/');
    event.respondWith(fetch(`${modifiedUrl}`));
  }
});
