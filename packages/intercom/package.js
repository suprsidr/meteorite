Package.describe({
  summary: "Intercom package"
});
Package.on_use(function (api) {
  api.add_files('intercom_loader.js', 'client');
  api.add_files('intercom_server.js', 'server');
  api.export('IntercomHash', 'server');
});