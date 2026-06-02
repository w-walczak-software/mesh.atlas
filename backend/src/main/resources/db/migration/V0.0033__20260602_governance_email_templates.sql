-- Governance email templates for verifier notifications.
-- Thymeleaf inline variables use [[${var}]] syntax processed at runtime by EmailTemplateProcessingService.
-- Flyway placeholder replacement is disabled globally (placeholder-replacement: false in application.yaml).

INSERT INTO atlas.email_template (id, version, code, title, body, description, tags, active, created_at, created_by)
VALUES (
    gen_random_uuid(), 0,
    'GOVERNANCE_API_CREATED',
    'Nowe API oczekuje na weryfikację',
    '<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><style>
  body{font-family:Arial,sans-serif;color:#333;background:#f5f5f5;margin:0;padding:0}
  .wrapper{max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:#1565C0;color:#fff;padding:24px 32px}
  .header h1{margin:0;font-size:20px}
  .content{padding:28px 32px}
  .ft{width:100%;border-collapse:collapse;margin:20px 0}
  .ft td{padding:8px 12px;border-bottom:1px solid #eee}
  .ft td:first-child{font-weight:bold;color:#555;width:40%}
  .footer{background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888}
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Nowe API oczekuje na weryfikację</h1></div>
  <div class="content">
    <p>Użytkownik <strong>[[${changedBy}]]</strong> zarejestrował nowe API w dniu <strong>[[${changedAt}]]</strong>.</p>
    <p>Jako osoba uprawniona do zatwierdzania zmian w systemie <strong>[[${producerSystemName}]]</strong>, prosimy o weryfikację:</p>
    <table class="ft">
      <tr><td>Kod API</td><td><strong>[[${apiCode}]]</strong></td></tr>
      <tr><td>Nazwa API</td><td>[[${apiName}]]</td></tr>
      <tr><td>Wersja</td><td>[[${apiVersion}]]</td></tr>
      <tr><td>System producent</td><td>[[${producerSystemName}]]</td></tr>
      <tr><td>Zgłoszono przez</td><td>[[${changedBy}]]</td></tr>
      <tr><td>Data zgłoszenia</td><td>[[${changedAt}]]</td></tr>
    </table>
    <p>Zaloguj się do platformy mesh.atlas, aby zatwierdzić lub odrzucić to API.</p>
  </div>
  <div class="footer">Wiadomość wygenerowana automatycznie przez mesh.atlas. Nie odpowiadaj na ten email.</div>
</div>
</body></html>',
    'Wysyłany do weryfikatorów systemu producenta po rejestracji nowego API wymagającego zatwierdzenia.',
    '["governance","api","weryfikacja"]',
    true, now(), 'system'
);

INSERT INTO atlas.email_template (id, version, code, title, body, description, tags, active, created_at, created_by)
VALUES (
    gen_random_uuid(), 0,
    'GOVERNANCE_API_MODIFIED',
    'Modyfikacja API oczekuje na weryfikację',
    '<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><style>
  body{font-family:Arial,sans-serif;color:#333;background:#f5f5f5;margin:0;padding:0}
  .wrapper{max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:#6A1B9A;color:#fff;padding:24px 32px}
  .header h1{margin:0;font-size:20px}
  .content{padding:28px 32px}
  .ft{width:100%;border-collapse:collapse;margin:20px 0}
  .ft td{padding:8px 12px;border-bottom:1px solid #eee}
  .ft td:first-child{font-weight:bold;color:#555;width:40%}
  .footer{background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888}
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Modyfikacja API oczekuje na weryfikację</h1></div>
  <div class="content">
    <p>Użytkownik <strong>[[${changedBy}]]</strong> zmodyfikował API w dniu <strong>[[${changedAt}]]</strong>.</p>
    <p>Jako osoba uprawniona do zatwierdzania zmian w systemie <strong>[[${producerSystemName}]]</strong>, prosimy o weryfikację zmian:</p>
    <table class="ft">
      <tr><td>Kod API</td><td><strong>[[${apiCode}]]</strong></td></tr>
      <tr><td>Nazwa API</td><td>[[${apiName}]]</td></tr>
      <tr><td>Wersja</td><td>[[${apiVersion}]]</td></tr>
      <tr><td>System producent</td><td>[[${producerSystemName}]]</td></tr>
      <tr><td>Zmodyfikowano przez</td><td>[[${changedBy}]]</td></tr>
      <tr><td>Data modyfikacji</td><td>[[${changedAt}]]</td></tr>
    </table>
    <p>API pozostaje widoczne dla wszystkich. Zaloguj się do mesh.atlas, aby zatwierdzić lub odrzucić zmiany.</p>
  </div>
  <div class="footer">Wiadomość wygenerowana automatycznie przez mesh.atlas. Nie odpowiadaj na ten email.</div>
</div>
</body></html>',
    'Wysyłany do weryfikatorów systemu producenta po modyfikacji zweryfikowanego API.',
    '["governance","api","weryfikacja"]',
    true, now(), 'system'
);
