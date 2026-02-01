
# AdminPricingRuleResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`productId` | object
`ruleType` | string
`marginPercent` | string
`fixedMarkupMinor` | number
`floorMinor` | number
`capMinor` | number
`minCostMinor` | number
`maxCostMinor` | number
`priority` | number
`isActive` | boolean
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { AdminPricingRuleResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "productId": null,
  "ruleType": null,
  "marginPercent": null,
  "fixedMarkupMinor": null,
  "floorMinor": null,
  "capMinor": null,
  "minCostMinor": null,
  "maxCostMinor": null,
  "priority": null,
  "isActive": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies AdminPricingRuleResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AdminPricingRuleResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


