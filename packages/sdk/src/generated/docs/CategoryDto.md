
# CategoryDto


## Properties

Name | Type
------------ | -------------
`id` | string
`label` | string
`type` | string
`count` | number
`icon` | string
`description` | string
`sortOrder` | number

## Example

```typescript
import type { CategoryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": games,
  "label": Games,
  "type": business,
  "count": 150,
  "icon": Gamepad2,
  "description": PC & Console game keys and accounts,
  "sortOrder": 0,
} satisfies CategoryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CategoryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


