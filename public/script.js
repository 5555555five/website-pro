let currentStream; // 保存当前的视频流
let selectedDeviceId; // 保存选择的摄像头 ID

// 添加日志记录功能
function logAction(action) {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleString(); // 获取当前时间
    const logEntry = document.createElement('div');
    logEntry.textContent = `${timestamp} - ${action}`; // 创建日志条目
    logContainer.appendChild(logEntry); // 将日志条目添加到日志容器
    logContainer.scrollTop = logContainer.scrollHeight; // 自动滚动到最底部
}

// 选择图片和视频按钮点击事件
document.getElementById('selectImageButton').addEventListener('click', function() {
    document.getElementById('imageUpload').click();
    logAction("选择图片");
});

document.getElementById('selectVideoButton').addEventListener('click', function() {
    document.getElementById('videoUpload').click();
    logAction("选择视频");
});

// 选择摄像头按钮点击事件
document.getElementById('selectCameraButton').addEventListener('click', async function() {
    const devices = await getMediaDevices();
    if (devices.length > 0) {
        const selectedDeviceIndex = prompt("请选择摄像头：\n" + devices.map((device, index) => `${index}: ${device.label}`).join('\n'));
        selectedDeviceId = devices[selectedDeviceIndex]?.deviceId;
        if (selectedDeviceId) {
            document.getElementById('startMonitoringButton').style.display = 'block'; // 显示开始监控按钮
            logAction("选择摄像头: " + devices[selectedDeviceIndex].label);
        } else {
            alert("无效的选择");
        }
    } else {
        alert("没有可用的摄像头");
    }
});

// 开始监控按钮点击事件
document.getElementById('startMonitoringButton').addEventListener('click', function() {
    if (selectedDeviceId) {
        startMonitoring(selectedDeviceId);
    } else {
        alert("请先选择摄像头");
    }
});

// 停止监控按钮点击事件
document.getElementById('stopMonitoringButton').addEventListener('click', function() {
    stopMonitoring();
});

// 获取可用的媒体设备
async function getMediaDevices() {
    return navigator.mediaDevices.enumerateDevices();
}

// 启动监控
function startMonitoring(deviceId) {
    const video = document.getElementById('uploadedVideo');
    const constraints = {
        video: { deviceId: { exact: deviceId } }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            currentStream = stream; // 保存流
            video.srcObject = stream;
            video.play();
            video.style.display = 'block'; // 显示视频

            // 显示结果容器
            const resultContainer = document.getElementById('resultContainer');
            resultContainer.style.display = 'block';

            clearImage(); // 清除之前的图片

            // 隐藏开始监控按钮，显示停止监控按钮
            document.getElementById('startMonitoringButton').style.display = 'none';
            document.getElementById('stopMonitoringButton').style.display = 'block';

            logAction("开始监控摄像头: " + deviceId);
        })
        .catch(error => {
            console.error("无法访问摄像头:", error);
            alert("无法访问摄像头");
        });
}

// 停止监控
function stopMonitoring() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop()); // 停止所有视频流
    }

    const video = document.getElementById('uploadedVideo');
    video.style.display = 'none'; // 隐藏视频

    // 显示最后一帧画面
    const canvas = document.getElementById('resultCanvas');
    canvas.width = video.videoWidth; // 设置画布宽度
    canvas.height = video.videoHeight; // 设置画布高度
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0); // 绘制最后一帧
    canvas.style.display = 'block'; // 显示画布

    // 隐藏停止监控按钮
    document.getElementById('stopMonitoringButton').style.display = 'none';

    logAction("停止监控");
}

// 处理图片选择
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const imageFile = event.target.files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            displayImage(e.target.result); // 显示选择的图片
            logAction("上传图片: " + imageFile.name);
        };
        reader.readAsDataURL(imageFile); // 读取文件
    }
});

// 处理视频选择
document.getElementById('videoUpload').addEventListener('change', function(event) {
    const videoFile = event.target.files[0];
    if (videoFile) {
        clearImage(); // 清除之前的图片
        displayVideo(URL.createObjectURL(videoFile)); // 显示选择的视频
        logAction("上传视频: " + videoFile.name);
    }
});

