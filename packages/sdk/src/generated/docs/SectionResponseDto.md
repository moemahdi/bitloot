
# SectionResponseDto


## Properties

Name | Type
------------ | -------------
`id` | string
`sectionKey` | string
`displayName` | string
`description` | string
`category` | string
`isEnabled` | boolean
`displayOrder` | number
`config` | object
`scheduleStart` | Date
`scheduleEnd` | Date
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { SectionResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "sectionKey": null,
  "displayName": null,
  "description": null,
  "category": null,
  "isEnabled": null,
  "displayOrder": null,
  "config": null,
  "scheduleStart": null,
  "scheduleEnd": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies SectionResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SectionResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


