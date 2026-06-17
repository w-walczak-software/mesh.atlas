import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import type { KeycloakTokenParsed } from 'keycloak-js';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '@environments/environment';
import type { AuthUser } from './jwt.model';

const SUPPORTED_LANGS = ['pl', 'en'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private keycloak!: Keycloak;
  private readonly http = inject(HttpClient);
  private readonly transloco = inject(TranslocoService);

  private readonly _user = signal<AuthUser | null>(null);
  private loginInProgress = false;

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);

  async init(): Promise<void> {
    this.keycloak = new Keycloak(environment.keycloak);

    await this.keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    this._user.set(this.parseUser(this.keycloak.tokenParsed));
    this.scheduleTokenRefresh();
    await this.syncLanguage();
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.roles().includes(r));
  }

  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }

  login(): void {
    if (this.loginInProgress) return;
    this.loginInProgress = true;
    this.keycloak.login();
  }

  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  async ensureFreshToken(): Promise<string | undefined> {
    try {
      await this.keycloak.updateToken(5);
      return this.keycloak.token;
    } catch {
      this.login();
      return undefined;
    }
  }

  private parseUser(parsed: KeycloakTokenParsed | undefined): AuthUser | null {
    if (!parsed?.sub) return null;

    const clientId = environment.keycloak.clientId;
    const clientRoles: string[] =
      (parsed['resource_access'] as Record<string, { roles: string[] }>)?.[clientId]?.roles ?? [];
    const realmRoles: string[] =
      (parsed['realm_access'] as { roles: string[] })?.roles ?? [];

    const roles = [...new Set([...clientRoles, ...realmRoles])];
    const firstName: string | undefined = parsed['given_name'] as string | undefined;
    const lastName: string | undefined = parsed['family_name'] as string | undefined;
    const fullName: string = (parsed['name'] as string | undefined) ?? '';

    return {
      id: parsed.sub,
      email: (parsed['email'] as string | undefined) ?? '',
      username: (parsed['preferred_username'] as string | undefined) ?? parsed.sub,
      fullName,
      firstName,
      lastName,
      roles,
      initials: this.initials(firstName, lastName, fullName),
    };
  }

  private initials(firstName?: string, lastName?: string, fullName?: string): string {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return (fullName ?? '??').slice(0, 2).toUpperCase();
  }

  private async syncLanguage(): Promise<void> {
    try {
      const url = `${environment.APIUrl}/api/v1/admin/system-parameters/by-key/DEFAULT_LANGUAGE`;
      const param = await firstValueFrom(this.http.get<{ stringValue: string }>(url));
      const lang = param.stringValue?.toLowerCase();
      if (lang && SUPPORTED_LANGS.includes(lang)) {
        localStorage.setItem('lang', lang);
        this.transloco.setActiveLang(lang);
      }
    } catch {
      // keep language already set from localStorage
    }
  }

  private scheduleTokenRefresh(): void {
    this.keycloak.onTokenExpired = () => {
      this.keycloak.updateToken(30).catch(() => this.login());
    };
  }
}
