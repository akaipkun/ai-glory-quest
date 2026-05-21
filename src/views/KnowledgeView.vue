<template>
  <div class="knowledge">
    <canvas ref="bgCanvas" class="knowledge__bg"></canvas>

    <!-- 导航 -->
    <div class="knowledge__nav">
      <button class="knowledge__back" @click="$router.push('/bestiary')">
        ← 返回影神册
      </button>
    </div>

    <!-- 标题 -->
    <div class="knowledge__hero">
      <h1 class="knowledge__title">AI 知识总纲</h1>
      <p class="knowledge__subtitle body-text">
        水墨卷轴 · 人工智能核心原理汇典
      </p>
      <p class="knowledge__desc body-text">
        六重关卡，六大门径。每关一境，每境一道。<br/>
        此卷收录 AI 各流派之精要，可溯源至 Wikipedia 与经典论文。
      </p>
    </div>

    <!-- 目录 -->
    <nav class="knowledge__toc">
      <h3 class="knowledge__toc-title">📑 目 录</h3>
      <div class="knowledge__toc-links">
        <a
          v-for="section in sections"
          :key="section.id"
          class="knowledge__toc-link"
          :href="'#section-' + section.id"
        >
          <span class="knowledge__toc-icon">{{ section.icon }}</span>
          <span>{{ section.name }}</span>
          <span class="knowledge__toc-tag">{{ section.tagline }}</span>
        </a>
      </div>
    </nav>

    <!-- 各关卡分区 -->
    <div
      v-for="section in sections"
      :key="section.id"
      :id="'section-' + section.id"
      class="knowledge__section"
    >
      <div class="knowledge__section-header">
        <span class="knowledge__section-icon">{{ section.icon }}</span>
        <h2 class="knowledge__section-title">{{ section.name }}</h2>
      </div>
      <p class="knowledge__section-tagline body-text">{{ section.tagline }}</p>

      <!-- 核心原理 -->
      <div class="knowledge__block">
        <h3 class="knowledge__block-title">🔬 核心 AI 原理</h3>
        <p class="knowledge__block-text body-text">{{ section.principle }}</p>
      </div>

      <!-- 关键概念 -->
      <div class="knowledge__block">
        <h3 class="knowledge__block-title">📌 关键概念</h3>
        <div class="knowledge__concepts">
          <a
            v-for="concept in section.concepts"
            :key="concept.label"
            class="knowledge__concept"
            :href="concept.url"
            target="_blank"
            rel="noopener"
            @click="onWikiClick"
          >
            <span class="knowledge__concept-label">{{ concept.label }}</span>
            <span class="knowledge__concept-desc">{{ concept.desc }}</span>
            <span class="knowledge__concept-link">↗</span>
          </a>
        </div>
      </div>

      <!-- 游戏体现 -->
      <div class="knowledge__block">
        <h3 class="knowledge__block-title">🎮 在游戏中如何体现</h3>
        <p class="knowledge__block-text body-text">{{ section.gameMapping }}</p>
      </div>
    </div>

    <!-- 引用来源 -->
    <div class="knowledge__references">
      <div class="knowledge__ref-line"></div>
      <h3 class="knowledge__ref-title">📚 参考文献与延伸阅读</h3>
      <ul class="knowledge__ref-list body-text">
        <li><a href="https://en.wikipedia.org/wiki/Turing_test" target="_blank">Turing, A.M. (1950). Computing Machinery and Intelligence. Mind.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Dartmouth_workshop" target="_blank">McCarthy, J. et al. (1956). Dartmouth Summer Research Project on Artificial Intelligence.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Expert_system" target="_blank">Feigenbaum, E. et al. — Expert Systems and Symbolic AI.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Backpropagation" target="_blank">Rumelhart, D., Hinton, G., Williams, R. (1986). Learning representations by back-propagating errors. Nature.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Convolutional_neural_network" target="_blank">LeCun, Y. et al. — Convolutional Neural Networks (CNN).</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Generative_adversarial_network" target="_blank">Goodfellow, I. et al. (2014). Generative Adversarial Networks. NeurIPS.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Deep_reinforcement_learning" target="_blank">Mnih, V. et al. (2015). Human-level control through deep reinforcement learning. Nature.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/AlphaGo" target="_blank">Silver, D. et al. (2016). Mastering the game of Go with deep neural networks and tree search. Nature.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Large_language_model" target="_blank">Brown, T. et al. (2020). Language Models are Few-Shot Learners. NeurIPS.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/RLHF" target="_blank">Christiano, P. et al. (2017). Deep Reinforcement Learning from Human Preferences.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Diffusion_model" target="_blank">Ho, J. et al. (2020). Denoising Diffusion Probabilistic Models. NeurIPS.</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Multi-agent_reinforcement_learning" target="_blank">Lowe, R. et al. (2017). Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments.</a></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'

