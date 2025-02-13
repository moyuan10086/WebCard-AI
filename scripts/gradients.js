/**
 * @description 渐变背景配置
 */
const gradients = {
  // 纯色背景
  solidColors: [
    { name: '纯白', value: '#FFFFFF' },
    { name: '米白', value: '#F8F6F0' },
    { name: '淡青', value: '#E8F4F2' }
  ],
  
  // 渐变背景
  gradients: [
    {
      name: '暖阳',
      value: 'linear-gradient(120deg, #FFE4B5 0%, #FFA07A 100%)'
    },
    {
      name: '清新',
      value: 'linear-gradient(120deg, #E0F7FA 0%, #B2EBF2 100%)'
    },
    {
      name: '梦幻',
      value: 'linear-gradient(120deg, #E1BEE7 0%, #B388FF 100%)'
    }
  ]
};

export default gradients; 