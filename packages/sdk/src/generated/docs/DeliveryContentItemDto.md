
# DeliveryContentItemDto


## Properties

Name | Type
------------ | -------------
`type` | string
`label` | string
`value` | string
`sensitive` | boolean

## Example

```typescript
import type { DeliveryContentItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "type": key,
  "label": Activation Key,
  "value": XXXXX-XXXXX-XXXXX-XXXXX,
  "sensitive": false,
} satisfies DeliveryContentItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DeliveryContentItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


