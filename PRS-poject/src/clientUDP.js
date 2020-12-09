const udp = require('dgram');
const readline = require('readline');
const fs = require('fs'); //Read file
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var initialPort = process.argv[2];
var hostServer = process.argv[3];
// creating a connectionClientS socket
const connectionClientS = udp.createSocket('udp4');

var handShake = new Promise(
    function (resolve, reject) {
        const data = Buffer.from('SYN')
        connectionClientS.send(data, initialPort, hostServer, error => {
            if (error) {
                console.log(error)
                connectionClientS.close()
            } else {
                console.log('Sending : ' + data)
            }
        })

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
                        console.log('Sending: ACK');
                        resolve(newPort);
                        //console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port)
                    }
                })
            }


        })
    }
)

function createDataSocket() {
    const DataClientS = udp.createSocket('udp4');
    return DataClientS;
}

function sendFilename(dataSocket, newPort, filename) {
    console.log(`File name requested : ${filename}`);
    dataSocket.send(new Buffer.from(filename), newPort, hostServer, error => {
        if (error) {
            console.log(error)
            dataSocket.close()
        } else {
            console.log('Sending: ' + filename);
            //console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port)
        }
    })
}

async function receiveFile(dataSocket) {
    //var file = fs.createWriteStream('reception.jpg');
    let segment_nb = 0;
  
    const fileWrite = fs.openSync(`./toto.jpg`, 'w');
    idx = 0
    dataSocket.on('message', (msg, info) => {
      console.log('Segment received: ', typeof msg, msg[0], msg.length, segment_nb++, info.size);
      //console.log(msg.toString())
      if(msg.toString()!='FINI'){
        fs.writeSync(fileWrite, msg, 0, msg.length, idx)
        idx+=msg.length
      }
    })
  }

handShake.then(
    async function (newPort) {//1
        console.log('Handshake done!');
        const dataSocket = createDataSocket();
        //rl.question("File:", function( filename) {
        console.time('Measuring time');
        sendFilename(dataSocket, newPort, '1.jpg');
        await receiveFile(dataSocket);
        console.timeEnd('Measuring time');
        console.log('Transmission finished')
        //  rl.close();
        // });

    }
).catch(
    function (reason) {//0
        console.log(reason)
        console.log('Something\'s gone wrong.');
    });



/*setTimeout( () => {
    connectionClientS.close()
},10000)*/