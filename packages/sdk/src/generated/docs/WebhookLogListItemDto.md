
# WebhookLogListItemDto


## Properties

Name | Type
------------ | -------------
`id` | string
`externalId` | string
`webhookType` | string
`paymentStatus` | string
`processed` | boolean
`signatureValid` | boolean
`orderId` | string
`paymentId` | string
`error` | string
`sourceIp` | string
`attemptCount` | number
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { WebhookLogListItemDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "externalId": null,
  "webhookType": null,
  "paymentStatus": null,
  "processed": null,
  "signatureValid": null,
  "orderId": null,
  "paymentId": null,
  "error": null,
  "sourceIp": null,
  "attemptCount": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies WebhookLogListItemDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookLogListItemDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


