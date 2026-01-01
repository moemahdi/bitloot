
# UpdateReviewDto


## Properties

Name | Type
------------ | -------------
`rating` | number
`title` | string
`content` | string
`authorName` | string

## Example

```typescript
import type { UpdateReviewDto } from ''

// TODO: Update the object below with actual values
const example = {
  "rating": 4,
  "title": Updated: Still great!,
  "content": Updated my review after using the product more.,
  "authorName": John D.,
} satisfies UpdateReviewDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateReviewDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


