
const util = require('util');
const sleep = util.promisify(setTimeout)
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

async function sendFile(dataSocket, info, filename) {
    return new Promise(async (resolve) => {
        const MTU = 1500;
        let bytesToRead = MTU;
        let segment_nb = 1;
        let counter_sent = 0;
        let total_Size = 0;
        var buffer = new Buffer.alloc(MTU);

        //Client


        console.log(filename + ` | Received ${filename.length} bytes from ${info.address}:${info.port}`);
        const file = fs.openSync(`./assets/${filename}`, 'r');
        //console.log(file)
        const stats = fs.statSync(`./assets/${filename}`);
        const fileSizeInBytes = stats.size;
        console.log(fileSizeInBytes)

        while ((segment_nb - 1) * MTU < fileSizeInBytes) {

            if ((segment_nb) * MTU > fileSizeInBytes) {
                bytesToRead = MTU - (MTU * segment_nb - fileSizeInBytes);
                buffer = new Buffer.alloc(bytesToRead);
            }
            const bytesRead = fs.readSync(file, buffer, 0, bytesToRead, null);
            //await sendData(dataSocket,buffer,info.port,infor.address);
            console.log(`Segment ${segment_nb}: ${bytesRead} bytes read. Buffer size: ${buffer.length}`);
            await dataSocket.send(new Buffer.from(buffer), info.port, info.address, async (error, bytes) => {
                //await dataSocket.send(new Buffer.from((counter_sent+1).toString()), info.port, info.address, async (error, bytes) => {
                if (error) {
                    console.log(error);
                    console.log('Error sending')
                    client.close();
                } else {
                    total_Size = total_Size + bytesRead;
                    counter_sent++;
                    if (total_Size == fileSizeInBytes) {

                        fs.closeSync(file);
                        console.log('Done');
                        resolve('Done')
                    }
                    console.log(`Sending packet ${counter_sent} of ${bytes.toString()} sent\n`);
                }
            })
            segment_nb++;
            //await sleep(1)
            
            //await sendData(dataSocket,buffer,info.port,info.address);

            console.log(` #${segment_nb}`)


        }

        /*fs.closeSync(file);
        console.log(`File ${filename} closed :)`)
        resolve('Done')*/



    })

}

async function sendData(socket, buffer, port, address) {
    await socket.send(new Buffer.from(buffer), port, address, (error, bytes) => {
        if (error) {
            //console.log(error);
            console.log('Error sending')
            client.close();
        } else {
            // total_Size = total_Size + bytesRead;
            console.log(`Sending packet of ${bytes.toString()} bytes`);
        }
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
            await sendFile(dataSocketArray[0][0], info, msg.toString());
            await sleep(3000)
            dataSocketArray[0][0].send(new Buffer.from('FINI'), info.port, info.address, (error, bytes) => {
                if (error) {
                    console.log(error);
                    client.close();
                } else {
                    console.log('Fini: ' + bytes.toString() + ' sent');
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