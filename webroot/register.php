<?php
require_once '/home/vagrant/project/phpcore/core.inc.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$mysqli = new mysqli(MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DTBS);
	if ($mysqli->connect_error) {
		throw new Exception('MySQL Error: '.$mysqli->connect_error);
	}
	
	$username = $_POST['username'];
	$password = $_POST['password'];
	$confirmPass = $_POST['confirmPass'];
}
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Mascarade - Register</title>

		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" integrity="sha512-dTfge/zgoMYpP7QbHy4gWMEGsbsdZeCXz7irItjcC3sPUFtf0kuFbDz/ixG7ArTxmDjLXDmezHubeNikyKGVyQ==" crossorigin="anonymous">
		<link rel="stylesheet" href="/css/default.css">

		<!--[if lt IE 9]>
			<script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
			<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
		<![endif]-->
		<script src="js/jquery/jquery-2.1.4.min.js"></script>
		<script src="js/register.js"></script>
	</head>
	<body>
		<div id="container">
			<div id="content">
				<div class="row">
					<div class="col-xs-4 col-xs-offset-4">
						<div id="errorsGoHere"></div>
						<form action="/register.php" id="register" method="post">
							<div class="form-group">
								<label for="username" class="control-label">User Name</label>
								<input type="text" class="form-control" id="username" name="username" />
							</div>
							<div class="form-group">
								<label for="password" class="control-label">Password</label>
								<input type="password" class="form-control" id="password" name="password" />
							</div>
							<div class="form-group">
								<label for="confirmPass" class="control-label">Confirm Password</label>
								<input type="password" class="form-control" id="confirmPass" name="confirmPass" />
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</body>
</html>