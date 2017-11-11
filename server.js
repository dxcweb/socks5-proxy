var cryptico = require('cryptico');
var WebSocket = require('ws');
var net = require('net');
var key = '4c1ee9d1807b7df183d93528d40ee7be';

var port = process.env.PORT || 9999;
var server = new WebSocket.Server({
  host: '0.0.0.0',
  port: port,
  perMessageDeflate: false,
});
server.on('connection', function(connection) {
  var targetConnection = null;
  connection.on('message', function(ciphertext) {
    var json = cryptico.decryptAESCBC(ciphertext, key);
    var obj = JSON.parse(json);
    switch (obj.type) {
      case 'connect':
        targetConnection = net.createConnection({ port: obj.dstPort, host: obj.dstAddr, allowHalfOpen: true }, function() {
          var obj = { type: 'connect' };
          var ciphertext = cryptico.encryptAESCBC(JSON.stringify(obj), key);
          connection.send(ciphertext);
        });
        targetConnection.on('data', function(data) {
          if (connection.readyState == WebSocket.OPEN) {
            var obj = { type: 'body', body: data.toString('base64') };
            var ciphertext = cryptico.encryptAESCBC(JSON.stringify(obj), key);
            connection.send(ciphertext);
          }
        });
        targetConnection.on('error', function(data) {
          connection.close();
        });
        break;
      case 'req':
        var buffer = new Buffer(obj.data, 'base64');
        targetConnection.write(buffer);
        break;
      default:
    }
  });
});
console.log('socks5-proxy server listening on port ' + port);
