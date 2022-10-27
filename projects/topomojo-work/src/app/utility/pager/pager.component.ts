import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pager',
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss']
})
export class PagerComponent implements OnInit {
  @Input() skip = 0;
  @Input() take = 0;
  @Input() count = 0;
  @Output() changed = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  next(): void {
    this.skip += this.take;
    this.changed.next(this.skip);
  }

  prev(): void {
    this.skip = Math.max(0, this.skip - this.take);
    this.changed.next(this.skip);
  }

  top(): void {
    this.skip = 0;
    this.changed.next(this.skip);
  }
}
