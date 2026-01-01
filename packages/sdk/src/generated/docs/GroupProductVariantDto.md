
# GroupProductVariantDto


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`slug` | string
`platform` | string
`region` | string
`subtitle` | string
`price` | string
`currency` | string
`coverImageUrl` | string
`rating` | number
`isPublished` | boolean
`sourceType` | string

## Example

```typescript
import type { GroupProductVariantDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "slug": null,
  "platform": null,
  "region": null,
  "subtitle": null,
  "price": null,
  "currency": null,
  "coverImageUrl": null,
  "rating": null,
  "isPublished": null,
  "sourceType": null,
} satisfies GroupProductVariantDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GroupProductVariantDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


