var redis = require('redis');
var config = require(process.env.HISTOGRAPH_CONFIG);
var client = redis.createClient(config.redis.port, config.redis.host);
var coreQueue = config.redis.queues.histograph;

// report the size of the Redis queue
exports.status = function(req, res)
{
	client.llen(coreQueue, function(err, reply){
		if(err)
			res.status(400).send({error: err});
		else
			res.status(200).send({name: coreQueue, length: reply});				
	});
}