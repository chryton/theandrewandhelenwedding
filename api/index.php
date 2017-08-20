<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require 'vendor/autoload.php';
require 'config.php';

$config['displayErrorDetails'] = true;
$config['addContentLengthHeader'] = false;

$app = new \Slim\App(["settings" => $config]);
$container = $app->getContainer();

$container['logger'] = function($c) {
	$logger = new \Monolog\Logger('my_logger');
	$file_handler = new \Monolog\Handler\StreamHandler("logs/app.log");
	$logger->pushHandler($file_handler);
	return $logger;
};



/**
 * Returns an authorized API client.
 * @return Google_Client the authorized client object
 */
function getClient() {
  $client = new Google_Client();
  $client->setApplicationName(APPLICATION_NAME);
  $client->setScopes(SCOPES);
  $client->setAuthConfig(CLIENT_SECRET_PATH);
  $client->setAccessType('offline');

  // Load previously authorized credentials from a file.
  $credentialsPath = expandHomeDirectory(CREDENTIALS_PATH);
  if (file_exists($credentialsPath)) {
    $accessToken = json_decode(file_get_contents($credentialsPath), true);
  } else {
    // Request authorization from the user.
    $authUrl = $client->createAuthUrl();
    printf("Open the following link in your browser:\n%s\n", $authUrl);
    print 'Enter verification code: ';
    $authCode = trim(fgets(STDIN));

    // Exchange authorization code for an access token.
    $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);

    // Store the credentials to disk.
    if(!file_exists(dirname($credentialsPath))) {
      mkdir(dirname($credentialsPath), 0700, true);
    }
    file_put_contents($credentialsPath, json_encode($accessToken));
    printf("Credentials saved to %s\n", $credentialsPath);
  }

  $client->setAccessToken($accessToken);

  // Refresh the token if it's expired.
  if ($client->isAccessTokenExpired()) {
    $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
    file_put_contents($credentialsPath, json_encode($client->getAccessToken()));
  }
  return $client;
}

/**
 * Expands the home directory alias '~' to the full path.
 * @param string $path the path to expand.
 * @return string the expanded path.
 */
function expandHomeDirectory($path) {
  $homeDirectory = getenv('HOME');
  if (empty($homeDirectory)) {
    $homeDirectory = getenv('HOMEDRIVE') . getenv('HOMEPATH');
  }
  return str_replace('~', realpath($homeDirectory), $path);
}

//////////////////
// START ROUTES
//////////////////

$app->get('/hello/{name}', function (Request $request, Response $response) {
	$name = $request->getAttribute('name');
	$response->getBody()->write("Hello, $name");
	$this->logger->addInfo("Something interesting happened");
	$this->logger->addInfo($name);

	return $response;
});

$app->get('/check', function (Request $request, Response $response){

	$is_invited = false;
	$return_data['isInvited'] = false;
	$data = $request->getQueryParams();

	// MAKE CALL TO SHEETS API HERE

	// // Get the API client and construct the service object.
	$client = getClient();
	$service = new Google_Service_Sheets($client);

	$spreadsheetId = SHEET_ID;
	$range = 'A4:U';
	$gresponse = $service->spreadsheets_values->get($spreadsheetId, $range);
	$sheets_return = $gresponse->getValues();

	foreach ($sheets_return as $row) {
		if ($row[7] == $data['zipcode'] && $row[8] == $data['id']){
			$is_invited = true;

			$return_data['isInvited'] = true;
			$return_data['message'] = $row[11];
			$return_data['rowId'] = $row[8];
			$return_data['attendees'] = array();
			$return_data['attendees'][0]['attendee'] = $row[12];
			$return_data['attendees'][0]['attendeeFood'] = $row[13];
			$return_data['attendees'][1]['attendee'] = $row[14];
			$return_data['attendees'][1]['attendeeFood'] = $row[15];
			$return_data['attendees'][2]['attendee'] = $row[16];
			$return_data['attendees'][2]['attendeeFood'] = $row[17];

			break;
		}
	}
	
	$json_response = $response->withJson($return_data);
	
	return $json_response;
});

$app->post('/update', function (Request $request, Response $response){

	$data = $request->getParsedBody();

	// CALL TO SHEETS API HERE

	$client = getClient();
	$service = new Google_Service_Sheets($client);

	$optParams = [];
	$optParams['valueInputOption'] = 'USER_ENTERED';
	$spreadsheetId = SHEET_ID;
	$row_id = explode("18", (string)$data['id']);
	$range = 'K' . $row_id[0] .':U' . $row_id[0];

	$requestBodyNames = array(
		array(
			$data['message']
		)
	);

	for ($i=0; $i < count($data['attendees']); $i++) { 
		$requestBodyNames[0][] = $data['attendees'][$i]["name"];
		$requestBodyNames[0][] = $data['attendees'][$i]["food"];
	}

	$requestBodyStatus = array(array(true, $data['attending']));

	$gdata = array();
	$gdata[] = new Google_Service_Sheets_ValueRange(array(
		'range' => $range,
		'values' => $requestBodyNames
	));	

	$gdata[] = new Google_Service_Sheets_ValueRange(array(
		'range' => 'A' . $row_id[0] .':B' . $row_id[0],
		'values' => $requestBodyStatus
	));	


	$body = new Google_Service_Sheets_BatchUpdateValuesRequest(array(
		'valueInputOption' => $optParams['valueInputOption'],
		'data' => $gdata
	));
	$result = $service->spreadsheets_values->batchUpdate($spreadsheetId, $body);	

	$json_response = $response->withJson($result);
	
	// return var_dump($requestBodyNames);
	return $json_response;
});

$app->run();