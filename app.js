'use strict';
(() => {
  const data = window.CAREER_DATA;
  const jobs = data.jobs;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => /^(https?:\/\/|mailto:)/i.test(value) ? esc(value) : '#';
  const link = (url, label, className='') => `<a class="${className}" href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  let saved = {};
  try { const stored = JSON.parse(localStorage.getItem('career-atlas-v1') || '{}'); if (stored && typeof stored === 'object' && !Array.isArray(stored)) saved = stored; } catch (_) { /* A fresh session works without persistent storage. */ }
  const getState = id => { const entry = Object.hasOwn(saved,id) ? saved[id] : null; return entry && typeof entry === 'object' ? entry : {}; };
  const ids = ['search','route','fit','kind','sector','sort','cohort','salary','favorite','applied'];
  const hasSalary = job => !['未公开','培训期工资未公开','不适用'].includes(job.cnSalary) || !['未公开','当前日本岗薪资未公开','研修期补贴未公开'].includes(job.jpSalary);
  const fitClass = job => ({'优先了解':'priority','补技能':'skill','经验门槛高':'exp'}[job.fit] || '');
  const routeClass = job => job.route === '日本岗位明确' ? 'japan' : ['赴日研修','全球调动'].includes(job.route) ? 'training' : 'pending';
  let displayed = [];
  let toastTimer;
  function toast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('toast').classList.remove('visible'),2500); }
  function setState(id, key, value) {
    saved[id] = {...getState(id),[key]:value};
    try { localStorage.setItem('career-atlas-v1', JSON.stringify(saved)); } catch (_) { toast('当前浏览器无法保存，标记仅在本次打开期间保留'); }
    render();
  }
  function render() {
    const terms = $('search').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    displayed = jobs.filter(job => {
      const haystack = [job.company,job.kind,job.role,job.location,job.requirements,job.note,job.evidence,job.cohort].join(' ').toLocaleLowerCase();
      return terms.every(term => haystack.includes(term)) &&
        (!$('route').value || ($('route').value === '研修/调动' ? ['赴日研修','全球调动'].includes(job.route) : job.route === $('route').value)) &&
        (!$('fit').value || job.fit === $('fit').value) &&
        (!$('kind').value || job.kind.includes($('kind').value)) &&
        (!$('sector').value || ($('sector').value === '商务与综合职' ? (job.sector !== 'IT / 咨询' || ['hand','abeam'].includes(job.id)) : job.sector === $('sector').value)) &&
        (!$('cohort').checked || /^2027/.test(job.cohort)) &&
        (!$('salary').checked || hasSalary(job)) &&
        (!$('favorite').checked || getState(job.id).favorite === true) &&
        (!$('applied').checked || getState(job.id).applied === true);
    });
    const priority = {'优先了解':0,'补技能':1,'关注':2,'经验门槛高':3};
    if ($('sort').value === 'company') displayed.sort((a,b)=>a.company.localeCompare(b.company,'zh-CN'));
    else if ($('sort').value === 'salary') displayed.sort((a,b)=>Number(hasSalary(b))-Number(hasSalary(a)));
    else displayed.sort((a,b)=>priority[a.fit]-priority[b.fit]);
    $('result-count').innerHTML = `<strong>${displayed.length}</strong> / ${jobs.length} 条机会线索`;
    $('empty').hidden = displayed.length !== 0;
    $('job-rows').innerHTML = displayed.map(job => {
      const state = getState(job.id);
      return `<tr data-id="${esc(job.id)}">
        <td><button class="company-name" data-detail="${esc(job.id)}">${esc(job.company)}</button><span class="badge ${fitClass(job)}">${esc(job.fit)}</span><div class="company-meta">${esc(job.kind)}<br>${esc(job.sector)}</div></td>
        <td><strong>${esc(job.role)}</strong><p class="muted">${esc(job.location)}</p><button class="detail-button" data-detail="${esc(job.id)}" aria-label="查看${esc(job.company)}的详细条件">完整条件与限制 ↗</button></td>
        <td><div class="salary-main"><span class="salary-label">国内/标薪</span>${esc(job.cnSalary)}</div><p class="salary-main salary-jp"><span class="salary-label">日本</span>${esc(job.jpSalary)}</p><small>原文口径 · 适用阶段见详情</small></td>
        <td><span class="badge ${routeClass(job)}">${esc(job.route)}</span><p class="route-text">${esc(job.evidence)}</p></td>
        <td>${esc(job.requirements)}</td>
        <td><strong>${esc(job.cohort)}</strong><p>${esc(job.status)}</p><small>${esc(job.verification)}<br>核查 ${esc(job.checkedAt)}</small>${job.deadline?`<div class="deadline">上海截止 ${esc(job.deadline)}<br>北京截止 2026-11-22</div>`:''}</td>
        <td>${link(job.applyUrl,job.applyType+' ↗','apply-link')}${link(job.sourceUrl,'查看原始出处 ↗','source-link')}<div class="row-actions"><button class="star" data-star="${esc(job.id)}" aria-label="${state.favorite?'取消收藏':'收藏'}${esc(job.company)}" aria-pressed="${state.favorite===true}">${state.favorite?'★':'☆'}</button><label class="apply-mark"><input type="checkbox" data-applied="${esc(job.id)}" ${state.applied?'checked':''} aria-label="标记${esc(job.company)}已投递">已投递</label></div></td>
      </tr>`;
    }).join('');
  }
  function reset() { ids.forEach(id => { if ($(id).type === 'checkbox') $(id).checked=false; else $(id).value=id==='sort'?'priority':''; }); render(); }
  function openDetail(id) {
    const job=jobs.find(item=>item.id===id); if(!job) return;
    $('dialog-content').innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${esc(job.company)}</h2><p>${esc(job.role)}</p><span class="badge ${fitClass(job)}">${esc(job.fit)}</span> <span class="badge ${routeClass(job)}">${esc(job.route)}</span></div>
    <div class="dialog-facts"><div><small>工作地点</small><p>${esc(job.location)}</p></div><div><small>届次 / 核查状态</small><p>${esc(job.cohort)} · ${esc(job.status)}</p></div><div><small>国内薪资 / 平台标薪</small><p>${esc(job.cnSalary)}</p></div><div><small>日本薪资</small><p>${esc(job.jpSalary)}</p></div></div>
    <section class="dialog-section"><h3>岗位要求</h3><p>${esc(job.requirements)}</p></section><section class="dialog-section"><h3>赴日路径：已找到的证据</h3><p>${esc(job.evidence)}</p></section><div class="dialog-warning"><strong>投递前要确认</strong><br>${esc(job.note)}</div>
    <section class="dialog-section"><h3>来源与核查边界</h3><p class="muted">核查 ${esc(job.checkedAt)} · ${esc(job.verification)}。可打开页面不等于岗位仍有名额；本手册未提交简历。</p><ul>${job.sources.map(s=>`<li>${link(s.url,s.label)}</li>`).join('')}</ul></section>${link(job.applyUrl,'前往：'+job.applyType+' ↗','dialog-apply')}`;
    $('job-dialog').showModal();
    $('job-dialog').scrollTop=0;
  }
  function downloadCsv() {
    const columns=[['company','企业'],['kind','企业性质'],['role','岗位'],['location','地点'],['cnSalary','国内/平台薪资'],['jpSalary','日本薪资'],['requirements','岗位要求'],['fit','投递判断'],['route','赴日证据类别'],['evidence','赴日证据'],['cohort','届次'],['status','核查状态'],['deadline','最早公开截止'],['applyType','入口类型'],['applyUrl','投递/核查入口'],['sourceUrl','出处'],['verification','证据层级'],['note','限制/待确认'],['checkedAt','核查日期']];
    const cell = value => '"'+String(value??'').replace(/"/g,'""')+'"';
    const lines=[columns.map(c=>cell(c[1])).concat(['"已收藏"','"已标记投递"']).join(','),...displayed.map(job=>columns.map(c=>cell(job[c[0]])).concat([cell(getState(job.id).favorite?'是':'否'),cell(getState(job.id).applied?'是':'否')]).join(','))];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const anchor=document.createElement('a'); anchor.href=url;anchor.download=`赴日机会簿-筛选${displayed.length}条-${data.updatedAt}.csv`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast(`已导出 ${displayed.length} 条筛选结果`);
  }
  ids.forEach(id=>$(id).addEventListener($(id).type==='search'?'input':'change',render));
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  $('job-rows').addEventListener('click',event=>{
    const detail=event.target.closest('[data-detail]'); if(detail) openDetail(detail.dataset.detail);
    const star=event.target.closest('[data-star]'); if(star) { const id=star.dataset.star;setState(id,'favorite',!getState(id).favorite); const replacement=document.querySelector(`[data-star="${id}"]`);if(replacement) replacement.focus({preventScroll:true}); }
  });
  $('job-rows').addEventListener('change',event=>{const id=event.target.dataset.applied;if(id){setState(id,'applied',event.target.checked);const replacement=document.querySelector(`[data-applied="${id}"]`);if(replacement)replacement.focus({preventScroll:true});}});
  $('close-dialog').addEventListener('click',()=>$('job-dialog').close());
  $('job-dialog').addEventListener('click',event=>{if(event.target===$('job-dialog')){const r=$('job-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('job-dialog').close();}});
  $('export-csv').addEventListener('click',downloadCsv);
  document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
    reset();
    if(button.dataset.preset==='no-code') { $('sector').value='商务与综合职'; $('fit').value='优先了解'; }
    if(button.dataset.preset==='it') $('sector').value='IT / 咨询';
    if(button.dataset.preset==='training') $('route').value='研修/调动';
    render();$('opportunities').scrollIntoView({block:'start'});
  }));
  $('copy-hr').addEventListener('click',async()=>{
    const template='您好，我是日语专业本科应届生，已取得JLPT N1，想咨询贵司该岗位。请问是否接收我这一毕业届次的日语专业本科？是否有院校或英语/技术门槛？岗位签约主体在国内还是日本？是否有明确的赴日岗位、出向或研修计划，何时选拔、赴日多久、未选上如何安排？另外想确认国内培训期工资、日本基本月薪、固定加班费、奖金、住宿及交通补贴，以及是否有培训费用或服务期约定。我可以提供简历、毕业时间及相关能力证明。谢谢！';
    try { await navigator.clipboard.writeText(template);$('copy-feedback').textContent='已复制，请补上毕业年月与实际技能后发送。'; }
    catch (_) { $('copy-feedback').textContent='浏览器未允许复制，可在下方选中模板手动复制。';let area=$('hr-template');if(!area){area=document.createElement('textarea');area.id='hr-template';area.setAttribute('aria-label','HR咨询模板');area.style.cssText='width:100%;min-height:160px;padding:10px;border:1px solid #a9b7a4;background:#fffefb;font-size:12px';$('copy-feedback').after(area);}area.value=template;area.focus();area.select(); }
  });
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('job-dialog').open){event.preventDefault();$('search').focus();}});
  $('total-stat').textContent=String(jobs.length).padStart(2,'0');$('japan-stat').textContent=jobs.filter(j=>j.route==='日本岗位明确').length;$('salary-stat').textContent=jobs.filter(hasSalary).length;
  $('exclusions').innerHTML=data.exclusions.map(item=>`<div class="exclusion-row"><strong>${esc(item.company)}</strong><p>${esc(item.reason)}</p>${link(item.url,'查看依据 ↗')}</div>`).join('');
  render();
})();
