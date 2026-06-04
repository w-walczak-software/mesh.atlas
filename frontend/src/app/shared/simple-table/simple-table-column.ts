import { contentChild, Directive, input, TemplateRef } from '@angular/core';

@Directive({ selector: 'app-column' })
export class AppSimpleTableColumn<T = unknown> {
  readonly name = input.required<string>();
  readonly header = input.required<string>();
  readonly cellTpl = contentChild<TemplateRef<{ $implicit: T }>>('cell');
}
