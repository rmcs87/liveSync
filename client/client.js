//https://live-sync-rmcs87.c9users.io/

window.onload = init;                  //Inicializa a APP;
console.log("oi");
var socket;                         //WebSockett;
var video_list = new Array();   //Lista de Vídeos;
var videoIndex1 = -1;           //Indice do primeiro vídeo tocando;
var player1;                    //Referencia para o primeiro Player;
var videoIndex2 = -1;           //Indice do segundo vídeo tocando;
var player2;                    //Referencia para o segundo Player;
var status = "play";            //Status da applicação: "play":tocando os videos, "sync":sincronizando os vídeos;
var flagSyncProc = false;       //flag para indicar se parou por causa do processo de SYNC ou outro motivo;
var msg = "";                   //Mensagem para identificar o que esta ocorrendo;

//Responsável por mostrar a mensagem na div identificada;
function showMsg(id,msg){
  document.getElementById(id).innerHTML = msg;
}

//Start the WS and interface;
function init(){
  //Conecta ao Coupler;
  //ws = new WebSocket( 'ws://10.9.7.127:4080' );
  socket = io('wss://live-sync-rmcs87.c9users.io/');
  //ws = new WebSocket("wss://hardsync-rmcs87.c9users.io");
  //Se a conexão for perdida:
  socket.on("disconnect", coupler_close);
  //Ao receber uma mensagem:
  socket.on("message", coupler_message);
  //Ao conectar:
  socket.on("connect",  coupler_connect);
  //Esconde os elementos de sincronização:
  hideSyncOptions();
  document.getElementById("b_sync").style.display = "none";
  document.getElementById("selector1").style.display = "none";
  document.getElementById("selector2").style.display = "none";
  //Adiciona Listeners para os botões de entrada:
  document.getElementById("b_sync").addEventListener("click",enterSync);
  document.getElementById("b_done").addEventListener("click",outSync);
  document.getElementById("b_add").addEventListener("click",addVideo);
  //Adiciona Listeners para os botões de syncronização:
  document.getElementById('b_pause1').addEventListener('click',function(){
    player1.pauseVideo();
  });
  document.getElementById('b_play1').addEventListener('click',function(){
    player1.playVideo();
  });
  document.getElementById('b_pause2').addEventListener('click',function(){
    player2.pauseVideo();
  });
  document.getElementById('b_play2').addEventListener('click',function(){
    player2.playVideo();
  });
}
//Adiciona contribuições já conhecidas;
function addSyncTest(){
  var ob;
  ob = {id:0, ts: 1234, act:'addAsset', ec:"CnvUUauFJ98"};
  socket.emit("message",JSON.stringify(ob));
  
  ob = {id:0, ts: 1234, act:'addAsset', ec:"YBv4-TCs3Lg"};
  socket.emit("message",JSON.stringify(ob));
  
  ob = {id:0, ts: 1234, act:'addAsset', ec:"jJfGx4G8tjo"};
  socket.emit("message",JSON.stringify(ob));
  
  ob = {id:0, ts: 1234, act:'addAsset', ec:"-RKE_xouTkw"};
  socket.emit("message",JSON.stringify(ob));

  var obj;
  obj = {id:1, ts: 1234, act:'addContribution', ec1:"CnvUUauFJ98", ec2:"YBv4-TCs3Lg", delta: 98.54987807057188};
  socket.emit("message",JSON.stringify(obj));
  
  obj = {id:1, ts: 1234, act:'addContribution', ec1:"CnvUUauFJ98", ec2:"jJfGx4G8tjo", delta: -20.490884034332275};
  socket.emit("message",JSON.stringify(obj));
  
  obj = {id:1, ts: 1234, act:'addContribution', ec1:"CnvUUauFJ98", ec2:"-RKE_xouTkw", delta: 15.877118127792357};
  socket.emit("message",JSON.stringify(obj));
}
//manda requisição para adicionar um novo vídeo. Nessa versão, do YouTube;
function addVideo(){
  var x = prompt("Qual o ID do novo Vídeo?(ex. DZYEYPJdcI8)", "");
  if(x != ''){
    var obj1 = {id:0, ts: 1234, act:'addAsset', ec:x};
    socket.emit("message",JSON.stringify(obj1));
    //Recarrega a aplicação, pegando uma nova lista de apresentação;
    window.location.reload();
  }
}
//Inicia o modo de sincronização;
function enterSync(){
  showSyncOptions();
  hideMenuOptions();  
  status = "sync";
}
//Finaliza a fase de sincronização e envia a contribuição;
function outSync(){
  var diff = player1.getCurrentTime() - player2.getCurrentTime();
  console.log("sync",player1.getCurrentTime(),player2.getCurrentTime());
  var obj = {id:1, ts: 1234, act:'addContribution',
              ec1:video_list[videoIndex1].uri,
              ec2:video_list[videoIndex2].uri,
              delta: diff}
  socket.emit("message",JSON.stringify(obj));
  hideSyncOptions();
  showMenuOptions();
  var obj2 = {id:0, ts: 1234, act:'getPresentation'};
  socket.emit("message",JSON.stringify(obj2));
}
//Caso a conexão não seja bem sucedida;
function coupler_close(){
  alert("Conection Failed. Click OK to reload!");
  window.location.reload();
}
//Ao conectar;
function coupler_connect(){
  addSyncTest();
}
//Ao receber uma mensagem;
function coupler_message(e){
  //Se não houver dados na mensagem, cancela;
  console.log(e);
  if(!e){return}
  //Transforma a mensagem em um objeto;
  var obj = JSON.parse(e);
  //Se é um objeto contendo os dados de apresentação {act:"presentation",relations:{uri:"",dur:number,delta:number}}
  if(obj.act=="presentation"){
    video_list = obj.relations;
    //Se há mais de um vídeo:
    if(video_list.length > 1){
      //Mostra as opções de vídeo e dois primeiros vídeos;
      console.log(video_list);
      videoIndex1 = 0;
      videoIndex2 = 1;
      displayLists();
      displayVideos();
      document.getElementById("selector1").style.display = "inline";
      document.getElementById("selector2").style.display = "inline";
      document.getElementById("b_sync").style.display = "inline";
    //Se há apenas um vídeo:
    }else if(video_list.length == 1) {
      //Mostra apenas um vídeo 
      videoIndex1 = 0;
      displayVideos();
      document.getElementById("selector1").style.display = "inline";
    }
  }
}
//Exibe as listas de seleção de vídeos;
function displayLists(){
  //o value da opção guarda a posição do vetor
  for(var i = 0; i < video_list.length; i++){
    var z = document.createElement("button");
    z.setAttribute("value", i);
    z.setAttribute("id", "btn_p1"+i);
    z.innerHTML = video_list[i].uri;
    if(i == videoIndex1){
      z.style.display = "none";
    }
    document.getElementById("selector1").appendChild(z);
  }
  //o value da opção guarda a posição do vetor
  for(var i = 0; i < video_list.length; i++){
    var z = document.createElement("button");
    z.setAttribute("value", i);
    z.setAttribute("id", "btn_p2"+i);
    z.innerHTML = video_list[i].uri;
    if(i == videoIndex2){
      z.style.display = "none";
    }
    document.getElementById("selector2").appendChild(z);
  }
  //Listener para a mudança de fluxo;
  document.getElementById("selector1").addEventListener("click",videoChange);
  document.getElementById("selector2").addEventListener("click",videoChange);
}
//Muda os videos que estão tocando;
function videoChange(e){
  //Se foi na primeira lsita de videos:
  if(e.currentTarget.id == "selector1"){
    document.getElementById("btn_p1"+videoIndex1).style.display = "inline";
    videoIndex1 = e.target.value;
    e.target.style.display = "none";
    player1.loadVideoById(video_list[videoIndex1].uri, 5, "large");
  //Se foi na segunda lsita de videos:
  }else if(e.currentTarget.id == "selector2"){
    document.getElementById("btn_p2"+videoIndex2).style.display = "inline";
    videoIndex2 = e.target.value;
    e.target.style.display = "none";
    player2.loadVideoById(video_list[videoIndex2].uri, 5, "large");
  }
}
//Carrega um video do YouTube;
//vid: id do fluxo do youTube; playerid: id da div para o video;
function loadVideo(vid,playerid,player){
  player = new YT.Player(playerid, {
    height: '390',
    width: '640',
    videoId: vid,       // Id do vídeo passado pelo parâmetro.
    playerVars: {
    'autoplay':'1',     // Liga o autoplay.
    'controls':'0',     // Mostra os controles.
    'enablejsapi':'1',  // Usa a API javascript.
    'showinfo':'1',     // Esconde as informações de cabeçalho do vídeo.
    'autohide':'1'      // Esconde os controles automaticamente durante a execução (se 'controls' for '1' ).
    },
  });
  return player;
}
//Inicia os videos;
function displayVideos(){
  if (videoIndex1 != -1){
    var newDiv = document.createElement('div');
    newDiv.id = "player1";
    document.getElementById("video1area").appendChild(newDiv);   
    player1 = loadVideo(video_list[videoIndex1].uri, newDiv.id, player1);
    player1.addEventListener("onStateChange",videoListener);    
  }
  if (videoIndex2 != -1){
    var newDiv = document.createElement('div');
    newDiv.id = "player2";
    document.getElementById("video2area").appendChild(newDiv);
    console.log(video_list[videoIndex2].uri);
    player2 = loadVideo(video_list[videoIndex2].uri, newDiv.id, player2);
    player2.addEventListener("onStateChange",videoListener);
  }
  //Apos 10 segundo inicia a sincronização; Substituir pelo listener dos players;
  /*
  setTimeout(sync, 15000);
  setInterval(function(){
    console.log(player1.getCurrentTime())
  },1000);*/
}
//Identifica se algum dos videos parou de progredir no tempo;
function checkYoutubBackInTime(){
  var local_data = localStorage.getItem("livsync_video_error");
  var d = JSON.parse(local_data);
  if(d){    
    var lst_time1 = d[player1.getVideoData().video_id];
    var lst_time2 = d[player2.getVideoData().video_id];
    if(lst_time1){
      if(lst_time1 >= player1.getCurrentTime()){
        alert("Video1 is back in time (YouTube BUG)!");
      }else{
        d[player1.getVideoData().video_id] = player1.getCurrentTime();
      }
    }else{
      d[player1.getVideoData().video_id] = player1.getCurrentTime();
    }
    if(lst_time2){
      console.log(lst_time1,player1.getCurrentTime())
      if(lst_time2 >= player2.getCurrentTime()){
        alert("Video2 is back in time (YouTube BUG)!");
      }else{
        d[player2.getVideoData().video_id] = player2.getCurrentTime();
      }
    }else{
      d[player2.getVideoData().video_id] = player2.getCurrentTime();
    }
  }else{
    d = {};
    d[player1.getVideoData().video_id] = player1.getCurrentTime();
    d[player2.getVideoData().video_id] = player2.getCurrentTime();
  }
  localStorage.setItem("livsync_video_error",JSON.stringify(d));

}
//Esculta os videos para identificar bufferização e resincronizar;
function videoListener(event){
  //Se pausou ou esta armazenando buffer;
  console.log(event.data);
  if (event.data == 2 || event.data == 3 || event.data == 3){
  //se começou a reproduzir;
  }else if(event.data == 1){
    //Se os dois players estão tocando:
    if(player1.getPlayerState() == 1 && player2.getPlayerState() == 1){
      //Faz a checagem de BUG do youtube (tempo atual menor ou igual que o último tempo marcado)
      //checkYoutubBackInTime();
      if(flagSyncProc == false){
        sync();
      }else{
        flagSyncProc = false;
      }
    }
  }
}
//Sincroniza os vídeos:
function sync(){
  showMsg("msg_field", "SYNCHRONIZING");
  console.log("insync",diff,difNow,difReal);
  //Se não tiver o delta em algum dos dois vídeos, não tem como sincronizar:
  if(video_list[ parseInt(videoIndex1)].delta == null 
    || video_list[ parseInt(videoIndex2)].delta == null){console.log("bye");return;}
  //Calcula a diferença entre os dois vídeos:
  //diff = -AB + AC
  var diff = -video_list[parseInt(videoIndex1)].delta + video_list[parseInt(videoIndex2)].delta;
  //Calcula a diferença atual dos dois vídeos;
  var difNow = player1.getCurrentTime() - player2.getCurrentTime();
  //Calcula a dirença real para sincronizar os dois vídeos;
  var difReal = diff - difNow;
  //se a diferença real for negativa: pausa o primeiro video;
  if(difReal < 0){
    player1.pauseVideo();
    setTimeout(function(){player1.playVideo();showMsg("msg_field", "");}, -difReal*1000);
  //se a diferença real for positiva: pausa o segundo video;
  }else if(difReal > 0){
    player2.pauseVideo();
    setTimeout(function(){player2.playVideo();showMsg("msg_field", "");}, difReal*1000); 
  }
  //Avisa que pausou por causa do processo;
  flagSyncProc = true;
  console.log("insync",diff,difNow,difReal);
}
//----------------------------------------------------hide/show------------------------------------//
//----------------------------------------------------hide/show------------------------------------//
//----------------------------------------------------hide/show------------------------------------//
//----------------------------------------------------hide/show------------------------------------//
function hideSyncOptions(){
  document.getElementById("b_play1").style.display = "none";
  document.getElementById("b_play2").style.display = "none";
  document.getElementById("b_pause1").style.display = "none";
  document.getElementById("b_pause2").style.display = "none";
  document.getElementById("b_done").style.display = "none";
  document.getElementById("sync-info").style.display = "none";
}
function showSyncOptions(){
  document.getElementById("b_play1").style.display = "inline";
  document.getElementById("b_play2").style.display = "inline";
  document.getElementById("b_pause1").style.display = "inline";
  document.getElementById("b_pause2").style.display = "inline";
  document.getElementById("b_done").style.display = "inline";
  document.getElementById("sync-info").style.display = "inline";
}
function hideMenuOptions(){
  document.getElementById("b_add").style.display = "none";
  document.getElementById("selector1").style.display = "none";
  document.getElementById("selector2").style.display = "none";
  document.getElementById("b_sync").style.display = "none";
  document.getElementById("main-info").style.display = "none";
}
function showMenuOptions(){
  document.getElementById("b_add").style.display = "inline";
  document.getElementById("selector1").style.display = "inline";
  document.getElementById("selector2").style.display = "inline";
  document.getElementById("b_sync").style.display = "inline";
  document.getElementById("main-info").style.display = "inline";
}
//----------------------------------------------------KEYLISTENERS------------------------------------//
//----------------------------------------------------KEYLISTENERS------------------------------------//
//----------------------------------------------------KEYLISTENERS------------------------------------//
//----------------------------------------------------KEYLISTENERS------------------------------------//
//Ao apertar 1, pausa ou reinicia o primeiro video;
KeyboardJS.on('1', function() {
  if(status == "sync"){
    if(player1.playing_video || player1.getPlayerState() == 1){
      player1.pauseVideo();
    }else{
      player1.playVideo();
    }
  }
});
//Ao apertar 2, pausa ou reinicia o segundo video;
KeyboardJS.on('2', function() {
  if(status == "sync"){
    if(player2.playing_video || player2.getPlayerState() == 1){
      player2.pauseVideo();
    }else{
      player2.playVideo();
    }
  }
});
//Adiciona atraso aleatório em um dos dois vídeos
KeyboardJS.on('b', function() {
	var v = Math.trunc(Math.random()*2);
	if(v == 0){
		var tempo = Math.trunc(Math.random()*2000);
		player1.pauseVideo();
		setTimeout(function(){
	  		player1.playVideo();
		}, tempo);
	}else{
		var tempo = Math.trunc(Math.random()*2000);
		player2.pauseVideo();
		setTimeout(function(){
	  		player2.playVideo();
		}, tempo);
	}
});
//Força resincronização
KeyboardJS.on('s', function() {
	sync();
});
