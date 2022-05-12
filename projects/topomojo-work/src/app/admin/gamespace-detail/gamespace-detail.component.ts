import { Component, Input, OnInit } from '@angular/core';
import { NotificationService } from '../../notification.service';

@Component({
  selector: 'app-gamespace-detail',
  templateUrl: './gamespace-detail.component.html',
  styleUrls: ['./gamespace-detail.component.scss']
})
export class GamespaceDetailComponent implements OnInit {
  @Input() detail: any;

  constructor(
    hub: NotificationService
  ) { }

  ngOnInit(): void {
  }

}
