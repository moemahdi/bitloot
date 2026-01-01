
# CreateProductGroupDto


## Properties

Name | Type
------------ | -------------
`title` | string
`slug` | string
`description` | string
`coverImageUrl` | string
`tagline` | string
`isActive` | boolean
`displayOrder` | number

## Example

```typescript
import type { CreateProductGroupDto } from ''

// TODO: Update the object below with actual values
const example = {
  "title": Battlefield 6,
  "slug": battlefield-6,
  "description": null,
  "coverImageUrl": null,
  "tagline": Available on 5 platforms,
  "isActive": null,
  "displayOrder": null,
} satisfies CreateProductGroupDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateProductGroupDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


