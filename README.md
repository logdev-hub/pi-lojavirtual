# Projeto Integrador de E-commerce — Fase 1: Planejamento e Estruturação

Ferramenta educacional interativa para alunos do Curso Técnico em Marketing planejarem a **Fase 1 do Projeto Integrador de E-commerce**: da ideia do negócio até a recomendação executiva, passando por público, catálogo, canais de venda, cadastro de produto, precificação, marketing, estoque, entrega/pós-venda e priorização de problemas.

O site **não é a loja pronta** — é um roteiro de trabalho guiado, com campos para preencher, calculadoras com fórmula + substituição + resultado + interpretação, um exemplo-guia fictício (NexoFit) em cada etapa e um checklist final de prontidão.

## Objetivo

Ajudar cada equipe a transformar conceitos de marketing e operação de e-commerce em decisões registradas e justificadas, seguindo a sequência: **dado → interpretação → decisão → consequência**.

## Estrutura de arquivos

```text
/index.html            Página única com as 13 etapas, glossário, checklist final e rubrica
/assets/css/style.css  Estilos (identidade visual, componentes, impressão, responsividade)
/assets/js/app.js      Lógica: armazenamento local, calculadoras, gráfico ABC, exportar/importar
/README.md             Este arquivo
```

Não há backend, banco de dados, login ou build step. É HTML5 + CSS3 + JavaScript puro, com Bootstrap 5.3.3, Bootstrap Icons e Chart.js carregados via CDN.

## Como abrir localmente

1. Baixe ou clone a pasta do projeto.
2. Dê duplo clique em `index.html` (ou abra pelo navegador com `Ctrl+O`).
3. É necessário estar conectado à internet na primeira vez que abrir, pois o Bootstrap, os ícones e o Chart.js vêm de um CDN. O restante da ferramenta (textos, cálculos, salvamento) funciona offline depois que a página carrega.

Não é necessário instalar nada nem rodar servidor local — basta abrir o arquivo diretamente no navegador.

## Como publicar no GitHub Pages

1. Suba os arquivos (`index.html`, pasta `assets/`, este `README.md`) para um repositório no GitHub, mantendo a mesma estrutura de pastas.
2. No repositório, acesse **Settings → Pages**.
3. Em **Source**, selecione a branch principal (ex.: `main`) e a pasta raiz (`/root`).
4. Salve e aguarde alguns minutos. O endereço público aparecerá na própria página de configuração (formato `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`).

## Dependências (via CDN)

- [Bootstrap 5.3.3](https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/) (CSS e JS bundle)
- [Bootstrap Icons 1.11.3](https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/)
- [Chart.js 4.4.4](https://cdn.jsdelivr.net/npm/chart.js@4.4.4/) (usado apenas no gráfico da Curva ABC/Pareto)

## Principais funcionalidades

- 13 etapas em accordion, cada uma com objetivo, explicação, tarefas, campos, exemplo-guia recolhível, dica, erro comum, entregável e mini-checklist.
- Salvamento automático de todos os campos no `localStorage` do navegador, com restauração ao reabrir a página.
- Barra de progresso das etapas e progresso por categoria no checklist final.
- Calculadoras com fórmula, substituição, resultado, unidade e interpretação: precificação, funil de marketing (CTR, CPC, conversão, CAC, ticket médio, ROAS), estoque e ponto de pedido, OTIF, devoluções, comparação de canais e simulador didático de importação formal.
- Curva ABC/Pareto com tabela ordenada, classificação A/B/C e gráfico (barras + linha acumulada) via Chart.js.
- Contador de caracteres do título do anúncio, validação de campos numéricos (aceita vírgula ou ponto) com mensagens de erro próximas ao campo.
- Botões: Salvar agora, Exportar projeto (JSON), Importar projeto (JSON), Imprimir/Salvar em PDF, Limpar respostas (com confirmação em modal), Expandir todas/Recolher todas as etapas.
- Glossário recolhível com 24 termos e tooltips nos termos mais importantes ao longo do texto.
- Checklist final com 11 categorias, progresso por categoria e painel geral de prontidão.
- Rubrica de avaliação de 10 pontos exibida ao aluno.
- Layout responsivo (mobile-first), navegação lateral fixa em telas grandes e menu offcanvas em telas pequenas, impressão em A4 sem botões/navegação.

## Sobre o armazenamento local

- Todas as respostas ficam salvas **apenas no navegador** usado (localStorage), por domínio/origem.
- **Limpar o histórico ou os dados do navegador apaga as respostas não exportadas.**
- Use o botão **Exportar projeto** para gerar um arquivo `.json` com todas as respostas antes de trocar de computador, navegador ou limpar o cache. Use **Importar projeto** para restaurar esse arquivo depois.

## Limitações

- Sem backend, sem login e sem sincronização entre dispositivos — cada navegador guarda suas próprias respostas.
- O simulador de importação é **didático**: alíquotas, base de cálculo, NCM, benefícios fiscais e regras estaduais reais devem ser confirmados com profissionais habilitados e fontes oficiais antes de qualquer decisão real.
- Os indicadores calculados não são classificados automaticamente como "bons" ou "ruins" — a leitura depende da meta definida pela equipe.
