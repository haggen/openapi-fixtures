import SwaggerParser from "@apidevtools/swagger-parser";
import { writeFile } from "fs";
import { join, dirname } from "path";
import mkdirp from "mkdirp";
import rimraf from "rimraf";

/**
 * Definition object type.
 */
export type Definition =
  | {
      allOf: Definition[];
    }
  | {
      anyOf: Definition[];
    }
  | {
      oneOf: Definition[];
    }
  | {
      type: "object";
      properties: Record<string, Definition>;
    }
  | {
      type: "number" | "integer";
      example?: number;
    }
  | {
      type: "boolean";
      example?: boolean;
    }
  | {
      type: "string";
      enum?: string[];
      example?: string;
    }
  | {
      type: "array";
      items: Definition;
    };

/**
 * Example value type.
 */
export type Example = any;

/**
 * Resolve example value from a combination (allOf, oneOf, anyOf) object.
 * @param def Definition object.
 * @returns Example value.
 */
export const getCombinedExample = (def: Definition): Example => {
  if ("allOf" in def) {
    return def.allOf.reduce(
      (example, def) => ({ ...example, ...getObjectExample(def) }),
      {}
    );
  } else if ("anyOf" in def) {
    return getExample(def.anyOf[0]);
  } else if ("oneOf" in def) {
    return getExample(def.oneOf[0]);
  }
  return null;
};

/**
 * Resolve example value from an array definition object.
 * @param def Definition object.
 * @returns Example value.
 */
export const getArrayExample = (def: Definition): Example => {
  if ("items" in def) {
    return [getExample(def.items)];
  }
  return null;
};

/**
 * Resolve example value from an object definition object.
 * @param def Definition object.
 * @returns Example value.
 */
export const getObjectExample = (def: Definition): Example => {
  if ("properties" in def) {
    return Object.keys(def.properties).reduce(
      (example, key) => ({
        ...example,
        [key]: getExample(def.properties[key]),
      }),
      {}
    );
  }
  return {};
};

/**
 * Resolve example value from any definition object.
 * @param def Definition object.
 * @returns Example value.
 */
export const getExample = (def: Definition) => {
  if (typeof def !== "object") {
    throw new Error("Definition isn't an object");
  }

  if ("example" in def) {
    return def.example;
  }

  if ("allOf" in def || "anyOf" in def || "oneOf" in def) {
    return getCombinedExample(def);
  }

  switch (def.type) {
    case "number":
    case "integer":
      return 1;
    case "boolean":
      return true;
    case "array":
      return getArrayExample(def);
    case "object":
      return getObjectExample(def);
    case "string":
      return def.enum?.[0] ?? "";
    default:
      throw new Error("Unrecodgined definition object");
  }
};

/**
 * Replace parameters with a concrete value in a given path.
 * @param path Path.
 * @param parameters Array of parameters definition objects.
 * @returns Path with concrete values.
 */
export const interpolate = (path: string, parameters: any[]) => {
  if (!parameters) {
    return path;
  }
  return parameters.reduce(
    (path, param) => path.replace(`{${param.name}}`, getExample(param.schema)),
    path
  );
};

/**
 * Writes the fixture content to given path creating any required directories.
 * @param file File path.
 * @param data File content.
 * @returns Promise of a written file.
 */
export const write = async (file: string, data: any) => {
  console.log(`Writing ${file}...`);

  await mkdirp(dirname(file));

  return new Promise<void>((res, rej) => {
    writeFile(
      file,
      JSON.stringify(data, null, 2),
      {
        encoding: "utf-8",
      },
      (err) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    );
  });
};

/**
 * Recursively deletes given directory.
 * @param dir Directory path.
 * @returns Promise.
 */
export const clear = async (dir: string) => {
  return new Promise<void>((res, rej) =>
    rimraf(dir, (err) => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    })
  );
};

/**
 * Pick the response schema from a responses object.
 * @param responses API operation responses object.
 * @returns Schema of a response object.
 */
export const getResponse = (responses: any): any => {
  return (responses["200"] || responses["201"])?.content?.["application/json"]
    ?.schema;
};

/**
 * Build a fixture object from given parameters.
 * @param method HTTP method.
 * @param path Path.
 * @param operation API operation object.
 * @returns A fixture object.
 */
export const getFixture = (method: string, path: string, operation: any) => {
  const response = getResponse(operation);
  if (!response) {
    return null;
  }
  return {
    path: `${interpolate(path, operation.parameters)}/${method}.json`,
    data: getExample(response),
  };
};

/**
 * Parse given OpenAPI spec. file and generate fixtures based off of responses.
 * @param input OpenAPI spec. file.
 * @param output Output directory.
 */
export default async (input: string, output: string) => {
  const api = await SwaggerParser.dereference(input);

  await clear(output);

  Object.keys(api.paths).forEach((path) => {
    const route = api.paths[path];

    Object.keys(route).forEach(async (method) => {
      const fixture = getFixture(method, path, route[method]);

      if (fixture) {
        write(join(output, fixture.path), fixture.data);
      }
    });
  });
};
