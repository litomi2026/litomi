import harpiTagJSON from '@/crawler/harpi/tag.json'

type HarpiTag = {
  en: string
  ko?: string
}

/**
 * HARPI_TAG_MAP is a map of Harpi tag IDs to their English and Korean names.
 *
```js
fetch('https://harpi.in/animation/attributes')
  .then((response) => response.json())
  .then((data) => {
    const tagsMap = Object.fromEntries(
      data.data.tags.map((tag) => [
        tag.id,
        { ko: tag.korStr, en: tag.engStr.replaceAll(' ', '_') },
      ]),
    )
    const sortedTagsMap = Object.keys(tagsMap)
      .sort()
      .reduce((newObj, key) => {
        newObj[key] = tagsMap[key]
        return newObj
      }, {})
    console.log(JSON.stringify(sortedTagsMap, null, 2))
  })
```
 */
export const HARPI_TAG_MAP: Record<string, HarpiTag> = harpiTagJSON
