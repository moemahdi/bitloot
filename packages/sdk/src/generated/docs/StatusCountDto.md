
# StatusCountDto


## Properties

Name | Type
------------ | -------------
`status` | string
`count` | number

## Example

```typescript
import type { StatusCountDto } from ''

// TODO: Update the object below with actual values
const example = {
  "status": fulfilled,
  "count": 42,
} satisfies StatusCountDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StatusCountDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


