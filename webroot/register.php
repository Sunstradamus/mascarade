<?php
require_once '/home/vagrant/project/phpcore/core.inc.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['username'], $_POST['password'], $_POST['verification'])) {
    $mysqli = new mysqli(MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DTBS);
    if ($mysqli->connect_error) {
      throw new Exception('MySQL Error: '.$mysqli->connect_error);
    }
  }

  if ($_POST['password'] === $_POST['verification']) {
    if (mb_strlen($_POST['password']) > 5) {
      if (mb_strlen($_POST['username']) > 5 && mb_strlen($_POST['username']) < 21) {
        if (ctype_alnum($_POST['username'])) {
          $username = $_POST['username'];
          $stmt = $mysqli->prepare("SELECT `id`, `username`, `password` FROM `users` WHERE `username`=?");
          $stmt->bind_param("s", $username);
          $stmt->execute();
          if ($stmt->fetch() === NULL) {
            $stmt->close();
            $stmt = $mysqli->prepare("INSERT INTO `users`(`username`, `password`) VALUES (?, ?)");
            $stmt->bind_param("ss", $username, $password);
            $username = $_POST['username'];
            $password = password_hash($_POST['password'], PASSWORD_BCRYPT);
            $stmt->execute();

            $_SESSION['user']['id'] = $mysqli->insert_id;
            $_SESSION['user']['username'] = $_POST['username'];
            $_SESSION['user']['hash'] = md5($mysqli->insert_id.$_SERVER['HTTP_USER_AGENT']);
            generate_user_token();
            header("Location: ".BASE_URL);
          } else {
            $stmt->close();
            $error_msg = 'Username already in use';
          }
        } else {
          $error_msg = 'Username can only consist of alphanumeric characters';
        }
      } else {
        $error_msg = 'Bad username length';
      }
    } else {
      $error_msg = 'Password too short';
    }
  } else {
    $error_msg = 'Passwords did not match';
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
        <form class="form-registration" method="post" action="/register.php">
          <h2 class="form-registration-heading">Registration</h2>
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
          <label for="inputPassword" class="sr-only">Confirm Password</label>
          <input type="password" id="inputVerification" name="verification" class="form-control" placeholder="Confirm Password" required>
          <button class="btn btn-lg btn-primary btn-block" type="submit">Register</button>
        </form>
      </div>
    </div>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js" integrity="sha512-K1qjQ+NcF2TYO/eI3M6v8EiNYZfA95pQumfvcVrTHtwQVDG+aHRqLi/ETn2uB+1JqwYqVG3LIvdm9lj6imS/pQ==" crossorigin="anonymous"></script>
  </body>
</html>