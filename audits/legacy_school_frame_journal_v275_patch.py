#!/usr/bin/env python3
"""SHA-fenced school frame and journal action migration, test branch only.

The attempt, journal, reward and navigation controllers stay in index.html.
Fallback markup stays keyboard-accessible when Vue module loading fails.
"""
from pathlib import Path
import hashlib,os
ROOT=Path(__file__).resolve().parent.parent
PAGE,WORKER=ROOT/'index.html',ROOT/'sw.js'
REPO="jokino9212/matkvest"
REF="refs/heads/refactor/route-vue-actions-from-7c14ce9"
BASE="7a8d0a205a6f8f4a6f1a84be6fdd924c86810f191c852db54a4618148483e660"
if os.environ.get("GITHUB_REPOSITORY")!=REPO or os.environ.get("GITHUB_REF")!=REF:
    raise SystemExit("REFUSING v275 patch outside test branch")
source=PAGE.read_text(encoding="utf-8")
actual=hashlib.sha256(source.encode()).hexdigest()
if actual!=BASE:raise SystemExit("REFUSING unknown v274 HTML baseline: "+actual)
def change(old,new):
    global source
    count=source.count(old)
    if count!=1:
        raise SystemExit("REFUSING ambiguous v275 anchor ("+str(count)+"): "+repr(old[:140]))
    source=source.replace(old,new,1)

