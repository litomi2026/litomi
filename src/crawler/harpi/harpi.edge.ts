class HarpiEdgeClient {
  fetchMangaImages(id: number, count: number): string[] {
    return Array.from({ length: count }, (_, i) => `https://soujpa.in/start/${id}/${id}_${i}.avif`)
  }
}

// Singleton instance
export const harpiEdgeClient = new HarpiEdgeClient()
