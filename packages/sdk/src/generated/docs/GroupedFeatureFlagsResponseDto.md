
# GroupedFeatureFlagsResponseDto


## Properties

Name | Type
------------ | -------------
`groups` | object
`total` | number
`categories` | Array&lt;string&gt;

## Example

```typescript
import type { GroupedFeatureFlagsResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "groups": {"Payments":[{"name":"payment_processing_enabled","enabled":true}],"Security":[{"name":"captcha_enabled","enabled":false}]},
  "total": null,
  "categories": null,
} satisfies GroupedFeatureFlagsResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GroupedFeatureFlagsResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


