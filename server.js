conf = require('./conf.json');

http = require('http');

url = require('url');

fs = require('fs');

var port = process.env.PORT || 3000;
var httpServer = http.createServer(onRequest).listen(port);

function onRequest(request, response) {
        
       var pathname = url.parse(request.url).pathname;

       var extension = pathname.split('.').pop();

       if(pathname == "/") pathname = conf.http.index;

        response.writeHead(200, {'Content-Type': conf.http.mime[extension]});

        try {
        	        response.end(preprocessor(fs.readFileSync(conf.http.www +'/'+ pathname)));
        	}

        catch(e) {
        	response.writeHead(404, ('Content-Type: text/html'));
        	response.end(e+fs.readFileSync(conf.http.error['404']));
        }
        //

}

function preprocessor(src){
  test = src.toString().match(/<script>(.*?)<\/script>/);
  if(test!=null) eval(test[1]);
  return src;
}

var io = require('socket.io').listen(httpServer);
var connected = new Array();

var users =[
  {id:1, login:'xalava',password:'$one', mail:'test@batard.com',avatar:'avatars/valentin@valentin.fr.png'},
  {id:2,login:'idleman',password:'idleman',mail:'idleman@idleman.fr',avatar:'avatars/idleman@idleman.fr.jpg'},

];

io.sockets.on('connection', function(socket){
  socket.user = {login:'anonymous',password:'',mail:'ano@nymous.com',avatar:'avatars/default.jpg'};

  socket.on('login', function(credentials){
  console.log("hi!"+credentials.login);
  var user = exist(credentials.login,credentials.password);
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
	console.log('New connection');
});

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
