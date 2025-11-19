
# UpdatePricingRuleDto


## Properties

Name | Type
------------ | -------------
`ruleType` | string
`marginPercent` | string
`fixedMarkupMinor` | number
`floorMinor` | number
`capMinor` | number
`priority` | number
`isActive` | boolean

## Example

```typescript
import type { UpdatePricingRuleDto } from ''

// TODO: Update the object below with actual values
const example = {
  "ruleType": null,
  "marginPercent": null,
  "fixedMarkupMinor": null,
  "floorMinor": null,
  "capMinor": null,
  "priority": null,
  "isActive": null,
} satisfies UpdatePricingRuleDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdatePricingRuleDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


