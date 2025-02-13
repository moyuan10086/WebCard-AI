document.addEventListener('DOMContentLoaded', () => {
  // 初始化提供商选择
  const apiProvider = document.getElementById('apiProvider');
  apiProvider.addEventListener('change', () => {
    updateProviderSettings(apiProvider.value);
    updateModelOptions(apiProvider.value);
  });

  // 加载保存的设置
  chrome.storage.sync.get([
    'provider',
    'openaiApiKey',
    'openaiBaseUrl',
    'deepseekApiKey',
    'deepseekBaseUrl',
    'model',
    'maxTokens',
    'temperature'
  ], (result) => {
    console.log('Loaded settings:', result);
    // 设置提供商
    const provider = result.provider || 'openai';
    document.getElementById('apiProvider').value = provider;
    
    // 更新界面显示
    updateProviderSettings(provider);
    updateModelOptions(provider);

    // 设置 API Keys 和 URLs
    document.getElementById('openaiApiKey').value = result.openaiApiKey || '';
    document.getElementById('openaiBaseUrl').value = result.openaiBaseUrl || 'https://api.openai.com';
    document.getElementById('deepseekApiKey').value = result.deepseekApiKey || '';
    document.getElementById('deepseekBaseUrl').value = result.deepseekBaseUrl || 'https://api.deepseek.com';

    // 设置其他选项
    document.getElementById('maxTokens').value = result.maxTokens || '300';
    document.getElementById('temperature').value = result.temperature || '0.5';

    // 设置模型选择
    if (result.model) {
      const modelOption = document.querySelector(`.model-option[data-model="${result.model}"]`);
      if (modelOption) {
        modelOption.classList.add('active');
      }
    } else {
      // 设置默认模型
      const defaultModel = provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat';
      const modelOption = document.querySelector(`.model-group[data-provider="${provider}"] .model-option[data-model="${defaultModel}"]`);
      if (modelOption) {
        modelOption.classList.add('active');
      }
    }
  });

  // 处理密码显示切换
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      const input = e.target.previousElementSibling;
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      e.target.textContent = type === 'password' ? '显示' : '隐藏';
    });
  });

  // 处理模型选择
  document.querySelectorAll('.model-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.remove('active');
      });
      option.classList.add('active');
    });
  });

  // 保存设置
  document.getElementById('saveButton').addEventListener('click', async () => {
    const provider = document.getElementById('apiProvider').value;
    const settings = {
      provider,
      maxTokens: document.getElementById('maxTokens').value,
      temperature: document.getElementById('temperature').value
    };

    // 根据提供商保存对应的设置
    switch (provider) {
      case 'openai':
        settings.openaiApiKey = document.getElementById('openaiApiKey').value.trim();
        settings.openaiBaseUrl = document.getElementById('openaiBaseUrl').value.trim() || 'https://api.openai.com';
        settings.openaiModel = document.getElementById('openaiModel').value.trim();
        settings.model = settings.openaiModel || 'gpt-4o-mini';
        break;
        
      case 'deepseek':
        settings.deepseekApiKey = document.getElementById('deepseekApiKey').value.trim();
        settings.deepseekBaseUrl = document.getElementById('deepseekBaseUrl').value.trim() || 'https://api.deepseek.com';
        settings.deepseekModel = document.getElementById('deepseekModel').value.trim();
        settings.model = settings.deepseekModel || 'deepseek-chat';
        break;
        
      case 'custom':
        settings.customProviderName = document.getElementById('customProviderName').value.trim();
        settings.customApiKey = document.getElementById('customApiKey').value.trim();
        settings.customBaseUrl = document.getElementById('customBaseUrl').value.trim();
        settings.customModel = document.getElementById('customModel').value.trim();
        settings.customEndpoint = document.getElementById('customEndpoint').value.trim() || '/v1/chat/completions';
        settings.model = settings.customModel;
        break;
    }

    // 验证设置
    if (!validateSettings(settings)) {
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set(settings, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      showStatus('设置已保存', 'success');
      await testApiConnection(settings);
    } catch (error) {
      console.error('保存设置失败:', error);
      showStatus(error.message || '保存设置失败', 'error');
    }
  });
});

function updateProviderSettings(provider) {
  // 隐藏所有提供商设置
  document.querySelectorAll('.provider-setting').forEach(setting => {
    setting.style.display = 'none';
  });
  
  // 显示选中的提供商设置
  const selectedSetting = document.querySelector(`.provider-setting[data-provider="${provider}"]`);
  if (selectedSetting) {
    selectedSetting.style.display = 'block';
  }
}

function updateModelOptions(provider) {
  // 隐藏所有模型选项
  document.querySelectorAll('.model-group').forEach(group => {
    group.style.display = 'none';
  });
  
  // 显示选中提供商的模型选项
  const selectedGroup = document.querySelector(`.model-group[data-provider="${provider}"]`);
  if (selectedGroup) {
    selectedGroup.style.display = 'block';
  }
}

function validateSettings(settings) {
  const provider = settings.provider;
  let apiKey, baseUrl, model;

  switch (provider) {
    case 'openai':
      apiKey = settings.openaiApiKey;
      baseUrl = settings.openaiBaseUrl;
      model = settings.model;
      break;
    case 'deepseek':
      apiKey = settings.deepseekApiKey;
      baseUrl = settings.deepseekBaseUrl;
      model = settings.model;
      break;
    case 'custom':
      if (!settings.customProviderName) {
        showStatus('请填写供应商名称', 'error');
        return false;
      }
      apiKey = settings.customApiKey;
      baseUrl = settings.customBaseUrl;
      model = settings.customModel;
      break;
  }

  if (!apiKey) {
    showStatus('请填写 API Key', 'error');
    return false;
  }

  if (!baseUrl) {
    showStatus('请填写 API 地址', 'error');
    return false;
  }

  if (!model) {
    showStatus('请填写模型名称', 'error');
    return false;
  }

  return true;
}

async function testApiConnection(settings) {
  const provider = settings.provider;
  let apiKey, baseUrl, testEndpoint, headers, body;

  switch (provider) {
    case 'openai':
      apiKey = settings.openaiApiKey;
      baseUrl = settings.openaiBaseUrl;
      testEndpoint = '/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      body = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      break;
    case 'deepseek':
      apiKey = settings.deepseekApiKey;
      baseUrl = settings.deepseekBaseUrl;
      testEndpoint = '/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      body = JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      break;
    default:
      throw new Error('不支持的API提供商');
  }

  try {
    console.log('Testing API connection:', `${baseUrl}${testEndpoint}`);
    const response = await fetch(`${baseUrl}${testEndpoint}`, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Test Error:', error);
      throw new Error(error.error?.message || 'API连接测试失败');
    }

    const data = await response.json();
    console.log('API Test Response:', data);
    showStatus('API连接测试成功', 'success');
  } catch (error) {
    console.error('API测试失败:', error);
    showStatus(error.message || 'API连接测试失败，请检查设置', 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
} 