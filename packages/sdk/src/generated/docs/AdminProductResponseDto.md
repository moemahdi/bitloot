
# AdminProductResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`sourceType` | string
`kinguinOfferId` | string
`slug` | string
`title` | string
`name` | string
`subtitle` | string
`description` | string
`platform` | string
`region` | string
`drm` | string
`ageRating` | string
`category` | string
`cost` | string
`price` | string
`currency` | string
`isPublished` | boolean
`isCustom` | boolean
`createdAt` | Date
`updatedAt` | Date
`deletedAt` | Date

## Example

```typescript
import type { AdminProductResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "sourceType": custom,
  "kinguinOfferId": 5c9b5e6b-89f6-4b3d-8f4e-abcdef123456,
  "slug": null,
  "title": null,
  "name": null,
  "subtitle": null,
  "description": null,
  "platform": null,
  "region": null,
  "drm": null,
  "ageRating": null,
  "category": null,
  "cost": null,
  "price": null,
  "currency": null,
  "isPublished": null,
  "isCustom": null,
  "createdAt": null,
  "updatedAt": null,
  "deletedAt": null,
} satisfies AdminProductResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminProductResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


