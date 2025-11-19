
# CreatePricingRuleDto


## Properties

Name | Type
------------ | -------------
`productId` | string
`ruleType` | string
`marginPercent` | string
`fixedMarkupMinor` | number
`floorMinor` | number
`capMinor` | number
`priority` | number
`isActive` | boolean

## Example

```typescript
import type { CreatePricingRuleDto } from ''

// TODO: Update the object below with actual values
const example = {
  "productId": null,
  "ruleType": null,
  "marginPercent": null,
  "fixedMarkupMinor": null,
  "floorMinor": null,
  "capMinor": null,
  "priority": null,
  "isActive": null,
} satisfies CreatePricingRuleDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreatePricingRuleDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


