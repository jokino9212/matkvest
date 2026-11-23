import { createApp, h, shallowReactive } from 'vue';
import KnowledgeMap from './KnowledgeMap.vue';
import TopicDetail from './TopicDetail.vue';
import ErrorWork from './ErrorWork.vue';
import WeakTopics from './WeakTopics.vue';
import ControlReview from './ControlReview.vue';
import ControlReviewResult from './ControlReviewResult.vue';
import AttemptJournal from './AttemptJournal.vue';
import AttemptReview from './AttemptReview.vue';
import PracticeResult from './PracticeResult.vue';
import GradeCourse from './GradeCourse.vue';
import CourseTopic from './CourseTopic.vue';
import TrainingProgress from './TrainingProgress.vue';
import StageResult from './StageResult.vue';
import TableExercise from './TableExercise.vue';
import QuizExercise from './QuizExercise.vue';
import ColumnExercise from './ColumnExercise.vue';
import QuickTrainerSetup from './QuickTrainerSetup.vue';
import QuickTrainerFrame from './QuickTrainerFrame.vue';
import QuickExercise from './QuickExercise.vue';
import QuickTrainerResult from './QuickTrainerResult.vue';
import HomeDashboard from './HomeDashboard.vue';
import AppHeader from './AppHeader.vue';
import AppFooter from './AppFooter.vue';
import DeveloperAccess from './DeveloperAccess.vue';
import DeveloperPanel from './DeveloperPanel.vue';
import RewardNotice from './RewardNotice.vue';
import TrainingHistoryReport from './TrainingHistoryReport.vue';
import StudentProgress from './StudentProgress.vue';
import TrainingGoalPicker from './TrainingGoalPicker.vue';
import TrainingPlan from './TrainingPlan.vue';
import TrainingPlanReturn from './TrainingPlanReturn.vue';
import SchoolAttempt from './SchoolAttempt.vue';
import SchoolAttemptFrame from './SchoolAttemptFrame.vue';
import FractionMixIntro from './FractionMixIntro.vue';
import StudentProfiles from './StudentProfiles.vue';
import ProfilePreview from './ProfilePreview.vue';
import StoreSurfaceHeader from './StoreSurfaceHeader.vue';
import StudentProfileEditor from './StudentProfileEditor.vue';
import StoreCatalog from './StoreCatalog.vue';
import CollectionSection from './CollectionSection.vue';
import CollectionNavigation from './CollectionNavigation.vue';
import CollectionWorth from './CollectionWorth.vue';
import PetQuickPanel from './PetQuickPanel.vue';
import CollectionArchive from './CollectionArchive.vue';
import StoreSaleDialog from './StoreSaleDialog.vue';
import StoreWallet from './StoreWallet.vue';
import StoreChest from './StoreChest.vue';
import StoreChestResult from './StoreChestResult.vue';
import StoreHelpDialog from './StoreHelpDialog.vue';
import StoreControls from './StoreControls.vue';
import StoreTabs from './StoreTabs.vue';
import Leaderboard from './Leaderboard.vue';
import AchievementCatalog from './AchievementCatalog.vue';
import BackupDialog from './BackupDialog.vue';
import StorageRecovery from './StorageRecovery.vue';
import TeacherPinDialog from './TeacherPinDialog.vue';
import TeacherDashboard from './TeacherDashboard.vue';
import TeacherStudentDetail from './TeacherStudentDetail.vue';
import TeacherStudentReport from './TeacherStudentReport.vue';
import TeacherReview from './TeacherReview.vue';
import TeacherTopicReview from './TeacherTopicReview.vue';
import TeacherActionDialog from './TeacherActionDialog.vue';
import QuestBoard from './QuestBoard.vue';
import QuestReplaceDialog from './QuestReplaceDialog.vue';
import LearningDialog from './LearningDialog.vue';
import ArtworkViewer from './ArtworkViewer.vue';

const views = new WeakMap();

export function mountKnowledgeMap(host, model, actions) {
  mountView(host, KnowledgeMap, model, actions);
}

export function mountTopicDetail(host, model, actions) {
  mountView(host, TopicDetail, model, actions);
}

export function mountErrorWork(host, model, actions) {
  mountView(host, ErrorWork, model, actions);
}