# Fix a confirmed legacy bug: a detached inline close button could still call
# closeModal() and inadvertently affect a later, unrelated overlay.
change(
    '''show(`<div id="schoolAttemptFrame" style="display:contents">
  <div class="mtop"><h2>${esc(title)}</h2><button type="button" class="x" aria-label="Закрыть окно" onclick="closeModal()">×</button></div>''',
    '''show(`<div id="schoolAttemptFrame" style="display:contents">
  <div class="mtop"><h2>${esc(title)}</h2><button type="button" class="x" aria-label="Закрыть окно">×</button></div>'''
)
change(
    ''' const host=modal.firstElementChild;
 schoolAttemptFrames.set(host,{title,lesson,lessonFirst,guide});
 mountSchoolAttemptFrameView(host);''',
    ''' const host=modal.firstElementChild,attempt=blockSession;
 host.onclick=event=>{
  if(host.hasAttribute("data-v-app"))return;
  if(event.target.closest(".mtop .x")&&host.contains(event.target)&&host.parentNode===modal&&
     blockSession===attempt&&overlay.classList.contains("show")&&!mk872Dialog)closeModal();
 };
 schoolAttemptFrames.set(host,{title,lesson,lessonFirst,guide});
 mountSchoolAttemptFrameView(host);'''
)
change(
    '''  module.mountSchoolAttemptFrame(host,{...model,progress:blockProgressModel()},{close:()=>closeModal()});''',
    '''  const isCurrentFrame=()=>host.parentNode===modal&&host.isConnected&&blockSession===attempt&&
   overlay.classList.contains("show")&&!mk872Dialog;
  const frameActions=window.MatKvestVueActions?.schoolAttemptFrameActions?.({
   isCurrent:isCurrentFrame,close:closeModal
  })||{close:()=>{if(isCurrentFrame())closeModal()}};
  module.mountSchoolAttemptFrame(host,{...model,progress:blockProgressModel()},frameActions);'''
)
change(
    ''' showVueReport("mountAttemptJournal",{title:`📋 Журнал попыток — ${profileName||"Ученик"}`,rows},{
  close:closeModal,back,
  review:index=>openAttemptReviewRecord(records[index],{journal:()=>openAttemptJournal(profileData,profileName,back)})
 });''',
    ''' const journalTitle=`📋 Журнал попыток — ${profileName||"Ученик"}`;
 let journalHost=null;
 const isCurrentJournal=()=>journalHost?.parentNode===modal&&journalHost.isConnected&&
  overlay.classList.contains("show")&&!mk872Dialog;
 const reviewRecord=index=>openAttemptReviewRecord(records[index],{
  journal:()=>openAttemptJournal(profileData,profileName,back)
 });
 const fallbackActions={
  close:()=>{if(isCurrentJournal())return closeModal()},
  back:typeof back==="function"?()=>{if(isCurrentJournal())return back()}:undefined,
  review:index=>{
   if(!isCurrentJournal()||!Number.isInteger(index)||index<0||index>=records.length)return;
   return reviewRecord(index);
  }
 };
 const journalActions=window.MatKvestVueActions?.attemptJournalActions?.({
  isCurrent:isCurrentJournal,close:closeModal,back,review:reviewRecord,recordCount:records.length
 })||fallbackActions;
 const fallback=`<div class="mtop"><h2>${esc(journalTitle)}</h2><button type="button" class="x"
  aria-label="Закрыть окно" data-journal-action="close">×</button></div>
  ${typeof back==="function"?'<button type="button" class="btn soft" data-journal-action="back">← Назад</button>':""}
  <div class="attempt-journal-fallback">
  ${rows.length?rows.map((row,index)=>`<button type="button" class="btn soft"
   data-journal-action="review" data-journal-index="${index}"><b>${esc(row.title)}</b>
   <span>${esc(row.stage)} · ${esc(row.score)} · ${esc(row.status)} · ${esc(row.date)}</span></button>`).join(""):
   '<p class="knowledge-empty" role="status">В журнале пока нет попыток.</p>'}
  </div>`;
 showVueReport("mountAttemptJournal",{title:journalTitle,rows},journalActions,fallback);
 journalHost=modal.querySelector(":scope > .vue-report");
 journalHost.onclick=event=>{
  if(journalHost.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button[data-journal-action]");
  if(!button||!journalHost.contains(button))return;
  if(button.dataset.journalAction==="review")
    journalActions.review(Number(button.dataset.journalIndex));
  else journalActions[button.dataset.journalAction]?.();
 };'''
)
change(
    ''' showVueReport("mountAttemptReview",{
  title:`📋 Разбор: ${record.title||attemptTitle(record.key)}`,
  active:record.status==="active",stage:attemptReportStage(record),status:attemptStatusLabel(record),
  date:fmtDate(record.startedAt),duration:fmtDuration((record.endedAt||now)-(record.startedAt||now)),
  stats:attemptReviewStats(record,items),items:cards
 },{close:closeModal,result,journal});''',
    ''' const reviewModel={
  title:`📋 Разбор: ${record.title||attemptTitle(record.key)}`,
  active:record.status==="active",stage:attemptReportStage(record),status:attemptStatusLabel(record),
  date:fmtDate(record.startedAt),duration:fmtDuration((record.endedAt||now)-(record.startedAt||now)),
  stats:attemptReviewStats(record,items),items:cards
 };
 let reviewHost=null;
 const isCurrentReview=()=>reviewHost?.parentNode===modal&&reviewHost.isConnected&&
  overlay.classList.contains("show")&&!mk872Dialog;
 const guarded=handler=>typeof handler==="function"?()=>{if(isCurrentReview())return handler()}:undefined;
 const fallbackActions={close:guarded(closeModal),journal:guarded(journal),result:guarded(result)};
 const reviewActions=window.MatKvestVueActions?.attemptReviewActions?.({
  isCurrent:isCurrentReview,close:closeModal,journal,result
 })||fallbackActions;
 const fallback=`<div class="mtop"><h2>${esc(reviewModel.title)}</h2>
  <button type="button" class="x" aria-label="Закрыть окно" data-review-action="close">×</button></div>
  <div class="actions"><button type="button" class="btn soft" data-review-action="journal">← К журналу</button>
  ${typeof result==="function"?'<button type="button" class="btn soft" data-review-action="result">← К результату</button>':""}</div>
  <p>${esc(reviewModel.stage)} · ${esc(reviewModel.status)} · ${esc(reviewModel.date)}</p>
  ${cards.length?cards.map((item,index)=>`<section class="card"><strong>Задание ${index+1}</strong>
  <div>${item.promptHtml}</div><div>Ответ ученика: ${item.studentHtml}</div>
  <div>Правильный ответ: ${item.correctHtml}</div><div>${item.explanationHtml}</div></section>`).join(""):
   '<p class="knowledge-empty">В этой попытке пока нет заданий.</p>'}`;
 showVueReport("mountAttemptReview",reviewModel,reviewActions,fallback);
 reviewHost=modal.querySelector(":scope > .vue-report");
 reviewHost.onclick=event=>{
  if(reviewHost.hasAttribute("data-v-app"))return;
  const button=event.target.closest("button[data-review-action]");
  if(!button||!reviewHost.contains(button))return;
  reviewActions[button.dataset.reviewAction]?.();
 };'''
)
for token in (
 'MatKvestVueActions?.schoolAttemptFrameActions?.',
 'MatKvestVueActions?.attemptJournalActions?.',
 'MatKvestVueActions?.attemptReviewActions?.',
 'MatKvestVueActions?.schoolColumnActions?.',
 'module.mountSchoolAttemptFrame(host,',
 'showVueReport("mountAttemptJournal"',
 'showVueReport("mountAttemptReview"',
):
    if source.count(token)!=1:raise SystemExit("REFUSING missing/duplicate v275 marker: "+token)
if source.count('?v=274')<25 or '?v=275' in source:raise SystemExit("REFUSING unknown asset baseline")
source=source.replace('?v=274','?v=275')
if '?v=274' in source:raise SystemExit("REFUSING mixed version assets")
worker=WORKER.read_text(encoding="utf-8")
old='const CACHE_NAME = "matkvest-iphone-v274";'
new='const CACHE_NAME = "matkvest-iphone-v275";'
if worker.count(old)!=1 or new in worker:raise SystemExit("REFUSING unknown worker cache baseline")
PAGE.write_text(source,encoding="utf-8")
WORKER.write_text(worker.replace(old,new,1),encoding="utf-8")
print("PASS_V275_FENCED_FRAME_JOURNAL_PATCH",hashlib.sha256(source.encode()).hexdigest())
