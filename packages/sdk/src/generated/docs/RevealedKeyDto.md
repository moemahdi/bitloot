
# RevealedKeyDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`itemId` | string
`plainKey` | string
`contentType` | string
`revealedAt` | Date
`expiresAt` | Date
`downloadCount` | number
`accessInfo` | object

## Example

```typescript
import type { RevealedKeyDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "itemId": 4f5d7890-1234-5678-9abc-def012345678,
  "plainKey": KEY-ABC123XYZ789,
  "contentType": text/plain,
  "revealedAt": 2025-11-08T14:00Z,
  "expiresAt": 2025-11-08T14:15Z,
  "downloadCount": 1,
  "accessInfo": {"ipAddress":"192.168.1.100","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
} satisfies RevealedKeyDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RevealedKeyDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


