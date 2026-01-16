
# BundleDealResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`slug` | string
`description` | string
`shortDescription` | string
`bundlePrice` | string
`originalPrice` | string
`savingsAmount` | string
`savingsPercent` | string
`currency` | string
`isActive` | boolean
`isFeatured` | boolean
`startsAt` | Date
`endsAt` | Date
`coverImage` | string
`badgeText` | string
`badgeColor` | string
`backgroundGradient` | string
`displayOrder` | number
`stockLimit` | number
`soldCount` | number
`productTypes` | Array&lt;string&gt;
`products` | Array&lt;string&gt;
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { BundleDealResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "slug": null,
  "description": null,
  "shortDescription": null,
  "bundlePrice": null,
  "originalPrice": null,
  "savingsAmount": null,
  "savingsPercent": null,
  "currency": null,
  "isActive": null,
  "isFeatured": null,
  "startsAt": null,
  "endsAt": null,
  "coverImage": null,
  "badgeText": null,
  "badgeColor": null,
  "backgroundGradient": null,
  "displayOrder": null,
  "stockLimit": null,
  "soldCount": null,
  "productTypes": null,
  "products": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies BundleDealResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BundleDealResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


