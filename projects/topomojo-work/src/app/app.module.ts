// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppRoutingModule } from './app-routing.module';
import { ApiModule } from './api/gen/api.module';
import { UtilityModule } from './utility/utility.module';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';

import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';

import { AppComponent } from './app.component';
import { AuthInterceptor } from './auth.interceptor';
import { ConfigService, markedOptionsFactory } from './config.service';
import { UserService } from './user.service';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { OidcComponent } from './oidc/oidc.component';
import { WorkspaceEditorComponent } from './workspace-editor/workspace-editor.component';
import { DocumentEditorComponent } from './document-editor/document-editor.component';
import { TemplatesEditorComponent } from './templates-editor/templates-editor.component';
import { ChallengeEditorComponent } from './challenge-editor/challenge-editor.component';
import { SettingsEditorComponent } from './settings-editor/settings-editor.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { WorkspaceCardComponent } from './workspace-card/workspace-card.component';
import { FilesEditorComponent } from './files-editor/files-editor.component';
import { EnlistComponent } from './enlist/enlist.component';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { TemplateSelectorComponent } from './template-selector/template-selector.component';
import { TemplateEditorFormComponent } from './template-editor-form/template-editor-form.component';
import { ImageManagerComponent } from './image-manager/image-manager.component';
import { VariantFormComponent } from './challenge-editor/variant-form/variant-form.component';
import { QuestionFormComponent } from './challenge-editor/question-form/question-form.component';
import { WorkspaceBrowserComponent } from './workspace-browser/workspace-browser.component';
import { WorkspaceCreatorComponent } from './workspace-creator/workspace-creator.component';
import { PresenceBarComponent } from './presence-bar/presence-bar.component';
import { GamespaceComponent } from './gamespace/gamespace.component';
import { GamespacePreviewComponent } from './gamespace-preview/gamespace-preview.component';
import { WorkspacePlayerComponent } from './workspace-player/workspace-player.component';
import { GamespaceQuizComponent } from './gamespace-quiz/gamespace-quiz.component';
import { IsoManagerComponent } from './iso-manager/iso-manager.component';
import { DropzoneComponent } from './dropzone/dropzone.component';
import { IsoSelectorComponent } from './iso-selector/iso-selector.component';
import { ApikeysComponent } from './apikeys/apikeys.component';
import { GamespaceCardComponent } from './gamespace-card/gamespace-card.component';
import { OidcSilentComponent } from './oidc-silent/oidc-silent.component';
import { GamespaceStateComponent } from './gamespace-state/gamespace-state.component';

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    HomeComponent,
    LoginComponent,
    OidcComponent,
    OidcSilentComponent,
    WorkspaceEditorComponent,
    DocumentEditorComponent,
    TemplatesEditorComponent,
    ChallengeEditorComponent,
    SettingsEditorComponent,
    PageNotFoundComponent,
    WorkspaceCardComponent,
    FilesEditorComponent,
    EnlistComponent,
    TemplateEditorComponent,
    TemplateSelectorComponent,
    TemplateEditorFormComponent,
    ImageManagerComponent,
    VariantFormComponent,
    QuestionFormComponent,
    WorkspaceBrowserComponent,
    WorkspaceCreatorComponent,
    PresenceBarComponent,
    GamespaceComponent,
    GamespacePreviewComponent,
    WorkspacePlayerComponent,
    GamespaceQuizComponent,
    IsoManagerComponent,
    DropzoneComponent,
    IsoSelectorComponent,
    ApikeysComponent,
    GamespaceCardComponent,
    GamespaceStateComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    UtilityModule,
    ApiModule,
    MonacoEditorModule.forRoot(),
    MarkdownModule.forRoot({
      loader: HttpClient,
      markedOptions: {
        provide: MarkedOptions,
        useFactory: markedOptionsFactory,
      },
    }),
    FontAwesomeModule,
    ButtonsModule.forRoot(),
    TooltipModule.forRoot(),
    AlertModule.forRoot(),
    ProgressbarModule.forRoot()
  ],
  exports: [
    ApiModule,
    BrowserModule,
    UtilityModule,
    FontAwesomeModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: loadSettings,
      deps: [ConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: register,
      deps: [UserService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function loadSettings(
  config: ConfigService,
): (() => Observable<any>) {
  return (): Observable<any> => config.load()
  // .pipe(tap(s => console.log('done settings init')))
  ;
}

export function register(
  user: UserService
): (() => Promise<void>) {
  return (): Promise<void> => user.register()
  // .then(() => console.log('done user init'))
  ;
}
