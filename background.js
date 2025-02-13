/**
 * @description 背景脚本，处理右键菜单和消息通信
 */

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装，创建右键菜单');
  chrome.contextMenus.create({
    id: 'generateCard',
    title: '生成分享卡片',
    contexts: ['selection', 'page']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('创建右键菜单失败:', chrome.runtime.lastError);
    }
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generateCard') {
    try {
      let text;
      
      if (info.selectionText) {
        // 使用选中的文本
        text = info.selectionText;
      } else {
        // 获取页面内容
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getPageContent
        });
        
        // 调用AI总结
        text = await getSummary(result.result);
      }

      // 保存卡片数据
      await chrome.storage.local.set({
        cardData: {
          url: tab.url,
          title: tab.title,
          text,
          timestamp: new Date().toISOString()
        }
      });

      // 打开卡片生成器
      chrome.tabs.create({ url: 'card-generator.html' });
      
    } catch (error) {
      console.error('生成卡片失败:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: '生成卡片失败',
        message: error.message || '请检查API设置是否正确'
      });
    }
  }
});

// 获取页面内容的函数（与popup.js中的相同）
function getPageContent() {
  const title = document.title;
  const content = document.body.innerText;
  const mainContent = getMainContent();
  
  return {
    title,
    content,
    mainContent
  };
}

function getMainContent() {
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
      return element.innerText;
    }
  }

  return document.body.innerText;
}

async function getSummary(pageContent) {
  const response = await fetch(`${baseUrl}/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      title: pageContent.title,
      content: pageContent.mainContent
    })
  });

  if (!response.ok) {
    throw new Error('API请求失败');
  }

  const data = await response.json();
  return data.summary;
}

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'openCardGenerator') {
    try {
      // 存储选中的文本和页面信息
      chrome.storage.local.set({ cardData: message.data }, () => {
        if (chrome.runtime.lastError) {
          console.error('存储数据失败:', chrome.runtime.lastError);
          return;
        }
        
        // 打开卡片生成器窗口
        chrome.tabs.create({ 
          url: chrome.runtime.getURL('card-generator.html'),
          active: true
        }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('打开卡片生成器失败:', chrome.runtime.lastError);
          }
        });
      });
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  }
  
  // 确保消息处理完成
  return true;
}); 