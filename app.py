from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont
import torchvision.transforms as transforms
import torch
import io

app = Flask(__name__)
CORS(app) 

model_path = r'D:\code\yolo\my-website\public\best.pt'
model = YOLO(model_path)

preprocess = transforms.Compose([
    transforms.Resize((640, 640)),
    transforms.ToTensor(),
])

# 定义不同类别对应的颜色
def get_color(class_id):
    colors = [
        (255, 0, 0),   # 红色
        (0, 255, 0),   # 绿色
        (0, 0, 255),   # 蓝色
        (255, 255, 0), # 黄色
        (255, 0, 255), # 品红色
        (0, 255, 255), # 青色
        # 可以根据类别数量添加更多颜色
    ]
    return colors[class_id % len(colors)]

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    image = Image.open(file.stream).convert('RGB')
    input_tensor = preprocess(image).unsqueeze(0)  # 添加 batch 维度

    # 使用模型进行预测
    with torch.no_grad():
        results = model.predict(source=input_tensor, save=False)

    # 获取结果
    result = results[0]  # 结果列表中的第一个元素

    # 提取边界框、类别和置信度
    boxes = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else np.array([])
    scores = result.boxes.conf.cpu().numpy() if result.boxes is not None else np.array([])
    class_ids = result.boxes.cls.cpu().numpy() if result.boxes is not None else np.array([])
    class_names = result.names  # 类别名称字典

    # 转换图像格式用于绘制
    image_np = np.array(image)
    image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)  # 从 RGB 转为 BGR（OpenCV 使用）

    # 创建 PIL 图像对象
    image_result = Image.fromarray(cv2.cvtColor(image_cv, cv2.COLOR_BGR2RGB))

    font_path = r'D:\code\yolo\my-website\SimHei.ttf'  # 确保路径正确
    font_size = 20
    font = ImageFont.truetype(font_path, font_size)

    # 在绘制检测结果的部分进行修改
    draw = ImageDraw.Draw(image_result)
    for i in range(len(boxes)):
        box = boxes[i]
        score = scores[i]
        class_id = int(class_ids[i])
        class_name = class_names[class_id]

        x1, y1, x2, y2 = box

        # 获取颜色
        color = get_color(class_id)

        # 绘制边界框
        draw.rectangle([int(x1), int(y1), int(x2), int(y2)], outline=color, width=2)
        
        # 绘制类别名称和置信度
        text = f"{class_name} {score:.2f}"
        draw.text((int(x1), int(y1) - 10), text, fill=color, font=font)

    # 将图像保存到内存并发送
    img_io = io.BytesIO()
    image_result.save(img_io, 'JPEG')
    img_io.seek(0)

    # 返回 JSON 数据和图像
    response = {
        'results': [
            {
                'id': i + 1,
                'type': class_names[int(class_ids[i])],
                'confidence': float(scores[i])
            }
            for i in range(len(boxes))
        ],
        'image': img_io.getvalue().decode('latin1')  # 以 Base64 编码图像数据
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(port=5000)
