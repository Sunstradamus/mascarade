<?PHP
require_once '/home/vagrant/project/phpcore/cfg.inc.php';

// Function declarations
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