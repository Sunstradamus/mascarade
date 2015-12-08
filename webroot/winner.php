<?php
require_once '/home/vagrant/project/phpcore/core.inc.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if (isset($_POST['winners'], $_POST['signature'])) {
		$signature = hash_hmac('sha512', $_POST['winners'], SECRET_KEY);
		if ($signature == $_POST['signature']) {
			$winners = json_decode($_POST['signature']);
		}
	}
}