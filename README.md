# 🌿 Feriani Nutri SBM — Sistema de Gestão para Nutricionistas

Sistema moderno e completo para gestão de consultórios de nutrição, acompanhamento de pacientes, prontuários clínicos e métricas em tempo real com **Neon PostgreSQL** e **Neon Auth**.

---

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Build Tool**: Vite
- **Banco de Dados**: Neon PostgreSQL (Serverless) via `@neondatabase/serverless`
- **Autenticação**: Neon Auth
- **Segurança**: Row Level Security (RLS) ativo em todas as tabelas

---

## 📋 Funcionalidades

- 🔐 **Autenticação Segura**: Login e cadastro com Neon Auth e sessão persistente.
- 📊 **Dashboard em Tempo Real**:
  - **Total de pacientes ativos**: Contagem em tempo real de pacientes cadastrados.
  - **Consultas da semana**: Acompanhamento dos atendimentos da semana corrente.
  - **Pacientes sem retorno**: Identificação automática de pacientes cuja última consulta foi há mais de 30 dias e sem retorno agendado.
- 👥 **Gestão de Pacientes**:
  - Cadastro completo com anamnese, objetivos, rotina de sono/água/atividades e hábitos.
  - Busca instantânea por nome, e-mail ou telefone.
  - Perfil detalhado com cálculo automático de IMC e histórico de medidas.
- 🩺 **Registro de Consultas**:
  - Aferição de peso, circunferência de cintura e quadril, % de gordura e notas clínicas.
  - Agendamento de data de próximo retorno.
  - Contato rápido direto via **WhatsApp**.

---

## 🛠️ Configuração e Instalação Local

### 1. Clonar o Repositório
```bash
git clone https://github.com/guuhferiani/feriani-nutri-sbm.git
cd feriani-nutri-sbm
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Preencha as variáveis no arquivo `.env`:
```env
# Conexão com o banco Neon PostgreSQL
VITE_NEON_DATABASE_URL=postgresql://neondb_owner:SUA_SENHA@ep-wandering-term-acrfychh-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Endpoint de autenticação do Neon Auth
VITE_NEON_AUTH_URL=https://ep-wandering-term-acrfychh.neonauth.sa-east-1.aws.neon.tech/neondb/auth
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`.

### 5. Build de Produção
```bash
npm run build
```

---

## 🔒 Segurança e Boas Práticas

- **Nunca comite o arquivo `.env`**: Ele já está configurado no `.gitignore`.
- **Isolamento de Dados (RLS)**: Cada nutricionista acessa estritamente os seus próprios pacientes e consultas.
- **Variáveis de Ambiente**: Em plataformas de deploy (como Vercel ou Netlify), adicione `VITE_NEON_DATABASE_URL` e `VITE_NEON_AUTH_URL` nas configurações do painel.

---

## 🌐 Deploy em Produção (Vercel / Netlify)

1. Conecte o repositório GitHub à sua conta **Vercel** ou **Netlify**.
2. Defina o comando de build como `npm run build` e a pasta de saída como `dist`.
3. Adicione as variáveis de ambiente:
   - `VITE_NEON_DATABASE_URL`
   - `VITE_NEON_AUTH_URL`
4. Clique em **Deploy**.

---

Desenvolvido com 💚 para a gestão nutricional de alta performance.
