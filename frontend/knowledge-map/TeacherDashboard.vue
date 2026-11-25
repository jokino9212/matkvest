<script setup>
import {ref,watch} from 'vue';
const props=defineProps({ model: Object, actions: Object });
const seats=ref([]),from=ref(''),to=ref('');
watch(()=>props.model.report?.period,period=>{if(period){from.value=period.from||'';to.value=period.to||''}});
function periodReport(start,end,offset=0){const report=props.model.report;if(report)props.actions.run('report',{id:report.profile_id,from:start||null,to:end||null,offset})}
function recentDays(days){const now=new Date(),start=new Date(now);start.setUTCDate(start.getUTCDate()-days+1);periodReport(start.toISOString().slice(0,10),now.toISOString().slice(0,10))}
const statusText={no_data:'Нет данных',limited:'Мало данных',review:'Стоит повторить',observed:'Наблюдаемый результат'};
watch(()=>props.model.data?.seats, value=>{seats.value=[...(value?.linked_student_ids||[])]},{immediate:true});
</script>

<template>
  <section v-if="model.server" data-mk95-tutor>
    <h1>👨‍🏫 Панель преподавателя</h1>
    <p v-if="model.error" role="alert">{{ model.error }}</p>
    <button class="btn soft" :disabled="model.busy" @click="actions.run('refresh')">Обновить данные</button>
    <p v-if="model.busy" role="status">Загрузка…</p>
    <template v-if="model.report">
      <button class="btn soft" @click="actions.run('back')">← Все ученики</button>
      <section class="teacher-panel" data-mk95-tutor-report>
        <h2>{{ model.report.display_name }} · учебный отчёт</h2>
        <p>Подтверждённых попыток за период: {{ model.report.total_attempts }}. Импортированные записи исключены.</p>
        <div class="actions report-no-print">
          <button type="button" class="btn soft" @click="periodReport(null,null)">Всё время</button>
          <button type="button" class="btn soft" @click="recentDays(7)">7 дней</button>
          <button type="button" class="btn soft" @click="recentDays(30)">30 дней</button>
        </div>
        <form class="student-report-custom report-no-print" @submit.prevent="periodReport(from,to)">
          <label>От <input type="date" v-model="from" aria-label="Начало периода" required></label>
          <label>До <input type="date" v-model="to" aria-label="Конец периода" required></label>
          <button type="submit" class="btn primary" :disabled="!from||!to||from>to">Применить период</button>
        </form>
        <p data-mk95-report-period>{{ model.report.period.from?model.report.period.from+' — '+model.report.period.to:'Всё время' }} · UTC (даты включительно)</p>
        <p>Доступ: {{ model.report.access.full?'Полный':'Free' }}</p>
        <div class="teacher-kpis">
          <div v-for="[key,label] in [['attempts','Попытки'],['questions','Задания'],['correct','Верно с первого раза'],['corrected','Исправлено'],['skipped','Пропущено'],['wrong','Не решено']]" :key="key" class="teacher-kpi" :data-mk95-period-stat="key"><b>{{ model.report.period_stats[key]??'—' }}</b><small>{{ label }}</small></div>
        </div>
        <section class="teacher-analytics-card" data-mk95-weak-topics>
          <h3>Темы для повторения</h3>
          <p>Минимум {{ model.report.review_rule.minimum_questions }} заданий и менее {{ model.report.review_rule.first_try_below_percent }}% верных с первой попытки. Это рекомендация, не оценка освоения программы.</p>
          <p v-if="!model.report.weak_topics.length">По имеющимся данным темы для повторения не выделены.</p>
          <div v-for="item in model.report.weak_topics" :key="item.topic_id" class="teacher-work-row"><b>{{ item.title }}</b><span>{{ item.first_try_percent }}% · {{ item.correct }}/{{ item.questions }}</span></div>
        </section>
        <section class="teacher-panel" data-mk95-knowledge>
          <h3>Карта результатов по темам</h3><p>18 серверных тем. Остальные темы не оцениваются.</p>
          <template v-for="grade in [4,5]" :key="grade">
            <h4>{{ grade }} класс</h4>
            <div v-for="item in model.report.knowledge.filter(x=>x.grade===grade)" :key="item.topic_id" class="teacher-card-metrics" :data-mk95-knowledge-topic="item.topic_id">
              <b>{{ item.title }}</b>
              <span>{{ statusText[item.status] }}{{ item.first_try_percent===null?'':' · '+item.first_try_percent+'% с первой попытки ('+item.correct+'/'+item.questions+')' }}</span>
              <span v-if="item.questions">Исправлено: {{ item.corrected }} · Пропущено: {{ item.skipped }} · Не решено: {{ item.wrong }}</span>
            </div>
          </template>
        </section>
        <h3>Журнал подтверждённых попыток</h3>
        <div v-for="row in model.report.rows" :key="row.id" class="teacher-work-row"><div><b>{{ row.title }}</b><small>{{ new Date(row.date).toLocaleString('ru-RU') }}</small></div><span>{{ row.correct }}/{{ row.total }}</span></div>
        <p v-if="!model.report.rows.length">Подтверждённых попыток на этой странице нет.</p>
        <button v-if="model.report.offset>0" class="btn soft" :disabled="model.busy" @click="periodReport(model.report.period.from,model.report.period.to,Math.max(0,model.report.offset-50))">Предыдущая страница</button>
        <button v-if="model.report.next_offset!==null" class="btn soft" :disabled="model.busy" @click="periodReport(model.report.period.from,model.report.period.to,model.report.next_offset)">Следующая страница</button>
      </section>
    </template>
    <template v-else-if="model.data">
      <section class="teacher-panel">
        <h2>Лицензия и места</h2>
        <p>{{ model.data.license ? model.data.license.plan_code+' · до '+new Date(model.data.license.ends_at).toLocaleDateString('ru-RU') : 'Активной лицензии нет' }}</p>
        <p>Места: {{ model.data.seats.allocated }} / {{ model.data.seats.limit }} · свободно {{ model.data.seats.available }}</p>
        <button v-if="!model.data.license" class="btn soft" :disabled="model.busy" @click="actions.run('trial')">Активировать пробный период</button>
        <template v-if="model.data.license">
          <div v-for="row in model.data.students" :key="row.profile_id"><label><input type="checkbox" v-model="seats" :value="row.profile_id" :disabled="model.busy || (!seats.includes(row.profile_id)&&seats.length>=model.data.seats.limit)"> {{ row.display_name }}</label></div>
          <button class="btn primary" :disabled="model.busy || seats.length>model.data.seats.limit" @click="actions.run('seats',[...seats])">Сохранить распределение мест</button>
        </template>
      </section>
      <section class="teacher-panel">
        <h2>Приглашение ученика</h2>
        <button class="btn primary" :disabled="model.busy" @click="actions.run('invite')">Создать приглашение</button>
        <template v-if="model.invite">
          <p>Одноразовый код до {{ new Date(model.invite.expires_at).toLocaleTimeString('ru-RU') }}:</p>
          <input readonly aria-label="Код приглашения преподавателя" :value="model.invite.code" @focus="$event.target.select()">
          <button class="btn soft" :disabled="model.busy" @click="actions.run('revoke',model.invite.invitation_id)">Отозвать приглашение</button>
        </template>
      </section>
      <input type="search" aria-label="Найти ученика" :value="model.search" @input="actions.search($event.target.value)">
      <div class="teacher-student-grid">
        <section v-for="row in model.data.students.filter(r=>r.display_name.toLowerCase().includes((model.search||'').toLowerCase()))" :key="row.profile_id" class="teacher-student-card" :data-mk95-linked-student="row.profile_id">
          <h3>{{ row.display_name }}</h3><p>{{ model.data.seats.linked_student_ids.includes(row.profile_id)?'Место выделено':'Место не выделено' }}</p>
          <button class="btn soft" :disabled="model.busy" @click="actions.open(row.profile_id)">Учебный отчёт</button>
          <button class="btn soft" :disabled="model.busy" @click="actions.run('unlink',row.profile_id)">Отвязать ученика</button>
        </section>
      </div>
      <p v-if="!model.data.students.length">Пока нет связанных учеников.</p>
    </template>
  </section>
  <template v-else>
  <div class="home-back-row">
    <button type="button" class="home-back-btn" @click="actions.close">← Главный экран</button>
  </div>
  <section class="teacher-hero">
    <div class="teacher-detail-head">
      <div>
        <h1>👨‍🏫 Панель преподавателя</h1>
        <p>Показатели рассчитаны по сохранённым профилям учеников.</p>
      </div>
      <button type="button" class="btn soft" @click="actions.close">🔒 Закрыть режим преподавателя</button>
    </div>
  </section>
  <div id="teacherDashboardBody">
    <div class="teacher-summary">
      <div v-for="{ label, value } in model.stats" :key="label"><b>{{ value }}</b><small>{{ label }}</small></div>
    </div>
    <div class="teacher-toolbar">
      <input id="teacherSearchInput" type="search" class="teacher-search" aria-label="Найти ученика"
        placeholder="🔎 Найти ученика" :value="model.search" @input="actions.search($event.target.value)">
      <select class="teacher-select" aria-label="Сортировать учеников" :value="model.sort"
        @change="actions.sort($event.target.value)">
        <option v-for="{ id, label } in model.sorts" :key="id" :value="id">{{ label }}</option>
      </select>
    </div>
    <div class="teacher-filter-row" role="group" aria-label="Фильтры учеников">
      <button v-for="{ id, label } in model.filters" :key="id" type="button" class="teacher-filter"
        :class="{ active: id === model.filter }" :aria-pressed="id === model.filter"
        @click="actions.filter(id)">{{ label }}</button>
    </div>
    <div class="actions" style="justify-content:flex-start">
      <button type="button" class="btn soft" @click="actions.profiles">+ Новый ученик</button>
      <button type="button" class="btn soft" @click="actions.backup">💾 Резервная копия</button>
    </div>
    <div v-if="model.hasStudents" class="teacher-student-grid">
      <section v-for="row in model.rows" :key="row.profileId" class="teacher-student-card">
        <div class="teacher-student-head">
          <div class="teacher-student-id">
            <span style="display:contents" v-html="row.avatar"></span>
            <div><h3>{{ row.name }}</h3><small>Уровень {{ row.level }} • {{ row.xp }} XP</small></div>
          </div>
          <span class="teacher-attention" :class="{ 'teacher-calm': !row.attention }">
            {{ row.attention ? '⚠️ Требует внимания' : '✅ Спокойно' }}
          </span>
        </div>
        <div class="teacher-progress-lines">
          <div v-for="grade in row.grades" :key="grade.number" class="teacher-progress-line">
            <span><span style="display:contents" v-html="grade.icon"></span> {{ grade.number }} класс</span>
            <div class="teacher-progress-track"><span :style="{ width: grade.percent + '%' }"></span></div>
            <b>{{ grade.label }}</b>
          </div>
        </div>
        <div class="teacher-card-metrics">
          <span>🔴 Слабых: {{ row.weakCount }}</span><span>🟡 Нестабильных: {{ row.unstableCount }}</span>
          <span>🧠 Ошибок: {{ row.activeErrors }}</span><span v-if="row.recentSkipped">⏭ Пропусков: {{ row.recentSkipped }}</span>
        </div>
        <div class="teacher-card-foot">
          <span>{{ row.lastActivity }}</span>
          <button type="button" class="btn soft" @click="actions.open(row.profileId)">Открыть</button>
        </div>
      </section>
      <div v-if="!model.rows.length" class="teacher-empty" role="status">По выбранному фильтру учеников нет.</div>
    </div>
    <div v-else class="teacher-empty">
      <b>Пока нет учеников.</b>
      <div class="actions"><button type="button" class="btn primary" @click="actions.profiles">+ Создать ученика</button></div>
    </div>
  </div>
  </template>
</template>
