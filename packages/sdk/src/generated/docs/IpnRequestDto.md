
# IpnRequestDto


## Properties

Name | Type
------------ | -------------
`orderId` | string
`externalId` | string
`status` | string
`payAmount` | number
`payCurrency` | string
`confirmations` | number

## Example

```typescript
import type { IpnRequestDto } from ''

// TODO: Update the object below with actual values
const example = {
  "orderId": 550e8400-e29b-41d4-a716-446655440000,
  "externalId": fake_550e8400-...,
  "status": finished,
  "payAmount": 0.001234,
  "payCurrency": btc,
  "confirmations": 0,
} satisfies IpnRequestDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as IpnRequestDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


