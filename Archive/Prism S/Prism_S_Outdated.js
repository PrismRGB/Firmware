export function Name() { return "Prism S"; }
export function VendorId() { return 0x16D0; }
export function ProductId() { return 0x1294; }
export function Publisher() { return "PrismRGB"; }
export function Size() { return [0, 0]; }
export function Type() { return "Hid"; }
export function SubdeviceController(){ return true; }
export function DefaultPosition(){return [120, 80];}
export function DefaultScale(){return 8.0;}
export function DeviceType(){return "lightingcontroller"}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
GPUCable:readonly
ATXCable:readonly
GPUCableType:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"ArduinoCompatibilityMode", "group":"", "label":"Arduino Compatibility Mode", "type":"boolean", "default":"false"},
	];
}

export function SubdeviceController(){ return true; }
export function DefaultComponentBrand() { return "LianLi";}

//Channel Name, Led Limit
/** @type {ChannelConfigArray}  */
const ChannelArray = [
	["Channel 1", 162, 162],
	["Channel 2", 108, 108],
];

const DeviceMaxLedLimit = 228;

function SetupChannels() {
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		const channelInfo = ChannelArray[i];

		if(channelInfo){
			device.addChannel(...channelInfo);
		}
	}
}

export function Validate(endpoint) {
	return endpoint.interface === -1 || endpoint.interface === 0 || endpoint.interface === 2;
}

export function Initialize() {
	SetupChannels();
	device.setFrameRateTarget(60);
	CorsairLightingController.FetchFirmwareVersion();
}

export function Render() {
	device.clearReadBuffer();

	SendChannel(0);
	device.pause(1);

	SendChannel(1);
	device.pause(1);

	CorsairLightingController.CommitColors();

}

export function Shutdown() {
	CorsairLightingController.SetChannelToHardwareMode(0);
	CorsairLightingController.SetChannelToHardwareMode(1);
}

function SendChannel(Channel) {
	const componentChannel = device.channel(ChannelArray[Channel][0]);

	if(!componentChannel){
		return;
	}
	let ChannelLedCount = componentChannel.LedCount();

	let ColorData = [];

	if(LightingMode === "Forced"){
		ColorData = device.createColorArray(forcedColor, ChannelLedCount, "Separate");

	}else if(componentChannel.shouldPulseColors()){
		ChannelLedCount = 120;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0]);
		ColorData = device.createColorArray(pulseColor, ChannelLedCount, "Separate");

	}else{
		ColorData = componentChannel.getColors("Separate");
	}

	//Set up for update
	CorsairLightingController.SetDirectColors(Channel, ColorData);
}

/**
 * Protocol Library for Corsair's Legacy Lighting Controllers
 * @class CorsairLightingControllerProtocol
 */
class CorsairLightingControllerProtocol{
	/** @typedef {1 | 2} ModeId */
	/** @typedef {0 | 1} ChannelId*/

	constructor(){
		this.writeLength = 65;
		this.readLength = 17;

		/** @type {Object.<string, ModeId>} */
		this.modes = {
			hardware: 1,
			software: 2
		};

		/**
		 * @alias CommandIdDict
		 * @type {Object.<string, number>}
		 * @readonly
		 */
		this.commandIds = {
			firmware: 0x02,
			directColors: 0x032,
			commit: 0x33,
			startDirect: 0x34,
			reset: 0x37,
			mode: 0x38
		};
	}

	FetchFirmwareVersion(){
		const packet = [0x00, this.commandIds.firmware];
		device.clearReadBuffer();
		device.write(packet, this.writeLength);

		const data = device.read([0x00], this.readLength);
		device.log(data);
	}
	/** @param {ChannelId} ChannelId */
	SetChannelToHardwareMode(ChannelId){
		this.SetChannelMode(ChannelId, this.modes.hardware);
	}
	/** @param {ChannelId} ChannelId */
	SetChannelToSoftwareMode(ChannelId){
		this.SetChannelMode(ChannelId, this.modes.software);
	}
	/**
	 * @param {ChannelId} ChannelId
	 * @param {ModeId} Mode
	 */
	SetChannelMode(ChannelId, Mode){
		const packet = [0x00, this.commandIds.mode, ChannelId, Mode];

		device.write(packet, this.writeLength);
		this.SafeRead();
	}
	/**
	 * @param {ChannelId} ChannelId
	 * @param {number[][]} RGBData
	 */
	SetDirectColors(ChannelId, RGBData){
		this.SetChannelToSoftwareMode(ChannelId);

		if(ArduinoCompatibilityMode){
			this.StartDirectColorSend(ChannelId);
		}

		//Stream RGB Data
		let ledsSent = 0;
		// Check Red Channel Length
		let TotalLedCount = RGBData[0].length >= 204 ? 204 : RGBData[0].length;

		let [red, green, blue] = RGBData;

		while(TotalLedCount > 0){
			const ledsToSend = TotalLedCount >= 50 ? 50 : TotalLedCount;

			this.StreamDirectColors(ledsSent, ledsToSend, 0, red.splice(0, ledsToSend), ChannelId);

			this.StreamDirectColors(ledsSent, ledsToSend, 1, green.splice(0, ledsToSend), ChannelId);

			this.StreamDirectColors(ledsSent, ledsToSend, 2, blue.splice(0, ledsToSend), ChannelId);

			ledsSent += ledsToSend;
			TotalLedCount -= ledsToSend;
		}
	}
	StartDirectColorSend(ChannelId){
		const packet = [0x00, this.commandIds.startDirect, ChannelId];

		device.write(packet, this.writeLength);
		this.SafeRead();
	}
	StreamDirectColors(startIdx, count, colorChannelid, data, channelId) {
		let packet = [0x00, this.commandIds.directColors, channelId, startIdx, count, colorChannelid];
		packet = packet.concat(data);

		device.write(packet, this.writeLength);
		this.SafeRead();
	}
	CommitColors(){
		const packet = [0x00, this.commandIds.commit, 0xFF];

		device.write(packet, this.writeLength);
		this.SafeRead();
	}

	// Arduino based Node Pro's cannot use a 0 timeout buffer clear.
	// This results in a 6fps loss for arduino models we can avoid on official models.
	SafeRead(){
		if(ArduinoCompatibilityMode){
			return device.read([0x00], 17);
		}

		return device.read([0x00], 17, 0);
	}
}
const CorsairLightingController = new CorsairLightingControllerProtocol();

export function ImageUrl() {
	return "https://i.imgur.com/Y1wzRO7.png";
}