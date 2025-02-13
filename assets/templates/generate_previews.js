/**
 * @description 生成模板预览图片
 */
const fs = require('fs');
const path = require('path');

const templates = [
  {
    name: 'simple',
    style: {
      background: '#ffffff',
      contentBg: '#ffffff',
      shadow: '0 4px 12px rgba(0,0,0,0.08)',
      textColor: '#333333',
      borderRadius: '8px'
    }
  },
  {
    name: 'vintage',
    style: {
      background: '#f8f3e9',
      contentBg: '#f8f3e9',
      border: '1px solid rgba(44,24,16,0.15)',
      textColor: '#2c1810',
      pattern: true,
      borderRadius: '8px'
    }
  },
  {
    name: 'modern',
    style: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
      contentBg: 'rgba(255,255,255,0.9)',
      blur: true,
      textColor: '#2c2c2c',
      borderRadius: '16px',
      shadow: '0 8px 32px rgba(0,0,0,0.1)'
    }
  }
];

// SVG模板
const generatePreviewSVG = (template) => {
  const { style } = template;
  
  // 设置更合适的预览图尺寸
  const width = 240;
  const height = 180;
  const padding = 16;
  const contentWidth = width - (padding * 2);
  const contentHeight = height - (padding * 2);

  const pattern = style.pattern ? `
    <pattern id="paperPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="none"/>
      <circle cx="10" cy="10" r="0.5" fill="${style.textColor}" opacity="0.1"/>
    </pattern>
  ` : '';

  const blur = style.blur ? `
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
    </filter>
  ` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${pattern}
    ${blur}
    <linearGradient id="modernGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#f5f5f5"/>
    </linearGradient>
    <!-- 添加阴影效果 -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${height}" rx="${style.borderRadius}" 
    fill="${style.background}" 
    ${style.border ? `style="stroke: rgba(44,24,16,0.15); stroke-width: 1"` : ''}
    filter="url(#shadow)"
  />
  
  <!-- 内容区域 -->
  <g transform="translate(${padding}, ${padding})">
    <!-- 网站信息 -->
    <rect width="${contentWidth * 0.8}" height="${contentHeight * 0.1}" rx="4" 
      fill="${style.textColor}" opacity="0.1"/>
    
    <!-- 正文内容 -->
    <g transform="translate(0, ${contentHeight * 0.15})">
      <rect width="${contentWidth}" height="${contentHeight * 0.08}" 
        fill="${style.textColor}" opacity="0.8"/>
      <rect y="${contentHeight * 0.12}" width="${contentWidth * 0.8}" 
        height="${contentHeight * 0.08}" fill="${style.textColor}" opacity="0.6"/>
      <rect y="${contentHeight * 0.24}" width="${contentWidth * 0.9}" 
        height="${contentHeight * 0.08}" fill="${style.textColor}" opacity="0.6"/>
    </g>
    
    <!-- 底部信息 -->
    <g transform="translate(0, ${contentHeight * 0.8})">
      <rect width="${contentWidth * 0.4}" height="${contentHeight * 0.1}" rx="4" 
        fill="${style.textColor}" opacity="0.2"/>
      <rect x="${contentWidth * 0.7}" width="${contentWidth * 0.3}" 
        height="${contentHeight * 0.1}" rx="4" fill="${style.textColor}" opacity="0.2"/>
    </g>
  </g>
  
  ${style.pattern ? `<rect width="${width}" height="${height}" 
    fill="url(#paperPattern)" opacity="0.5"/>` : ''}
</svg>`;
};

// 创建templates目录
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// 生成模板预览图
templates.forEach(template => {
  const svg = generatePreviewSVG(template);
  const filePath = path.join(templatesDir, `${template.name}.svg`);
  
  // 添加SVG优化配置
  const optimizedSvg = svg.replace(/>\s+</g, '><') // 移除空白
    .replace(/\s+/g, ' ') // 合并空格
    .replace(/\s+"/g, '"') // 移除属性前的空格
    .replace(/"\s+/g, '"'); // 移除属性后的空格
  
  fs.writeFileSync(filePath, optimizedSvg);
}); 