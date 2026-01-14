
# MarginDistributionDto


## Properties

Name | Type
------------ | -------------
`distribution` | [Array&lt;MarginDistributionBucketDto&gt;](MarginDistributionBucketDto.md)
`totalProducts` | number
`avgMargin` | number
`medianMargin` | number
`period` | string

## Example

```typescript
import type { MarginDistributionDto } from ''

// TODO: Update the object below with actual values
const example = {
  "distribution": null,
  "totalProducts": null,
  "avgMargin": null,
  "medianMargin": null,
  "period": null,
} satisfies MarginDistributionDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MarginDistributionDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


