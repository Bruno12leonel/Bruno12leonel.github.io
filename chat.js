/* =============================================
   CONFIGURAÇÃO
   Usando Groq — API gratuita, sem cartão de crédito.
   Crie sua chave em: https://console.groq.com
   ✏️ Cole sua chave abaixo e faça o deploy.
   ============================================= */
const OPENAI_API_KEY = '';
const OPENAI_MODEL   = 'llama-3.3-70b-versatile';
const OPENAI_BASE    = 'https://late-lab-1ef1.bruno12leonel.workers.dev';

/* =============================================
   SYSTEM PROMPT — Informações sobre o Bruno
   ✏️ Edite este bloco com seus dados reais.
   Este texto é injetado como contexto para o agente.
   ============================================= */
const SYSTEM_PROMPT = `
Você é o agente de portfólio do Bruno Leonel Nunes, um Engenheiro de IA especializado em sistemas multi-agente,
LLMs e RAG. Sua função é responder perguntas sobre a trajetória, habilidades e projetos do Bruno Leonel
de forma clara, entusiasmada e profissional.

Responda sempre em português, de forma concisa (máximo 3-4 parágrafos por resposta).
Se não souber alguma informação específica, diga que o Bruno pode ser contactado diretamente.

=== INFORMAÇÕES SOBRE O BRUNO ===

**Perfil Geral:**
- Nome: Bruno Leonel Nunes
- Cargo: AI Engineer
- Localização: São Paulo, Brasil (remoto)
- LinkedIn: linkedin.com/in/brunoln
- GitHub: github.com/Bruno12leonel
- Email: bruno12leonel@gmail.com

**Resumo profissional:**
Engenheiro de Computação com mais de 5 anos de experiência em desenvolvimento de software, especializado nos últimos anos em
Inteligência Artificial Generativa, Machine Learning e NLP. Atua na arquitetura, desenvolvimento e escalabilidade de soluções
baseadas em LLMs e processamento de grandes volumes de dados.

**Especialidades:**
- Orquestração de sistemas multiagentes: CrewAI, LangChain, Google ADK
- RAG (Retrieval-Augmented Generation) e CAG (Cache-Augmented Generation)
- Prompt Engineering (incluindo few-shot learning)
- Observabilidade de LLMs com Langfuse
- NLP, classificação de texto, análise de sentimentos
- Modelos descritivos para Data Streams (pesquisa acadêmica)

**Habilidades Técnicas:**
- IA & LLMs: CrewAI, LangChain, Google ADK, RAG, CAG, GPT, Gemini, Prompt Engineering
- Linguagens: Python (Django, FastAPI), Golang, TypeScript, JavaScript
- Cloud: GCP (Cloud Run, BigQuery), AWS (SQS, RDS, S3), Docker, Microserviços
- Dados & ML: NLP, Unsupervised Learning, clustering escalável para Big Data/Data Streams
- Outras: Flutter, Firebase, Selenium, Langfuse, Clerk/JWT

**Experiência Profissional:**
1. AI Engineer @ Lopti (Jun 2025 – Presente) — Legal Tech, São Paulo, Remoto
   - Orquestração de agentes com CrewAI, LangChain e Google ADK
   - Extração de informações em documentos jurídicos (PDF, Excel, TXT)
   - Pipelines RAG e CAG com cache semântico para redução de latência e custo
   - Monitoramento de tokens e performance via Langfuse e GCP
   - Backend com Django, arquitetura de microserviços, autenticação JWT com Clerk

2. AI Engineer @ BrandLovers (Jun 2023 – Mai 2025) — São Paulo, Híbrido
   - Sistema de classificação de criadores de conteúdo com IA (Gemini + GPT)
   - Infraestrutura híbrida AWS + GCP (Cloud Run) para processamento em larga escala
   - Análise de sentimentos com OpenAI
   - Chatbot com RAG usando LangChain
   - Few-shot learning para refinamento de prompts
   - Desenvolvimento em Python e Golang

3. Engenheiro de Software @ PGFN — Procuradoria-Geral da Fazenda Nacional (Fev 2021 – Jan 2023) — São Carlos, Híbrido
   - Estágio (Fev 2021 – Jan 2022) e CLT (Jan 2022 – Jan 2023)
   - NLP com Python e LLMs para classificação de textos judiciais
   - Web scraping com Selenium e JavaScript
   - Automação de processos com macros Google Sheets

4. Desenvolvedor Back-End @ Departamento de Computação UFSCar (Jun 2019 – Dez 2021) — Remoto
   - Projeto de extensão com o Departamento de Medicina da UFSCar
   - App mobile de apoio psicológico para profissionais de saúde durante a pandemia
   - Desenvolvimento com Flutter e Firebase

**Formação & Publicações:**
- Bacharelado em Engenharia de Computação — UFSCar, São Carlos (2016-2021)
- Certificação em LLMs — Universidade de Stanford
- Coautor de artigo publicado na Science Direct (Elsevier, 2025) — modelos de ML para Data Streams
- Coautor de artigo publicado na Springer Nature (2023) — clustering escalável para dados não rotulados

**Projetos:**
Os projetos no GitHub (github.com/Bruno12leonel) incluem trabalhos em telecom, DevOps, análise de dados com IBM e pesquisa em HPC.

**Contato:**
- LinkedIn: linkedin.com/in/brunoln
- GitHub: github.com/Bruno12leonel
- Email: bruno12leonel@gmail.com

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

const hasApiKey = true;
if (apiWarning) apiWarning.style.display = 'none';

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
    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    return 'O Bruno trabalha principalmente com Python e o ecossistema de IA: CrewAI, LangChain e Google ADK para ' +
      'orquestração de agentes. Tem forte experiência com RAG, CAG e Prompt Engineering. ' +
      'No back-end também usa Golang e TypeScript, e na cloud atua com GCP (Cloud Run) e AWS (SQS, S3). ' +
      'Para observabilidade de LLMs usa Langfuse.';
  }
  if (lower.includes('multi-agent') || lower.includes('agente') || lower.includes('agent')) {
    return 'Sistemas multiagentes são a principal especialidade do Bruno! ' +
      'Ele orquestra fluxos com CrewAI, LangChain e Google ADK, onde agentes especializados colaboram para ' +
      'resolver tarefas complexas — extração de documentos jurídicos, comparação de arquivos, geração de relatórios. ' +
      'Atualmente usa o Google ADK na Lopti para construir soluções de Legal Tech com integração a APIs externas e ferramentas customizadas.';
  }
  if (lower.includes('rag') || lower.includes('cag') || lower.includes('retriev')) {
    return 'RAG e CAG são áreas de forte atuação do Bruno. ' +
      'Ele constrói pipelines de Retrieval-Augmented Generation para consulta em bases de documentos (PDF, Excel, TXT) ' +
      'e aplica CAG (Cache-Augmented Generation) com cache semântico para reduzir latência e custo de tokens. ' +
      'Na Lopti usa sistemas de busca e indexação do Google; na BrandLovers implementou RAG com LangChain para chatbot.';
  }
  if (lower.includes('projeto') || lower.includes('project') || lower.includes('github')) {
    return 'No GitHub (github.com/Bruno12leonel) o Bruno tem projetos em telecom, DevOps (CRUD-DEVOPS para matéria de ' +
      'DevOps da UFSCar), análise de dados (IBM Data Analyst) e pesquisa em HPC. ' +
      'Na prática profissional, construiu sistemas de classificação de criadores de conteúdo na BrandLovers, ' +
      'agentes para documentos jurídicos na Lopti, e app de saúde com Flutter na UFSCar.';
  }
  if (lower.includes('contato') || lower.includes('falar') || lower.includes('contact')) {
    return 'Você pode entrar em contato com o Bruno Leonel pelo LinkedIn (linkedin.com/in/brunoln) ' +
      'ou explorar seus projetos no GitHub (github.com/Bruno12leonel).';
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
