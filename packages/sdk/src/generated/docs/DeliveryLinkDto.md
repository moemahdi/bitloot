
# DeliveryLinkDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`signedUrl` | string
`expiresAt` | Date
`itemCount` | number
`message` | string

## Example

```typescript
import type { DeliveryLinkDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "signedUrl": https://r2-example.example.com/orders/550e8400.json?signature=xyz,
  "expiresAt": 2025-11-08T14:15Z,
  "itemCount": 3,
  "message": Your order is ready for download. Link expires in 15 minutes.,
} satisfies DeliveryLinkDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DeliveryLinkDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


