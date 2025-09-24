import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const isGitHubPages = window.location.hostname.includes('github.io');
const baseHref = isGitHubPages ? '/activity-tracking-angular/' : '/';

const baseElement = document.createElement('base');
baseElement.href = baseHref;
document.head.prepend(baseElement);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
