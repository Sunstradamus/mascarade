$(document).ready(INIT);
var errorDiv = 
'<div class="alert alert-warning alert-dismissible" role="alert">' +
'	<button type="button" class="close" data-dismiss="alert" aria-label="Close">' + 
'	<span aria-hidden="true">&times;</span></button>' +
'	__errorMsg__' +
'</div>';

function INIT() {
	$('#register').submit(validate);
}

function validate(event) {
	var $username = $('#username');
	var $password = $('#password');
	var confirmPass = $('#confirmPass');
	
	var errorMsg = errorDiv;

	if ($username.val() == '') {
		$username.closest('.form-group').addClass('has-error');
		$("#errorsGoHere").append(errorMsg.replace('__errorMsg__', "Please enter a username."));
		return false;
	} else if ($password.val() == '') {
		$password.closest('.form-group').addClass('has-error');
		$("#errorsGoHere").append(errorMsg.replace('__errorMsg__', "Please enter a password."));
		return false;
	} else if ($confirmPass.val() == '') {
		$confirmPass.closest('.form-group').addClass('has-error');
		$("#errorsGoHere").append(errorMsg.replace('__errorMsg__', "Please confirm your password."));
		return false;
	} else if ($password.val() != $confirmPass.val()) {
		$password.closest('.form-group').addClass('has-error');
		$confirmPass.closest('.form-group').addClass('has-error');
		$("#errorsGoHere").append(errorMsg.replace('__errorMsg__', "Your passwords don't match."));
		return false;
	}
	return true;
}