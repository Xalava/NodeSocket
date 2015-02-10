
/**
	debug OAuth google
**/
function signinCallback(authResult) {
  if (authResult['status']['signed_in']) {
    // Update the app to reflect a signed in user
    // Hide the sign-in button now that the user is authorized, for example:
    alert('signed');
    document.getElementById('signinButton').setAttribute('style', 'display: none');
  } else {
    // Update the app to reflect a signed out user
    // Possible error values:
    //   "user_signed_out" - User is signed-out
    //   "access_denied" - User denied access to your app
    //   "immediate_failed" - Could not automatically log in the user
    console.log('Sign-in state: ' + authResult['error']);
  }
}



$(document).ready(function(){
socket = io.connect({path:'/socket.io'});
//Au chargement du site, on charge la page d'accueil : home.html
page('home');
});
//Fonction permettant de charger un contenu de page dans la div centrale en ajax
function page(page){

$('.window-page').load(page+'.ejs',function(){

switch(page){
case 'chat':

//ECOUTE D'EVENEMENTS
socket.on('connected', function (data) {
$('#login-container').fadeOut(200);
info('Je suis connecté !');
 
$('#chat-avatar').attr('src',data.user.avatar);
for(var key in data.connected){
console.log(data.connected);
var usr =  data.connected[key];
$('#chat-users').prepend('<li id="user-'+usr.id+'"><img src="'+usr.avatar+'"><span>'+usr.login+'</span></li>');
}
});
socket.on('new_user', function (user) {
info(user.login+' est arrivé!!');
$('#chat-users').prepend('<li id="user-'+user.id+'"><img src="'+user.avatar+'"><span>'+user.login+'</span></li>');
});
socket.on('new_message', function (data) {
message(data);
});

socket.on('left_user', function (user) {
$('#user-'+user.id).remove();
info(user.login+' est partis!!');
});

$('#chat-message').keyup(function(e){

if(e.keyCode==13) send_message();
 
});

$('#login-container input').keyup(function(e){

if(e.keyCode==13) send_login();

});

break;
}
});
}
 
//Affichage d'un message dans le chat : on remplis un "template" de message avec les parametres donnés en arguments et on affiche.
function message(message){
var template = $('#chat-message-template').clone();
$('.chat-message-avatar',template).prepend('<img src="'+message.avatar+'"/>');
$('login',template).replaceWith(message.login);
$('message',template).replaceWith(message.message);
$('date',template).replaceWith(message.date);
$(template).removeAttr('id');
$('#chat-messages').prepend(template);
$(template).fadeIn(300);
}
//Affichage d'une infos serveur dans le chat
function info(message){
$('#chat-messages').prepend('<li><i></i> '+message+'</li>');
}
//Fonction executée lors de l'appuis sur "connexion"
function send_login(){
	console.log($('#login').val());

socket.emit('login',{login:$('#login').val(),password:$('#password').val()});
}
//Fonction executée lors de l'appuis sur entrée dans le champs message de chat
function send_message(){
		alert('send mess');
		socket.emit('message',{message:$('#chat-message').val()});
		$('#chat-message').val('').focus();
}
 
//Fonctions permettant d'afficher et de faire disparaitre le préloader à chaques action ajax
$(document).ajaxStop(function() {
$('.preloader').fadeOut(200);
});
$(document).ajaxStart(function() {
$('.preloader').show();
});