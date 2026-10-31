// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// The app bootstraps with zone change detection (see main.ts), so tests must too;
// TestBed defaults to zoneless as of Angular 21.
@NgModule({ providers: [provideZoneChangeDetection()] })
class ZoneChangeDetectionModule { }

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  [BrowserDynamicTestingModule, ZoneChangeDetectionModule],
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);
