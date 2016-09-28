/*
	In this version we are not allowing Hierarchies (Struct DLA from model),
	or removihg anything, nor any error Handling is used.
*/
////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////Constructors///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//Imports for Node
var ss = require("./simple-statistics.min.js");

/*contructor for DLA:*/
function DLA(){

	this.it = 0;

	this.assets = new Array();
	/*Function to add an Asset:
		a (Asset): an Asset to be related in this DLA;
	*/

	this.addAsset = function addAsset(a){
		for(var x=0; x < this.assets.length; x++){
			this.assets[x].addRelation( new Relation(this.assets[x],a) );
		}
		this.assets.push(a);
	}

	/*Function to add a Contribution:
		a,b (Asset): Assets to be related;
		delta (NUMBER): the difference time between a and b;
	*/
	this.addContribution = function addContribution(a,b,delta,user){
		this.getRelation(a,b).add(new Contribution(user,delta));
	}

	/*Function to recover an Asset
		label (STRING): the asset laber (id)
	*/
	this.getAsset = function getAsset(label){
		for(var i = 0; i < this.assets.length; i++){
			if(label == this.assets[i].label){
				return this.assets[i];
			}
		}
	}

	/*Function that returns the difference between two assets
		a,b (Asset): the asset wich we want the difference
	*/
	this.getDiff = function getDiff(a,b){
		var pa = this.assets.indexOf(a);
		var pb = this.assets.indexOf(b);
		var rel;
		if(pa < pb){
			return a.getRelation(b).delta;
		}else{
			var x = b.getRelation(a).delta;
			if(x){return -x}else{return x};
		}
	}

	/*Function to calculate the difference of two assets. We use the Geometric mean:
		"In mathematics, the geometric mean is a type of mean or average, which indicates
		the central tendency or typical value of a set of numbers by using the product
		of their values (as opposed to the arithmetic mean which uses their sum)" (wikipedia)"
		"http://buzzardsbay.org/geomean.htm"
		"http://simplestatistics.org/docs/#geometricMean"
		a,b (Asset): the Assets wich we want the difference.
		OBS!!!!: essas medias não funcionam com valores negativos, entao no momento é usada a média normal.
	*/
	this.updateGeometricMean = function updateGeometricMean(a,b){
		var rel = this.getRelation(a,b);
		var vet = new Array();
		for(var i = 0; i < rel.contributions.length; i++){
			vet.push(rel.contributions[i].value);
		}
		//console.log('S',ss.geometricMean;
		rel.delta = ss.mean(vet);
		//rel.delta = ss.geometricMean(vet);
		//rel.delta=vet[0];
		//rel.delta = ss.harmonicMean(vet);
	}

	/*Function to calculate the difference of two assets. This one user average mean.
		a,b (Asset): the Assets wich we want the difference.
	*/
	this.updateAverage = function updateAverage(a,b){
		var rel = this.getRelation(a,b);
		var sum = 0;
		for(var i =0; i < rel.contributions.length; i++){
			sum += rel.contributions[i].value;
		}
		rel.delta = sum/rel.count;
	}

	/*Function to get a relation */
	this.getRelation = function getRelation(a,b){
		var pa = this.assets.indexOf(a);
		var pb = this.assets.indexOf(b);
		var rel;
		if(pa < pb){
			rel = a.getRelation(b);
		}else{
			rel = b.getRelation(a);
		}
		return rel;
	}

	/*Function to update all Deltas of known relations.*/
	this.updateAll = function updateAll(){
		for(var i = 0; i < this.assets.length; i++){
			for(var j = 0; j < this.assets.length; j++){
				if(this.assets[i].label != this.assets[j].label){
					this.updateGeometricMean(this.assets[i],this.assets[j]);
				}
			}
		}
	}

	//Funcao recursiva que procura o caminho pelo principio da transitividade
	this.search = function search(a,b){
		rel = this.getRelation(a,b);
		if(rel.delta){
			dr = rel.delta;
			if(rel.frm == b){
				dr = -dr
				console.log(rel.to.label+'->'+rel.frm.label);
			}else{
				console.log(rel.frm.label+'->'+rel.to.label);
			}
			this.it=0;
			return dr;
		}
		var rels = a.relations;
		this.it++;
		for(i=0; i < rels.length; i++){
			var r = rels[i];
			if(!r.delta) continue;
			var d = this.search(r.to,b);
			if(this.it > this.assets.length){
				this.it--;
				return r.delta+d;
			}
			if(d){
				dr = r.delta;
				if(r.frm == b) dr = -dr
				console.log(r.frm.label+'->'+r.to.label);
				this.it--;
				return dr + d;
			}
		}
		return null;
	}

	/*Function toinfer the unknown Deltas.*/
	this.inferUnknown = function inferUnknown(){
		//Passo 1 - Iterativo
		//Percorre todos assets, menos o ultimo, pois ele não tem relacoes;
		for(var i = 0; i < this.assets.length - 1; i++){
			//Percorre todos assets à direita, menos o último;
			for(var j = i+1; j < this.assets.length - 1; j++){
				var rel = this.assets[i].relations[j-i-1];
				//Se ha relação entre Ai e Aj;
				if(rel.count > 0){
					//Percorre todas contribuições para ver se tem algo que Ai sabe e Aj não;
					for(var k = 0; k < this.assets.length - j - 1; k++){
						//Se Ai sabe e Aj não, infere;
						if( ( this.assets[i].relations[k+1].count > 0) && (this.assets[j].relations[k].count == 0) ){
							//BC = -BA + AC
							this.assets[j].relations[k].delta = -this.assets[i].relations[j-1-i].delta + this.assets[i].relations[k+j-i].delta;
						}
					}
				}
			}
		}
	}
	//Procura transitividade entre A e B recursivamente
	this.inferUnknownR = function inferUnknownR(){
		//Passo 2 - Recursivo
		for(var i = 0; i < this.assets.length; i++){
			this.it=0;
			var rels = this.assets[i].relations;
			for(j=0; j < rels.length; j++){
				var rel = rels[j];
				if(!rel.count){
					console.log('#'+this.assets[i].label+'->'+rel.to.label);
					d = this.search(rel.frm, rel.to);
					console.log(d);
					if(this.it < 1) rel.delta = d;
					console.log('');
				}
			}
		}
	}

	/*Function to show on console all relations.*/
	this.print = function print(){
		for(var i = 0; i < this.assets.length; i++){
			for(var j = 0; j < this.assets.length; j++){
				if(this.assets[i].label != this.assets[j].label){
					console.log(this.assets[i].label+'<->'+this.assets[j].label+'='+this.getDiff(this.assets[i],this.assets[j]));
				}
			}
		}
	}

	/*Function that returns an object with all info necessary to play the assets.
		-the {base asset,dur} (the one with more relations)
		-a vetor with: {asset, asset dur, delta to base]
		!nessa implementação, retorno o primeiro asset como base, mas deveria ver aquele
		com mais relações!
		Ex: "{"assetBase":{"uri":"ws://10.9.7.127:8084","dur":0},"relations":["ws://10.9.7.130:8084",0,-5.42]}"
	*/
	this.getPresentation = function getPresentation(){
		if(this.assets.length <= 0){return}
		var vet = new Array();
		var objBase={
				uri:this.assets[0].uri, 
				dur:this.assets[0].dur, 
				delta:0
			}
		vet.push(objBase);
		for(var i = 1; i < this.assets.length; i++){
			var obj={
				uri:this.assets[i].uri, 
				dur:this.assets[i].dur, 
				delta:this.getDiff(this.assets[0],this.assets[i])
			}
			vet.push(obj);
		}
		var pst = {act:"presentation", relations:vet};
		console.log(pst);
		return pst;
	}
}

