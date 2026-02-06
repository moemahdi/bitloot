
# UpdateProductDto


## Properties

Name | Type
------------ | -------------
`sourceType` | string
`deliveryType` | string
`kinguinOfferId` | string
`title` | string
`subtitle` | string
`description` | string
`platform` | string
`region` | string
`drm` | string
`ageRating` | string
`category` | string
`businessCategory` | string
`isFeatured` | boolean
`cost` | string
`price` | string
`currency` | string
`featuredSections` | Array&lt;string&gt;
`featuredOrder` | number

## Example

```typescript
import type { UpdateProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "sourceType": custom,
  "deliveryType": key,
  "kinguinOfferId": 5c9b5e6b-89f6-4b3d-8f4e-abcdef123456,
  "title": null,
  "subtitle": null,
  "description": null,
  "platform": null,
  "region": null,
  "drm": null,
  "ageRating": null,
  "category": null,
  "businessCategory": games,
  "isFeatured": null,
  "cost": null,
  "price": null,
  "currency": null,
  "featuredSections": ["trending","featured_games"],
  "featuredOrder": 0,
} satisfies UpdateProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