export function mountWeakTopics(host, model, actions) {
  mountView(host, WeakTopics, model, actions);
}

export function mountControlReview(host, model, actions) {
  mountView(host, ControlReview, model, actions);
}

export function mountControlReviewResult(host, model, actions) {
  mountView(host, ControlReviewResult, model, actions);
}

export function mountAttemptJournal(host, model, actions) {
  mountView(host, AttemptJournal, model, actions);
}

export function mountAttemptReview(host, model, actions) {
  mountView(host, AttemptReview, model, actions);
}

export function mountPracticeResult(host, model, actions) {
  mountView(host, PracticeResult, model, actions);
}

export function mountGradeCourse(host, model, actions) {
  mountView(host, GradeCourse, model, actions);
}

export function mountCourseTopic(host, model, actions) {
  mountView(host, CourseTopic, model, actions);
}

export function mountTrainingProgress(host, model) {
  mountView(host, TrainingProgress, model);
}

export function mountStageResult(host, model, actions) {
  mountView(host, StageResult, model, actions);
}

export function mountTableExercise(host, model, actions) {
  mountView(host, TableExercise, model, actions);
}

export function mountQuizExercise(host, model, actions) {
  mountView(host, QuizExercise, model, actions);
}

export function mountColumnExercise(host, model, actions) {
  mountView(host, ColumnExercise, model, actions);
}

export function mountQuickTrainerSetup(host, model, actions) {
  mountView(host, QuickTrainerSetup, model, actions);
}

export function mountQuickTrainerFrame(host, model, actions) {
  mountView(host, QuickTrainerFrame, model, actions);
}

export function mountQuickExercise(host, model, actions) {
  mountView(host, QuickExercise, model, actions);
}

export function mountQuickTrainerResult(host, model, actions) {
  mountView(host, QuickTrainerResult, model, actions);
}

export function mountHomeDashboard(host, model, actions) {
  mountView(host, HomeDashboard, model, actions);
}

export function mountDeveloperAccess(host, model, actions) {
  mountView(host, DeveloperAccess, model, actions);
}

export function mountDeveloperPanel(host, model, actions) {
  mountView(host, DeveloperPanel, model, actions);
}

export function mountAppFooter(host, model, actions) {
  mountView(host, AppFooter, model, actions);
}

export function mountRewardNotice(host, model) {
  mountView(host, RewardNotice, model);
}

export function mountAppHeader(host, model, actions) {
  mountView(host, AppHeader, model, actions);
}

export function mountTrainingHistoryReport(host, model, actions) {
  mountView(host, TrainingHistoryReport, model, actions);
}

export function mountStudentProgress(host, model, actions) {
  mountView(host, StudentProgress, model, actions);
}

export function mountTrainingGoalPicker(host, model, actions) {
  mountView(host, TrainingGoalPicker, model, actions);
}

export function mountTrainingPlan(host, model, actions) {
  mountView(host, TrainingPlan, model, actions);
}

export function mountTrainingPlanReturn(host, model, actions) {
  mountView(host, TrainingPlanReturn, model, actions);
}

export function mountSchoolAttempt(host, model, actions) {
  if (model.column) {
    actions = {
      inputCell: globalThis.columnCellInput,
      moveCell: globalThis.workKey,
      toggleDot: globalThis.toggleDot,
      ...actions,
    };
  }
  mountView(host, SchoolAttempt, model, actions);
}

export function mountSchoolAttemptFrame(host, model, actions) {
  mountView(host, SchoolAttemptFrame, model, actions);
}

export function mountFractionMixIntro(host, model, actions) {
  mountView(host, FractionMixIntro, model, actions);
}

export function mountProfilePreview(host, model) {
  mountView(host, ProfilePreview, model);
}

export function mountStoreSurfaceHeader(host, model, actions) {
  mountView(host, StoreSurfaceHeader, model, actions);
}

export function mountStudentProfiles(host, model, actions) {
  mountView(host, StudentProfiles, model, actions);
}

export function mountStudentProfileEditor(host, model, actions) {
  mountView(host, StudentProfileEditor, model, actions);
}

export function mountStoreCatalog(host, model, actions) {
  mountView(host, StoreCatalog, model, actions);
}

