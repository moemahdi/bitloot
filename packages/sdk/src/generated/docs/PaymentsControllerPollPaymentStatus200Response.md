
# PaymentsControllerPollPaymentStatus200Response


## Properties

Name | Type
------------ | -------------
`paymentId` | string
`paymentStatus` | string
`orderId` | string
`orderStatus` | string
`fulfillmentTriggered` | boolean

## Example

```typescript
import type { PaymentsControllerPollPaymentStatus200Response } from ''

// TODO: Update the object below with actual values
const example = {
  "paymentId": null,
  "paymentStatus": null,
  "orderId": null,
  "orderStatus": null,
  "fulfillmentTriggered": null,
} satisfies PaymentsControllerPollPaymentStatus200Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaymentsControllerPollPaymentStatus200Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


