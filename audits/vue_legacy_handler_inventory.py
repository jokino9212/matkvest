#!/usr/bin/env python3
"""Read-only evidence-oriented census. Does not modify app source."""
import json
import re
import sys
from collections import Counter
from pathlib import Path

root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text('utf-8')
bridge=(root/'frontend/knowledge-map/mount.js').read_text('utf-8')
directory=root/'frontend/knowledge-map'
components=sorted(directory.glob('*.vue'))
exports=sorted(set(re.findall(r'export function (mount[A-Z]\w+)\(', bridge)))
definitions=set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(', html))
assignments=set(re.findall(r'\b(?:window|globalThis)\.([A-Za-z_$][\w$]*)\s*=',html))
events=list(re.finditer(r'\bon(click|input|change|keydown|keyup|keypress|submit|blur|focus|pointerdown|touchstart|touchend)\s*=\s*(["\'])(.{0,350}?)\2',html,re.I|re.S))
direct=list(re.finditer(r'\baddEventListener\(\s*["\']([a-z-]+)["\']',html,re.I))
sinks={key:len(re.findall(p,html)) for key,p in {
 'innerHTML':r'\binnerHTML\s*=', 'insertAdjacentHTML':r'\binsertAdjacentHTML\s*\(',
 'outerHTML':r'\bouterHTML\s*=', 'document.write':r'\bdocument\.write\s*\('}.items()}
vue=[]
for file in components:
 s=file.read_text('utf-8')
 vue.append(dict(view=file.stem,clicks=len(re.findall(r'@click(?:\.[\w.]+)?\s*=',s)),
    keyboard=len(re.findall(r'@(?:keydown|keyup)(?:\.[\w.]+)?\s*=',s)),
    inputs=len(re.findall(r'@(?:input|change|submit)(?:\.[\w.]+)?\s*=',s)),
    models=len(re.findall(r'\bv-model(?:\.[\w.]+)?\s*=',s)),
    actions=sorted(set(re.findall(r'\bactions\.([A-Za-z_$]\w*)',s)))))
routes=[dict(entry=entry,htmlMentions=len(re.findall(r'\b'+entry+r'\b',html)),
   exists=(directory/(entry[5:]+'.vue')).exists()) for entry in exports]
groups={
 'navigation_and_render':['renderHome','openGrade','openTopic','closeModal','showVueReport','renderAnalyticsView','openQuickTrainer','openTrainingPlan','openKnowledgeMap','openProfiles'],
 'school_logic':['beginBlock','finishBlock','startQuizStage','startTableStage','startColumnStage','startG5QuizStage','skipNormalQuiz','syncActiveAttempt'],
 'quick_logic':['renderQuick','finishQuick','quickNext','quickAnswer','quickTrainer','quickSession'],
 'persistence':['save','persistSilently','mk872PersistDraft','mk872ReadDraft','mk872RestoreDraft','mk872HasActiveLearning'],
 'economy':['award','grantReward','openShop','openCollection','buyItem','sellItem','renderShop'],
 'teacher':['openTeacherDashboard','openTeacherStudentDetailById','openAttemptJournal','openControlReview']
}
legacy=[]
for group,names in groups.items():
 for name in names:
  legacy.append(dict(group=group,name=name,defined=name in definitions,
    mentions=len(re.findall(r'\b'+name+r'\b',html))))
sample=[]
for e in events[:60]:
 line=html.count('\n',0,e.start())+1
 sample.append(dict(line=line,event=e.group(1).lower(),code=re.sub(r'\s+',' ',e.group(3))[:120]))
report=dict(
 source=dict(htmlBytes=len(html.encode('utf-8')),htmlLines=html.count('\n')+1,
  vueComponents=len(components),vueMounts=len(exports),htmlFunctionDeclarations=len(definitions),
  globalsAssigned=len(assignments),inlineEventAttributes=len(events),
  eventListeners=len(direct),sinks=sinks),
 routes=routes,legacy=legacy,vue=vue,inlineEventTypes=dict(Counter(e.group(1).lower() for e in events)),
 listenerTypes=dict(Counter(e.group(1).lower() for e in direct)),inlineSamples=sample,
 warnings=[f'Missing Vue file: {r["entry"]}' for r in routes if not r['exists']])
if '--json' in sys.argv:
 Path(sys.argv[sys.argv.index('--json')+1]).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
bt=chr(96)
lines=['# МатКвест: инвентаризация HTML ↔ Vue','',
 'Автоматический статический срез текущей тестовой ветки. Число упоминаний функции не доказывает, что она вызывается пользователем. Перенос шаблона в Vue не означает перенос управляющей логики.','',
 '## Сводка','','| Метрика | Значение |','|---|---:|']
for k,v in report['source'].items():
 if k=='sinks':continue
 lines.append('| '+k+' | '+str(v)+' |')
for k,v in sinks.items():lines.append('| '+k+' | '+str(v)+' |')
lines.extend(['','## Экранные Vue mount-точки','',
 '| Точка монтирования | Упоминания в index.html | Vue-файл |','|---|---:|---|'])
for r in routes:
 lines.append('| '+bt+r['entry']+bt+' | '+str(r['htmlMentions'])+' | '+('есть' if r['exists'] else '**ОТСУТСТВУЕТ**')+' |')
lines.extend(['','## Функции, сохраняющиеся в index.html','',
 '| Область | Имя | function declaration | Упоминания |','|---|---|---|---:|'])
for r in legacy:
 lines.append('| '+r['group']+' | '+bt+r['name']+bt+' | '+('да' if r['defined'] else 'не обнаружено*')+' | '+str(r['mentions'])+' |')
lines.extend(['','* Функция также может быть стрелочной или назначаться через объект.','',
 '## Старые DOM события','',
 '| Inline-атрибут | Количество |','|---|---:|'])
for k,v in sorted(report['inlineEventTypes'].items()):lines.append('| '+k+' | '+str(v)+' |')
lines.extend(['','Обработчики '+bt+'addEventListener'+bt+': '+str(report['listenerTypes'])+'.','',
 'Примеры (первые 60)','','| Строка | Event | Handler excerpt |','|---:|---|---|'])
for r in sample:
 lines.append('| '+str(r['line'])+' | '+r['event']+' | '+bt+r['code'].replace('|','/').replace(bt,"'")+bt+' |')
lines.extend(['','## Vue-события по компонентам','','| Компонент | Click | Keyboard | Input | v-model |','|---|---:|---:|---:|---:|'])
for x in vue:
 lines.append('| '+bt+x['view']+bt+' | '+str(x['clicks'])+' | '+str(x['keyboard'])+' | '+str(x['inputs'])+' | '+str(x['models'])+' |')
lines.extend(['','## Граница ответственности','',
 '- В Vue уже размещены шаблоны экрана, содержащиеся в файлах компонентов и смонтированные через mount-мост.',
 '- В legacy HTML остаются маршрутизаторы и функции подготовки моделей, генераторы заданий, запись локальных попыток, прогресс, экономика и обработчики из таблицы — до отдельной миграции.',
 '- Часть legacy-функций является контроллерами Vue, а не дублирующими HTML-экранами: нельзя удалять по имени без call graph и браузерной проверки.',
 '- Нужна отдельная проверка интерактивных inline-атрибутов, динамически созданных из HTML строк, и остальных чистых JS-обработчиков.',
 '','## Проверенные границы','',
 '- Эта инвентаризация НЕ утверждает, что полный backend уже готов.',
 '- Эта инвентаризация НЕ заменяет e2e на мобильном и настольном разрешениях и офлайн-F5.',
 ''])
if '--markdown' in sys.argv:
 Path(sys.argv[sys.argv.index('--markdown')+1]).write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps({'summary':report['source'],'mounts':routes,'eventTypes':report['inlineEventTypes'],
 'listenerTypes':report['listenerTypes'],'legacy':legacy,'warnings':report['warnings']},ensure_ascii=False,indent=2))
if report['warnings']:raise SystemExit('Missing Vue component from mount registry')
