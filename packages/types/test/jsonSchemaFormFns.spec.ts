import {test, expect} from 'vitest'
import {
    formId,
    jsonSchemaForm,
    jsonSchemaFormFns,
    jsonSchemaFormLabels,
    languages,
    schemaKeyLabel
} from "../src/index.js";

test("applyLabels folds title and description into the json schema underpinning the form", () => {
    const form = jsonSchemaForm(formId(), "Test form", {
        properties: {
            name: {
                type: "string"
            },
            age: {
                type: "number"
            }
        }
    })
    const labels = jsonSchemaFormLabels(form.id,languages.en,"Labeled form", [
        schemaKeyLabel("name", "Name", "This is the name"),
        schemaKeyLabel("age", "Age", "This is the age")
    ], "This is the description")
    const labeled = jsonSchemaFormFns.applyLabels(form, labels)
    expect(labeled.name).toBe("Labeled form")
    expect(labeled.description).toBe("This is the description")
    const schema = labeled.schema as any
    expect(schema.properties.name.title).toBe("Name")
    expect(schema.properties.name.description).toBe("This is the name")
    expect(schema.properties.age.title).toBe("Age")
    expect(schema.properties.age.description).toBe("This is the age")
})