const game = useGameStore()
const bgCanvas = ref(null)
let animId = null

// 触发「求知若渴」成就 + 统计 wiki 点击
const wikiClickCount = ref(0)
function onWikiClick() {
  wikiClickCount.value++
  if (wikiClickCount.value >= 5) {
    game.earnMiniBadge('all_wiki')
  }
}

onMounted(() => {
  game.earnMiniBadge('knowledge_seeker')
})

// 分区数据
const sections = [
  {
    id: 1,
    icon: '🪨',
    name: '灵石出世 · 图灵测试与符号逻辑',
    tagline: 'AI 的起源 —— 机器能思考吗？',
    principle: '人工智能起源于1950年图灵提出的「机器能思考吗？」之问。图灵测试绕开了「思考」的哲学定义，转而设计可操作的测试：如果人类评判者无法通过文字对话区分机器和人类，那么这台机器可以被认为具有智能。符号主义AI的核心思想是：智能 = 符号操作 + 逻辑推理 + 搜索。知识用规则和符号表示，推理就是在状态空间中搜索路径。专家系统、知识图谱、决策树均属此范式。',
    concepts: [
      { label: '图灵测试', desc: '机器智能的行为主义测试标准', url: 'https://en.wikipedia.org/wiki/Turing_test' },
      { label: '符号主义', desc: 'Symbolicism — 逻辑推理驱动智能', url: 'https://en.wikipedia.org/wiki/Symbolic_artificial_intelligence' },
      { label: '专家系统', desc: '基于规则库的领域推理系统', url: 'https://en.wikipedia.org/wiki/Expert_system' },
      { label: '知识图谱', desc: '结构化语义知识网络', url: 'https://en.wikipedia.org/wiki/Knowledge_graph' },
      { label: '决策树', desc: '基于树状结构的分类与决策模型', url: 'https://en.wikipedia.org/wiki/Decision_tree_learning' }
    ],
    gameMapping: '在「辨妖辨AI」中，你需要通过语言模式判断谁是人、谁是AI——这正是图灵测试的核心。在「AI三界」中，你将专家系统、知识图谱、决策树归入符号之山，体验符号主义「逻辑推演」的精髓。'
  },
  {
    id: 2,
    icon: '🔰',
    name: '峡谷修炼 · 机器学习与神经网络',
    tagline: '数据驱动 —— 让机器从经验中学习',
    principle: '机器学习（Machine Learning）是AI的核心方法：不显式编程规则，而是让模型从数据中学习模式。有监督学习通过标注数据训练（如分类器），无监督学习发现数据内在结构（如聚类）。神经网络由大量简单「神经元」组成，通过反向传播算法调整连接权重来最小化误差。损失函数衡量预测与真实值的差距——优化器沿着梯度下降方向更新参数。训练/验证/测试集划分防止过拟合。',
    concepts: [
      { label: '机器学习', desc: '从数据中学习模式的计算方法', url: 'https://en.wikipedia.org/wiki/Machine_learning' },
      { label: '神经网络', desc: '模拟生物神经元的计算模型', url: 'https://en.wikipedia.org/wiki/Neural_network_(machine_learning)' },
      { label: '反向传播', desc: '通过链式法则计算梯度的核心算法', url: 'https://en.wikipedia.org/wiki/Backpropagation' },
      { label: '梯度下降', desc: '沿负梯度方向迭代优化损失函数', url: 'https://en.wikipedia.org/wiki/Gradient_descent' },
      { label: '过拟合', desc: '模型过度记忆训练数据而丧失泛化能力', url: 'https://en.wikipedia.org/wiki/Overfitting' }
    ],
    gameMapping: '在「英雄训练」中，你通过选择训练数据、调整参数来训练模型；「炼丹炉」让你亲自调节学习率、批次大小等超参数；「排位竞技」让你观察不同模型在验证集上的表现差异——这就是机器学习的完整pipeline。'
  },
  {
    id: 3,
    icon: '🔥',
    name: '火眼金睛 · 计算机视觉与CNN',
    tagline: '神经之眼 —— 让机器看见世界',
    principle: '计算机视觉（Computer Vision）让机器理解和分析图像。卷积神经网络（CNN）是视觉AI的基石：卷积层用可学习的滤波器（kernel）扫描图像，提取边缘、纹理等特征；池化层降采样减少计算量；全连接层做最终分类。CNN的三大特性：局部感知（每个神经元只看局部区域）、权重共享（同一滤波器扫全图）、层次化特征（低层检测边缘→高层识别物体）。现代视觉模型还包括Transformer架构的ViT、目标检测的YOLO等。',
    concepts: [
      { label: 'CNN', desc: '卷积神经网络——图像识别的核心架构', url: 'https://en.wikipedia.org/wiki/Convolutional_neural_network' },
      { label: 'ImageNet', desc: '大规模图像识别基准数据集', url: 'https://en.wikipedia.org/wiki/ImageNet' },
      { label: '卷积核', desc: '可学习的滤波器，提取局部特征', url: 'https://en.wikipedia.org/wiki/Kernel_(image_processing)' },
      { label: 'AI生成检测', desc: '识别GAN/Diffusion模型生成的虚假图像', url: 'https://en.wikipedia.org/wiki/Deepfake#Detection' },
      { label: '对抗样本', desc: '精心构造的输入可欺骗神经网络的分类结果', url: 'https://en.wikipedia.org/wiki/Adversarial_machine_learning' }
    ],
    gameMapping: '在「火眼识图」中，你体验卷积层逐层提取特征的视觉效果；「妖兽辨识」让你在ImageNet风格的数据集中识别物体类别；「对抗幻象」让你识破AI生成的虚假图像——这正是计算机视觉与AI安全的前沿课题。'
  },
  {
    id: 4,
    icon: '👑',
    name: '王者排位 · 深度学习与策略优化',
    tagline: '深度智能 —— 多层网络的表示学习',
    principle: '深度学习（Deep Learning）是连接主义的高峰。核心思想：多层神经网络（深度 > 2）通过逐层抽象学习数据的层次化表示——这就是「表示学习」。关键技术包括：激活函数（ReLU/GELU等引入非线性）、批归一化（BatchNorm加速训练并稳定梯度）、残差连接（ResNet跳过连接使超深网络可训练）、Dropout正则化防止过拟合。优化器从SGD演进到Adam/AdamW，自适应调整学习率。现代大语言模型正是深度学习的巅峰应用。',
    concepts: [
      { label: '深度学习', desc: '多层神经网络的层次化表示学习', url: 'https://en.wikipedia.org/wiki/Deep_learning' },
      { label: '激活函数', desc: 'ReLU/GELU——引入非线性的关键组件', url: 'https://en.wikipedia.org/wiki/Activation_function' },
      { label: '残差网络', desc: 'ResNet的跳过连接让超深网络可训练', url: 'https://en.wikipedia.org/wiki/Residual_neural_network' },
      { label: 'Dropout', desc: '随机丢弃神经元防止过拟合的正则化方法', url: 'https://en.wikipedia.org/wiki/Dilution_(neural_networks)' },
      { label: 'Adam优化器', desc: '自适应动量优化算法', url: 'https://en.wikipedia.org/wiki/Stochastic_gradient_descent#Adam' }
    ],
    gameMapping: '在「英雄选角」中，你选择不同的优化策略（SGD/Adam等）来训练模型；「排位交锋」展示不同模型架构（CNN/ResNet/Transformer）在排行榜上的竞争；「王者决战」是全关卡知识的综合对决——体现了深度学习从数据到决策的完整流程。'
  },
  {
    id: 5,
    icon: '🪶',
    name: '七十二变 · 生成式AI与潜空间',
    tagline: '变化之道 —— 从噪声中创造万物',
    principle: '生成式AI（Generative AI）学习数据的分布，从而生成新的、逼真的数据。核心技术：GAN（生成对抗网络）通过生成器和判别器的博弈学习——生成器从潜空间随机向量产生假样本，判别器区分真假，两者对抗训练。扩散模型（Diffusion Models）是当前SOTA：前向过程逐步加噪破坏图像，逆向过程学习去噪还原——从纯噪声开始逐步生成清晰图像。潜空间（Latent Space）是数据特征的低维表示，在此空间中线性插值可产生平滑的形态渐变。提示词工程通过文本编码器（CLIP）将自然语言指令映射为潜空间条件向量。',
    concepts: [
      { label: 'GAN', desc: '生成对抗网络——造假者与鉴伪者的博弈', url: 'https://en.wikipedia.org/wiki/Generative_adversarial_network' },
      { label: '扩散模型', desc: '从噪声逐步去噪生成图像的前沿方法', url: 'https://en.wikipedia.org/wiki/Diffusion_model' },
      { label: '潜空间', desc: '高维数据的低维连续表示空间', url: 'https://en.wikipedia.org/wiki/Latent_space' },
      { label: 'CLIP', desc: '文本-图像联合嵌入模型（OpenAI）', url: 'https://en.wikipedia.org/wiki/CLIP_(neural_network)' },
      { label: '提示词工程', desc: 'Prompt Engineering——引导生成式AI的艺术', url: 'https://en.wikipedia.org/wiki/Prompt_engineering' }
    ],
    gameMapping: '在「潜空间漫游」中，你通过线性插值观察形态渐变——这是生成式AI「72变」的数学本质；「提示词工坊」让你用自然语言「咒语」控制图像生成；「虚实相生」让你挑战AI生成检测——理解生成与鉴别的对抗关系。'
  },
  {
    id: 6,
    icon: '💥',
    name: '团战时刻 · 强化学习与多智能体',
    tagline: '众智成城 —— 多个AI的协同与竞争',
    principle: '强化学习（Reinforcement Learning）是行为主义AI的核心。智能体在环境中执行动作，获得奖励信号，通过试错学习最优策略。关键概念：马尔可夫决策过程（MDP）形式化序列决策问题、Q-Learning学习状态-动作价值函数、ε-贪婪策略平衡探索与利用。多智能体强化学习（MARL）扩展至多个智能体——它们可以合作（共享奖励）、竞争（零和博弈）或混合。CTDE范式（集中训练+分布执行）是当前主流。AlphaStar和OpenAI Five展示了MARL在复杂策略游戏中的威力。',
    concepts: [
      { label: '强化学习', desc: '通过试错和奖励信号学习最优行为', url: 'https://en.wikipedia.org/wiki/Reinforcement_learning' },
      { label: 'Q-Learning', desc: '学习动作价值函数的经典RL算法', url: 'https://en.wikipedia.org/wiki/Q-learning' },
      { label: '多智能体RL', desc: '多个智能体同时学习的协同/竞争框架', url: 'https://en.wikipedia.org/wiki/Multi-agent_reinforcement_learning' },
      { label: 'AlphaStar', desc: 'DeepMind的星际争霸II AI', url: 'https://en.wikipedia.org/wiki/AlphaStar_(software)' },
      { label: '贝尔曼方程', desc: '动态规划的核心——递推定义最优价值', url: 'https://en.wikipedia.org/wiki/Bellman_equation' }
    ],
    gameMapping: '在「RL训练场」中，你亲自调节ε-贪婪参数观察探索vs利用的权衡；「多智能体协作」让你配置通信频率和分工策略观察团队表现；「5v5团战」中英雄的攻击、协作、阵亡都是MARL行为——这正是从单智能体到多智能体的扩展。'
  }
]

