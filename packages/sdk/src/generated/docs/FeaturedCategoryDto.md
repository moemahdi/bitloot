
# FeaturedCategoryDto


## Properties

Name | Type
------------ | -------------
`id` | string
`label` | string
`sort` | string
`icon` | string

## Example

```typescript
import type { FeaturedCategoryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": trending,
  "label": Trending,
  "sort": trending,
  "icon": flame,
} satisfies FeaturedCategoryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FeaturedCategoryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


