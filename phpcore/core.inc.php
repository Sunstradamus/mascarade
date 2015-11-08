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

function html($data) {
	echo htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, "UTF-8");
}

function secure_session_start() {
	session_name("SID");
	session_start();
	session_regenerate_id(TRUE);
}

// Start the session
secure_session_start();