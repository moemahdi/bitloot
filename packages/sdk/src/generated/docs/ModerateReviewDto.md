
# ModerateReviewDto


## Properties

Name | Type
------------ | -------------
`status` | string
`displayOnHomepage` | boolean
`adminNotes` | string

## Example

```typescript
import type { ModerateReviewDto } from ''

// TODO: Update the object below with actual values
const example = {
  "status": approved,
  "displayOnHomepage": true,
  "adminNotes": Approved - genuine customer feedback,
} satisfies ModerateReviewDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ModerateReviewDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


