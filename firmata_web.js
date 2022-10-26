    var writer;
    var pin_io_array = new Uint8Array(39);
    var pin_direction_array = new Uint8Array(39);

    async function connect_serial() {
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
        console.log(portVal.toString(2));
        arrays[4] = portVal;
        pin_io_array[(port_pin - 1) * 8 + 1] << 1 + pin_io_array[(port_pin - 1) * 8];

        arrays[5] = 0x00;

        writeToStream(arrays);
        //readLoop();
    }

    function analog_write_fmt(pin, value) {

    }

    function analog_read_fmt(pin){
        
    }
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

