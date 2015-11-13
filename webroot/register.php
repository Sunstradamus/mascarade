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
	
	if (strcmp($password, $confirmPass) == 0) {
		$stmt = $mysqli->prepare("SELECT `username`, FROM `users` WHERE `username`=?");
		$stmt->bind_param("s", $username);
		$stmt->execute();
		$stmt->bind_result($username);
		
		if ($stmt->fetch() === NULL) {
			$stmt = $mysqli->prepare("INSERT INTO `users` (`username`, `password`) VALUES (?, ?)");
			$stmt->bind_param("ss", $username. $password);
			$stmt->execute();
			$success_msg = "Account created.";
		} else {
			$error_msg = "That username is already taken.";
		}
		$stmt->close();
	} else {
		$error_msg = "Your passwords don't match.";
	}
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
				<div id="errorsGoHere"></div>
				<?PHP
				if (isset($success_msg)):
				?>
				<div class="alert alert-success" role="alert"><?PHP html($success_msg); ?></div>
				<?PHP
				endif;
				?>
				<?PHP
				if (isset($error_msg)):
				?>
				<div class="alert alert-error" role="alert"><?PHP html($error_msg); ?></div>
				<?PHP
				endif; 
				?>
				<form action="/register.php" id="register" class="form-register" method="post">
					<h2 class="form-register-heading">Register</h2>
					<div class="form-group">
						<label for="username" class="sr-only">User Name</label>
						<input type="text" class="form-control" id="username" name="username" placeholder="Username" required />
					</div>
					<div class="form-group">
						<label for="password" class="sr-only">Password</label>
						<input type="password" class="form-control" id="password" name="password" placeholder="Password" required />
					</div>
					<div class="form-group">
						<label for="confirmPass" class="sr-only">Confirm Password</label>
						<input type="password" class="form-control" id="confirmPass" name="confirmPass"  placeholder="Confirm Password" required />
					</div>
					<div class="row">
						<div class="col-xs-6">
						  <button class="btn btn-lg btn-primary btn-block" type="submit">Register</button>
						</div>
						<div class="col-xs-6">
						  <a href="/login.php" class="btn btn-lg btn-default btn-block">Cancel</a>
						</div>
				  </div>
				</form>
			</div>
		</div>
	</body>
</html>