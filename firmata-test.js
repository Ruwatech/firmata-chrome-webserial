let writer;
let pin_io_array = new Uint8Array(39);
let pin_direction_array = new Uint8Array(39);

const analogPinsESP32 = { "39": 0, "36": 1, "35": 2, "34": 3, "33": 4, "32": 5, "27": 6, "26": 7, "25": 8, "15": 9, "14": 10, "13": 11, "12": 12, "5": 13, "4": 14, "2": 15 };
var read_vald;

async function connect_serial() {
    console.log("connecting...");
    //Optional filter to only see relevant boards
    const filter1 = {
        usbVendorId: 0x1A86 // CH340G
    };
    const filter2 = {
        usbVendorId: 0x10C4 // CP2102
    };
    //Try to connect to the Serial port
    try {
        port = await navigator.serial.requestPort({ filters: [filter1, filter2] });
        // Continue connecting to |port|.

        // - Wait for the port to open.
        await port.open({
            baudRate: 57600
        });

        //statusBar.innerText = "Connected";
        //connectButton.innerText = "Disconnect"
        let decoder = new TextDecoderStream();
        inputDone = port.readable.pipeTo(decoder.writable);
        inputStream = decoder.readable;

        //const encoder = new TextEncoderStream();
        //outputDone = encoder.readable.pipeTo(port.writable);
        //outputStream = encoder.writable;
        writer = port.writable.getWriter();
        reader = inputStream.getReader();

    } catch (e) {
        //If the pipeTo error appears; clarify the problem by giving suggestions.
        if (e == "TypeError: Cannot read property 'pipeTo' of undefined") {
            e += "\n Use Google Chrome and enable-experimental-web-platform-features"
        }

    }
};

async function writeToStream(line) {
    writer.write(line);
    // console.log(line);
    //writer.releaseLock();
};

function digitalWrite_fmt(pin, state) {
    var arrays = new Uint8Array(6);
    let port_pin = Math.floor(pin / 8);
    arrays[0] = 0xF4;
    arrays[1] = pin;
    arrays[2] = 1;

    pin_direction_array[pin] = 1;

    arrays[3] = 0x90 + port_pin;
    pin_io_array[pin] = state;


    let portVal = 0;
    j = 0;
    for (let i = port_pin * 8; i <= pin + 7; i++) {
        console.log(i);
        if (pin_io_array[i] == 1) {
            portVal |= (1 << j);
        } else {
            portVal &= ~(1 << j);
        }
        j++;
    }
    //console.log(portVal.toString(2));
    arrays[4] = portVal;
    pin_io_array[(port_pin - 1) * 8 + 1] << 1 + pin_io_array[(port_pin - 1) * 8];

    arrays[5] = 0x00;

    writeToStream(arrays);
    //readLoop();
}

async function digital_read_fmt(pin) {
    //let flush_const = await flush_serial();
    let arrays = new Uint8Array(5);
    let port_pin = Math.floor(pin / 8);
    let value_dec = 0;
    arrays[0] = 0xF4;
    arrays[1] = pin;
    arrays[2] = 0x00;
    arrays[3] = 0xD0 + port_pin;
    arrays[4] = 0x01;
    writeToStream(arrays);
    let read_val = await readLoop(1)
    console.log(read_val.charCodeAt(0) + " " + read_val.charCodeAt(1) + " " + read_val.charCodeAt(3)); //add check to validate port
    for(let i=0; i<read_val.length; i++){
        if(read_val.charCodeAt(i) == 65533){
            value_dec = (read_val.charCodeAt(i+1)>>(pin-port_pin*8))&0b1;
            break;
        }
    }

   
    
    console.log(value_dec);
    return value_dec;
}


function analog_write_fmt(pin, value) {
    var arrays = new Uint8Array(9);
    let port_pin = Math.floor(pin / 8);
    arrays[0] = 0xF4;
    arrays[1] = pin;
    arrays[2] = 0x03;
    pin_direction_array[pin] = 1;
    arrays[3] = 0xF0;
    arrays[4] = 0x6F;
    pin_io_array[pin] = 1;
    arrays[5] = pin;
    arrays[6] = value;
    arrays[7] = 0x00;
    arrays[8] = 0xF7;
    writeToStream(arrays);
    //readLoop();
}

