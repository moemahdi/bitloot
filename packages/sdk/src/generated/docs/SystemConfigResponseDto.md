
# SystemConfigResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`provider` | string
`key` | string
`value` | string
`isSecret` | boolean
`isSet` | boolean
`environment` | string
`isActive` | boolean
`description` | string
`validationPattern` | string
`displayOrder` | number
`createdAt` | Date
`updatedAt` | Date
`updatedByEmail` | string

## Example

```typescript
import type { SystemConfigResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "provider": null,
  "key": null,
  "value": null,
  "isSecret": null,
  "isSet": null,
  "environment": null,
  "isActive": null,
  "description": null,
  "validationPattern": null,
  "displayOrder": null,
  "createdAt": null,
  "updatedAt": null,
  "updatedByEmail": null,
} satisfies SystemConfigResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SystemConfigResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


