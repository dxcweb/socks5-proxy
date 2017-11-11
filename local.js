var socks = require('socksv5');
var cryptico = require('cryptico');
var WebSocket = require('ws');

var key = '4c1ee9d1807b7df183d93528d40ee7be';
var serverAddress = '127.0.0.1';
var serverPort = '9999';
var serverPort = '80';

var srv = socks.createServer(function(info, accept, deny) {
  var socket;
  var serverConnection = new WebSocket('ws://' + serverAddress + ':' + serverPort, {
    perMessageDeflate: false,
  });
  serverConnection.on('open', function() {
    var obj = {
      type: 'connect',
      dstAddr: info.dstAddr,
      dstPort: info.dstPort,
    };
    var ciphertext = cryptico.encryptAESCBC(JSON.stringify(obj), key);
    serverConnection.send(ciphertext);
  });
  serverConnection.on('message', function(ciphertext) {
    var json = cryptico.decryptAESCBC(ciphertext, key);
    var obj = JSON.parse(json);
    switch (obj.type) {
      case 'connect':
        socket = accept(true);
        if (socket) {
          socket.on('data', function(data) {
            var obj = {
              type: 'req',
              data: data.toString('base64'),
            };
            var ciphertext = cryptico.encryptAESCBC(JSON.stringify(obj), key);
            serverConnection.send(ciphertext);
          });
          socket.on('error', function(data) {
            serverConnection && serverConnection.close();
          });
          socket.on('close', function(data) {
            serverConnection && serverConnection.close();
          });
        }
        break;
      case 'body':
        var body = new Buffer(obj.body, 'base64');
        socket.write(body);
        break;
      default:
    }
    // var body = new Buffer(data, 'base64');
    // console.log(body.toString());
    // socket.write(body);
  });
  serverConnection.on('error', function(error) {
    console.log('aaaa');
    if (socket) {
      socket.end();
    } else {
      deny();
    }
  });
  serverConnection.on('close', function(error) {
    if (socket) {
      socket.end();
    } else {
      deny();
    }
  });
});
srv.listen(process.env.PORT || 1080, '0.0.0.0', function() {
  console.log('SOCKS server listening on port ' + process.env['PORT'] || 1080);
});

srv.useAuth(socks.auth.None());
