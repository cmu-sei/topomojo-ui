import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-oidc-silent',
  templateUrl: './oidc-silent.component.html',
  styleUrls: ['./oidc-silent.component.scss']
})
export class OidcSilentComponent implements OnInit {

  constructor(
    auth: AuthService
  ) {

    auth.silentLoginCallback();

  }

  ngOnInit(): void {
  }

}
