
# CreateProductDto


## Properties

Name | Type
------------ | -------------
`title` | string
`subtitle` | string
`description` | string
`platform` | string
`region` | string
`drm` | string
`ageRating` | string
`category` | string
`costMinor` | string
`priceMinor` | string
`currency` | string
`isPublished` | boolean

## Example

```typescript
import type { CreateProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "title": null,
  "subtitle": null,
  "description": null,
  "platform": null,
  "region": null,
  "drm": null,
  "ageRating": null,
  "category": null,
  "costMinor": null,
  "priceMinor": null,
  "currency": null,
  "isPublished": null,
} satisfies CreateProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


