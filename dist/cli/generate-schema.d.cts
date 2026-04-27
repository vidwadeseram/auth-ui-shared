#!/usr/bin/env node
declare function camelCase(s: string): string;
declare function openapiToZod(name: string, schema: any): string;

export { camelCase, openapiToZod };
