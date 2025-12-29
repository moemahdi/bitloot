
# KinguinProductResultDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`name` | string
`originalName` | string
`platform` | string
`price` | number
`region` | string
`coverImageUrl` | string
`metacriticScore` | number
`ageRating` | string
`alreadyImported` | boolean

## Example

```typescript
import type { KinguinProductResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": 5c9b5b4b4f4c4c4c4c4c4c4c,
  "name": Cyberpunk 2077,
  "originalName": Cyberpunk 2077,
  "platform": Steam,
  "price": 29.99,
  "region": Global,
  "coverImageUrl": https://cdn.kinguin.net/media/catalog/product/1234.jpg,
  "metacriticScore": 86,
  "ageRating": 18+,
  "alreadyImported": false,
} satisfies KinguinProductResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as KinguinProductResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


