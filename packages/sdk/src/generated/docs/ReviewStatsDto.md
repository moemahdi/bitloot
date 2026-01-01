
# ReviewStatsDto


## Properties

Name | Type
------------ | -------------
`totalReviews` | number
`averageRating` | number
`ratingBreakdown` | object
`statusBreakdown` | object

## Example

```typescript
import type { ReviewStatsDto } from ''

// TODO: Update the object below with actual values
const example = {
  "totalReviews": 150,
  "averageRating": 4.7,
  "ratingBreakdown": {"1":5,"2":10,"3":20,"4":40,"5":75},
  "statusBreakdown": {"pending":15,"approved":130,"rejected":5},
} satisfies ReviewStatsDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReviewStatsDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


