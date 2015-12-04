<?PHP
require_once '/home/vagrant/project/phpcore/cfg.inc.php';

// Function declarations
function authenticate_user() {
	if (isset($_SESSION['user']['hash'])) {
		if ($_SESSION['user']['hash'] !== md5($_SESSION['user']['id'].$_SERVER['HTTP_USER_AGENT'])) {
			$_SESSION = array();
			header("Location: ".BASE_URL."/login.php");
		}
	} else {
		$_SESSION = array();
		header("Location: ".BASE_URL."/login.php");
	}
}

function generate_user_token() {
	$token = hash('sha512', make_random_string());
	$signature = hash_hmac('sha512', $token, SECRET_KEY);
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, GC_URL."/user_token?username=".$_SESSION['user']['username']);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(array('token' => $token, 'signature' => $signature)));
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	if (curl_exec($ch) !== FALSE) {
		$_SESSION['user']['token'] = $token;
	} else {
		$_SESSION['user']['token'] = '';
	}
	curl_close($ch);
}

function html($data) {
	echo htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, "UTF-8");
}

function make_random_string() {
	$space = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	$string = '';
	for ($i=0; $i < 10 ; $i++) { 
		$string .= $space[rand(0, 61)];
	}
	return $string;
}

function secure_session_start() {
	session_name("SID");
	session_start();
	session_regenerate_id(TRUE);
}

// Start the session
secure_session_start();