import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { SystemParameterService } from '../../admin/settings/system-parameter.service';

@Injectable({ providedIn: 'root' })
export class GovernanceService {
  private readonly systemParamService = inject(SystemParameterService);

  isGovernanceEnabledOnApiCreate(): Observable<boolean> {
    return this.systemParamService.findByKey('GOVERNANCE_ENABLED_ON_API_CREATE').pipe(
      map(p => p.booleanValue === true),
      catchError(() => of(false)),
    );
  }
}