// 显示选择的图片
function displayImage(imageSrc) {
    const img = document.getElementById('uploadedImage');
    img.src = imageSrc; // 设置图片的 src
    img.style.width = '1044px';
    img.style.height = '480px';
    img.style.objectFit = 'contain';
    img.style.display = 'block'; // 显示图片

    // 显示结果容器
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.style.display = 'block';

    // 隐藏视频和画布
    document.getElementById('uploadedVideo').style.display = 'none';
    document.getElementById('resultCanvas').style.display = 'none';
}

// 清除图像和视频
function clearImage() {
    const img = document.getElementById('uploadedImage');
    img.src = ''; // 清空 src
    img.style.display = 'none'; // 隐藏图片

    const video = document.getElementById('uploadedVideo');
    video.src = ''; // 清空视频
    video.style.display = 'none'; // 隐藏视频

    const canvas = document.getElementById('resultCanvas');
    canvas.style.display = 'none'; // 隐藏画布
}

// 显示选择的视频
function displayVideo(videoSrc) {
    const video = document.getElementById('uploadedVideo');
    video.src = videoSrc; // 设置视频的 src
    video.style.display = 'block'; // 显示视频

    // 显示结果容器
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.style.display = 'block';

    // 隐藏图片和画布
    document.getElementById('uploadedImage').style.display = 'none';
    document.getElementById('resultCanvas').style.display = 'none';
}

// 模型加载按钮点击事件
document.getElementById('uploadModelButton').addEventListener('click', function() {
    // 可选择的模型列表，关联模型名称与路径
    const models = [
        { name: '模型A', path: 'D:\\code\\yolo\\my-website\\public\\best.pt' },
        { name: '模型B', path: 'D:\\code\\yolo\\my-website\\public\\modelB.pt' },
        { name: '模型C', path: 'D:\\code\\yolo\\my-website\\public\\modelC.pt' }
    ];

    // 提示用户选择模型
    const selectedModelIndex = prompt("请选择模型：\n" + models.map((model, index) => `${index}: ${model.name}`).join('\n'));

    if (selectedModelIndex !== null && models[selectedModelIndex]) {
        const selectedModel = models[selectedModelIndex];
        logAction("模型加载: " + selectedModel.name);
        alert("您选择的模型是: " + selectedModel.name);

        // 调用加载模型的逻辑
        loadModel(selectedModel.path); // 使用模型的路径
    } else {
        alert("无效的选择");
    }
});

// 模型加载的逻辑
function loadModel(modelName) {
    // 这里可以添加加载模型的实际逻辑，如从服务器获取模型
    console.log("正在加载模型: " + modelName);
    logAction("正在加载模型: " + modelName);
}

// ... (其余代码保持不变)

document.getElementById('inferButton').addEventListener('click', function() {
    const imgInput = document.getElementById('imageUpload');
    const imgFile = imgInput.files[0];

    if (!imgFile) {
        alert("请先上传一张图片！");
        return;
    }

    const formData = new FormData();
    formData.append('file', imgFile);

    fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败，状态码：' + response.status);
        }
        return response.json(); // 转换为 JSON
    })
    .then(data => {
        console.log('推理结果:', data);

    // 处理图像
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + btoa(data.image);
    img.onload = function() {
        const resultCanvas = document.getElementById('resultCanvas');
        const ctx = resultCanvas.getContext('2d');

        // 设置 canvas 的样式
        resultCanvas.style.width = '1044px';
        resultCanvas.style.height = '480px';
        resultCanvas.style.objectFit = 'contain';

        resultCanvas.width = img.width; // 可以保持原始图像宽高
        resultCanvas.height = img.height; // 可以保持原始图像高

        ctx.drawImage(img, 0, 0);
        resultCanvas.style.display = 'block';
    };

        // 更新识别信息
        const recognizedObject = document.getElementById('recognizedObject');
        const confidence = document.getElementById('confidence');
        const coordinates = document.getElementById('coordinates');

        if (data.results.length > 0) {
            // 打印所有检测结果
            recognizedObject.innerHTML = data.results.map(result => result.type).join(', '); // 所有检测类别
            confidence.textContent = data.results.length; // 检测数量
        } else {
            recognizedObject.textContent = '无';
            confidence.textContent = '0';
        }

        // 隐藏上传的原图像
        document.getElementById('uploadedImage').style.display = 'none';
    })
    .catch(error => {
        console.error('推理失败:', error);
        alert("推理失败，请重试！具体错误：" + error.message);
    });
});
