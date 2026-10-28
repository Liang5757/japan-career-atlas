# -*- coding: utf-8 -*-
import json,csv,pathlib
out=pathlib.Path(__file__).resolve().parent.parent
data=json.loads((out/'data.json').read_text())
rows=data['jobs']
exclusions=data['exclusions']
(out/'data.js').write_text('window.CAREER_DATA = '+json.dumps(data,ensure_ascii=False)+';\n')
headers={'company':'企业','kind':'企业性质','role':'岗位','location':'地点','cnSalary':'国内薪资/平台标薪','jpSalary':'日本薪资','requirements':'岗位要求','fit':'投递判断','route':'赴日证据分类','evidence':'赴日路径/证据','cohort':'届次','status':'核查状态','deadline':'最早公开截止','applyType':'入口类型','applyUrl':'投递/核查链接','sourceUrl':'出处','verification':'证据层级','note':'限制/待确认','checkedAt':'核查日'}
with (out/'jobs.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(headers.values());w.writerows([[r.get(k,'') for k in headers] for r in rows])
md='# 从国内出发的赴日求职清单\n\n核查日期：2026-10-29（北京时间）。按2027届暂定。共'+str(len(rows))+'条企业/岗位线索，含2条日本直接招聘补充，不保证穷尽全国，不代表全部当前在招。\n\n'
md+='已公开条件中未见统一排除民办本科的规定，不等于企业实际筛选不看学校。N1不等于商务口语、IT能力或英语条件已经满足。性别不作为普遍优势判断。\n\n'
md+='薪资均保留原公告币种、周期及阶段；来源未说明税前或到手时不作推断。未公开的金额不估算。日企、合资或对日业务本身不等于外派日本。\n\n'
cols=['企业 / 性质','岗位 / 地点','国内与日本薪资','要求','赴日路径 / 判断','届次 / 状态','投递 / 来源']
md+='| '+' | '.join(cols)+' |\n|'+'|'.join(['---']*len(cols))+'|\n'
for r in rows:
    cells=[r['company']+'<br>'+r['kind'],r['role']+'<br>'+r['location'],'国内：'+r['cnSalary']+'<br>日本：'+r['jpSalary'],r['requirements'],r['route']+'：'+r['evidence']+'<br>判断：'+r['fit']+'；'+r['note'],r['cohort']+'<br>'+r['status'],f"[{r['applyType']}]({r['applyUrl']})<br>[原始出处]({r['sourceUrl']})"]
    md+='| '+' | '.join(c.replace('|','／').replace('\n',' ') for c in cells)+' |\n'
md+='\n## 容易误投的通道\n\n'
for e in exclusions:md+=f"- **{e['company']}**：{e['reason']} [岗位/官网]({e['url']}) · [补充出处]({e['source']})\n"
md+='\n## 投递顺序建议（分析判断）\n\n- 不想转开发：先看三井物产中国综合职、汉得对日咨询（需CET6）、博彦日本营业事务（需确认能否接受2027毕业）、广汽丰田翻译（当前官网未见空缺，先确认）、五羊本田综合管理、烟台首钢电装英日翻译（需英语），以及三井住友银行中国日语岗。后四类目前未证实日本常驻机会。\n- 愿意学习IT：先咨询西安裕日、NTT DATA日语运维、艾瑞赴日SAP；有代码与SQL基础后再看ACTY、海隆。历史项目需先确认2027届是否继续。\n- 目标是尽快长期在日本：优先问有明确日本岗位的项目，确认录用主体和毕业后入职时间。研修、国内对日业务、全球调动均不能当成常驻日本保证。\n\n## 发给HR的确认事项\n\n先说明毕业年月、学历学位、N1、口语、英语及IT基础；核实是否接受该届日语专业本科，是否限制院校；确认签约主体、日本岗位与国内岗位是否分开、赴日选拔条件及未选上安排、国内培训工资、赴日月基本工资/固定加班/奖金/住宿/税社保、培训费用或服务期条款。\n'
(out/'research.md').write_text(md)
print(f'Exported {len(rows)} rows to data.js, jobs.csv and research.md')
