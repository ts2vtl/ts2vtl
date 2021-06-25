import * as util from 'util';

class Foreach {
  get hasNext(): boolean {
    return false;
  }
}

export interface Entry<K, V> {
  key: K,
  value: V,
}

class JavaString {
  static format(format: string, ...args: any[]): string {
    return util.format(format, ...args);
  }

  static join(delimiter: string, elements: ReadonlyArray<string>): string;
  static join(delimiter: string, ...elements: string[]): string;
  static join(delimiter: string, ...args: any): string {
    if (Array.isArray(args[0])) {
      return args[0].join(delimiter);
    } else {
      return args.join(delimiter);
    }
  }
}

export function Range(begin: number, end: number) {
  begin |= 0;
  end |= 0;

  const result = [];
  let step = begin < end ? 1 : begin > end ? -1 : 0;

  for (; ; begin += step) {
    result.push(begin);
    if (begin === end) {
      break;
    }
  }

  return result;
}

export function add<E>(receiver: Array<E>, e: E): boolean;
export function add<E>(receiver: Array<E>, index: number, e: E): void;
export function add<E>(receiver: Array<E>, a1: E | number, a2?: E): boolean | void {
  if (arguments.length === 2) {
    receiver.push(a1 as E);
    return true;
  } else {
    receiver.splice(a1 as number, 0, a2 as E);
    return;
  }
}

export function addAll<E>(receiver: Array<E>, c: ReadonlyArray<E>): boolean;
export function addAll<E>(receiver: Array<E>, index: number, c: ReadonlyArray<E>): boolean;
export function addAll<E>(receiver: Array<E>, a1: ReadonlyArray<E> | number, a2?: ReadonlyArray<E>): boolean {
  if (arguments.length === 2) {
    const c = a1 as ReadonlyArray<E>;
    receiver.push(...c);
    return c.length > 0;
  } else {
    const c = a2 as ReadonlyArray<E>;
    receiver.splice(a1 as number, 0, ...c);
    return c.length > 0;
  }
}

export function clear(receiver: any): void {
  if (Array.isArray(receiver)) {
    receiver.splice(0, receiver.length);
  } else if (typeof receiver === 'object') {
    for (const key in receiver) {
      delete receiver[key];
    }
  } else {
    throw new Error('clear() requires an array or an object');
  }
}

export function clone<E>(receiver: ReadonlyArray<E>): Array<E>;
export function clone(receiver: any): any {
  if (Array.isArray(receiver)) {
    return Array.from(receiver);
  } else if (typeof receiver === 'object') {
    return Object.assign({}, receiver);
  } else {
    throw new Error('clone() requires an array or an object');
  }
}

export function contains<E>(receiver: ReadonlyArray<E>, o: any): boolean {
  return receiver.includes(o);
}

export function containsKey(receiver: object, key: any): boolean {
  return key in receiver;
}

export function containsValue(receiver: object, value: any): boolean {
  return Object.values(receiver).includes(value);
}

export function entrySet<V>(receiver: { [key: string]: V }): Entry<string, V>[];
export function entrySet<V>(receiver: ReadonlyArray<V>): Entry<number, V>[];
export function entrySet(receiver: any): Entry<any, any>[] {
  if (Array.isArray(receiver)) {
    return receiver.map((value, key) => ({ key, value }));
  } else if (typeof receiver === 'object') {
    return Object.entries(receiver).map(([key, value]) => ({ key, value }));
  } else {
    throw new Error('entrySet() requires an array or an object');
  }
}

export function get<V>(receiver: { [key: string]: V }, key: string): V;
export function get<V>(receiver: ReadonlyArray<V>, index: number): V;
export function get(receiver: any, a1: any): any {
  if (Array.isArray(receiver) || typeof receiver === 'object') {
    return receiver[a1];
  } else {
    throw new Error('get() requires an array or an object');
  }
}

export function getOrDefault<V>(receiver: any, key: any, deafultValue: V): V {
  if (typeof receiver === 'object') {
    return key in receiver ? receiver[key] : deafultValue;
  } else {
    throw new Error('getOrDefault() requires an object');
  }
}


export function isEmpty(receiver: any) {
  if (Array.isArray(receiver)) {
    return receiver.length === 0;
  } else if (typeof receiver === 'object') {
    return Object.keys(receiver).length === 0;
  } else {
    throw new Error('isEmpty() requires an array or an object');
  }
}

export function keySet(receiver: any) {
  if (typeof receiver === 'object') {
    return Object.keys(receiver);
  } else {
    throw new Error('keySet() requires an object');
  }
}

export function values(receiver: any) {
  if (typeof receiver === 'object') {
    return Object.values(receiver);
  } else {
    throw new Error('keySet() requires an object');
  }
}

export const foreach = new Foreach();

export { JavaString as String }
