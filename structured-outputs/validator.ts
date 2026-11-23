type Schema = {
   type?: string;
   required?: string[];
   properties?: Record<string, Schema>;
   minItems?: number;
   maxItems?: number;
   items?: Schema;
   enum?: unknown[];
   minimum?: number;
   maximum?: number;
}

function validate_schema(data: unknown, schema: Schema): string[] {
   const errors: string[] = []
   _validate(data, schema, "", errors)
   return errors
}

function _validate(data: unknown, schema: Schema, path: string, errors: string[]): void {
   const schemaType = schema.type

   if (schemaType === "object") {
      
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
         errors.push(`${path}: expected object, got ${getType(data)}`)
         return
      }

      for (const key of schema.required ?? []) {
         if (!(key in data)) {
            errors.push(`${path}.${key}: required field missing`)
         }
      }

      const properties = schema.properties ?? {}

      for (const [key, value] of Object.entries(data)) {
         if (key in properties) {
            _validate(value, properties[key], `${path}.${key}`, errors)
         }
      }
   }
}

function getType(value: unknown): string {
   if (value === null) return "null"
   if (Array.isArray(value)) return "array"
   return typeof value
}