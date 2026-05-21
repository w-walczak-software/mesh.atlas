import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HelloService {
  constructor(private httpClient: HttpClient) {}

  getContextUrl(context: string): string {
    return environment.APIUrl + context;
  }

  public getHello(name: string): Observable<string> {
    return this.httpClient
      .get(`${this.getContextUrl('/api/hello')}/${name}`, { responseType: 'text' });
  }

  public getHello2(name: string): Observable<any> {
    return this.httpClient
      .get<any>(`${this.getContextUrl('/api/hello/test')}/${name}`)
      .pipe(map((json) => json));
  }
}
