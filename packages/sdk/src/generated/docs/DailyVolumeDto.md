
# DailyVolumeDto


## Properties

Name | Type
------------ | -------------
`date` | string
`count` | number
`revenue` | number

## Example

```typescript
import type { DailyVolumeDto } from ''

// TODO: Update the object below with actual values
const example = {
  "date": 2025-01-12,
  "count": 15,
  "revenue": 450.99,
} satisfies DailyVolumeDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DailyVolumeDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


