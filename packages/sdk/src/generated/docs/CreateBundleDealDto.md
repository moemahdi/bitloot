
# CreateBundleDealDto


## Properties

Name | Type
------------ | -------------
`name` | string
`slug` | string
`description` | string
`shortDescription` | string
`bundlePrice` | string
`originalPrice` | string
`savingsPercent` | number
`category` | string
`currency` | string
`isActive` | boolean
`isFeatured` | boolean
`startsAt` | string
`endsAt` | string
`coverImage` | string
`heroImage` | string
`badgeText` | string
`badgeColor` | string
`backgroundGradient` | string
`stockLimit` | number
`products` | [Array&lt;BundleProductDto&gt;](BundleProductDto.md)

## Example

```typescript
import type { CreateBundleDealDto } from ''

// TODO: Update the object below with actual values
const example = {
  "name": null,
  "slug": null,
  "description": null,
  "shortDescription": null,
  "bundlePrice": null,
  "originalPrice": null,
  "savingsPercent": null,
  "category": null,
  "currency": null,
  "isActive": null,
  "isFeatured": null,
  "startsAt": null,
  "endsAt": null,
  "coverImage": null,
  "heroImage": null,
  "badgeText": null,
  "badgeColor": null,
  "backgroundGradient": null,
  "stockLimit": null,
  "products": null,
} satisfies CreateBundleDealDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateBundleDealDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


