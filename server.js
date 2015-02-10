conf = require('./conf.json');

http = require('http');

url = require('url');

fs = require('fs');

var express = require('express');
var multiparty = require('multiparty'),
serv = "192.168.33.10";

var passport = require('passport')
  , util = require('util')
  , GoogleStrategy = require('passport-google').Strategy;

var port = process.env.PORT || 3000;

var httpServer = http.createServer().listen(port);
//var privateKey = fs.readFileSync('certkey.pem').toString();
//var certificate = fs.readFileSync('cert.pem').toString();




passport.serializeUser(function(user, done){
  done(null, user)
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    returnURL: 'http://'+serv+':3000/auth/google/return',
    realm: 'http://'+serv+':3000/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));


var app = express();


  app.set('views', __dirname + '/www');
  app.set('view engine', 'ejs');
  //app.engine('html', require('ejs').renderFile);
 
  app.use(express.logger());
  app.use(express.cookieParser());
  //app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/www'));

  app.locals.inspect = require('util').inspect;

app.use(function(req,res,next){
  var userSession = req.session.user;

  if (!userSession) {
    userSession = req.session.views = {}
  }
});
app.get('/', function(req,res){
  if(!req.session.user) {
    req.session.user = [{

    }];
  }
  res.render('index', {user : req.session.user});

  //to get parser from data    var form = new multiparty.Form();

});
app.get('/auth/google', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log(req);
    res.redirect('/');
  });
app.get('/login', function(req,res){
  res.send('chat');

  //to get parser from data    var form = new multiparty.Form();

});

app.get('/user', function(req,res){
  res.send('chat');

  //to get parser from data    var form = new multiparty.Form();

});

app.get('/auth/google/return', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    //on remet l'utilisateur dans la session//
    req.session.user = [];
    req.session.user.push({'displayName':req.user.displayName});
    res.redirect('/');
  });
app.get('/account', ensureAuthenticated, function(req, res){
  
  res.render('account', { user: req.user });
});
app.listen(httpServer);


function preprocessor(src){
  test = src.toString().match(/<script>(.*?)<\/script>/);
  if(test!=null) eval(test[1]);
  return src;
}

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  //res.redirect('/login')
}

var appServer = app.listen(httpServer);
var io = require('socket.io').listen(appServer);
var connected = new Array();

var users =[
  {id:1, login:'xalava',password:'$one', mail:'test@batard.com',avatar:'avatars/valentin@valentin.fr.png'},
  {id:2,login:'idleman',password:'idleman',mail:'idleman@idleman.fr',avatar:'avatars/idleman@idleman.fr.jpg'},

];

io.sockets.on('connection', function(socket){
  socket.user = {login:'anonymous',password:'',mail:'ano@nymous.com',avatar:'avatars/default.jpg'};

  socket.on('login', function(credentials){
  var user = exist(credentials.login,credentials.password);
  console.log("hi!"+credentials.login);
  
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
  socket.on('message', function(data){
     console.log("Message envoyé par : "+socket.user.login);
    var currentdate = new Date();
    var date = currentdate.getDate() + "/"
    + (currentdate.getMonth()+1) + "/"
    + currentdate.getFullYear() + " @ "
    + currentdate.getHours() + ":"
    + currentdate.getMinutes() + ":"
    + currentdate.getSeconds();
//On renvois son message a tous le monde (lui compris)
io.sockets.emit('new_message', {id:socket.user.id,login:socket.user.login,avatar:socket.user.avatar,message:data.message,date:date});
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
