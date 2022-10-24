class firmata_web{
    constructor(port, baud) {
      this.port = port;
      this.baud = baud;
    };

    connect(){

    }
    disconnect(){

    }
    getPorts(){

    }
    
  }


  //When the connectButton is pressed
  $scope.clickConnect = async function() {
    if (port) {
        //if already connected, disconnect
        $scope.disconnect();

    } else {
        //otherwise connect
        await $scope.connect();
    }
};
$scope.connect = async function connect() {

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
            baudRate: 115200
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
        $scope.readLoop();
    } catch (e) {
        /*
        //If the pipeTo error appears; clarify the problem by giving suggestions.
        if (e == "TypeError: Cannot read property 'pipeTo' of undefined") {
            e += "\n Use Google Chrome and enable-experimental-web-platform-features"
        }
        //connectButton.innerText = "Connect"
        //statusBar.innerText = e;
        */
    }
};

//Write to the Serial port
$scope.writeToStream = async function(line) {
    const writer = outputStream.getWriter();
    writer.write(line);
    writer.releaseLock();
};

//Disconnect from the Serial port
$scope.disconnect = async function() {

    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => {});
        reader = null;
        inputDone = null;
    }
    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }
    //statusBar.innerText = "Disconnected";
    //connectButton.innerText = "Connect"
    //Close the port.
    await port.close();
    port = null;
};
//Read the incoming data
$scope.readLoop = async function() {

    let sendStr = $scope.deviceConfig.device_id + "," + $scope.deviceConfig.key + "," + $scope.deviceConfig.wifi_ssid + "," + $scope.deviceConfig.wifi_password + "," + $scope.deviceConfig.admin_password + "," + $scope.deviceConfig.name+"\n";
    const writer = outputStream.getWriter();
    writer.write(sendStr);
    writer.releaseLock();
    let timeout_check_serial = Date.now();
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Allow the serial port to be closed later.
        reader.releaseLock();
        break;
      }
      // value is a string.
      //console.log(value);
      if(value.includes("CDONE#")){
          $scope.disconnect();
          Swal.fire("Configuration Done!", "Now you can use the device with magicblocks", "success");
          break;
      }
      if((Date.now()-timeout_check_serial)>3000){
          $scope.disconnect();
          Swal.fire("Configuration Failed!", "Try again, check drivers & cable", "error");
      }
    }
};