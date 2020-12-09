
const udp = require('dgram');//UDP Socket
const fs = require('fs'); //Read file

var initialPort = process.argv[2];

let dataSocketArray = [];
// --------------------creating a udp connectionSocket --------------------

// creating a udp connectionSocket
const connectionSocket = udp.createSocket('udp4')

// emits when any error occurs
connectionSocket.on('error', (error) => {
    console.log(error);
    connectionSocket.close();
})

async function handshake(info) {
    let data;
    const newPort = initialPort.substring(0, 3) + '1';
    data = Buffer.from('SYN-ACK' + newPort);
    connectionSocket.send(data, info.port, info.address, (error, bytes) => {
        if (error) {
            console.log(error);
            client.close();
        } else {
            console.log('Sending: ' + data);
        }
    })

    connectionSocket.on('message', (msg, info) => {
        if (msg == 'ACK') {
            console.log(msg.toString() + ` | Received ${msg.length} bytes from ${info.address}:${info.port}`);
            console.log('Handshake done!');
        }
    })
    return newPort;
}


// emits on new datagram msg
connectionSocket.on('message', async (msg, info) => {
    let newPort = "";
    if (msg == 'SYN') {
        console.log(msg.toString() + ` | Received ${msg.length} bytes from ${info.address}:${info.port}`)
        newPort = await handshake(info);
        createDataSocket(newPort);
    }







})  // end connectionSocket.on

function sendFile(dataSocket, info, filename) {
    return new Promise(resolve => {
        const MTU = 1500;
        let bytesToRead = MTU;
        let segment_nb = 1;
        let counter_sent = 0;
        let total_Size = 0;
        var buffer = new Buffer.alloc(MTU);
        console.log(filename + ` | Received ${filename.length} bytes from ${info.address}:${info.port}`);
        fs.open(`./assets/${filename}`, 'r', async function (err, fd) {
            if (err) {
                return console.log(err);
            }
            const stats = fs.statSync(`./assets/${filename}`);
            const fileSizeInBytes = stats.size;
            console.log(fileSizeInBytes)
            //while (segment_nb  < 5) {

            while ((segment_nb - 1) * MTU < fileSizeInBytes) {

                if ((segment_nb) * MTU > fileSizeInBytes) {
                    bytesToRead = MTU - (MTU * segment_nb - fileSizeInBytes);
                    //console.log('Aqui sali',bytesToRead)
                    //buffer = new Buffer.alloc(bytesToRead);
                }
                console.log((counter_sent ) * MTU);
                fs.read(fd, buffer, 0, bytesToRead, null,
                    async function (err, bytesR) {
                        if (err) {
                            console.log(err);
                        }

                        if (bytesR > 0) {
                            //const buffToSend = Buffer.from(buffer.buffer, 0, 785);
                            console.log('Bytes read: ' + bytesR)
                            console.log('Content: ', buffer.toString().substring(0,5))
                            if (bytesR != MTU) {
                                const resp = buffer;
                                buffer = new Buffer.alloc(bytesR);

                            }
                           
                            console.log('Val sent: ',counter_sent+1)
                            await dataSocket.send(new Buffer.from(buffer), info.port, info.address, async (error, bytes) => {
                            //await dataSocket.send(new Buffer.from((counter_sent+1).toString()), info.port, info.address, async (error, bytes) => {
                                if (error) {
                                    console.log(error);
                                    console.log('Error sending')
                                    client.close();
                                } else {
                                    total_Size = total_Size + bytesR;
                                    counter_sent++;
                                    if (total_Size == fileSizeInBytes) {
                                        console.log('Done');
                                        fs.close(fd, function (err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            //console.log(segment_nb)
                                            console.log("File closed successfully");
                                        })
                                        resolve('Done')
                                    }
                                    console.log(`Sending packet ${counter_sent} of ${bytes.toString()} sent\n`);

                                }
                            })
                        }
                    });
                segment_nb++;
            }
            console.log('I found it');
        });
    })

}

function createDataSocket(port) {
    const dataSocket = udp.createSocket('udp4')
    dataSocket.on('listening', () => {
        const address = dataSocket.address()
        const port = address.port
        const family = address.family
        const ipaddr = address.address

        console.log('connectionSocket is listening at port ' + port)
        console.log('connectionSocket ip :' + ipaddr)
        console.log('connectionSocket is IP4/IP6 : ' + family)
    })

    dataSocket.on('message', async (msg, info) => {
        const fileRegex = /[.]+/;
        if (dataSocketArray.length > 0 && fileRegex.test(msg.toString())) {
            console.time('Measuring time');
            await sendFile(dataSocketArray[0][0], info, msg.toString());
            console.timeEnd('Measuring time');
            dataSocketArray[0][0].send(new Buffer.from('FINI'), info.port, info.address, (error, bytes) => {
                if (error) {
                    console.log(error);
                    client.close();
                } else {
                    console.log(bytes.toString() + ' sent');
                }
            })
        }
    })

    dataSocket.on('close', () => {
        console.log('Socket is closed !');
    })


    dataSocket.bind(port);
    dataSocketArray.push([dataSocket, port]);
    //console.log(dataSocketArray);
}

//emits when socket is ready and listening for datagram msgs
connectionSocket.on('listening', () => {
    const address = connectionSocket.address()
    const port = address.port
    const family = address.family
    const ipaddr = address.address

    console.log('connectionSocket is listening at port ' + port)
    console.log('connectionSocket ip :' + ipaddr)
    console.log('connectionSocket is IP4/IP6 : ' + family)
})

//emits after the socket is closed using socket.close()
connectionSocket.on('close', () => {
    console.log('Socket is closed !')
})

connectionSocket.bind(initialPort);