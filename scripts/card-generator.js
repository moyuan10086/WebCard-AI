/**
 * @description 卡片生成器主类
 */
class CardGenerator {
  /**
   * @description 构造函数，初始化卡片生成器
   */
  constructor() {
    this.cardData = null;
    this.currentTemplate = 'simple';
    this.currentBackground = '#F5F5F5';
    this.currentFont = 'default';
    this.currentAlign = 'left';
    this.currentFontColor = null;
    this.qrcode = null;
    
    this.init();
  }

  /**
   * @description 初始化函数
   */
  async init() {
    // 加载保存的卡片数据
    await this.loadCardData();
    // 初始化事件监听
    this.initEventListeners();
    // 初始化二维码
    this.initQRCode();
    // 设置默认字体颜色
    this.setFontColor('#333333');
    // 渲染预览
    this.updatePreview();
  }

  /**
   * @description 加载卡片数据
   */
  async loadCardData() {
    try {
      const result = await chrome.storage.local.get('cardData');
      this.cardData = result.cardData || {};
      this.updateContentDisplay();
    } catch (error) {
      console.error('加载卡片数据失败:', error);
    }
  }

  /**
   * @description 初始化事件监听器
   */
  initEventListeners() {
    // 模板选择
    document.querySelectorAll('.template-option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.setTemplate(e.currentTarget.dataset.template);
      });
    });

    // 背景颜色选择
    this.initBackgroundOptions();

    // 自定义背景图片
    document.getElementById('bgImageUpload').addEventListener('change', this.handleImageUpload.bind(this));

    // 字体选择
    document.getElementById('fontFamily').addEventListener('change', (e) => {
      this.setFont(e.target.value);
    });

    // 文本对齐
    document.querySelectorAll('.text-align-options button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.setTextAlign(e.target.dataset.align);
      });
    });

    // 导出按钮
    document.getElementById('exportButton').addEventListener('click', this.exportCard.bind(this));

    // 复制图片按钮
    document.getElementById('copyImageButton').addEventListener('click', this.copyImageToClipboard.bind(this));

    // 复制文本按钮
    document.getElementById('copyTextButton').addEventListener('click', this.copyTextToClipboard.bind(this));

    // 字体颜色选择
    document.querySelectorAll('.font-color-options .color-item').forEach(item => {
      const color = item.dataset.color;
      const preview = item.querySelector('.color-preview');
      // 设置预览颜色
      if (preview) {
        preview.style.backgroundColor = color;
      }
      
      item.addEventListener('click', () => {
        this.setFontColor(color);
        this.updateFontColorSelection(item);
      });
    });

    // 自定义颜色选择
    const customColorInput = document.getElementById('customFontColor');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        this.setFontColor(e.target.value);
        // 移除其他颜色选项的选中状态
        document.querySelectorAll('.font-color-options .color-item').forEach(item => {
          item.classList.remove('active');
        });
      });
    }
  }

  /**
   * @description 初始化二维码
   */
  initQRCode() {
    this.updateQRCode();
  }

  /**
   * @description 更新二维码
   */
  updateQRCode() {
    const qrcodeElement = document.getElementById('qrcode');
    qrcodeElement.innerHTML = ''; // 清除旧的二维码
    
    if (!this.cardData?.url) {
      qrcodeElement.innerHTML = '<div class="qrcode-error">等待网页数据</div>';
      return;
    }

    try {
      // 添加加载状态
      qrcodeElement.innerHTML = '<div class="qrcode-loading"></div>';

      // 创建二维码图片元素
      const qrImage = document.createElement('img');
      qrImage.style.width = '100%';
      qrImage.style.height = '100%';
      qrImage.style.objectFit = 'contain';
      
      // 使用 Google Charts API 生成二维码
      const encodedUrl = encodeURIComponent(this.cardData.url);
      qrImage.src = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chld=M|0&chl=${encodedUrl}`;
      
      // 处理加载完成
      qrImage.onload = () => {
        qrcodeElement.innerHTML = '';
        qrcodeElement.appendChild(qrImage);
      };
      
      // 处理加载失败
      qrImage.onerror = () => {
        console.error('二维码加载失败，尝试备用服务');
        // 使用备用服务 QR Server
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
      };

    } catch (error) {
      console.error('生成二维码失败:', error);
      qrcodeElement.innerHTML = '<div class="qrcode-error">二维码生成失败</div>';
    }
  }

  /**
   * @description 获取二维码颜色
   * @returns {string} 颜色值
   */
  getQRCodeColor() {
    const templateColors = {
      'simple': '#333333',
      'vintage': '#2c1810',
      'modern': '#1a1a1a'
    };
    return templateColors[this.currentTemplate] || '#000000';
  }

  /**
   * @description 更新内容显示
   */
  updateContentDisplay() {
    if (!this.cardData) return;

    // 更新网站图标
    const websiteIcon = document.getElementById('websiteIcon');
    const hostname = new URL(this.cardData.url).hostname;
    websiteIcon.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    
    // 更新网站名称
    document.getElementById('websiteName').textContent = this.cardData.title || hostname;
    
    // 更新内容
    document.getElementById('contentText').textContent = this.cardData.text;
    
    // 更新时间戳
    const timestamp = new Date(this.cardData.timestamp);
    document.getElementById('timestamp').textContent = timestamp.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 添加插件标识
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.textContent = 'Generated by moyuan';
    document.querySelector('.card-content').appendChild(watermark);

    // 更新二维码
    this.updateQRCode();
  }

  /**
   * @description 设置模板
   * @param {string} template - 模板名称
   */
  setTemplate(template) {
    this.currentTemplate = template;
    
    // 移除所有模板的active状态
    document.querySelectorAll('.template-option').forEach(option => {
      option.classList.remove('active');
    });
    
    // 设置当前模板的active状态
    const selectedTemplate = document.querySelector(`[data-template="${template}"]`);
    if (selectedTemplate) {
      selectedTemplate.classList.add('active');
    }
    
    // 更新预览
    const preview = document.getElementById('cardPreview');
    preview.className = `card-preview template-${template}`;
    
    // 如果没有自定义字体颜色，则使用模板默认颜色
    if (!this.currentFontColor) {
      const templateColors = {
        simple: '#333333',
        vintage: '#2c1810',
        modern: '#1a1a1a'
      };
      this.setFontColor(templateColors[template]);
    }
  }

  /**
   * @description 设置元数据颜色
   * @param {string} color - 颜色值
   */
  setMetaColor(color) {
    const websiteName = document.getElementById('websiteName');
    const timestamp = document.getElementById('timestamp');
    const author = document.getElementById('author');
    
    websiteName.style.color = color;
    timestamp.style.color = color;
    author.style.color = color;
  }

  /**
   * @description 设置主要内容文字颜色
   * @param {string} color - 颜色值
   */
  setContentColor(color) {
    const contentText = document.getElementById('contentText');
    contentText.style.color = color;
    this.currentFontColor = color;
  }

  /**
   * @description 设置字体颜色
   * @param {string} color - 颜色值
   */
  setFontColor(color) {
    if (!color) return;
    
    this.currentFontColor = color;
    const contentText = document.getElementById('contentText');
    if (contentText) {
      contentText.style.color = color;
    }
  }

  /**
   * @description 初始化背景选择
   */
  initBackgroundOptions() {
    // 初始化纯色背景
    document.querySelectorAll('.color-options .color-item').forEach(item => {
      const color = item.dataset.color;
      const preview = item.querySelector('.color-preview');
      if (preview) {
        preview.style.backgroundColor = color;
      }
      
      item.addEventListener('click', () => {
        this.setBackground(color);
        this.updateBackgroundSelection('color', item);
      });
    });

    // 初始化渐变背景
    document.querySelectorAll('.gradient-options .gradient-item').forEach(item => {
      const gradientName = item.dataset.gradient;
      const preview = item.querySelector('.gradient-preview');
      const gradient = this.getGradientByName(gradientName);
      if (preview) {
        preview.style.background = gradient;
      }
      
      item.addEventListener('click', () => {
        this.setBackground(gradient);
        this.updateBackgroundSelection('gradient', item);
      });
    });
  }

  /**
   * @description 根据名称获取渐变样式
   * @param {string} name - 渐变名称
   * @returns {string} 渐变样式
   */
  getGradientByName(name) {
    const gradientMap = {
      '暖阳': 'linear-gradient(135deg, #FFE4B5 0%, #FFA07A 100%)',
      '清新': 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
      '梦幻': 'linear-gradient(135deg, #E1BEE7 0%, #B388FF 100%)'
    };
    return gradientMap[name] || gradientMap['暖阳'];
  }

  /**
   * @description 更新背景选择状态
   * @param {string} type - 背景类型
   * @param {HTMLElement} selectedItem - 选中的元素
   */
  updateBackgroundSelection(type, selectedItem) {
    // 移除所有active状态
    document.querySelectorAll('.color-item, .gradient-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 添加active状态
    selectedItem.classList.add('active');
    
    // 清除自定义背景图片的选择
    const fileInput = document.getElementById('bgImageUpload');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * @description 处理图片上传
   * @param {Event} event - 上传事件对象
   */
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 获取卡片预览区域的尺寸
        const cardPreview = document.querySelector('.card-preview');
        const previewRect = cardPreview.getBoundingClientRect();
        
        // 计算最佳缩放比例
        const targetWidth = previewRect.width;
        const targetHeight = previewRect.height;
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        
        let width, height;
        if (imgRatio > targetRatio) {
          // 图片更宽，以高度为基准
          height = targetHeight;
          width = height * imgRatio;
        } else {
          // 图片更高，以宽度为基准
          width = targetWidth;
          height = width / imgRatio;
        }

        // 创建canvas进行图片处理
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 应用高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为base64并优化质量
        const optimizedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // 创建背景样式
        const backgroundStyle = this.createBackgroundStyle(optimizedImageUrl);
        
        // 更新背景
        this.setBackground(backgroundStyle);
        
        // 移除所有背景选项的active状态
        document.querySelectorAll('.color-item, .gradient-item').forEach(item => {
          item.classList.remove('active');
        });

        // 根据图片亮度调整文字颜色
        if (!this.currentFontColor) {
          const brightness = this.getImageBrightness(ctx, width, height);
          const textColor = brightness > 128 ? '#333333' : '#ffffff';
          this.setFontColor(textColor);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * @description 创建背景样式
   * @param {string} imageUrl - 图片URL
   * @returns {string} 背景样式
   */
  createBackgroundStyle(imageUrl) {
    // 添加半透明遮罩
    const overlay = `linear-gradient(
      rgba(255,255,255,0.85),
      rgba(255,255,255,0.85)
    )`;
    
    // 组合背景样式
    return `${overlay}, url(${imageUrl})`;
  }

  /**
   * @description 设置背景
   * @param {string} background - 背景值
   */
  setBackground(background) {
    this.currentBackground = background;
    const cardContent = document.querySelector('.card-content');
    
    if (!cardContent) return;
    
    // 清除之前的所有背景相关样式
    cardContent.style.cssText = `
      padding: 32px;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      transition: all 0.3s ease;
    `;
    
    if (background.startsWith('linear-gradient') && background.includes('url(')) {
      // 自定义背景图片
      cardContent.style.background = '#ffffff';
      cardContent.style.backgroundImage = background;
      cardContent.style.backgroundSize = 'cover';
      cardContent.style.backgroundPosition = 'center';
      cardContent.style.backgroundRepeat = 'no-repeat';
      cardContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else if (background.includes('gradient')) {
      // 渐变背景
      cardContent.style.background = background;
      cardContent.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
      cardContent.style.backdropFilter = 'blur(10px)';
    } else {
      // 纯色背景
      cardContent.style.background = background;
      cardContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    }
  }

  /**
   * @description 获取图片的平均亮度
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   * @param {number} width - 图片宽度
   * @param {number} height - 图片高度
   * @returns {number} 平均亮度值(0-255)
   */
  getImageBrightness(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height).data;
    let sum = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      // 使用相对亮度公式: 0.299R + 0.587G + 0.114B
      sum += (imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114);
    }
    return sum / (width * height);
  }

  /**
   * @description 设置字体
   * @param {string} font - 字体名称
   */
  setFont(font) {
    this.currentFont = font;
    const fontFamilies = {
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      songti: 'SimSun, "宋体", serif',
      kaiti: 'KaiTi, "楷体", serif',
      heiti: 'SimHei, "黑体", sans-serif',
      yuanti: 'YouYuan, "圆体", sans-serif',
      fangsong: 'FangSong, "仿宋", serif'
    };
    document.getElementById('contentText').style.fontFamily = fontFamilies[font];
  }

  /**
   * @description 设置文本对齐方式
   * @param {string} align - 对齐方式
   */
  setTextAlign(align) {
    this.currentAlign = align;
    document.getElementById('contentText').style.textAlign = align;
  }

  /**
   * @description 更新预览
   */
  updatePreview() {
    const preview = document.getElementById('cardPreview');
    preview.className = `card-preview template-${this.currentTemplate}`;
  }

  /**
   * @description 导出卡片
   */
  async exportCard() {
    const exportButton = document.getElementById('exportButton');
    const format = document.getElementById('exportFormat').value;
    const quality = document.getElementById('exportQuality').value;

    // 保存原始文本
    const originalText = exportButton.textContent;

    try {
      // 显示加载状态
      exportButton.textContent = '正在导出...';
      exportButton.style.pointerEvents = 'none';
      exportButton.style.background = '#6c757d';
      
      // 获取预览元素
      const element = document.getElementById('cardPreview');
      
      // 配置html2canvas选项
      const options = {
        scale: quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('cardPreview');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.width = '600px';
          }
        }
      };

      // 生成canvas
      const canvas = await html2canvas(element, options);

      // 获取文件名
      const websiteName = document.getElementById('websiteName').textContent;
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = websiteName.replace(/[<>:"/\\|?*]/g, '_');
      
      // 根据格式导出
      if (format === 'pdf') {
        // 获取canvas尺寸（以毫米为单位，假设96dpi）
        const width = canvas.width;
        const height = canvas.height;
        const pdfWidth = (width * 25.4) / 96;
        const pdfHeight = (height * 25.4) / 96;

        try {
          // 创建PDF文档
          const pdf = new window.jspdf.jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });

          // 将canvas转换为图片
          const imgData = canvas.toDataURL('image/jpeg', 0.95);

          // 添加图片到PDF
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');

          // 保存PDF
          pdf.save(`${safeName}_分享卡片_${timestamp}.pdf`);
        } catch (pdfError) {
          console.error('PDF导出失败:', pdfError);
          throw new Error('PDF导出失败，请重试');
        }
      } else {
        // 导出为图片
        const link = document.createElement('a');
        const quality = format === 'jpg' ? 0.95 : 1.0;
        link.download = `${safeName}_分享卡片_${timestamp}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, quality);
        link.click();
      }

      // 显示成功消息
      exportButton.textContent = '导出成功';
      exportButton.style.background = '#28a745';
      
      // 2秒后恢复按钮状态
      setTimeout(() => {
        exportButton.textContent = originalText;
        exportButton.style.pointerEvents = 'auto';
        exportButton.style.background = '';
      }, 2000);

    } catch (error) {
      console.error('导出失败:', error);
      // 显示错误消息
      exportButton.textContent = '导出失败';
      exportButton.style.background = '#dc3545';
      
      // 2秒后恢复按钮状态
      setTimeout(() => {
        exportButton.textContent = originalText;
        exportButton.style.pointerEvents = 'auto';
        exportButton.style.background = '';
      }, 2000);
    }
  }

  /**
   * @description 导出为图片
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {string} format - 导出格式
   * @param {string} quality - 导出质量
   */
  exportToImage(canvas, format, quality) {
    const qualityMap = {
      high: 1.0,
      medium: 0.8,
      low: 0.6
    };

    const websiteName = document.getElementById('websiteName').textContent;
    const fileName = this.generateFileName(websiteName, format);

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL(`image/${format}`, qualityMap[quality]);
    link.click();
  }

  /**
   * @description 生成文件名
   * @param {string} websiteName - 网站名称
   * @param {string} format - 文件格式
   * @returns {string} 文件名
   */
  generateFileName(websiteName, format) {
    // 移除网站名称中的非法字符
    const safeName = websiteName.replace(/[<>:"/\\|?*]/g, '_');
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${safeName}_分享卡片_${date}.${format}`;
  }

  /**
   * @description 更新字体颜色选择状态
   * @param {HTMLElement} selectedItem - 选中的颜色元素
   */
  updateFontColorSelection(selectedItem) {
    if (!selectedItem) return;
    
    // 移除所有active状态
    document.querySelectorAll('.font-color-options .color-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // 添加active状态
    selectedItem.classList.add('active');
    
    // 更新自定义颜色选择器的值
    const customColorInput = document.getElementById('customFontColor');
    if (customColorInput && selectedItem.dataset.color) {
      customColorInput.value = selectedItem.dataset.color;
    }
  }

  /**
   * @description 复制卡片图片到剪贴板
   */
  async copyImageToClipboard() {
    try {
      // 生成卡片图片
      const canvas = await html2canvas(document.getElementById('cardPreview'), {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // 转换canvas为blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      try {
        // 复制图片
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        
        // 显示成功提示
        const copyButton = document.getElementById('copyImageButton');
        const originalText = copyButton.textContent;
        copyButton.textContent = '复制成功！';
        copyButton.style.background = '#28a745';
        
        // 2秒后恢复按钮状态
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.style.background = '';
        }, 2000);
      } catch (clipError) {
        console.error('复制图片失败:', clipError);
        alert('当前浏览器不支持复制图片，请尝试使用导出功能');
      }
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
    }
  }

  /**
   * @description 复制卡片文本到剪贴板
   */
  async copyTextToClipboard() {
    try {
      const websiteName = document.getElementById('websiteName').textContent;
      const contentText = document.getElementById('contentText').textContent;
      const author = document.getElementById('author').textContent;
      const timestamp = document.getElementById('timestamp').textContent;
      
      // 组织复制内容
      const copyContent = [
        `来自：${websiteName}`,
        '',
        contentText,
        '',
        `作者：${author}`,
        `时间：${timestamp}`,
      ].join('\n');

      // 复制文本
      await navigator.clipboard.writeText(copyContent);
      
      // 显示成功提示
      const copyButton = document.getElementById('copyTextButton');
      const originalText = copyButton.textContent;
      copyButton.textContent = '复制成功！';
      copyButton.style.background = '#6c757d';
      
      // 2秒后恢复按钮状态
      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = '';
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请重试');
    }
  }
}

// 初始化卡片生成器
new CardGenerator(); 