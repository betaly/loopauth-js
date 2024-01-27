import {dynamicImport} from '@cspell/dynamic-import';

export async function importDynamic<T>(name: string): Promise<T> {
  // const module = eval(`(async () => {return await import("${name}")})()`);
  // return module as T;
  return dynamicImport(name, '');
}
