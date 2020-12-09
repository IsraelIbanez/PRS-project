const udp = require('dgram');
// const readline = require('readline');
const fs = require('fs'); //Read file
const util = require('util');
const sleep = util.promisify(setTimeout)
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
var initialPort = process.argv[2];
var hostServer = process.argv[3];
// creating a connectionClientS socket

function connect() {
  return new Promise(function(resolve) {
    // Cette variable doit être privée -> let
    let connectionClientS = udp.createSocket('udp4');
    connectionClientS.send(Buffer.from('SYN'), initialPort, hostServer)
    resolve(connectionClientS)
  })
}

function handShake (connectionClientS) {
  return new Promise(function (resolve, reject) {
    connectionClientS.on('message', (msg, info) => {
      if (msg.toString().substring(0, 7) == 'SYN-ACK') {
        console.log('From server : ' + msg.toString())
        const newPort = msg.toString().substring(7, 12);
        //console.log(`New port: ${newPort}`);
        connectionClientS.send(new Buffer.from('ACK'), initialPort, hostServer, error => {
          if (error) {
            console.log(error)
            connectionClientS.close()
            reject(error);
          } else {
            console.log('Sending: ACK', newPort);
            // SFR : Pour envoyer plusieurs attributs, il faut faire un objet
            resolve({socket: connectionClientS, port: newPort});
            //console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port)
          }
        })
      }
    })
  })
}

function sendFilename(dataSocket, newPort, filename) {
  // SFR : cette fonction ne sert pas ?
  dataSocket.send(new Buffer.from(filename), newPort, hostServer)
}

async function receiveFile(dataSocket) {
  // SFR : Le mot clé async ne sert pas
  // SFR : Une promesse commence par cette ligne
  return new Promise(function(resolve) {
    //var file = fs.createWriteStream('reception.jpg');
    let segment_nb = 0;
    const fileWrite = fs.openSync(`./toto.jpg`, 'w');
    let idx = 0
    dataSocket.on('message', async function(msg, info) {
      console.log('Segment received: ', typeof msg, msg[0], msg.length, segment_nb++, info.size);
      //console.log(msg.toString())
      //if(msg.toString()!='FINI'){
        fs.writeSync(fileWrite, msg, 0, msg.length, idx)
        idx+=msg.length
        await sleep(2000);
      /*} else {
        fs.closeSync(fileWrite)
        dataSocket.close()
        return resolve('fini')
      }*/
    })
  })
}

// SFR : j'ai décomposé pour avoir un exemple. Ca ne sert à rien...
connect()
.then ((connection) => {
  // SFR : Ici, ne pas oublier le return.
  return handShake(connection)
})
.then((con) => {
  // console.log('Handshake done!', con);
  con.socket.send(new Buffer.from('1.jpg'), con.port, hostServer)
  return receiveFile(con.socket)
})
.finally(() => {
  console.log('Done !')
})
.catch((reason) => {//0
  console.log(reason)
  console.log('Something\'s gone wrong.');
})



/*setTimeout( () => {
    connectionClientS.close()
},10000)*/
