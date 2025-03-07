<template>
  <span v-show="false">{{ reviewModeTracker }}</span>

  <div class="w-full place-content-center">
    <span class="lg:text-3xl sm:text-2xl">Science of Reading Quizzes</span>
    <p v-if="quizState !== 'resultSummary' && quizState !== 'end'">
      {{ numCompleted }} / {{ quizItems.length }}
    </p>
  </div>

  <div v-if="quizState === 'resultSummary'"
    class="sm:w-full md:w-9/12 lg:w-5/6 px-2 quizzes-container text-center border-solid bodrder-stone-400">
    <h5 class="text-stone-400 pt-2"></h5>
    <p class="question-text mb-2">Results</p>

    <div class="grid quiz-item w-full border-4 place-self-center place-content-center text-center">
      <p class="mt-20">You got </p>
      <p class="text-3xl"> {{ numCorrect() }} of {{ this.quizItems.length }}</p>
      <p class="mb-20">correct.</p>
    </div>
  </div>
  <div v-else-if="quizState === 'end'" class="sm:w-full md:w-9/12 lg:w-5/6 px-2 quizzes-container text-center">
    <h5 class="text-stone-400 pt-2">&nbsp;</h5>

    <div class="grid quiz-item w-full border-4 place-self-center place-content-center text-center">
      <p class="mt-20">You got </p>
      <p class="text-3xl"> {{ numCorrect() }} of {{ this.quizItems.length }}</p>
      <p class="mb-20">correct.</p>
    </div>
  </div>
  <div v-else class="sm:w-full md:w-9/12 lg:w-5/6 lg:px-4 quizzes-container text-center">
    <div v-if="debug === true" class="debug-info">
      <p>Quiz Debug (before QuizItem):
        quizState: {{ quizState }},
        reviewMode: {{ reviewMode }},
        basicMode: {{ basicMode }}
      </p>
    </div>
    <QuizItem :currentQuizItem="currentQuizItem" :itemNum="itemNum" :reviewMode="reviewMode" :basicMode="basicMode"
      :userAnswer="userAnswers[itemNum]" @selected="answerSelected" :debug="debug" />
  </div>

  <!--div v-if="selectError === true">
    <p class="text-orange-500">Please select an answer.</p>
  </div-->

  <!-- Debug info -->
  <div v-if="false">
    <p>quizState: {{ quizState }}, itemNum: {{ itemNum }}, complete: {{ complete }}, chosen: {{ chosen }}, reviewMode:
      {{ reviewMode }}</p>
  </div>

  <div v-if="quizState === 'basicAsk' && chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="checkIt">
      'Check it' </button>
  </div>
  <div v-else-if="quizState === 'basicAsk' && !chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="selectionError">&nbsp; </button>
  </div>
  <div v-else-if="quizState === 'expertAsk' && chosen && complete">
    <p v-if="!basicMode && chosen && complete && !reviewMode">No more questions...</p>
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="submit">Submit</button>
  </div>
  <div v-else-if="quizState === 'basicResults' && complete">
    <button class="bg-stone-400 w-32 h-10 mt-3 mb-3 text-amber-400" @click="quizDone">quizDone</button>
  </div>
  <div v-else-if="quizState === 'basicResults'">
    <button class="bg-stone-400 h-10 mt-6 text-amber-400" @click="nextQuestion">Next Question</button>
  </div>
  <div v-else-if="quizState === 'expertAsk' && !chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="selectionError">&nbsp; </button>
  </div>
  <div v-else-if="quizState === 'expertAsk' && chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="nextItem">Next</button>
  </div>
  <div v-else-if="quizState === 'resultSummary'">
    <button class="bg-stone-400 h-10 mt-6 text-amber-400" @click="startReview">Let's see what's happening.</button>
  </div>
  <div v-else-if="quizState === 'expertResults' && complete">
    <button class="bg-stone-400 w-32 h-10 mt-3 mb-3 text-amber-400" @click="quizDone">Next</button>
  </div>
  <div v-else-if="quizState === 'expertResults'">
    <button class="bg-stone-400 w-32 h-10 mt-3 mb-3 text-amber-400" @click="nextReview">Next</button>
  </div>
  <div v-else-if="quizState === 'end'" class="mt-6">
    <p>Thank you!</p>
    <div class="mt-4 mb-4 flex justify-center">
      <div class="w-full md:w-1/2 px-2">
        <label for="feedback" class="block mb-2 feedback-label relative pr-20 text-stone-900 dark:text-gray-50">
          Please add your feedback on this quiz set. Together we can raise up teachers everywhere.
          <img src="/images/partners.png" alt="Partners" class="absolute right-0 top-1/2 -translate-y-1/2" width="54"
            height="54" />
        </label>
        <textarea id="feedback" v-model="userFeedback" class="w-full p-2 border rounded-md h-16" rows="3">
        </textarea>
      </div>
    </div>
    <button class="bg-stone-400 h-10 mt-4 text-amber-400" @click="showOriginalView">Submit thoughts & return to
      Quizzes</button>
    <div class="router-link-container">
      <router-link to="/edit-item/new" class="button-75">Suggest a New Quiz Entry</router-link>
    </div>
  </div>
  <div v-else>
    <p>Error: Unknown quiz state: {{ quizState }}</p>
  </div>
  <span v-show="false">{{ reviewModeTracker }}</span>

  <div class="text-xs text-gray-500 mt-8">
    <a href="https://www.flaticon.com/free-icons/collaboration" title="collaboration icons"
      class="text-gray-500">Collaboration icons created by small.smiles - Flaticon</a>
  </div>

  <!-- Add the progress popup component -->
  <ProgressDetailsPopup ref="progressPopup" />
