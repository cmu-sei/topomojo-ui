import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AdminService, ThemeInfo } from '../../api/admin.service';

@Component({
  selector: 'app-setting-browser',
  templateUrl: './setting-browser.component.html',
  styleUrls: ['./setting-browser.component.scss'],
  standalone: false
})
export class SettingBrowserComponent implements OnInit {
  previewUrl: string | null = null;
  error = '';
  uploading = false;

  constructor(
    private admin: AdminService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.admin.getTheme().subscribe({
      next: (r) => {
        this.previewUrl = r.backgroundUrl;
        this.applyBackground(r.backgroundUrl);
      },
      error: (err) => (this.error = `Could not load theme settings (${err.status}).`),
    });
  }

  onFileSelected(event: Event): void {
    this.error = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error = 'Please choose an image file.';
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.error = 'Image is too large. Please use an image under 5MB.';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    this.previewUrl = localPreview;

    this.uploading = true;

    this.admin.uploadBackground(file).subscribe({
      next: (r) => {
        this.previewUrl = r.backgroundUrl;
        this.applyBackground(r.backgroundUrl);
        this.uploading = false;
        URL.revokeObjectURL(localPreview);
      },
      error: (err) => {
        this.uploading = false;
        this.error = `Upload failed (${err.status} ${err.statusText}).`;
      },
    });

    input.value = '';
  }

  clearBackground(): void {
    this.error = '';
    this.admin.clearBackground().subscribe({
      next: (r) => {
        this.previewUrl = r.backgroundUrl;
        this.applyBackground(r.backgroundUrl);
      },
      error: (err) => {
        this.error = `Could not clear background (${err.status} ${err.statusText}).`;
      },
    });
  }

  private applyBackground(url: string | null): void {
    const root = this.document.documentElement;
    root.style.setProperty('--app-bg-image', url ? `url("${url}")` : 'none');
    root.classList.toggle('has-bg-image', !!url);
  }

}
