-- System parameter: comma-separated list of admin emails to receive sync reports.
-- Empty value means notifications are disabled.
INSERT INTO atlas.system_parameter (parameter_key, parameter_name, parameter_type, string_value,
    system_defined, category, description, created_by)
VALUES (
    'SYNC_ADMIN_NOTIFICATION_EMAILS',
    'Sync – powiadomienia email administratorów',
    'STRING',
    '',
    true,
    'INTEGRATION',
    'Adresy email administratorów (rozdzielone przecinkiem) otrzymujących raport po każdej synchronizacji potoków. Puste = brak powiadomień.',
    'system'
);

-- Email template: sync execution report sent to admins after pipeline sync completes.
-- Variables: pipelineName, pipelineCode, targetEntity, status, executedBy,
--            executedAt, completedAt, duration, totalCount, successCount, failedCount, skippedCount
INSERT INTO atlas.email_template (id, version, code, title, body, description, tags, active, created_at, created_by)
VALUES (
    gen_random_uuid(), 0,
    'SYNC_EXECUTION_REPORT',
    'Raport synchronizacji potoku: [[${pipelineCode}]]',
    '<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><style>
  body{font-family:Arial,sans-serif;color:#333;background:#f5f5f5;margin:0;padding:0}
  .wrapper{max-width:680px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:#1565C0;color:#fff;padding:24px 32px}
  .header h1{margin:0;font-size:20px;font-weight:600}
  .header p{margin:6px 0 0;font-size:13px;opacity:.85}
  .content{padding:28px 32px}
  .status-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:20px}
  .status-completed{background:#E8F5E9;color:#2E7D32}
  .status-partial{background:#FFF8E1;color:#F57F17}
  .status-failed{background:#FFEBEE;color:#C62828}
  .status-running{background:#E3F2FD;color:#1565C0}
  .ft{width:100%;border-collapse:collapse;margin:16px 0}
  .ft td{padding:9px 12px;border-bottom:1px solid #eee;font-size:14px}
  .ft td:first-child{font-weight:600;color:#555;width:42%;white-space:nowrap}
  .counts{display:flex;gap:12px;margin:20px 0;flex-wrap:wrap}
  .count-box{flex:1;min-width:100px;padding:14px 16px;border-radius:6px;text-align:center}
  .count-box .num{font-size:26px;font-weight:700;margin:0}
  .count-box .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin:2px 0 0;opacity:.75}
  .c-total{background:#E3F2FD;color:#1565C0}
  .c-success{background:#E8F5E9;color:#2E7D32}
  .c-failed{background:#FFEBEE;color:#C62828}
  .c-skipped{background:#F5F5F5;color:#616161}
  .footer{background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee}
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Raport synchronizacji</h1>
    <p>Potok: <strong>[[${pipelineCode}]]</strong> &mdash; [[${pipelineName}]]</p>
  </div>
  <div class="content">
    <div th:switch="${status}">
      <span th:case="''COMPLETED''" class="status-badge status-completed">&#10003; ZAKOŃCZONA</span>
      <span th:case="''PARTIAL''" class="status-badge status-partial">&#9888; CZĘŚCIOWA</span>
      <span th:case="''FAILED''" class="status-badge status-failed">&#10007; BŁĄD</span>
      <span th:case="*" class="status-badge status-running">[[${status}]]</span>
    </div>

    <table class="ft">
      <tr><td>Potok</td><td><strong>[[${pipelineCode}]]</strong> &mdash; [[${pipelineName}]]</td></tr>
      <tr><td>Encja docelowa</td><td>[[${targetEntity}]]</td></tr>
      <tr><td>Wyzwolona przez</td><td>[[${executedBy}]]</td></tr>
      <tr><td>Czas rozpoczęcia</td><td>[[${executedAt}]]</td></tr>
      <tr><td>Czas zakończenia</td><td>[[${completedAt}]]</td></tr>
      <tr><td>Czas trwania</td><td>[[${duration}]]</td></tr>
    </table>

    <div class="counts">
      <div class="count-box c-total">
        <p class="num">[[${totalCount}]]</p>
        <p class="lbl">Łącznie</p>
      </div>
      <div class="count-box c-success">
        <p class="num">[[${successCount}]]</p>
        <p class="lbl">Sukces</p>
      </div>
      <div class="count-box c-failed">
        <p class="num">[[${failedCount}]]</p>
        <p class="lbl">Błędy</p>
      </div>
      <div class="count-box c-skipped">
        <p class="num">[[${skippedCount}]]</p>
        <p class="lbl">Pominięte</p>
      </div>
    </div>

    <p style="font-size:13px;color:#666;margin-top:16px">
      Szczegóły synchronizacji dostępne są w rejestrze synchronizacji platformy mesh.atlas.
    </p>
  </div>
  <div class="footer">Wiadomość wygenerowana automatycznie przez mesh.atlas. Nie odpowiadaj na ten email.</div>
</div>
</body></html>',
    'Raport wysyłany do administratorów po każdorazowym zakończeniu synchronizacji potoku integracyjnego.',
    '["integration","sync","report","admin"]',
    true, now(), 'system'
);
