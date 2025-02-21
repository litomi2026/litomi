type Params = {
  startByte: string
  endByte: string
}

export default async function fetchNozomi({ startByte, endByte }: Params) {
  const response = await fetch('https://ltn.hitomi.la/index-korean.nozomi', {
    method: 'GET',
    headers: {
      Range: `bytes=${startByte}-${endByte}`,
    },
  })

  if (!response.ok && response.status !== 206) {
    console.error('HTTP Error:', response)
    return
  }

  const arrayBuffer = await response.arrayBuffer()

  if (arrayBuffer) {
    const view = new DataView(arrayBuffer)
    const total = view.byteLength / 4
    const nozomi = []

    for (let i = 0; i < total; i++) {
      nozomi.push(view.getInt32(i * 4, false /* big-endian */))
    }

    const contentRange = response.headers.get('Content-Range') ?? ''
    const total_items = parseInt(contentRange.replace(/^[Bb]ytes \d+-\d+\//, ''), 10) / 4

    return {
      nozomi,
      total_items,
    }
  }
}
