
# TopProductDto


## Properties

Name | Type
------------ | -------------
`name` | string
`count` | number
`totalCost` | number

## Example

```typescript
import type { TopProductDto } from ''

// TODO: Update the object below with actual values
const example = {
  "name": CS:GO Key,
  "count": 15,
  "totalCost": 75.5,
} satisfies TopProductDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TopProductDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


