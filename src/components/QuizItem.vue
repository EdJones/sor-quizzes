<template>
  <div class="w-full place-content-center mx-auto">
    <!-- Display the question for all question types -->
    <h2 class="text-xl font-bold mb-4">{{ quizItem.subtitle }}</h2>
    <!-- Existing question types -->
    <div v-if="quizItem.answer_type == 'mc'">
      <MultipleChoice @answer-selected="handleAnswerSelected" :quizItem="quizItem" :reviewMode="reviewMode"
        :itemNum="itemNum" :basicMode="basicMode" />
    </div>

    <div v-else-if="quizItem.answer_type == 'true_false'">
      <!-- ... true/false content ... -->
    </div>

    <div v-else-if="quizItem.answer_type == 'short_answer'">
      <!-- ... short answer content ... -->
    </div>

    <!-- Sortable list -->
    <div v-else-if="quizItem.answer_type == 'sortable'">
      <SortableList :title="quizItem.title" :instructions="quizItem.instructions" :items="quizItem.items"
        :correctOrder="quizItem.correctOrder" :disabled="reviewMode" :topLabel="quizItem.topLabel"
        :bottomLabel="quizItem.bottomLabel" @order-changed="handleOrderChanged" />
    </div>

    <Explanation :quizItem="quizItem" :reviewMode="reviewMode" :userAnswer="userAnswer" ref="explanationComponent" />

  </div>
</template>

<script>
import MultipleChoice from './MultipleChoice.vue';
import LiteYouTubeEmbed from 'vue-lite-youtube-embed';
import Explanation from './Explanation.vue'; // Add this import
import SortableList from './SortableList.vue';
import { ref } from 'vue';

export default {
  name: 'QuizItem',
  props: {
    currentQuizItem: {
      type: Object,
      required: true
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
    }
  },
  components: {
    MultipleChoice,
    Explanation, // Add this component
    LiteYouTubeEmbed, // Add this component if you're using it
    SortableList,
  },
  computed: {
    // You can remove this if you're not using it
    quizItem() {
      return this.currentQuizItem; // Automatically updates when quizItem changes
    }
  },
  watch: {

    itemNum(newItemNum, oldItemNum) {
      console.log("In quizItem watcher itemNum, item changed from", oldItemNum, " to ", newItemNum);
      console.log("In quizItem  watcher itemNum, reviewmode is: ", this.reviewMode)
      console.log("In quizItem  Watcher, basicMode is: ", this.basicMode, "and reviewMode is: ", this.reviewMode)
      if (this.basicMode == false)
        console.log("In quizItem watcher, quizItem is: ", this.quizItem);
      console.log("Exit QuizItem itemNum watcher");
    },
    quizItem: {
      handler(newVal) {
        console.log("Updated quizItem:", newVal); // Should log the new quizItem
      },
      immediate: true // Trigger on component mount
    },
    reviewMode(oldStatus, newStatus) {
      console.log("reviewMode changed from ", oldStatus, " to ", newStatus);
      if (this.reviewMode) {
        console.log("in quizItem  watcher, this.$userAnswers", this.$userAnswers);
        console.log("in quizItem  watcher, this.itemNum", this.itemNum);
        console.log("in quizItem  watcher, this.$userAnswers[this.itemNum]", this.$userAnswers[this.itemNum]);


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
    console.log("----QuizItem mounted------")
  },

  methods: {

    onHover() {
      console.log("Hovered");
    },
    handleOrderChanged(newOrder) {
      this.userAnswer = newOrder;
      this.$emit('selected');
      this.explanationComponent.checkAnswer();
    },
    handleAnswerSelected(selectedOption) {
      console.log("Answer selected:", selectedOption);
      this.$emit('selected'); // Emit to parent (Quiz.vue)
    }
  },
  setup(props, { emit }) {
    const userAnswer = ref(null);
    const explanationComponent = ref(null);

    const handleOrderChanged = (newOrder) => {
      userAnswer.value = newOrder;
      emit('selected');
      explanationComponent.value.checkAnswer();
    };

    return {
      userAnswer,
      handleOrderChanged,
      explanationComponent,
      // quizItem: props.quizItem,
    };
  },
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
  border-style: solid;
  border-top-right-radius: 2dvw;
  border-radius: 2dvw;

}

.question-text {
  margin: 2;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-weight: 400;
}

.answer {
  margin: 5px;
  border-radius: 5pt;
  border-style: solid;
  border-width: 2pt;
  text-align: left;
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
</style>