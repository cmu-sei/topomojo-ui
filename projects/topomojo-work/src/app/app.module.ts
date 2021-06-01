// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AlertModule } from 'ngx-bootstrap/alert';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { ApiModule } from './api/gen/api.module';
import { AppRoutingModule } from './app-routing.module';
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
import { ClipspanComponent } from './clipspan/clipspan.component';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { VmControllerComponent } from './vm-controller/vm-controller.component';
import { TemplateSelectorComponent } from './template-selector/template-selector.component';
import { ErrorDivComponent } from './error-div/error-div.component';
import { TemplateEditorFormComponent } from './template-editor-form/template-editor-form.component';
import { ConfirmButtonComponent } from './confirm-button/confirm-button.component';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { ImageManagerComponent } from './image-manager/image-manager.component';
import { VariantFormComponent } from './challenge-editor/variant-form/variant-form.component';
import { QuestionFormComponent } from './challenge-editor/question-form/question-form.component';
import { WorkspaceBrowserComponent } from './workspace-browser/workspace-browser.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { WorkspaceCreatorComponent } from './workspace-creator/workspace-creator.component';
import { PresenceBarComponent } from './presence-bar/presence-bar.component';
import { GamespaceComponent } from './gamespace/gamespace.component';
import { GamespacePreviewComponent } from './gamespace-preview/gamespace-preview.component';
import { WorkspacePlayerComponent } from './workspace-player/workspace-player.component';
import { GamespaceQuizComponent } from './gamespace-quiz/gamespace-quiz.component';
import { IsoManagerComponent } from './iso-manager/iso-manager.component';
import { DropzoneComponent } from './dropzone/dropzone.component';
import { IsoSelectorComponent } from './iso-selector/iso-selector.component';
import { SpacesPipe } from './spaces.pipe';

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
    ClipspanComponent,
    TemplateEditorComponent,
    VmControllerComponent,
    TemplateSelectorComponent,
    ErrorDivComponent,
    TemplateEditorFormComponent,
    ConfirmButtonComponent,
    ImageManagerComponent,
    VariantFormComponent,
    QuestionFormComponent,
    WorkspaceBrowserComponent,
    SpinnerComponent,
    WorkspaceCreatorComponent,
    PresenceBarComponent,
    GamespaceComponent,
    GamespacePreviewComponent,
    WorkspacePlayerComponent,
    GamespaceQuizComponent,
    IsoManagerComponent,
    DropzoneComponent,
    IsoSelectorComponent,
    SpacesPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
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
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot()
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
  config: ConfigService
): (() => void) {
  return () => config.load();
}
export function register(
  user: UserService
): (() => void) {
  return () => user.register();
}
