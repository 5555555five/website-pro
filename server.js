const express = require('express');
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');

const app = express(); // 确保这里定义了 app

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 配置 multer 以处理文件上传
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 处理图片上传
app.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
    if (req.files.image) {
        const imagePath = req.files.image[0].path;

        // 调用 Python 模型
        const options = {
            scriptPath: './',
            args: [imagePath]
        };

        PythonShell.run('run_model.py', options, function (err, results) {
            if (err) return res.status(500).send(err);
            try {
                const detections = JSON.parse(results[0]);
                return res.json({ detections: detections });
            } catch (parseError) {
                return res.status(500).send('解析结果失败');
            }
        });
    }

    if (req.files.video) {
        const videoPath = req.files.video[0].path;
        return res.json({ message: '视频上传成功', videoPath: videoPath });
    }

    return res.status(400).json({ message: '未上传任何文件' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
