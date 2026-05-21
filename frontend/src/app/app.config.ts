import { ApplicationConfig, APP_INITIALIZER, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { apiInterceptor } from './core/http/api.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTransloco, provideTranslocoFallbackStrategy } from '@jsverse/transloco';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { ScopeSafeFallbackStrategy } from './core/i18n/transloco-fallback.strategy';

const savedLang = (() => {
  try { return localStorage.getItem('lang') ?? 'en'; } catch { return 'en'; }
})();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiInterceptor])),
    provideAnimationsAsync(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'pl'],
        defaultLang: savedLang,
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoFallbackStrategy(ScopeSafeFallbackStrategy),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.init(),
      deps: [AuthService],
      multi: true,
    },
  ],
};
