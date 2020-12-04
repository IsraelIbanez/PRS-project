const { taskOne, taskTwo } = require('./tasks');

async function main(){
    try{
        console.time('Measuring time');
        const valueOne = await taskOne();
        const valueTwo = await taskTwo();
        console.timeEnd('Measuring time');
        console.log('Task one returned', valueOne);
        console.log('Task one returned', valueTwo);  
    }catch(e){
        console.log(e);
    }
}
 
main();
