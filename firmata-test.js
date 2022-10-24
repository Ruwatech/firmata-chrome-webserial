async function connect() {
    console.log("cgtn");
    //Optional filter to only see relevant boards
    const filter1 = {
        usbVendorId: 0x1A86 // CH340G
    };
    const filter2 = {
        usbVendorId: 0x10C4 // CP2102
    };
    //Try to connect to the Serial port
    try {
        port = await navigator.serial.requestPort({filters: [filter1,filter2]});
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

        const encoder = new TextEncoderStream();
        outputDone = encoder.readable.pipeTo(port.writable);
        outputStream = encoder.writable;

        reader = inputStream.getReader();
        var arrays = new Uint8Array(7);  
        arrays[0] = 0xF0;
        arrays[1] = 0xF5;
        arrays[2] = 16;
        arrays[3] = 1
        arrays[4] = 0xF7;
        arrays[5] = 0x0A;
        arrays[6] = 0x0D;
        writeToStream(arrays);
        readLoop();
    } catch (e) {
        //If the pipeTo error appears; clarify the problem by giving suggestions.
        if (e == "TypeError: Cannot read property 'pipeTo' of undefined") {
            e += "\n Use Google Chrome and enable-experimental-web-platform-features"
        }
        
    }
};

async function writeToStream(line) {
    const writer = outputStream.getWriter();
    writer.write(line);
    console.log(line);
    writer.releaseLock();
};


async function readLoop(sendStr) {
    console.log("reading");
    let timeout_check_serial = Date.now();
    while (true) {
      const { value, done } = await reader.read();
      console.log(value);
      if (done) {
        // Allow the serial port to be closed later.
        console.log(value);
        reader.releaseLock();
        break;
      }
      // value is a string.
      
    }
};