-- Email template: notifies API subscribers when an API changes or is deactivated.
-- Variables use Thymeleaf inline syntax [[${var}]] processed at runtime.
INSERT INTO atlas.email_template (id, version, code, title, body, description, tags, active, created_at, created_by)
VALUES (
    gen_random_uuid(), 0,
    'API_CHANGE_NOTIFICATION',
    'Powiadomienie o zmianie API',
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
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:bold;background:#e3f2fd;color:#1565c0}
  .footer{background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888}
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Zmiana API: [[${apiName}]]</h1></div>
  <div class="content">
    <p>Subskrybujesz API, które zostało niedawno zmodyfikowane.</p>
    <table class="ft">
      <tr><td>API</td><td><strong>[[${apiName}]]</strong> <span class="badge">[[${apiCode}]]</span></td></tr>
      <tr><td>Wersja</td><td>[[${apiVersion}]]</td></tr>
      <tr><td>System producenta</td><td>[[${producerSystemName}]]</td></tr>
      <tr><td>Typ zmiany</td><td>[[${changeType}]]</td></tr>
      <tr><td>Zmieniono przez</td><td>[[${changedBy}]]</td></tr>
      <tr><td>Data zmiany</td><td>[[${changedAt}]]</td></tr>
    </table>
    <p>Aby zobaczyć szczegóły, zaloguj się do <strong>mesh.atlas</strong>.</p>
  </div>
  <div class="footer">
    <p>Otrzymujesz tę wiadomość, ponieważ subskrybujesz powiadomienia o zmianach API w platformie mesh.atlas.</p>
    <p>Aby zrezygnować z subskrypcji, zaloguj się do mesh.atlas i przejdź do sekcji <em>Moje subskrypcje</em>.</p>
  </div>
</div>
</body>
</html>',
    'Powiadomienie email dla subskrybentów API o zmianach metadanych, dezaktywacji lub zatwierdzeniu governance.',
    '[]',
    TRUE,
    NOW(),
    'system'
);
