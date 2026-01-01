
# CategoriesResponseDto


## Properties

Name | Type
------------ | -------------
`categories` | [Array&lt;CategoryDto&gt;](CategoryDto.md)
`featured` | [Array&lt;FeaturedCategoryDto&gt;](FeaturedCategoryDto.md)
`totalProducts` | number

## Example

```typescript
import type { CategoriesResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "categories": null,
  "featured": null,
  "totalProducts": 1500,
} satisfies CategoriesResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CategoriesResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


