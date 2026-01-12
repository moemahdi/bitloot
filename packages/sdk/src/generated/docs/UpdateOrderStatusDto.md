
# UpdateOrderStatusDto


## Properties

Name | Type
------------ | -------------
`status` | string
`reason` | string

## Example

```typescript
import type { UpdateOrderStatusDto } from ''

// TODO: Update the object below with actual values
const example = {
  "status": failed,
  "reason": Manual refund processed via PayPal - customer requested,
} satisfies UpdateOrderStatusDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateOrderStatusDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


