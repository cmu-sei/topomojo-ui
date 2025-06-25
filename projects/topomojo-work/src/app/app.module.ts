// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppRoutingModule } from './app-routing.module';
import { ApiModule } from './api/gen/api.module';
import { UtilityModule } from './utility/utility.module';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MarkdownModule, MARKED_OPTIONS, MarkedOptions } from 'ngx-markdown';

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
import { GamespaceStateComponent } from './gamespace-state/gamespace-state.component';
import { GamespaceJoinComponent } from './gamespace-join/gamespace-join.component';

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    HomeComponent,
    LoginComponent,
    OidcComponent,
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
    GamespaceStateComponent,
    GamespaceJoinComponent
  ],
  exports: [
    ApiModule,
    BrowserModule,
    UtilityModule,
    FontAwesomeModule
  ],
  bootstrap: [AppComponent], imports: [BrowserModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UtilityModule,
    ApiModule,
    MonacoEditorModule.forRoot(),
    MarkdownModule.forRoot({
      loader: HttpClient,
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: markedOptionsFactory,
      }
    }),
    FontAwesomeModule,
    ButtonsModule.forRoot(),
    TooltipModule.forRoot(),
    AlertModule.forRoot(),
    ProgressbarModule.forRoot()], providers: [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi: true,
      },
      provideAppInitializer(() => {
        const initializerFn = (loadSettings)(inject(ConfigService));
        return initializerFn();
      }),
      provideAppInitializer(() => {
        const initializerFn = (register)(inject(UserService));
        return initializerFn();
      }),
      provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AppModule { }

export function loadSettings(
  config: ConfigService,
): (() => Observable<any>) {
  return (): Observable<any> => config.load();
}

export function register(
  user: UserService,
): (() => Promise<void>) {
  return (): Promise<void> => user.register();
}
