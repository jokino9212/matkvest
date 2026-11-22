<script setup>
import { useTemplateRef } from 'vue';
import ReportHeader from './ReportHeader.vue';

defineProps({ model: Object, actions: Object });

const fileInput = useTemplateRef('fileInput');
</script>

<template>
  <ReportHeader :title="model.title" @close="actions.close" />

  <template v-if="model.screen === 'manager'">
    <div class="backup-box warn">
      <b>Важно:</b> данные хранятся в браузере. Очистка данных браузера, переустановка или переход на другой компьютер могут удалить локальный прогресс.
      <div role="status" style="margin-top:6px;color:var(--muted);font-size:12px">{{ model.lastBackup }}</div>
    </div>
    <div class="backup-grid">
      <button type="button" class="backup-action" @click="actions.export('all')">
        <b>📦 Скачать полную копию</b><small>Все ученики, XP, монеты, магазин, прогресс, журнал попыток и настройки профилей.</small>
      </button>
      <button type="button" class="backup-action" @click="actions.export('current')">
        <b>👤 Скачать текущего ученика</b><small>Удобно передать данные одного ребёнка на другой компьютер.</small>
      </button>
    </div>
    <div class="file-drop">
      <b>📥 Восстановить или перенести данные</b>
      <div style="color:var(--muted);font-size:13px;margin:5px 0 10px">Выбери файл .json. МатКвест распознает учеников по ID профиля.</div>
      <button type="button" class="btn primary" @click="fileInput?.click()">Выбрать файл</button>
      <input id="backupFileInput" ref="fileInput" type="file" accept=".json,application/json"
        @change="actions.read($event.target.files?.[0])">
    </div>
    <div class="backup-box">
      <b>Как работает «Умно объединить»</b>
      <div style="color:var(--muted);font-size:13px;line-height:1.55;margin-top:5px">
        Профили с тем же ID объединяются, повторные копии пропускаются. Новый ID и новое имя добавляют ученика.
        Если совпадает имя, а ID разные, МатКвест спросит, один это ученик или два разных.
      </div>
    </div>
    <div class="lesson">
      Копии предыдущих версий поддерживаются. Старый прогресс 4 класса получает префикс <b>g4:</b>.
      <template v-if="model.legacy"><br><b>Обнаружено старое хранилище mq5_full.</b> Оно хранится отдельно, автоматического начисления XP и монет из него нет.</template>
    </div>
  </template>

  <template v-else-if="model.screen === 'preview'">
    <div class="import-preview">
      <h3>{{ model.filename }}</h3>
      <div style="color:var(--muted);font-size:13px">Создана: {{ model.date }} • версия формата {{ model.version }}</div>
      <div class="backup-meta">
        <div v-for="stat in model.stats" :key="stat.label"><b>{{ stat.value }}</b><small>{{ stat.label }}</small></div>
      </div>
      <div class="import-plan">
        <div v-for="row in model.rows" :key="row.name" class="import-plan-row">
          <div><b>{{ row.name }}</b><small>{{ row.detail }}</small></div>
          <span class="import-tag" :class="row.className">{{ row.label }}</span>
        </div>
      </div>
    </div>
    <div v-if="model.recoveryNotice" class="backup-box warn" role="alert">{{ model.recoveryNotice }}</div>
    <div v-else class="backup-box">
      <b>Что произойдёт при «Умно объединить»?</b>
      <div style="font-size:13px;color:var(--muted);line-height:1.5;margin-top:5px">
        Профили с тем же ID объединятся. Повторная копия будет пропущена. Новые ученики добавятся.
        При совпадении имён приложение попросит уточнить, кому принадлежит профиль из копии.
      </div>
    </div>
    <div class="actions">
      <button v-if="model.recoveryNotice" type="button" class="btn soft" @click="actions.download">
        Скачать повреждённые исходные данные
      </button>
      <button v-else type="button" class="btn primary" @click="actions.merge">Умно объединить</button>
      <button type="button" class="btn" :class="model.recoveryNotice ? 'primary' : 'soft'" @click="actions.replace">Заменить всё</button>
      <button type="button" class="btn soft" @click="actions.back">Отмена</button>
    </div>
  </template>

  <template v-else-if="model.screen === 'conflict'">
    <div class="backup-box warn">{{ model.reason }} Уточни, кому принадлежит профиль из копии.</div>
    <div class="conflict-compare">
      <div v-for="side in model.sides" :key="side.label" class="conflict-side" :class="{ imported: side.imported }">
        <h3>{{ side.label }}: {{ side.name }}</h3>
        <div class="conflict-stats"><span v-for="stat in side.stats" :key="stat">{{ stat }}</span></div>
        <div style="color:var(--muted);font-size:12px;margin-top:8px">Обновлён: {{ side.date }}</div>
      </div>
    </div>
    <div class="backup-box">
      <b>Это один и тот же ребёнок?</b>
      <div style="font-size:13px;color:var(--muted);line-height:1.5;margin-top:5px">
        Данные одного ученика объединятся в один профиль. Если это разные дети, второй профиль будет сохранён как «{{ model.newName }}». Можно пропустить профиль из копии.
      </div>
    </div>
    <div class="actions">
      <button type="button" class="btn primary" @click="actions.resolve('same')">Да, это тот же ученик</button>
      <button type="button" class="btn soft" @click="actions.resolve('different')">Нет, это другой ученик</button>
      <button type="button" class="btn soft" @click="actions.resolve('skip')">Пропустить</button>
    </div>
  </template>

  <template v-else-if="model.screen === 'replace'">
    <div class="backup-box warn">
      <b>Это удалит текущие локальные профили из браузера</b> и восстановит данные из выбранной копии. Для обычного переноса чаще подходит «Умно объединить».
    </div>
    <div v-if="model.recoveryError" class="backup-box warn" role="alert">{{ model.recoveryError.message }}</div>
    <div class="actions">
      <button v-if="model.recoveryError?.download" type="button" class="btn soft" @click="actions.download">
        Скачать повреждённые исходные данные
      </button>
      <button type="button" class="btn primary" @click="actions.restore">
        {{ model.recoveryError ? 'Повторить восстановление' : 'Да, восстановить копию' }}
      </button>
      <button type="button" class="btn soft" @click="actions.back">Отмена</button>
    </div>
  </template>

  <template v-else-if="model.screen === 'result'">
    <div class="import-result" role="status">{{ model.message }}</div>
    <div class="backup-meta">
      <div v-for="stat in model.stats" :key="stat.label"><b>{{ stat.value }}</b><small>{{ stat.label }}</small></div>
    </div>
    <div v-if="model.skipped" class="backup-box">Пропущено профилей: <b>{{ model.skipped }}</b></div>
    <div class="actions">
      <button type="button" class="btn primary" @click="actions.profiles">Открыть профили</button>
      <button type="button" class="btn soft" @click="actions.back">💾 Данные</button>
    </div>
  </template>

  <template v-else-if="model.screen === 'error'">
    <div class="backup-box warn" role="alert">
      <b>Не удалось импортировать файл.</b><div style="margin-top:6px">{{ model.message }}</div>
    </div>
    <div class="actions"><button type="button" class="btn soft" @click="actions.back">← Назад</button></div>
  </template>
</template>
