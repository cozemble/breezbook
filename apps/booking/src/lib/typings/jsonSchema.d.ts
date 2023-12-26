/* copied from cozemble/monorepo/data-editor */

declare interface JSONSchema {
	$id?: string;
	$schema?: string;
	$ref?: string;
	$comment?: string;
	title?: string;
	description?: string;

	properties?: Record<string, JSONSchema>;
	items?: JSONSchema;
	additionalItems?: JSONSchema | boolean;
	type?: 'string' | 'number' | 'integer' | 'object' | 'array' | 'boolean' | 'null';
	required?: string[];

	// Disabled due to not having Cozemble stuff here
	// /** To store Cozemble specific configurations */
	// coz?: JSONSchemaCozembleConfigs;

	[key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

declare type JSONObject<S extends JSONSchema> = S extends { type: 'object' }
	? {
			[K in keyof S['properties']]: JSONObject<S['properties'][K]>;
	  }
	: S extends { type: 'array' }
	  ? JSONArray<S['items']>
	  : S extends { type: 'string' }
	    ? string
	    : S extends { type: 'number' }
	      ? number
	      : S extends { type: 'integer' }
	        ? number
	        : S extends { type: 'boolean' }
	          ? boolean
	          : S extends { type: 'null' }
	            ? null
	            : unknown;

// value.d.ts file in the original repo

declare type SimpleValue = string | number | boolean | null | undefined;

declare type ArrayValue = AnyValue[];

declare interface ObjectValue {
	[key: string]: SimpleValue | ObjectValue | ArrayValue;
}

declare type AnyValue = SimpleValue | ObjectValue | ArrayValue;
