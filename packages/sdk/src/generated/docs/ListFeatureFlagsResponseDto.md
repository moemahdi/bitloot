
# ListFeatureFlagsResponseDto


## Properties

Name | Type
------------ | -------------
`flags` | [Array&lt;FeatureFlagResponseDto&gt;](FeatureFlagResponseDto.md)
`total` | number
`enabledCount` | number
`disabledCount` | number

## Example

```typescript
import type { ListFeatureFlagsResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "flags": null,
  "total": null,
  "enabledCount": null,
  "disabledCount": null,
} satisfies ListFeatureFlagsResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ListFeatureFlagsResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


