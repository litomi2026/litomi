// BinaryIdMap.ts
export class BinaryIdMap {
  private ids: Uint32Array
  private idToIndex: Map<number, number>
  private uuids: Uint8Array

  constructor(entries: [number, string][]) {
    this.ids = new Uint32Array(entries.length)
    this.uuids = new Uint8Array(entries.length * 16)
    this.idToIndex = new Map()

    entries.forEach(([id, uuid], index) => {
      this.ids[index] = id
      this.idToIndex.set(id, index)
      this.writeUUID(index, uuid)
    })
  }

  get(id: number): string | undefined {
    const index = this.idToIndex.get(id)

    if (index === undefined) {
      return undefined
    }

    const offset = index * 16
    const bytes = this.uuids.subarray(offset, offset + 16)

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  }

  getMemoryUsage(): number {
    return (this.ids.byteLength + this.uuids.byteLength + this.idToIndex.size * 12) / 1024 / 1024
  }

  private writeUUID(index: number, uuid: string) {
    const hex = uuid.replace(/-/g, '')
    const offset = index * 16
    for (let i = 0; i < 16; i++) {
      this.uuids[offset + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
  }
}