</template>
<script>
import QuizItem from './QuizItem.vue';
import { quizEntries } from '../data/quiz-items.js'
import { quizSets } from '../data/quizSets.js'
import { quizStore } from '../stores/quizStore'; // Import the store
import { ref, onMounted, watch } from 'vue'
import { useProgressStore } from '../stores/progressStore';
import ProgressDetailsPopup from './ProgressDetailsPopup.vue';

export default {
  name: 'Quiz',
  emits: ['change-view'],
  components: {
    QuizItem,
    ProgressDetailsPopup
  },
  props: {
    selectedQuiz: {
      type: Number,
      required: true
    },
    debug: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const store = quizStore();
    const progressStore = useProgressStore();
    const progressPopup = ref(null);

    onMounted(() => {
      store.setCurrentQuiz(props.selectedQuiz);
    });

    // Add method to show progress
    const showProgress = () => {
      console.log('Showing progress popup for quiz:', props.selectedQuiz);
      progressPopup.value?.togglePopup(props.selectedQuiz);
    };

    return {
      store,
      progressStore,
      progressPopup,
      showProgress
    }
  },
  data() {
    console.log("Data item:");
    //console.log(quizItems[0]);
    const quizChoice = 1;
    const quizState = 'chooseQuiz';
    const reviewMode = false;


    return {
      quizItems: [],
      userAnswers: Array(10).fill(null),  // Initialize with enough slots
      complete: false,
      chosen: false,
      itemNum: 0,
      basicMode: false,
      reviewMode: reviewMode,
      showEnd: false,
      selectError: false,
      userFeedback: '',
      quizStarted: new Date().getTime() // Use milliseconds timestamp
    }
  },
  computed: {
    currentQuizItem() {
      console.log("In currentQuizItem, itemNum is: ", this.itemNum);
      console.log("In currentQuizItem, quizItems is: ", this.quizItems);
      console.log("In currentQuizItem, quizItems[itemNum] is: ", this.quizItems[this.itemNum]);
      return this.quizItems[this.itemNum];
    },
    numCompleted() {
      // During review mode, show current position
      if (this.reviewMode) {
        return this.itemNum + 1;
      }
      // For basic mode, it's just the current item number + 1
      if (this.basicMode) {
        return this.itemNum + 1;
      }
      // For expert mode, count the number of answered questions
      return this.itemNum + 1;
    },
    reviewModeTracker() {
      return this.reviewMode;  // Explicitly track reviewMode
    }
  },
  methods: {
    buildQuizSet() {
      // Set of 10-ish items
      console.log("Building quiz set");
      console.log("quizSets: ", quizSets[this.selectedQuiz])
      let quizSetItems = [];
      for (let i = 0; i < quizSets[this.selectedQuiz].items.length; i++) {
        console.log("In for loop", quizSets[this.selectedQuiz].items[i])
        quizSetItems[i] = quizEntries[quizSets[this.selectedQuiz].items[i]];
      }
      this.quizItems = quizSetItems;
      this.basicMode = quizSets[this.selectedQuiz].basicMode;
      if (this.basicMode) {
        this.quizState = 'basicAsk';
      } else {
        this.quizState = 'expertAsk';
      }

      console.log("in buildQuizSet, this.basicMode: ", this.basicMode)
      console.log("Returning quizItems: ", this.quizItems)
      // return quizItems;
    },
    numCorrect() {
      let correct = 0;
      console.log("Length ", this.quizItems.length);

      if (!Array.isArray(this.quizItems) || !Array.isArray(this.userAnswers)) {
        console.error('Invalid quizItems or userAnswers');
        return 0;
      }

      for (let i = 0; i < this.quizItems.length; i++) {
        if (!this.quizItems[i]) {
          console.warn(`Missing quiz item at index ${i}`);
          continue;
        }

        const userAnswer = this.userAnswers[i];
        const quizItem = this.quizItems[i];

        // Skip if no answer provided
        if (userAnswer === undefined) {
          console.warn(`No user answer for question ${i + 1}`);
          continue;
        }

        console.log("Question", i + 1, ":");
        console.log("User answer:", userAnswer);

        // Handle multiple select questions
        if (quizItem.answer_type === 'ms') {
          const correctAnswers = quizItem.correctAnswers || [];
          console.log("Multiple Select - Correct answers:", correctAnswers);

          if (Array.isArray(userAnswer) && Array.isArray(correctAnswers)) {
            const isCorrect = userAnswer.length === correctAnswers.length &&
              userAnswer.every(answer => correctAnswers.includes(answer));

            if (isCorrect) {
              correct++;
              console.log("✓ Multiple Select Correct!");
            } else {
              console.log("✗ Multiple Select Incorrect");
            }
          } else {
            console.warn("Invalid answer format for multiple select question");
          }
          continue;
        }

        // Handle multiple choice questions
        const correctAnswer = Number(quizItem.correctAnswer);
        console.log("Correct answer:", correctAnswer);

        // Compare the numeric values for MC questions
        if (!isNaN(correctAnswer) && userAnswer === correctAnswer) {
          correct++;
          console.log("✓ Multiple Choice Correct!");
        } else {
          console.log("✗ Multiple Choice Incorrect");
          console.log("Types - User answer:", typeof userAnswer, "Correct answer:", typeof correctAnswer);
        }
      }
      console.log("Total correct:", correct);
      return correct;
    },
    nextQuestion() {
      console.log("----In nextQuestion----");
      if (this.itemNum < this.quizItems.length - 1) {
        this.itemNum++;
        this.chosen = false;
        this.reviewMode = false;
        this.quizState = 'basicAsk';
      } else {
        this.complete = true;
        this.quizState = 'resultSummary';
      }
    },
    nextReview() {
      console.log("----In nextReview----");
      this.quizState = 'expertResults';
      console.log("Reviewing itemNum: ", this.itemNum, "quizItems.length: ", this.quizItems.length);
      if (this.itemNum < this.quizItems.length - 1) {
        this.itemNum++;
        this.chosen = false;
        this.complete = false;
      } else {
        this.complete = true;
        this.quizState = 'end';
      }
    },
    async nextItem() {
      console.log("----In nextItem----");
      try {
        console.log("----In nextItem----");
        const currentQuestion = this.quizItems[this.itemNum];
        const selectedAnswer = this.userAnswers[this.itemNum];
        const correctAnswer = currentQuestion.correctAnswer;
        const questionId = currentQuestion.id;
        const questionTitle = currentQuestion.title;

        console.log('Next Item Answer Check:', {
          questionNumber: this.itemNum,
          questionId: questionId,
          questionTitle: questionTitle,
          selectedAnswer: selectedAnswer,
          correctAnswer: correctAnswer
        });

        // Save to store with correctness, ID, and title
        await this.store.setUserAnswer(
          this.itemNum,
          selectedAnswer,
          correctAnswer,
          questionId,
          questionTitle,
          currentQuestion
        );

        // Save progress
        await this.progressStore.saveQuizProgress(this.selectedQuiz, {
          lastQuestionAnswered: this.itemNum,
          userAnswers: this.store.userAnswers,
          incorrectQuestions: this.store.incorrectQuestions,
          totalCorrect: this.store.userAnswers.filter(a => a.correct).length,
          totalAnswered: this.store.userAnswers.length,
          timestamp: new Date()
        });

        // Advance to next question
        console.log("itemNum: ", this.itemNum, "quizItems.length: ", this.quizItems.length);
        if (this.itemNum < this.quizItems.length - 1) {
          this.itemNum++;
          this.chosen = false;
        } else {
          this.complete = true;
          this.quizState = 'resultSummary';
        }
      } catch (error) {
        console.error("Error in nextItem method:", error);
      }
    },
    async checkIt() {
      console.log("----In checkIt----");
      try {
        const currentQuestion = this.quizItems[this.itemNum];
        if (!currentQuestion) {
          console.error('No question found for index:', this.itemNum);
          return;
        }

        // Add debug logging to see what we're working with
        console.log('Current answer:', this.userAnswers[this.itemNum]);
        console.log('Current question:', currentQuestion);

        if (!this.userAnswers[this.itemNum]) {
          console.error('No valid answer for question:', this.itemNum);
          return;
        }

        // Debug log to see what we're checking the answer_type correctly
        console.log('Question type:', {
          type: currentQuestion.answer_type,
          isSortable: currentQuestion.answer_type === 'sortableList'
        });

        let selectedAnswer;
        // Make sure we're checking the answer_type correctly
        if (currentQuestion.answer_type === 'sortableList' || currentQuestion.answer_type === 'sortable') {
          // For sortable lists, just use the items array
          selectedAnswer = currentQuestion.items || [];
          console.log('Using sortable items:', selectedAnswer);
        } else if (currentQuestion.answer_type === 'ms') {
          // For multiple select questions
          selectedAnswer = this.userAnswers[this.itemNum];
          if (!Array.isArray(selectedAnswer)) {
            console.error('Invalid answer format for multiple select question:', selectedAnswer);
            return;
          }
          console.log('Using multiple select answers:', selectedAnswer);
        } else {
          // For multiple choice
          selectedAnswer = this.userAnswers[this.itemNum];
          if (selectedAnswer === undefined) {
            console.error('No valid answer for multiple choice question:', this.itemNum);
            return;
          }
        }

        const questionData = {
          selectedAnswer,
          correctAnswer: currentQuestion.answer_type === 'ms' ? currentQuestion.correctAnswers : currentQuestion.correctAnswer,
          questionId: currentQuestion.id || '',
          questionTitle: currentQuestion.title || '',
          quizEntry: currentQuestion
        };

        await this.store.setUserAnswer(
          this.itemNum,
          questionData.selectedAnswer,
          questionData.correctAnswer,
          questionData.questionId,
          questionData.questionTitle,
          questionData.quizEntry
        );

        await this.progressStore.saveQuizProgress(this.selectedQuiz, {
          lastQuestionAnswered: this.itemNum,
          userAnswers: this.store.userAnswers,
          incorrectQuestions: this.store.incorrectQuestions,
          totalCorrect: this.store.userAnswers.filter(a => a.correct).length,
          totalAnswered: this.store.userAnswers.length,
          timestamp: new Date()
        });

        this.quizState = 'basicResults';
        this.reviewMode = true;
        console.log("In checkIt, itemNum: ", this.itemNum, "quizItems.length: ", this.quizItems.length);
        if (this.itemNum === this.quizItems.length - 1) {
          this.complete = true;
        } else {
          this.complete = false;
          this.chosen = false;
        }

      } catch (error) {
        console.error("Error in checkIt method:", error);
      }
    },
    async answerSelected(option) {
      console.log("In answerSelected with answer:", option);
      this.selectError = false;
      this.chosen = true;
      this.userAnswers[this.itemNum] = option;

      // Check if answer is correct
      let isCorrect = false;
      if (this.currentQuizItem.answer_type === 'ms') {
        const correctAnswers = this.currentQuizItem.correctAnswers || [];
        isCorrect = Array.isArray(option) &&
          option.length === correctAnswers.length &&
          option.every(answer => correctAnswers.includes(answer));
      } else {
        isCorrect = option === this.currentQuizItem.correctAnswer;
      }

      if (isCorrect) {
        // Pass both quizId and questionId
        await this.progressStore.markQuizItemCorrect(
          this.selectedQuiz,
          this.currentQuizItem.id,
          isCorrect
        );
      }

      // Update store immediately when answer is selected
      this.store.setUserAnswer(
        this.itemNum,
        option,
        this.currentQuizItem.answer_type === 'ms' ? this.currentQuizItem.correctAnswers : this.currentQuizItem.correctAnswer,
        this.currentQuizItem.id,
        this.currentQuizItem.title,
        this.currentQuizItem
      );
    },
    submit() {
      console.log("Complete. Let's see your score. ");
      this.showResults = true;
      this.complete = false
      //this.quizState = 'resultSummary';

    },
    startReview() {
      console.log("----Start Review----", {
        beforeState: {
          quizState: this.quizState,
          itemNum: this.itemNum,
          reviewMode: this.reviewMode,
          complete: this.complete
        }
      });

      // Force all state changes in the correct order
      this.itemNum = 0;
      this.reviewMode = true;  // Set this before quizState
      this.quizState = 'expertResults';
      this.complete = false;

      console.log("After startReview:", {
        afterState: {
          quizState: this.quizState,
          itemNum: this.itemNum,
          reviewMode: this.reviewMode,
          complete: this.complete
        }
      });
    },
    selectionError() {
      console.log("In selectionError");
      this.selectError = true;
    },
    async quizDone() {
      try {
        const score = this.numCorrect();
        const total = this.quizItems.length;

        // Validate the values before sending
        if (typeof score !== 'number' || typeof total !== 'number') {
          console.error('Invalid score or total:', { score, total });
          throw new Error('Invalid score or total questions');
        }

        // Record the quiz attempt with validated data
        await this.store.recordQuizAttempt({
          quizStarted: new Date(this.quizStarted),
          score: score,
          totalQuestions: total
        });
        console.log('Quiz attempt recorded successfully');

        // Update the quiz state
        this.quizState = 'end';
        this.complete = true;
        this.reviewMode = false;

        console.log('After quizDone:', {
          currentState: this.quizState,
          complete: this.complete,
          reviewMode: this.reviewMode,
          score: score,
          total: total
        });

        // Force a re-render of the component
        this.$nextTick(() => {
          if (this.quizState === 'end') {
            this.$emit('change-view', {
              showQuizzes: false,
              showEnd: true
            });
          }
        });

        // Show the progress popup
        this.showProgress();

      } catch (error) {
        console.error('Error in quizDone:', error);
      }
    },
    async showOriginalView() {
      console.log("showOriginalView clicked");
      console.log("Current feedback:", this.userFeedback);

      // Save feedback if provided
      if (this.userFeedback.trim()) {
        try {
          console.log("Attempting to save feedback");
          await this.progressStore.saveQuizProgress(this.selectedQuiz, {
            feedback: this.userFeedback,
            timestamp: new Date()
          });
          console.log("Feedback saved successfully");
        } catch (error) {
          console.error("Error saving feedback:", error);
        }
      }

      console.log("Emitting change-view event");
      this.$emit('change-view', { showQuizzes: true }); // Emit an event with the new state
      console.log("Event emitted");
    },
    showProgress() {
      console.log('Showing progress popup for quiz:', this.selectedQuiz);
      this.progressPopup.value?.togglePopup(this.selectedQuiz);
    }
  },
  created() {
    this.buildQuizSet();
    // console.log("In created, ", this.quizItems)
  },
  watch: {
    quizState: {
      immediate: true,
      handler(newState) {
        console.log('quizState watcher:', {
          newState,
          isExpertResults: newState === 'expertResults',
          isBasicResults: newState === 'basicResults',
          shouldBeReviewMode: newState === 'expertResults' || newState === 'basicResults'
        });

        this.reviewMode = newState === 'expertResults' || newState === 'basicResults';

        console.log('After setting reviewMode:', {
          reviewMode: this.reviewMode,
          quizState: this.quizState
        });
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /*color: #2c3e50; */
  margin-top: 20px;
}

.lead-image {
  width: 50;
  height: 50;
}

.quizzes-container {
  display: flex;
  margin-left: auto;
  margin-right: auto;
  justify-content: space-evenly;
  flex-flow: column nowrap;
}

.quiz-item {
  border-style: solid;
  border-top-right-radius: 2dvw;
  border-radius: 2dvw;

}

.mt-4.mb-4.flex.justify-center {
  width: 100%;
}

textarea#feedback {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background: rgba(63, 63, 136, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
}

textarea#feedback:focus {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 0 20px rgba(74, 144, 226, 0.2);
  outline: none;
}

textarea#feedback::placeholder {
  color: rgba(51, 51, 51, 0.6);
}

label[for="feedback"] {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1rem;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .feedback-label {
    color: #ffffff !important;
  }

  textarea#feedback {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
}

:root[class~="dark"] .feedback-label {
  color: #ffffff !important;
}

:root[class~="dark"] textarea#feedback {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
</style>
