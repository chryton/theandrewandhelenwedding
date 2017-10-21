<?php

define('SHEETS_KEY', '000000000'); // Google Sheets API Key
define('SHEET_ID', '000000000'); // Google Sheet ID

define('APPLICATION_NAME', 'Wedding Site');
define('CREDENTIALS_PATH', 'credentials/sheets.googleapis.creds.json');
define('CLIENT_SECRET_PATH', 'credentials/client_secret.json');

define('SCOPES', implode(' ', array(
  Google_Service_Sheets::SPREADSHEETS)
));