export function mountCollectionSection(host, model, actions) {
  mountView(host, CollectionSection, model, actions);
}

export function mountCollectionNavigation(host, model, actions) {
  mountView(host, CollectionNavigation, model, actions);
}

export function mountCollectionWorth(host, model) {
  mountView(host, CollectionWorth, model);
}

export function mountPetQuickPanel(host, model, actions) {
  mountView(host, PetQuickPanel, model, actions);
}

export function mountCollectionArchive(host, model, actions) {
  mountView(host, CollectionArchive, model, actions);
}

export function mountStoreSaleDialog(host, model, actions) {
  mountView(host, StoreSaleDialog, model, actions);
}

export function mountStoreWallet(host, model, actions) {
  mountView(host, StoreWallet, model, actions);
}

export function mountStoreChest(host, model, actions) {
  mountView(host, StoreChest, model, actions);
}

export function mountStoreChestResult(host, model, actions) {
  mountView(host, StoreChestResult, model, actions);
}

export function mountStoreHelpDialog(host, model, actions) {
  mountView(host, StoreHelpDialog, model, actions);
}

export function mountStoreControls(host, model, actions) {
  mountView(host, StoreControls, model, actions);
}

export function mountStoreTabs(host, model, actions) {
  mountView(host, StoreTabs, model, actions);
}

export function mountLeaderboard(host, model, actions) {
  mountView(host, Leaderboard, model, actions);
}

export function mountAchievementCatalog(host, model, actions) {
  mountView(host, AchievementCatalog, model, actions);
}

export function mountBackupDialog(host, model, actions) {
  mountView(host, BackupDialog, model, actions);
}

export function mountStorageRecovery(host, model, actions) {
  mountView(host, StorageRecovery, model, actions);
}

export function mountTeacherPinDialog(host, model, actions) {
  mountView(host, TeacherPinDialog, model, actions);
}

export function mountTeacherDashboard(host, model, actions) {
  mountView(host, TeacherDashboard, model, actions);
}

export function mountTeacherStudentDetail(host, model, actions) {
  mountView(host, TeacherStudentDetail, model, actions);
}

export function mountTeacherStudentReport(host, model, actions) {
  mountView(host, TeacherStudentReport, model, actions);
}

export function mountTeacherReview(host, model, actions) {
  mountView(host, TeacherReview, model, actions);
}

export function mountTeacherTopicReview(host, model, actions) {
  mountView(host, TeacherTopicReview, model, actions);
}

export function mountTeacherActionDialog(host, model, actions) {
  mountView(host, TeacherActionDialog, model, actions);
}

export function mountQuestBoard(host, model, actions) {
  mountView(host, QuestBoard, model, actions);
}

export function mountQuestReplaceDialog(host, model, actions) {
  mountView(host, QuestReplaceDialog, model, actions);
}

export function mountLearningDialog(host, model, actions) {
  mountView(host, LearningDialog, model, actions);
}

export function mountArtworkViewer(host, model, actions) {
  mountView(host, ArtworkViewer, model, actions);
}

function mountView(host, view, model, actions) {
  const existing = views.get(host);
  if (existing) {
    // A reused host must receive fresh callbacks as well as fresh data.
    // The legacy router can also reuse the same host for a different view.
    existing.model = model;
    existing.actions = actions;
    existing.view = view;
    return;
  }

  const state = shallowReactive({ view, model, actions });
  const app = createApp({
    render: () => h(state.view, { model: state.model, actions: state.actions }),
  });
  const parent = host.parentNode;
  app.mount(host);
  views.set(host, state);

  // The legacy router replaces the screen by removing its host.
  const observer = new MutationObserver(() => {
    if (host.isConnected && host.parentNode === parent) return;
    observer.disconnect();
    app.unmount();
    views.delete(host);
  });
  // Observe each ancestor's direct children, not the whole document subtree.
  // Legacy routing can remove #mainView, #modal or an intermediate wrapper;
  // observing only the host parent and its surface misses those removals and
  // leaves a detached Vue app (with listeners/effects) mounted indefinitely.
  for (let ancestor = parent; ancestor?.nodeType === 1; ancestor = ancestor.parentElement) {
    observer.observe(ancestor, { childList: true });
  }
}
