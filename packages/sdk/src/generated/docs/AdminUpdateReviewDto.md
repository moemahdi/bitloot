
# AdminUpdateReviewDto


## Properties

Name | Type
------------ | -------------
`rating` | number
`title` | string
`content` | string
`authorName` | string
`status` | string
`displayOnHomepage` | boolean
`adminNotes` | string

## Example

```typescript
import type { AdminUpdateReviewDto } from ''

// TODO: Update the object below with actual values
const example = {
  "rating": 5,
  "title": Edited title,
  "content": Edited content,
  "authorName": Valued Customer,
  "status": approved,
  "displayOnHomepage": true,
  "adminNotes": Approved after content review,
} satisfies AdminUpdateReviewDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminUpdateReviewDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


