<?php
require_once '/home/vagrant/project/phpcore/core.inc.php';
authenticate_user();

generate_user_token();
echo $_SESSION['user']['token'];