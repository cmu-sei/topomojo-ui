import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'jsonParse',
    standalone: false
})
export class JsonParsePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): any {
    return JSON.parse(value);
  }

}
