/**
 * @description 将SVG图标转换为PNG格式
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * @description 转换SVG到PNG
 * @param {string} inputDir - 输入目录
 * @param {string} outputDir - 输出目录
 */
async function convertSvgToPng(inputDir, outputDir) {
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 读取所有SVG文件
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.svg'));

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.svg', '.png'));

    try {
      await sharp(inputPath)
        .png()
        .toFile(outputPath);
      console.log(`转换成功: ${file}`);
    } catch (error) {
      console.error(`转换失败 ${file}:`, error);
    }
  }
}

// 转换图标
convertSvgToPng(
  path.join(__dirname, '../assets/icons'),
  path.join(__dirname, '../assets/icons')
);

// 转换模板预览图
convertSvgToPng(
  path.join(__dirname, '../assets/templates'),
  path.join(__dirname, '../assets/templates')
); 