//웹소켓 참고용
function sigma_upload_file(file, dsc, callback, env= '', location = '') //file객체, file이름, 업로드 진행률 콜백
{
	const socket = io.connect('https://upload.snacpia.com', {
	// const socket = io.connect('http://192.168.100.170:3002', {
	// const socket = io.connect('https://socket.snacpia.com:3003', {
		cors: {origin: '*'}
	})

	let fileReader = new FileReader();
	console.log(file.type);

	fileReader.onload = function(event){

		let data;
		if(!event){
			data = fileReader.content;
		}else{
			data = event.target.result;
		}

		socket.emit('Upload', { 'Name' : dsc, 'Data' : data, 'env' : env, 'location':location });
	}
	socket.emit('Start', { 'Name' : dsc, 'Size' : file.size, 'env' : env, 'location':location });


	socket.on('disconnect', function (){
		console.log('disconnect');
	});

	socket.on('complete', function (){
		callback(100);
		socket.disconnect();
	});

	socket.on('MoreData', function (data){
		callback(data.Percent);
		var Place = data.Place * 100000;
		var NewFile = '';
		if(file.webkitSlice)
			NewFile = file.webkitSlice(Place, Place + Math.min(100000, (file.size-Place)));
		else
			NewFile = file.slice(Place, Place + Math.min(100000, (file.size-Place)));

		if (!FileReader.prototype.readAsBinaryString) {
			FileReader.prototype.readAsBinaryString = function (fileData) {
				var binary = "";
				var pt = this;
				var reader = new FileReader();
				reader.onload = function (e) {
					var bytes = new Uint8Array(reader.result);
					var length = bytes.byteLength;
					for (var i = 0; i < length; i++) {
						binary += String.fromCharCode(bytes[i]);
					}

					pt.content = binary;
					pt.onload();
				}
				reader.readAsArrayBuffer(fileData);
			}
		}

		fileReader.readAsBinaryString(NewFile);
	});
}
