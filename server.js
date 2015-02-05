//Récuperation de nos configuration perssonalisées
conf = require('./conf.json');
//Inclusion de la librairie http permettant de créer un serveur web
http = require('http');
//Récuperation de la librairie url qui facilite l'analyse de l'url des requetes reçues
url = require('url');
//Récuperation de la librairie fs qui permet la gestion de fichiers (ecriture, lecture...)
fs = require('fs');

//Création d'un serveur http sur le port spécifié dans conf.json (section http)
//Dès qu'une requetes est reçu sur 127.0.0.1:port, la fonction onRequest est executée
//et prends pour parametre un objet requete (ce qui est recu) et un objet réponse (ce que le serveur vas retourner)
var httpServer = http.createServer(onRequest).listen(conf.http.port);

//Fonction onRequest est executée à chaques requete sur le serveur
function onRequest(request, response) {
		//On récupere l'url requise et on la parse pour n'avoir que la partie qui nous interesse
		var pathname = url.parse(request.url).pathname;
		//On récupère l'extension du fichier requis (html,css,js,jpg...)
		var extension = pathname.split('.').pop();
		//Si l'utilisateur ne spécifie pas de page, on prend l'index par défaut 'index.html' (spécifié dans conf.json)
		if(pathname=='/') pathname = conf.http.index;
		//On définis l'entete de réponse au code 200 signifiant : "succès de la requete" et
		//on définit le type mime du fichier de retour (image/jpg pour un jpg, text/css pour un css etc..)
		//Les types mimes sont définit dans le fichier json conf.
		response.writeHead(200, {'Content-Type': conf.http.mime[extension]});
		try {
			//On lit le contenu du fichier demandé (en ajoutant la racine www spécifiée dans conf.json)
			//et on le retour a l'utilisateur
			response.end(preprocessor(fs.readFileSync(conf.http.www + pathname)));
		}catch(e){
			//Si la lecture du fichier à échouée on renvoie un code d'erreur 404
			response.writeHead(404, {'Content-Type': 'text/html'});
			//on affiche le contenu de la page 404.html (chemin spécifiée dans conf.json)
			response.end(e+fs.readFileSync(conf.http.error['404']));
		}
}

function preprocessor(src){
	
	test = src.toString().match(/<script>(.*?)<\/script>/);
	if(test!=null) eval(test[1]);
	
	return src;
}


//Utilisation de la librairie socket.io sur le port
var io = require('socket.io').listen(httpServer,{ log: false });
//Tableau contenant les utilisateurs connectés
var connected = new Array();
//Tableau des comptes utilisateurs (base de donnée utilisateurs)
var users = [
                {id:1,login:'valentin',password:'valentin',mail:'valentin@valentin.fr',avatar:'avatars/valentin@valentin.fr.png'},
                {id:2,login:'idleman',password:'idleman',mail:'idleman@idleman.fr',avatar:'avatars/idleman@idleman.fr.jpg'},
            ];

//Tout commence lorsqu'un visiteur se connecte au serveur, un socket personnel lui est alloué
io.sockets.on('connection', function (socket) {
  console.log('Nouvelle connexion anonyme');
	socket.user = {login:'anonymous',password:'',mail:'ano@nymous.com',avatar:'avatars/default.jpg'};
  //Si le visiteur anonyme fait une demande d'authentification
  socket.on('login', function (data) {
    //Si le visiteur possede bien un compte avec ce login et ce password
    var user = exist(data.login,data.password);
    if(user!=false){
        //utilisateur authentifié
        console.log("Connexion authentifiée : "+user.login);
		
        //On met a jour la liste des connectés
        connected.push({id:user.id,login:user.login,avatar:user.avatar});
        //On lie l'utilisateur connecté au socket de manière a pouvoir le récuperer partout
        socket.user= user;
        socket.on('user', function () {
            //On avrtis tous le monde (sauf l'utilisateur) que l'utilisateur est connecté et on leur retournes quelques infos sur lui
            socket.broadcast.emit('new_user', {id:user.id,login:user.login,avatar:user.avatar});
            //On avertis l'utilisateur qu'il est bien connecté et on lui retourne toutes ses infos de compte
            socket.emit('connected', {connected:connected,user:user});
        });
    }
  });
 
  //Lorsqu'un message est envoyé
  socket.on('message', function(data) {
    //On recupere l'utilisateur lié au socket
    var user= socket.user

    console.log("Message envoyé par : "+user.login);
	  var currentdate = new Date(); 
	  var date = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
      //On renvois son message a tous le monde (lui compris)
      io.sockets.emit('new_message', {id:user.id,login:user.login,avatar:user.avatar,message:data.message,date:date});
  
  });
 
  //Lorsqu'un socket se déconnecte
  socket.on('disconnect', function () {
  //On recupere l'utilisateur lié au socket
    var user = socket.user;
      console.log("Déconnexion : "+user.login);
      //On informe ceux qui restent que l'utilisateur est partis
	  removeConnected(user.id);
      socket.broadcast.emit('left_user', {id:user.id,login:user.login});

  });
 
});

//Fonction permettant la recherche d'un utilisateur à partir d'un login + mdp, retourne false si rien n'est trouvé
//ou l'objet utilisateur si les login + mdp sont bons.
function exist(login,password){
    var response = false;
    for(var key in users){
        if(users[key].login == login && users[key].password == password)response = users[key];
    }
    return response;
}

function removeConnected(id){
    for(var key in connected){
        if(connected[key].id == id) connected[key] = null;
    }
}
