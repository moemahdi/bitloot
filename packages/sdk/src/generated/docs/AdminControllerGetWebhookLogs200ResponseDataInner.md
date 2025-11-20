
# AdminControllerGetWebhookLogs200ResponseDataInner


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`webhookType` | string
`paymentStatus` | string
`payload` | object
`processed` | boolean
`signature` | string
`signatureValid` | boolean
`orderId` | string
`paymentId` | string
`result` | string
`sourceIp` | string
`attemptCount` | number
`error` | string
`createdAt` | Date

## Example

```typescript
import type { AdminControllerGetWebhookLogs200ResponseDataInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "webhookType": null,
  "paymentStatus": null,
  "payload": null,
  "processed": null,
  "signature": null,
  "signatureValid": null,
  "orderId": null,
  "paymentId": null,
  "result": null,
  "sourceIp": null,
  "attemptCount": null,
  "error": null,
  "createdAt": null,
} satisfies AdminControllerGetWebhookLogs200ResponseDataInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminControllerGetWebhookLogs200ResponseDataInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


