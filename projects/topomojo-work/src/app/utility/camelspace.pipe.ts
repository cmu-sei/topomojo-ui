import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelspace'
})
export class CamelspacePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }

}
