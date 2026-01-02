
# WatchlistProductDto


## Properties

Name | Type
------------ | -------------
`id` | string
`slug` | string
`title` | string
`subtitle` | string
`coverImageUrl` | string
`platform` | string
`region` | string
`price` | number
`isPublished` | boolean

## Example

```typescript
import type { WatchlistProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "slug": null,
  "title": null,
  "subtitle": null,
  "coverImageUrl": null,
  "platform": null,
  "region": null,
  "price": null,
  "isPublished": null,
} satisfies WatchlistProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WatchlistProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


