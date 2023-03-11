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
    this.changed.next(this.skip + this.take);
  }

  prev(): void {
    this.changed.next(Math.max(0, this.skip - this.take));
  }

  top(): void {
    this.changed.next(0);
  }
}
