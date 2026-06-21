import { Injectable } from '@nestjs/common';
import { BoxType } from '../value-objects/box-type.vo';

@Injectable()
export class BoxSelectionPolicy {
  selectBoxType(totalProducts: number): BoxType {
    if (totalProducts <= 0) {
      throw new Error('Cannot select box for empty order');
    }
    if (totalProducts <= 2) {
      return BoxType.SMALL;
    }
    if (totalProducts <= 5) {
      return BoxType.MEDIUM;
    }
    return BoxType.LARGE;
  }
}
