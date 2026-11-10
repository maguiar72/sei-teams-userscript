// ==UserScript==
// @name         SEI no Teams
// @namespace    sei-teams
// @version      1.2
// @description  Torna clicáveis os números de processo e de documento SEI nas conversas do Teams (web) e abre pela Pesquisa Rápida do SEI.
// @match        https://teams.microsoft.com/*
// @match        https://teams.cloud.microsoft/*
// @match        https://*/sei/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const CHAVE_URL = 'seiUrl';
  const CHAVE = 'pesquisaPendente';
  const VALIDADE_MS = 5 * 60 * 1000; // tempo para concluir o login, se o SEI pedir
  // Número de processo, ou número de documento (7 dígitos) precedido de uma
  // palavra-chave no mesmo trecho, como "Despacho SIGLA 0123456" ou "SEI nº 0123456".
  const TIPOS_DOC = 'Despachos?|Of[íi]cios?|SEI|Documentos?|Doc|Memorandos?|Informaç(?:ão|ões)|Parecer(?:es)?|Portarias?|Certid(?:ão|ões)|Minutas?|Decis(?:ão|ões)|Relatórios?|Nota Técnica';
  const RE_NUMERO = new RegExp(
    '\\d{7}-\\d{2}\\.\\d{4}\\.\\d\\.\\d{2}\\.\\d{4}' +
    '|(?<=\\b(?:' + TIPOS_DOC + ')\\b[^\\n\\d]{0,40})\\d{7}(?!\\d|-\\d)',
    'gi'
  );

  // O endereço do SEI é definido pelo usuário (menu do Tampermonkey ou primeiro clique).
  function seiUrl() {
    return GM_getValue(CHAVE_URL, '');
  }

  function configurarSei() {
    const atual = seiUrl();
    const resposta = prompt('Endereço do SEI do seu órgão (ex.: https://sei.exemplo.gov.br/sei/):', atual);
    if (resposta === null) return atual;
    const m = (resposta.trim() + '/').match(/^https:\/\/[^\/]+\/sei\//i);
    if (!m) {
      alert('Endereço inválido. Use o formato https://sei.exemplo.gov.br/sei/');
      return atual;
    }
    GM_setValue(CHAVE_URL, m[0]);
    return m[0];
  }

  GM_registerMenuCommand('Definir endereço do SEI', configurarSei);

  if (/^teams\./.test(location.hostname)) {
    ladoTeams();
  } else if (seiUrl() && location.href.startsWith(seiUrl())) {
    ladoSei();
  }

  // No SEI: se há um número pendente vindo do Teams, envia pela Pesquisa Rápida.
  // O formulário da própria página já traz o infra_hash exigido pelo SEI.
  function ladoSei() {
    if (window.top !== window.self) return;
    const pendente = GM_getValue(CHAVE);
    if (!pendente || Date.now() - pendente.t > VALIDADE_MS) return;
    const campo = document.getElementById('txtPesquisaRapida');
    if (!campo || !campo.form) return; // tela de login: tenta de novo na próxima página
    GM_deleteValue(CHAVE);
    campo.value = pendente.numero;
    HTMLFormElement.prototype.submit.call(campo.form);
  }

  // No Teams: não altera o DOM (o React do Teams quebraria); apenas destaca os
  // números com a CSS Highlight API e trata o clique sobre eles.
  function ladoTeams() {
    function intervalos(raiz) {
      const achados = [];
      const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      for (let no; (no = tw.nextNode());) {
        if (!/\d{7}/.test(no.data)) continue;
        for (const m of no.data.matchAll(RE_NUMERO)) {
          // ignora a caixa de digitação
          if (no.parentElement && no.parentElement.closest('[contenteditable="true"]')) break;
          const range = new Range();
          range.setStart(no, m.index);
          range.setEnd(no, m.index + m[0].length);
          achados.push({ range, numero: m[0] });
        }
      }
      return achados;
    }

    if (window.CSS && CSS.highlights && window.Highlight) {
      GM_addStyle('::highlight(sei-processo) { color: #2b88d8; text-decoration: underline; }');
      const destaque = new Highlight();
      CSS.highlights.set('sei-processo', destaque);

      let agendado = null;
      const atualizar = () => {
        agendado = null;
        destaque.clear();
        for (const { range } of intervalos(document.body)) destaque.add(range);
      };
      new MutationObserver(() => {
        if (!agendado) agendado = setTimeout(atualizar, 400);
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
      atualizar();
    }

    document.addEventListener('click', (e) => {
      if (e.button !== 0 || !getSelection().isCollapsed) return; // preserva a seleção de texto
      if (!(e.target instanceof Element) || e.target.textContent.length > 2000) return;
      for (const { range, numero } of intervalos(e.target)) {
        for (const r of range.getClientRects()) {
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            e.preventDefault();
            e.stopPropagation();
            const url = seiUrl() || configurarSei();
            if (!url) return;
            GM_setValue(CHAVE, { numero, t: Date.now() });
            GM_openInTab(url, { active: true });
            return;
          }
        }
      }
    }, true);
  }
})();
