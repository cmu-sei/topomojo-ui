// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';
import { EnlistComponent } from './enlist/enlist.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { OidcComponent } from './oidc/oidc.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { WorkspaceEditorComponent } from './workspace-editor/workspace-editor.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'oidc', component: OidcComponent },
  { path: '', canActivate: [AuthGuard], canActivateChild: [AuthGuard], children: [
    { path: 'enlist/:code', component: EnlistComponent },
    { path: 'topo/:id', pathMatch: 'full', redirectTo: 'topo/:id/settings'},
    { path: 'topo/:id/:section', component: WorkspaceEditorComponent},
    {
      path: 'admin',
      canLoad: [AdminGuard], canActivate: [AdminGuard], canActivateChild: [AdminGuard],
      loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
    },
  ]},
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
