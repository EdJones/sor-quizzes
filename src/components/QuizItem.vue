<template>
  <div v-if="debug === true" style="padding: 5px; margin: 5px;">
    <p>QuizItem Debug:</p>
    <ul>
      <li>reviewMode: {{ reviewMode }}</li>
      <li>Has currentQuizItem: {{ !!currentQuizItem }}</li>
      <li>Explanation should show: {{ reviewMode }}</li>
    </ul>
  </div>
  <div v-if="currentQuizItem" class="w-full place-content-center mx-auto">
    <!-- Display the question for all question types -->
    <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">{{ quizItem.subtitle }}</h2>
    <!-- Question types -->
    <div v-if="quizItem.answer_type == 'mc'" class="text-gray-900 dark:text-white">
      <MultipleChoice v-model:userAnswer="userAnswer" @answer-selected="handleAnswerSelected" :quizItem="quizItem"
        :reviewMode="reviewMode" :itemNum="itemNum" :basicMode="basicMode" />
    </div>

    <div v-else-if="quizItem.answer_type == 'ms'" class="text-gray-900 dark:text-white">
      <MultipleSelect v-model:userAnswer="userAnswer" @answer-selected="handleAnswerSelected" :quizItem="quizItem"
        :reviewMode="reviewMode" :itemNum="itemNum" :basicMode="basicMode" />
    </div>

    <div v-else-if="quizItem.answer_type == 'true_false'">
      <!-- ... true/false content ... -->
    </div>

    <div v-else-if="quizItem.answer_type == 'short_answer'" class="text-gray-900 dark:text-white">
      <ShortAnswer v-model:userAnswer="userAnswer" @answer-selected="handleAnswerSelected"
        @correctness-change="handleShortAnswerCorrectness" :quizItem="quizItem" :reviewMode="reviewMode" />
    </div>

    <!-- Sortable list -->
    <div v-else-if="quizItem.answer_type == 'sortable'">
      <SortableList :title="quizItem.title" :instructions="quizItem.instructions" :items="quizItem.items"
        :correctOrder="quizItem.correctOrder" :disabled="reviewMode" :topLabel="quizItem.topLabel"
        :bottomLabel="quizItem.bottomLabel" @order-changed="handleOrderChanged" />
    </div>
    <!-- Debug the Explanation rendering condition -->
    <div v-if="debug === true">
      <p>Should show Explanation: {{ reviewMode && !basicMode }}</p>
    </div>
    <Explanation :quizItem="quizItem" :reviewMode="reviewMode" :userAnswer="userAnswer" ref="explanationComponent" />
    <!-- Debug output -->
    <!--div class="debug-info">
      <p>Review Mode in QuizItem: {{ reviewMode }}</p>
    </div> -->
  </div>
  <div v-else class="error-message">
    Error loading quiz item
  </div>
</template>

<script>
import MultipleChoice from './MultipleChoice.vue';
import MultipleSelect from './MultipleSelect.vue';
import LiteYouTubeEmbed from 'vue-lite-youtube-embed';
import Explanation from './Explanation.vue';
import SortableList from './SortableList.vue';
import ShortAnswer from './ShortAnswer.vue';
import { ref } from 'vue';

