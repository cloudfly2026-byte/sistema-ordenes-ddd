export enum BoxTypeEnum {
  BOX_SMALL = 'BOX_SMALL',
  BOX_MEDIUM = 'BOX_MEDIUM',
  BOX_LARGE = 'BOX_LARGE',
}

export class BoxType {
  private readonly _value: BoxTypeEnum;

  private constructor(value: BoxTypeEnum) {
    this._value = value;
  }

  static readonly SMALL = new BoxType(BoxTypeEnum.BOX_SMALL);
  static readonly MEDIUM = new BoxType(BoxTypeEnum.BOX_MEDIUM);
  static readonly LARGE = new BoxType(BoxTypeEnum.BOX_LARGE);

  static fromString(value: string): BoxType {
    const parsed = Object.values(BoxTypeEnum).find((b) => b === value);
    if (!parsed) {
      throw new Error(`Invalid box type: ${value}`);
    }
    return new BoxType(parsed);
  }

  static fromProductCount(count: number): BoxType {
    if (count <= 0) {
      throw new Error('Product count must be positive');
    }
    if (count <= 2) return BoxType.SMALL;
    if (count <= 5) return BoxType.MEDIUM;
    return BoxType.LARGE;
  }

  get value(): BoxTypeEnum {
    return this._value;
  }

  equals(other: BoxType): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}