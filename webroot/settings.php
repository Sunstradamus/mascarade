<?php
require_once '/home/vagrant/project/phpcore/core.inc.php';
authenticate_user();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if (isset($_POST['old_password'], $_POST['new_password'], $_POST['verification'])) {
		if ($_POST['new_password'] === $_POST['verification']) {
	      if (mb_strlen($_POST['password']) > 5) {

	      } else {
	        $error_msg = 'Password too short';
	      }
		}
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
  </head>
  <body>
    <div id="background">
      <img src="images/background.jpg" class="stretch" alt="" />
    </div>
    <div class="logo" >
      <img src="images/smallLogo.png" alt="mascarade-logo" />
    </div>
    <div id="container">
      <div id="content">
        <form class="form-registration" method="post" action="/settings.php">
          <h2 class="form-registration-heading">Change Password</h2>
<?PHP
if (isset($error_msg)):
?>
          <div class="alert alert-danger" role="alert"><?PHP html($error_msg); ?></div>
<?PHP
endif;
?>
          <label for="inputUsername" class="sr-only">Old Password</label>
          <input type="text" id="inputUsername" name="old_password" class="form-control" placeholder="Old Password" required autofocus>
          <label for="inputPassword" class="sr-only">New Password</label>
          <input type="password" id="inputPassword" name="new_password" class="form-control" placeholder="New Password" required>
          <label for="inputPassword" class="sr-only">Confirm Password</label>
          <input type="password" id="inputVerification" name="verification" class="form-control" placeholder="Confirm Password" required>
          <button class="btn btn-lg btn-primary btn-block" type="submit">Change</button>
        </form>
      </div>
    </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js" integrity="sha512-K1qjQ+NcF2TYO/eI3M6v8EiNYZfA95pQumfvcVrTHtwQVDG+aHRqLi/ETn2uB+1JqwYqVG3LIvdm9lj6imS/pQ==" crossorigin="anonymous"></script>
  </body>
</html>