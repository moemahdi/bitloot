
# NowpaymentsIpnRequestDto


## Properties

Name | Type
------------ | -------------
`paymentId` | [NowpaymentsIpnRequestDtoPaymentId](NowpaymentsIpnRequestDtoPaymentId.md)
`invoiceId` | [NowpaymentsIpnRequestDtoInvoiceId](NowpaymentsIpnRequestDtoInvoiceId.md)
`orderId` | string
`paymentStatus` | string
`priceAmount` | number
`priceCurrency` | string
`payAmount` | number
`payCurrency` | string
`payAddress` | string
`actuallyPaid` | number
`actuallyPaidAtFiat` | number
`receivedAmount` | number
`receivedCurrency` | string
`outcomeAmount` | number
`outcomeCurrency` | string
`fee` | [NowPaymentsFeeDto](NowPaymentsFeeDto.md)
`purchaseId` | object
`orderDescription` | string
`createdAt` | object
`updatedAt` | object
`reference` | string
`network` | string
`networkPrecision` | number
`burningPercent` | number
`expirationEstimateDate` | string
`isFixedRate` | boolean
`isFeePaidByUser` | boolean
`validUntil` | string
`type` | string
`smartContract` | string
`payinExtraId` | string
`parentPaymentId` | object
`paymentExtraIds` | object
`depositId` | object
`senderAddress` | string
`txnId` | string

## Example

```typescript
import type { NowpaymentsIpnRequestDto } from ''

// TODO: Update the object below with actual values
const example = {
  "paymentId": null,
  "invoiceId": null,
  "orderId": 930a98e1-b8fd-4eb0-adb2-f37df3d0bfbe,
  "paymentStatus": finished,
  "priceAmount": 19.5,
  "priceCurrency": eur,
  "payAmount": 0.00025524,
  "payCurrency": btc,
  "payAddress": 36GMdZsn5ciVZhHEyUfGyoiUmyhAdG5gn3,
  "actuallyPaid": 0.00025524,
  "actuallyPaidAtFiat": 19.5,
  "receivedAmount": 0.0025,
  "receivedCurrency": btc,
  "outcomeAmount": 0.2778371,
  "outcomeCurrency": ltc,
  "fee": null,
  "purchaseId": 5489876303,
  "orderDescription": BitLoot Order #930a98e1,
  "createdAt": 2025-11-08T15:30:00Z,
  "updatedAt": 1767352373337,
  "reference": null,
  "network": btc,
  "networkPrecision": null,
  "burningPercent": null,
  "expirationEstimateDate": null,
  "isFixedRate": null,
  "isFeePaidByUser": null,
  "validUntil": null,
  "type": null,
  "smartContract": null,
  "payinExtraId": null,
  "parentPaymentId": null,
  "paymentExtraIds": null,
  "depositId": null,
  "senderAddress": null,
  "txnId": null,
} satisfies NowpaymentsIpnRequestDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NowpaymentsIpnRequestDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


