//R�cuperation de nos configuration perssonalis�es
conf = require('./conf.json');
//Inclusion de la librairie http permettant de cr�er un serveur web
http = require('http');
//R�cuperation de la librairie url qui facilite l'analyse de l'url des requetes re�ues
url = require('url');
//R�cuperation de la librairie fs qui permet la gestion de fichiers (ecriture, lecture...)
fs = require('fs');

//Cr�ation d'un serveur http sur le port sp�cifi� dans conf.json (section http)
//D�s qu'une requetes est re�u sur 127.0.0.1:port, la fonction onRequest est execut�e
//et prends pour parametre un objet requete (ce qui est recu) et un objet r�ponse (ce que le serveur vas retourner)
var httpServer = http.createServer(onRequest).listen(conf.http.port);

//Fonction onRequest est execut�e � chaques requete sur le serveur
function onRequest(request, response) {
		//On r�cupere l'url requise et on la parse pour n'avoir que la partie qui nous interesse
		var pathname = url.parse(request.url).pathname;
		//On r�cup�re l'extension du fichier requis (html,css,js,jpg...)
		var extension = pathname.split('.').pop();
		//Si l'utilisateur ne sp�cifie pas de page, on prend l'index par d�faut 'index.html' (sp�cifi� dans conf.json)
		if(pathname=='/') pathname = conf.http.index;
		//On d�finis l'entete de r�ponse au code 200 signifiant : "succ�s de la requete" et
		//on d�finit le type mime du fichier de retour (image/jpg pour un jpg, text/css pour un css etc..)
		//Les types mimes sont d�finit dans le fichier json conf.
		response.writeHead(200, {'Content-Type': conf.http.mime[extension]});
		try {
			//On lit le contenu du fichier demand� (en ajoutant la racine www sp�cifi�e dans conf.json)
			//et on le retour a l'utilisateur
			response.end(preprocessor(fs.readFileSync(conf.http.www + pathname)));
		}catch(e){
			//Si la lecture du fichier � �chou�e on renvoie un code d'erreur 404
			response.writeHead(404, {'Content-Type': 'text/html'});
			//on affiche le contenu de la page 404.html (chemin sp�cifi�e dans conf.json)
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
//Tableau contenant les utilisateurs connect�s
var connected = new Array();
//Tableau des comptes utilisateurs (base de donn�e utilisateurs)
var users = [
                {id:1,login:'valentin',password:'valentin',mail:'valentin@valentin.fr',avatar:'avatars/valentin@valentin.fr.png'},
                {id:2,login:'idleman',password:'idleman',mail:'idleman@idleman.fr',avatar:'avatars/idleman@idleman.fr.jpg'},
            ];

//Tout commence lorsqu'un visiteur se connecte au serveur, un socket personnel lui est allou�
io.sockets.on('connection', function (socket) {
  console.log('Nouvelle connexion anonyme');
	socket.user = {login:'anonymous',password:'',mail:'ano@nymous.com',avatar:'avatars/default.jpg'};
  //Si le visiteur anonyme fait une demande d'authentification
  socket.on('login', function (data) {
    //Si le visiteur possede bien un compte avec ce login et ce password
    var user = exist(data.login,data.password);
    if(user!=false){
        //utilisateur authentifi�
        console.log("Connexion authentifi�e : "+user.login);
		
        //On met a jour la liste des connect�s
        connected.push({id:user.id,login:user.login,avatar:user.avatar});
        //On lie l'utilisateur connect� au socket de mani�re a pouvoir le r�cuperer partout
        socket.user= user;
        socket.on('user', function () {
            //On avrtis tous le monde (sauf l'utilisateur) que l'utilisateur est connect� et on leur retournes quelques infos sur lui
            socket.broadcast.emit('new_user', {id:user.id,login:user.login,avatar:user.avatar});
            //On avertis l'utilisateur qu'il est bien connect� et on lui retourne toutes ses infos de compte
            socket.emit('connected', {connected:connected,user:user});
        });
    }
  });
 
  //Lorsqu'un message est envoy�
  socket.on('message', function(data) {
    //On recupere l'utilisateur li� au socket
    var user= socket.user

    console.log("Message envoy� par : "+user.login);
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
 
  //Lorsqu'un socket se d�connecte
  socket.on('disconnect', function () {
  //On recupere l'utilisateur li� au socket
    var user = socket.user;
      console.log("D�connexion : "+user.login);
      //On informe ceux qui restent que l'utilisateur est partis
	  removeConnected(user.id);
      socket.broadcast.emit('left_user', {id:user.id,login:user.login});

  });
 
});

//Fonction permettant la recherche d'un utilisateur � partir d'un login + mdp, retourne false si rien n'est trouv�
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
