/**
 * @description 获取当前页面内容并生成卡片
 */
async function generateCard() {
  const button = document.getElementById('generateCard');
  const buttonText = button.querySelector('.button-text');
  const originalText = buttonText.textContent;

  try {
    // 显示加载状态
    button.classList.add('loading');
    buttonText.textContent = 'AI正在总结...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 获取页面内容
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getPageContent
    });

    const pageContent = result[0].result;
    
    // 更新加载文本
    buttonText.textContent = 'AI总结中...';
    
    // 调用AI总结API
    const summary = await getSummary(pageContent);

    // 更新加载文本
    buttonText.textContent = '正在生成卡片...';

    // 保存卡片数据
    const cardData = {
      url: tab.url,
      title: tab.title,
      text: summary,
      timestamp: new Date().toISOString()
    };

    await chrome.storage.local.set({ cardData });
    
    // 添加淡出动画
    document.body.classList.add('fade-out');
    
    // 等待动画完成后打开卡片生成器
    setTimeout(() => {
      chrome.tabs.create({ url: 'card-generator.html' });
    }, 300);

  } catch (error) {
    console.error('生成卡片失败:', error);
    button.classList.remove('loading');
    buttonText.textContent = '生成失败，请重试';
    setTimeout(() => {
      buttonText.textContent = originalText;
    }, 2000);
    alert('生成卡片失败，请重试');
  }
}

/**
 * @description 获取页面内容
 * @returns {Object} 页面内容
 */
function getPageContent() {
  // 获取主要内容
  function extractMainContent() {
    const selectors = [
      'article',
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.innerText.trim();
      }
    }

    // 如果没有找到特定元素，尝试智能提取
    const paragraphs = Array.from(document.getElementsByTagName('p'))
      .filter(p => p.innerText.length > 100) // 过滤短段落
      .map(p => p.innerText);
    
    return paragraphs.join('\n\n');
  }

  return {
    title: document.title,
    url: window.location.href,
    mainContent: extractMainContent() || document.body.innerText.trim()
  };
}

/**
 * @description 调用AI总结API
 * @param {Object} pageContent - 页面内容
 * @returns {Promise<string>} 总结内容
 */
async function getSummary(pageContent) {
  try {
    const settings = await chrome.storage.sync.get([
      'provider',
      'openaiApiKey',
      'openaiBaseUrl',
      'deepseekApiKey',
      'deepseekBaseUrl',
      'customProviderName',
      'customApiKey',
      'customBaseUrl',
      'customEndpoint',
      'model',
      'maxTokens',
      'temperature'
    ]);

    if (!settings.provider) {
      throw new Error('请先在扩展设置中配置 API');
    }

    let apiKey, baseUrl, endpoint, headers;
    const body = {
      model: settings.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文章总结助手。请简明扼要地总结以下内容，突出重点。'
        },
        {
          role: 'user',
          content: `标题：${pageContent.title}\n\n内容：${pageContent.mainContent}`
        }
      ],
      max_tokens: parseInt(settings.maxTokens) || 300,
      temperature: parseFloat(settings.temperature) || 0.5
    };

    switch (settings.provider) {
      case 'openai':
        apiKey = settings.openaiApiKey;
        baseUrl = settings.openaiBaseUrl;
        endpoint = '/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };
        break;

      case 'deepseek':
        apiKey = settings.deepseekApiKey;
        baseUrl = settings.deepseekBaseUrl;
        endpoint = '/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };
        break;

      case 'custom':
        apiKey = settings.customApiKey;
        baseUrl = settings.customBaseUrl;
        endpoint = settings.customEndpoint;
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };
        break;

      default:
        throw new Error('不支持的API提供商');
    }

    if (!apiKey || !baseUrl) {
      throw new Error('请先在扩展设置中配置 API 信息');
    }

    console.log('Sending request to:', `${baseUrl}${endpoint}`);
    console.log('Request body:', body);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error:', error);
      throw new Error(error.error?.message || 'API请求失败');
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API 返回数据格式错误');
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error('调用AI总结API失败:', error);
    throw error;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateCard').addEventListener('click', generateCard);
  
  // 添加设置链接处理
  document.getElementById('openSettings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}); 