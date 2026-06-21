export class MaterialCode {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Material code cannot be empty');
    }
    this._value = value.trim().toUpperCase();
  }

  get value(): string {
    return this._value;
  }

  equals(other: MaterialCode): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

