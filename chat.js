/* =============================================
   CONFIGURAÇÃO
   ✏️ Substitua pela sua chave OpenAI antes do deploy.
   ATENÇÃO: Nunca exponha sua chave em repositórios públicos.
   Para produção, use um backend/proxy para esconder a chave.
   ============================================= */
const OPENAI_API_KEY = 'sk-...SUA_CHAVE_AQUI...';
const OPENAI_MODEL   = 'gpt-4o';

/* =============================================
   SYSTEM PROMPT — Informações sobre o Bruno
   ✏️ Edite este bloco com seus dados reais.
   Este texto é injetado como contexto para o agente.
   ============================================= */
const SYSTEM_PROMPT = `
Você é o agente de portfólio do Bruno, um Engenheiro de IA especializado em sistemas multi-agente,
LLMs e RAG. Sua função é responder perguntas sobre a trajetória, habilidades e projetos do Bruno
de forma clara, entusiasmada e profissional.

Responda sempre em português, de forma concisa (máximo 3-4 parágrafos por resposta).
Se não souber alguma informação específica, diga que o Bruno pode ser contactado diretamente.

=== INFORMAÇÕES SOBRE O BRUNO ===

**Perfil Geral:**
- Nome: Bruno
- Cargo: AI Engineer Senior
- Localização: Brasil
- Disponível para novas oportunidades: sim

**Especialidades:**
- Sistemas Multi-Agente com LangGraph e CrewAI
- LLMs: GPT-4o, Claude, Llama (fine-tuning com LoRA/QLoRA)
- RAG (Retrieval-Augmented Generation) com Pinecone e Chroma
- Prompt Engineering avançado
- MLOps: MLflow, Weights & Biases, Docker

**Habilidades Técnicas:**
- Linguagens: Python (principal), SQL, JavaScript
- Frameworks: LangChain, LangGraph, HuggingFace Transformers, PyTorch
- Cloud: AWS (SageMaker, Lambda, S3), GCP
- Bancos de dados: PostgreSQL, MongoDB, Redis, Pinecone, Chroma
- DevOps: Docker, Kubernetes, GitHub Actions

**Experiência Profissional:**
1. AI Engineer Senior @ [Empresa Atual] (Jan 2024 – Presente)
   - Arquitetou sistemas multi-agente para automação de processos
   - Reduziu tempo de processamento em 60% com RAG otimizado
   - Implementou fine-tuning de LLMs para domínios específicos

2. Machine Learning Engineer @ [Empresa Anterior] (Mar 2022 – Dez 2023)
   - Modelos de NLP para classificação de documentos
   - Pipelines de MLOps com MLflow e Docker
   - Infraestrutura de ML escalável na AWS

3. Data Scientist @ [Startup] (Jun 2021 – Fev 2022)
   - Modelos preditivos de churn e segmentação
   - Primeiros experimentos com LLMs aplicados

**Formação Acadêmica:**
- Mestrado em Ciência da Computação — área: Inteligência Artificial (2022-2024)
  Dissertação: Coordenação emergente em redes de LLMs
- Bacharelado em Engenharia de Computação (2018-2022)

**Projetos Destacados:**
1. Multi-Agent Research Assistant — sistema com orquestrador + agentes especializados para pesquisa autônoma
2. Document Intelligence Pipeline — extração e análise de PDFs complexos com RAG
3. LLM Fine-tuning Toolkit — framework para fine-tuning eficiente com LoRA/QLoRA
4. AI Monitoring Dashboard — monitoramento de LLMs em produção

**Contato:**
- GitHub: github.com/Bruno12leonel
- LinkedIn: linkedin.com/in/seu-usuario
- Email: seu@email.com

=== FIM DAS INFORMAÇÕES ===

Tom de resposta: profissional, direto e levemente entusiasmado com os temas de IA.
Sempre que pertinente, mencione detalhes técnicos específicos para demonstrar expertise.
`;

/* =============================================
   ESTADO DO CHAT
   ============================================= */
const chatHistory = [];
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSend     = document.getElementById('chat-send');
const apiWarning   = document.getElementById('api-warning');
const suggestions  = document.querySelectorAll('.suggestion-btn');

const hasApiKey = OPENAI_API_KEY && !OPENAI_API_KEY.includes('SUA_CHAVE');
if (hasApiKey && apiWarning) apiWarning.style.display = 'none';

/* =============================================
   ENVIO DE MENSAGEM
   ============================================= */
async function sendMessage(text) {
  const userText = text.trim();
  if (!userText) return;

  appendMessage('user', userText);
  chatHistory.push({ role: 'user', content: userText });
  chatInput.value = '';
  chatInput.style.height = 'auto';
  chatSend.disabled = true;

  hideSuggestions();

  if (!hasApiKey) {
    await fakeStream(getMockResponse(userText));
    chatSend.disabled = false;
    return;
  }

  await streamFromOpenAI();
  chatSend.disabled = false;
}

/* =============================================
   STREAMING REAL — OpenAI API
   ============================================= */