export default {
  name: 'QuizItem',
  components: {
    MultipleChoice,
    MultipleSelect,
    Explanation,
    LiteYouTubeEmbed,
    SortableList,
    ShortAnswer,
  },
  props: {
    currentQuizItem: {
      type: Object,
      required: true,
      validator(value) {
        // Add basic validation
        const required = ['title', 'Question', 'answer_type'];
        const valid = required.every(prop => value.hasOwnProperty(prop));
        if (!valid) {
          console.warn('QuizItem missing required properties:',
            required.filter(prop => !value.hasOwnProperty(prop)));
        }
        return valid;
      }
    },
    itemNum: {
      type: Number,
      required: true
    },
    reviewMode: {
      type: Boolean,
      required: true
    },
    basicMode: {
      type: Boolean,
      required: true
    },
    userAnswer: {
      type: [String, Number, Array],
      default: null
    },
    debug: {
      type: Boolean,
      required: true
    },
    previewMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    quizItem() {
      if (!this.currentQuizItem) {
        console.error('No quiz item provided');
        return {};
      }
      return this.currentQuizItem;
    }
  },
  watch: {
    itemNum(newItemNum, oldItemNum) {
      console.log("In itemNumwatcher itemNum, item changed from", oldItemNum, " to ", newItemNum);
      console.log("In itemNum watcher itemNum, reviewmode is: ", this.reviewMode)
      console.log("In itemNum  Watcher, basicMode is: ", this.basicMode, "and reviewMode is: ", this.reviewMode)
      if (this.basicMode == false)
        console.log("In itemNum watcher, quizItem is: ", this.quizItem);
      console.log("Exit itemNum itemNum watcher");
    },
    quizItem: {
      handler(newVal) {
        console.log("Updated quizItem:", newVal); // Should log the new quizItem
      },
      immediate: true // Trigger on component mount
    },
    reviewMode: {
      handler(newVal, oldVal) {
        console.log("reviewMode changed from ", oldVal, " to ", newVal);
        // Remove references to $userAnswers
        console.log("in reviewMode watcher, itemNum:", this.itemNum);
      }
    }
  },
  data() {
    console.log("In QuizItem data, itemNum is: ", this.itemNum);
    console.log("In QuizItem data, quizItem is: ", this.quizItem);
    //console.log("In QuizItem data, quizItems is: ", quizItems);
    return {
      //currentQuizItem: this.quizItems[this.itemNum]
    }
  },
  mounted() {
    console.log('QuizItem mounted, currentQuizItem:', this.currentQuizItem);
  },

  methods: {
    onHover() {
      console.log("Hovered");
    },
    handleAnswerSelected(selectedOption) {
      console.log("Answer selected in QuizItem:", selectedOption);
      this.$emit('selected', selectedOption);
    },
    handleShortAnswerCorrectness(isCorrect) {
      console.log("Short answer correctness:", isCorrect);
      this.$emit('selected', this.userAnswer, isCorrect);
    }
  },
  setup(props, { emit }) {
    const userAnswer = ref(null);
    const explanationComponent = ref(null);

    const handleOrderChanged = (newOrder) => {
      if (!newOrder) return;
      userAnswer.value = newOrder;
      emit('selected', newOrder); // Pass the newOrder to selected event
      if (explanationComponent.value) {
        explanationComponent.value.checkAnswer();
      }
    };

    return {
      userAnswer,
      explanationComponent,
      handleOrderChanged
    };
  },
  emits: ['update:userAnswer', 'selected'],
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
}


a {
  color: #42b983;
}

.quiz-item {
  border-style: v-bind(previewMode ? 'dashed' : 'solid');
  border-top-right-radius: 2dvw;
  border-radius: 2dvw;

}

.question-text {
  margin: 2;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-weight: 400;
  @apply text-gray-900 dark:text-white;
}

.answer {
  margin: 5px;
  border-radius: 5pt;
  border-style: solid;
  border-width: 2pt;
  text-align: left;
  @apply text-gray-900 dark:text-white;
}


.list-asking {

  margin-top: auto;
  margin-bottom: auto;
  margin-right: 10px;
  margin-left: 10px;

  color: red;
}

.answer-icon {
  color: aqua;
  height: 25px;
  width: 25px;
  ;
}

.list-item-right {
  /*padding: 5px;
  margin-left: 20px;
  padding-top: 5px;*/
  margin-top: auto;
  margin-bottom: auto;
}

.explanation {
  border-radius: 3pt;
  border-style: solid;
  border-width: 2pt;
}

.p-explanation {
  margin-left: 200px;
  margin-right: 200px;
}

.hidden {
  visibility: hidden;
}

.test-border {
  border: #42b983;
  border-style: solid;
}

.correct-choice {
  color: green;
}

.caution-icon {
  height: 20;
  width: 20;
  color: #FFBF00;
}

.caution-message {
  padding-left: 4;
}

.correct-choice {
  color: green;
}

.incorrect-choice {
  color: red;
}

.debug-info {
  color: blueviolet;
}
</style>