function buzzer_fmt(freq, duration){
    var arrays = new Uint8Array(8);
    //let port_pin = Math.floor(pin / 8);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x07;
    arrays[3] = freq;
    arrays[4] = 0x00;
    arrays[5] = duration&0xFF;
    arrays[6] = duration>>8;
    arrays[7] = 0xF7;
    writeToStream(arrays);
    
    
}

function display_text_fmt(text,text_size,xpos,ypos){
    var arrays = new Uint8Array(8+text.length);
    //let port_pin = Math.floor(pin / 8);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x01;
    arrays[3] = xpos;
    arrays[4] = ypos;
    arrays[5] = 0x02;
    arrays[6] = text.length;
    for(let i=0; i<text.length; i++){
        arrays[7+i] = text.charCodeAt(i);
    }

    arrays[7+text.length] = 0xF7;
    writeToStream(arrays);
}

function display_clear_fmt(){
    var arrays = new Uint8Array(4);
    //let port_pin = Math.floor(pin / 8);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x02;
    arrays[3] = 0xF7;
    writeToStream(arrays);
}



function play_tone_fmt(note, beats){
    var arrays = new Uint8Array(6);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x08;
    arrays[3] = note;
    arrays[4] = beats;
    arrays[5] = 0xF7;
    writeToStream(arrays);
    
}

function servo_write_fmt(pin, angle){
    var arrays = new Uint8Array(6);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x08;
    arrays[3] = note;
    arrays[4] = beats;
    arrays[5] = 0xF7;
    writeToStream(arrays);
    
}

//f4 10 01 f0 6f 10 ff 00 f7   
//f4 10 03 f0 6f 10 32 00 f7

async function analog_read_fmt(pin) {
    let arrays = new Uint8Array(5);
    let pin_s = analogPinsESP32[pin];
    arrays[0] = 0xF4;
    arrays[1] = pin_s;
    arrays[2] = 0x02;
    arrays[3] = 0xC0 + pin_s;
    arrays[4] = 0x01;
    writeToStream(arrays);
    let read_val = await readLoop(0)
    let value_dec = (read_val.charCodeAt(1)) + (read_val.charCodeAt(2) << 7);
    //console.log(value_dec);
    return value_dec;
}

async function temperature_read_fmt(pin) {
    let arrays = new Uint8Array(5);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x03;
    arrays[3] = pin;
    arrays[4] = 0xF7;
    writeToStream(arrays);
    let read_val = await readLoop(2)
    value_dec = read_val.charCodeAt(read_val.length-3)+(read_val.charCodeAt(read_val.length-2)<<4);

    
    //console.log("temp:"+value_dec);
    return value_dec;
}

async function humidity_read_fmt(pin) {
    let arrays = new Uint8Array(5);
    arrays[0] = 0xF0;
    arrays[1] = 0x02;
    arrays[2] = 0x11;
    arrays[3] = pin;
    arrays[4] = 0xF7;
    writeToStream(arrays);
    let read_val = await readLoop(2)
    value_dec = read_val.charCodeAt(read_val.length-3)+(read_val.charCodeAt(read_val.length-2)<<4);
    console.log("hum:"+value_dec);
    return value_dec;
}

async function readLoop(mode) { //0=normal reads | 1=digital read
    //console.log("reading");
    let timeout_check_serial = Date.now();
    let val;
    while (true) {
        const { value, done } = await reader.read();
        //console.log(value);
        //console.log("initv:" + value);
        //console.log(value.length);
        if (mode == 0) {
            if (value.length >= 2) {
                val = value;
                //reader.releaseLock();
                break;
            }
        } else if (mode == 1) {
            if (value.length >= 2) {
                if (val == null) {
                    val = value;
                } else {
                    val = val.concat(value);
                }
                //reader.releaseLock();
                break;
            } else {
                val = (value);
            }
        }else if (mode == 2) {
            if(val == null){
                val = value;
            }else{
                val = val.concat(value);
                if(val.charCodeAt(val.length-1) == 0xFFFD){
                    break;
                }
            }
        }


    };
    //console.log("read_v:" + val);
    return val;
}


async function flush_serial(){
    let temp = await readLoop(0);
}