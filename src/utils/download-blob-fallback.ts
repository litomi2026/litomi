import type { ZipWriterAddDataOptions, ZipWriterConstructorOptions } from '@zip.js/zip.js/lib/zip-core-writer.js'

type Options = {
  filename: string
  options: ZipWriterConstructorOptions
}

type ZipArchiveWriter = {
  add(filename: string, reader: ReadableStream<Uint8Array>, options: ZipWriterAddDataOptions): Promise<unknown>
  close(): Promise<void>
}

const ZIP_MIME_TYPE = 'application/zip'
const OBJECT_URL_REVOKE_DELAY_MS = 30_000

const importZipWriter = () => import('@zip.js/zip.js/lib/zip-core-writer.js')

export async function createBlobFallbackZipWriter({ filename, options }: Options): Promise<ZipArchiveWriter> {
  const chunks: BlobPart[] = []
  const writable = new WritableStream<Uint8Array>({
    write(chunk) {
      chunks.push(chunk.slice())
    },
  })

  const { ZipWriter } = await importZipWriter()
  const zip = new ZipWriter(writable, options)

  return {
    add(entryName, reader, addOptions) {
      return zip.add(entryName, reader, addOptions)
    },
    async close() {
      await zip.close()
      downloadBlob(new Blob(chunks, { type: ZIP_MIME_TYPE }), filename)
    },
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const blobURL = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobURL
  link.download = filename
  link.click()

  window.setTimeout(() => URL.revokeObjectURL(blobURL), OBJECT_URL_REVOKE_DELAY_MS)
}
