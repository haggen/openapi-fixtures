# OpenAPI Fixtures

> Generate JSON fixtures from OpenAPI examples.

## About

This package will generate a JSON fixture file based off the example from each path definition in an OpenAPI v3 specification file.

- ☑️ Works with most basic types, references and even schema combination (oneOf, allOf, etc).
- ☑️ Generates fixtures for all responses with status `200` or `201`.
- ⚠️ Warning: it'll recursively delete the given output directory.

## Usage

As an example, if you run the following script:

```js
const generateFixtures = require("openapi-fixtures");
generateFixtures("api.yml", "fixtures"); // input spec file, output directory
```

Given the following spec. file:

```yml
openapi: 3.0.3

paths:
  "/store/{id}/pets":
    post:
      parameters:
        - name: id
          in: path
          type: integer
      responses:
        201:
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
    get:
      parameters:
        - name: id
          in: path
          type: integer
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
components:
  schemas:
    Pet:
      type: object
      properties:
        name:
          type: string
          example: "Max"
        animal:
          type: string
          enum:
            - dog
```

Will output two files;

- `fixtures/store/1/pets/post.json`

  ```json
  {
    "name": "Max",
    "animal": "dog"
  }
  ```

- `fixtures/store/1/pets/get.json`

  ```json
  [
    {
      "name": "Max",
      "animal": "dog"
    }
  ]
  ```

## Legal

The MIT License © 2021 Arthur Corenzan
