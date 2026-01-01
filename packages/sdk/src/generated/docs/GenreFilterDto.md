
# GenreFilterDto


## Properties

Name | Type
------------ | -------------
`id` | string
`label` | string
`count` | number

## Example

```typescript
import type { GenreFilterDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": rpg,
  "label": RPG,
  "count": 120,
} satisfies GenreFilterDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GenreFilterDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


