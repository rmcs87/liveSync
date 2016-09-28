var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);
var d = require("./dal.js");

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];
var dal = new d.DLA();

//Ao conectar;
io.on('connection', function (socket) {
    console.log("ALGUEM CONECTOU!")
    //Emite todas as mensagens já enviadas para a nova conexão;
    /*messages.forEach(function (data) {
      socket.emit('message', data);
    });*/
    socket.emit("message", JSON.stringify(dal.getPresentation()) );
    //socket.emit("message", JSON.stringify(dal.getPresentation()) );
    //Adiciona o socket à lista de conexões;
    sockets.push(socket);
    //Quando desconectar
    socket.on('disconnect', function () {
        //remove o socket da lista;
      sockets.splice(sockets.indexOf(socket), 1);

    });
    //Ao receber a mensagem
    socket.on('message', function (msg) {
        console.log("");
        console.log("Recebeu", msg);
        console.log("");
        //transforma a mensagem em um objeto;
        var obj = JSON.parse(msg);
        //Adição de um novo asset;
        if(obj.act == "addAsset"){
          //verifica se o asset já existe;
          if(dal.getAsset(obj.ec)){
            return;
          }
          //adiciona o novo asset;
          dal.addAsset(new d.Asset(obj.ec,obj.ec,0));
        //Adição de uma nova contribuição de sincronização;
        }else if (obj.act == "addContribution") {
          dal.addContribution(dal.getAsset(obj.ec1),dal.getAsset(obj.ec2),obj.delta);
          dal.updateAll();
          dal.inferUnknown();
          dal.inferUnknownR();
          console.log("DAL ATUALIZADO:");
          console.log(dal.getPresentation());
        //Solicitação dos valores de apresentação atuais;
        }else if (obj.act == "getPresentation") {
          socket.emit( JSON.stringify(dal.getPresentation()) );
        }
    });
  });

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
