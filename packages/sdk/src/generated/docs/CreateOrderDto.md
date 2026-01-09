
# CreateOrderDto


## Properties

Name | Type
------------ | -------------
`email` | string
`productId` | string
`items` | [Array&lt;CreateOrderItemDto&gt;](CreateOrderItemDto.md)
`note` | string
`captchaToken` | string
`idempotencyKey` | string

## Example

```typescript
import type { CreateOrderDto } from ''

// TODO: Update the object below with actual values
const example = {
  "email": user@example.com,
  "productId": demo-product,
  "items": null,
  "note": Demo order,
  "captchaToken": null,
  "idempotencyKey": cart-hash-abc123,
} satisfies CreateOrderDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateOrderDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