/*contructor for Asset:
	uri (STRING): path to the video
	label (STRING): Asset identification
	dur (NUMBER): duration of thi Asset
*/
function Asset(uri,label,dur){
	this.uri = uri;
	this.label = label;
	this.dur = dur;
	this.relations = new Array;			//a vector to store this asset relations;

	/*Function to add a Relation to an Asset:
		r (Relation): a relation from the this asset to other;
	*/
	this.addRelation = function addRelation(r){
			this.relations.push(r);
	}
	/*Function to get a Relation to an Asset:
		r (Relation): a relation from the this asset to other;
	*/
	this.getRelation = function getRelation(b){
			for(var i = 0; i < this.relations.length; i++){
				if(this.relations[i].to.label == b.label){
					return this.relations[i];
				}
			}
	}
}


/*contructor for Relation:
	frm (Asset): the base Asset
	to (Asset): the asset to be related with the base
*/
function Relation(frm, to){
	this.frm = frm;
	this.to = to;
	this.delta = null;						//the supposed delta for this Relation
	this.confidence = null;				//the confidence that the delta is correct
	this.count = 0;								//the number of contributions for this Relation;
	this.contributions = new Array;	//vector to store contributions for this Relation

	/*function to add Contributions to a Relation
		c(Contribution): a contribtuion from an User
	*/
	this.add = function addContribution(c){
		this.contributions.push(c);
		this.count++;
	}
}

/*constructor for Contribution
	user (User): the user that made the Contribution
	value (NUMBER): the value of the Contribution
*/
function Contribution(user,value){
	this.user = user;
	this.value = value;

	/*function to show an contribution on console*/
	this.show = function showContribution(){
		var result = this.user.id + " :(" + this.value + ")";
		console.log(result);
	}
}

/*constructor for User
	id (NUMBER): an unique id that identifies an User
	lvl (NUMBER): determines the confidence degree of that User
*/
function User(id, lvl) {
	this.id = id;
  this.lvl = lvl;

	/*function to show the user Details	on console*/
	this.show = function showUser() {
		var result = this.id + ":(" + this.lvl + ")";
		console.log(result);
	}
}

module.exports.DLA = DLA;
module.exports.Asset = Asset;
module.exports.Relation = Relation;
module.exports.Contribution = Contribution;
module.exports.User = User;
