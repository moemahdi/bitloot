
# ProductGroupWithProductsDto


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`slug` | string
`description` | string
`coverImageUrl` | string
`tagline` | string
`isActive` | boolean
`displayOrder` | number
`minPrice` | string
`maxPrice` | string
`productCount` | number
`createdAt` | Date
`updatedAt` | Date
`products` | [Array&lt;GroupProductVariantDto&gt;](GroupProductVariantDto.md)

## Example

```typescript
import type { ProductGroupWithProductsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "slug": null,
  "description": null,
  "coverImageUrl": null,
  "tagline": null,
  "isActive": null,
  "displayOrder": null,
  "minPrice": null,
  "maxPrice": null,
  "productCount": null,
  "createdAt": null,
  "updatedAt": null,
  "products": null,
} satisfies ProductGroupWithProductsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProductGroupWithProductsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


