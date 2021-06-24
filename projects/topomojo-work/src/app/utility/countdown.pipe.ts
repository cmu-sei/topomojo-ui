import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countdown'
})
export class CountdownPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): unknown {
    const tag = [ 's', 'm', 'h', 'd' ];
    const a: number[] = [
      value / 1000,
      value / 1000 / 60,
      value / 1000 / 60 / 60,
      value / 1000 / 60 / 60 / 24
    ];

    let r = '';

    for (let i = 0; i < a.length; i++) {
      value = Math.floor(a[i]);
      if (!!value) {
        r = value + tag[i];
      }
    }
    return r;
  }

}
