var validator = require('is-my-json-valid');
var config = require('histograph-config');
var pitSchema = require('./node_modules/histograph-schemas/lib/pitsSchema')

var validate = validator(pitSchema(config), {verbose:true})

console.log('should be valid', validate({"id":"11","name":"Ackoy","type":"hg:Place","validSince":["1505","1506"],"validUntil":["1505","1506"]}))

console.log('should be valid', validate({"id":"11","name":"Ackoy","type":"hg:Place","validSince":["1505","1506"],"validUntil":["1505","1506"],"data":{"periodValidFor":"toponym","land":"Netherlands"}}))

console.log('should be valid', validate({"id":"10","name":"Heesse Straet","type":"hg:Street","hasBeginning":"1779","hasEnd":"1780","data":{"bijzonderheden":"Spellingsvariant voor Hezelstraat, in boek uit 1779 gebruikt"}}))