// ── 水墨背景 ──
function initBg() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = document.body.scrollHeight || window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  const mists = []
  for (let i = 0; i < 40; i++) {
    mists.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      size: 40 + Math.random() * 100,
      speed: 0.08 + Math.random() * 0.15,
      opacity: 0.01 + Math.random() * 0.03
    })
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const m of mists) {
      m.x += m.speed
      if (m.x > canvas.width + 120) m.x = -120

      ctx.beginPath()
      ctx.arc(m.x, m.y, m.size * 0.5, 0, Math.PI * 2)
      ctx.arc(m.x + m.size * 0.4, m.y - m.size * 0.2, m.size * 0.35, 0, Math.PI * 2)
      ctx.arc(m.x + m.size * 0.7, m.y + m.size * 0.05, m.size * 0.45, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(26, 26, 26, ${m.opacity})`
      ctx.fill()
    }

    animId = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => initBg())
onUnmounted(() => { if (animId) cancelAnimationFrame(animId) })
</script>

<style scoped>
.knowledge {
  min-height: 100vh;
  padding: 32px 24px 80px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.knowledge__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.knowledge__nav { margin-bottom: 32px; }
.knowledge__back {
  background: none; border: none; font-family: var(--font-body); font-size: 0.9rem;
  color: var(--ink-medium); cursor: pointer; padding: 6px 0; transition: color 0.3s; letter-spacing: 0.08em;
}
.knowledge__back:hover { color: var(--ink-black); }

/* Hero */
.knowledge__hero { text-align: center; margin-bottom: 40px; }
.knowledge__title {
  font-family: var(--font-display); font-size: 2.5rem; letter-spacing: 0.25em;
  margin-bottom: 12px;
}
.knowledge__subtitle { font-size: 0.9rem; color: var(--ink-medium); letter-spacing: 0.1em; margin-bottom: 12px; }
.knowledge__desc { font-size: 0.8rem; color: var(--ink-light); line-height: 2; }

/* 目录 */
.knowledge__toc { margin-bottom: 48px; padding: 24px; border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.5); }
.knowledge__toc-title { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.15em; margin-bottom: 16px; }
.knowledge__toc-links { display: flex; flex-direction: column; gap: 6px; }
.knowledge__toc-link {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  font-family: var(--font-body); font-size: 0.82rem; color: var(--ink-medium); text-decoration: none;
  transition: all 0.3s ease; border-left: 2px solid transparent;
}
.knowledge__toc-link:hover { color: var(--cinnabar); border-left-color: var(--cinnabar); background: rgba(194,58,43,0.03); }
.knowledge__toc-icon { font-size: 1rem; }
.knowledge__toc-tag { font-size: 0.7rem; color: var(--ink-light); margin-left: auto; }

/* 各分区 */
.knowledge__section {
  margin-bottom: 40px; padding: 28px 24px;
  border: 1px solid var(--ink-pale); background: rgba(245,240,232,0.4);
  scroll-margin-top: 20px;
}
.knowledge__section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.knowledge__section-icon { font-size: 1.8rem; }
.knowledge__section-title { font-family: var(--font-display); font-size: 1.25rem; letter-spacing: 0.1em; }
.knowledge__section-tagline { font-size: 0.8rem; color: var(--cinnabar); margin-bottom: 20px; letter-spacing: 0.06em; }

/* 原理块 */
.knowledge__block { margin-bottom: 16px; }
.knowledge__block-title {
  font-family: var(--font-display); font-size: 0.9rem; letter-spacing: 0.08em;
  margin-bottom: 8px; color: var(--ink-dark);
}
.knowledge__block-text { font-size: 0.82rem; line-height: 1.9; color: var(--ink-medium); }

/* 概念卡片 */
.knowledge__concepts { display: flex; flex-direction: column; gap: 6px; }
.knowledge__concept {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  border: 1px solid var(--ink-pale); text-decoration: none;
  transition: all 0.3s ease; font-family: var(--font-body); font-size: 0.8rem;
}
.knowledge__concept:hover { border-color: var(--cinnabar); background: rgba(194,58,43,0.03); }
.knowledge__concept-label { font-weight: 600; color: var(--ink-dark); white-space: nowrap; }
.knowledge__concept-desc { color: var(--ink-light); flex: 1; font-size: 0.75rem; }
.knowledge__concept-link { color: var(--cinnabar); font-size: 0.9rem; opacity: 0; transition: opacity 0.3s; }
.knowledge__concept:hover .knowledge__concept-link { opacity: 1; }

/* 参考文献 */
.knowledge__references { margin-top: 56px; padding-top: 32px; border-top: 1px solid var(--ink-pale); }
.knowledge__ref-line { width: 80px; height: 1px; background: var(--gold); opacity: 0.4; margin: 0 auto 20px; }
.knowledge__ref-title { font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.12em; margin-bottom: 16px; text-align: center; }
.knowledge__ref-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.knowledge__ref-list li { font-size: 0.75rem; }
.knowledge__ref-list a { color: var(--ink-medium); text-decoration: none; transition: color 0.3s; }
.knowledge__ref-list a:hover { color: var(--cinnabar); }
</style>