async function streamFromOpenAI() {
  const typingEl = appendTypingIndicator();

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...chatHistory,
  ];

  let fullResponse = '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        stream: true,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    typingEl.remove();
    const bubbleEl = appendMessage('assistant', '');
    const textEl = bubbleEl.querySelector('.message-bubble');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          fullResponse += delta;
          textEl.textContent = fullResponse;
          scrollToBottom();
        } catch (_) { /* ignora chunks incompletos */ }
      }
    }

    chatHistory.push({ role: 'assistant', content: fullResponse });

  } catch (err) {
    typingEl?.remove();
    appendMessage('assistant', `Ocorreu um erro ao conectar com a API: ${err.message}. Verifique sua chave OpenAI.`);
    console.error(err);
  }
}

/* =============================================
   MOCK — quando não há chave configurada
   ============================================= */
function getMockResponse(text) {
  const lower = text.toLowerCase();
  if (lower.includes('skill') || lower.includes('tecnolog') || lower.includes('stack')) {
    return 'O Bruno domina principalmente Python e o ecossistema de IA: LangChain, LangGraph, HuggingFace e PyTorch. ' +
      'É especialista em construir sistemas RAG com Pinecone e Chroma, e tem vasta experiência com as APIs da OpenAI e Anthropic. ' +
      'No lado de infraestrutura, trabalha com AWS, Docker e MLflow para colocar modelos em produção de forma confiável.';
  }
  if (lower.includes('multi-agent') || lower.includes('agente') || lower.includes('agent')) {
    return 'Sistemas multi-agente são a principal especialidade do Bruno! ' +
      'Ele projeta arquiteturas onde um Orchestrator Agent coordena agentes especializados — um para RAG, outro para executar tools, ' +
      'outro para gerenciar o prompt. Essa abordagem resolve tarefas complexas que um único LLM não conseguiria. ' +
      'Ele usa principalmente LangGraph para implementar esses fluxos com estado persistente.';
  }
  if (lower.includes('rag') || lower.includes('retriev')) {
    return 'RAG (Retrieval-Augmented Generation) é uma das áreas mais fortes do Bruno. ' +
      'Ele constrói pipelines que vão desde o chunking e embedding dos documentos até a recuperação semântica ' +
      'e injeção de contexto no prompt. Trabalha com Pinecone, Chroma e pgvector, sempre focando em ' +
      'relevância e redução de alucinações.';
  }
  if (lower.includes('projeto') || lower.includes('project')) {
    return 'Os projetos mais relevantes do Bruno incluem: um Multi-Agent Research Assistant que pesquisa autonomamente ' +
      'usando múltiplos agentes; um Document Intelligence Pipeline para análise de contratos com RAG; ' +
      'um LLM Fine-tuning Toolkit com LoRA/QLoRA; e um AI Monitoring Dashboard para acompanhar LLMs em produção. ' +
      'Todos disponíveis no GitHub dele!';
  }
  if (lower.includes('contato') || lower.includes('falar') || lower.includes('contact')) {
    return 'Você pode entrar em contato com o Bruno pelo LinkedIn (linkedin.com/in/seu-usuario), ' +
      'pelo GitHub (github.com/Bruno12leonel) ou por e-mail. ' +
      'Ele costuma responder em menos de 24 horas e está aberto a discutir projetos interessantes de IA!';
  }
  return 'Essa é uma ótima pergunta sobre o Bruno! Posso te contar que ele é um Engenheiro de IA com foco em ' +
    'sistemas multi-agente, LLMs e RAG. Para uma resposta mais detalhada com a API real, configure sua chave ' +
    'OpenAI no arquivo chat.js. Enquanto isso, pode me perguntar sobre suas skills, projetos ou experiências!';
}

async function fakeStream(text) {
  const bubbleEl = appendMessage('assistant', '');
  const textEl = bubbleEl.querySelector('.message-bubble');
  let i = 0;
  await new Promise(resolve => {
    const interval = setInterval(() => {
      textEl.textContent += text[i++];
      scrollToBottom();
      if (i >= text.length) { clearInterval(interval); resolve(); }
    }, 18);
  });
  chatHistory.push({ role: 'assistant', content: text });
}

/* =============================================
   HELPERS DE UI
   ============================================= */
function appendMessage(role, text) {
  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;
  wrap.innerHTML = `
    <div class="message-avatar">${role === 'assistant' ? '🤖' : '👤'}</div>
    <div class="message-bubble">${escapeHtml(text)}</div>
  `;
  chatMessages.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

function appendTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'message assistant';
  wrap.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideSuggestions() {
  const box = document.getElementById('chat-suggestions');
  if (box) box.style.display = 'none';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/* =============================================
   EVENTOS
   ============================================= */
chatSend.addEventListener('click', () => sendMessage(chatInput.value));

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(chatInput.value);
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

suggestions.forEach(btn => {
  btn.addEventListener('click', () => sendMessage(btn.textContent));
});
