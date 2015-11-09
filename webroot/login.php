<?php
require_once '/home/vagrant/project/phpcore/core.inc.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['username'], $_POST['password'])) {
      $mysqli = new mysqli(MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DTBS);
      if ($mysqli->connect_error) {
        throw new Exception('MySQL Error: '.$mysqli->connect_error);
      }

      $username = $_POST['username'];
      $stmt = $mysqli->prepare("SELECT `id`, `username`, `password` FROM `users` WHERE `username`=?");
      $stmt->bind_param("s", $username);
      $stmt->execute();
      $stmt->bind_result($id, $username, $password);
      if ($stmt->fetch() === NULL) {
        // User was not found
        $error_msg = 'Wrong username or password.';
      } else {
        if (password_verify($_POST['password'], $password)) {
          // Valid
          $_SESSION['user']['id'] = $id;
          $_SESSION['user']['username'] = $username;
          $_SESSION['user']['hash'] = md5($id.$_SERVER['HTTP_USER_AGENT']);
          header("Location: ".BASE_URL);
        } else {
          // Invalid
          $error_msg = 'Wrong username or password.';
        }
      }
      $stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mascarade - Login</title>

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" integrity="sha512-dTfge/zgoMYpP7QbHy4gWMEGsbsdZeCXz7irItjcC3sPUFtf0kuFbDz/ixG7ArTxmDjLXDmezHubeNikyKGVyQ==" crossorigin="anonymous">
    <link rel="stylesheet" href="/css/default.css">

    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body>
    <div id="container">
      <div id="content">
        <form class="form-signin" method="post" action="/login.php">
          <h2 class="form-signin-heading">Please sign in</h2>
<?PHP
if (isset($error_msg)):
?>
          <div class="alert alert-danger" role="alert"><?PHP html($error_msg); ?></div>
<?PHP
endif;
?>
          <label for="inputUsername" class="sr-only">Username</label>
          <input type="text" id="inputUsername" name="username" class="form-control" placeholder="Username" required autofocus>
          <label for="inputPassword" class="sr-only">Password</label>
          <input type="password" id="inputPassword" name="password" class="form-control" placeholder="Password" required>
          <div class="row">
            <div class="col-xs-6">
              <a href="/register.php" class="btn btn-lg btn-info btn-block">Register</a>
            </div>
            <div class="col-xs-6">
              <button class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js" integrity="sha512-K1qjQ+NcF2TYO/eI3M6v8EiNYZfA95pQumfvcVrTHtwQVDG+aHRqLi/ETn2uB+1JqwYqVG3LIvdm9lj6imS/pQ==" crossorigin="anonymous"></script>
  </body>
</html>