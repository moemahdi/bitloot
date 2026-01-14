
# AdminControllerGetWebhookLogDetail200Response


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`webhookType` | string
`paymentStatus` | string
`payload` | object
`signatureValid` | boolean
`processed` | boolean
`orderId` | string
`paymentId` | string
`result` | object
`error` | string
`sourceIp` | string
`attemptCount` | number
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { AdminControllerGetWebhookLogDetail200Response } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "webhookType": null,
  "paymentStatus": null,
  "payload": null,
  "signatureValid": null,
  "processed": null,
  "orderId": null,
  "paymentId": null,
  "result": null,
  "error": null,
  "sourceIp": null,
  "attemptCount": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies AdminControllerGetWebhookLogDetail200Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminControllerGetWebhookLogDetail200Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


