<template>
  <div class="w-full place-content-center mx-auto">
    <p>1/10</p>
    <div class="grid quiz-item w-full border-4 place-self-center place-content-center text-center">
      <h5 class="text-stone-400 pt-2">{{ quizItem.title }}</h5>
      <p class="question-text mb-2">Your Score</p>
      <!--ul class="lg:w-96 place-self-center mb-8">
        <li :class="{ [`bg-stone-400 border-amber-500`]: highlighted[1] }" class="flex flex-row p-4 answer"
          @click="select(1)">
          <div class="list-asking">
            <OptionIcon status="1"></OptionIcon>
          </div>
          <div class="list-item-right">{{ quizItem.option1 }}
          </div>
        </li>
        <li :class="{ [`bg-stone-400 border-amber-500`]: highlighted[2] }" @click="select(2)"
          class="flex flex-row p-4 border-solid rounded-lg answer ">
          <div class="list-asking">
            <OptionIcon status="2"></OptionIcon>
          </div>
          <div class=""> {{ quizItem.option2 }}</div>
        </li>
        <li :class="{ [`bg-stone-400 border-amber-500`]: highlighted[3] }" class="flex flex-row p-4 answer"
          @click="select(3)">
          <div class="list-asking">
            <OptionIcon :status="option3Status"></OptionIcon>
          </div>
          <div class="list-item-right">{{ quizItem.option3 }}</div>
        </li>
        <li :class="{ [`bg-stone-400 border-amber-500`]: highlighted[4] }" class="flex flex-row p-4 answer"
          @click="select(4)">

          <div uclass="list-asking">
            <OptionIcon status="4"></OptionIcon>
          </div>
          <div class="list-item-right">{{ quizItem.option4 }}</div>
        </li>
      </ul-->
      <div :class="{ [`hidden`]: !reviewMode }" class="divide-solid explanation lg:mx-20">
        <p mb-8>{{ quizItem.explanation }} <a href="https://youtu.be/Nh3r2WZs2P8?si=9wZ9XWrCTioUaVkG">Phoneme Addition</a>
        </p>
        <div class="flex flex-row mt-8">
          <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc. -->
            <path opacity="1" fill="#FFBF00"
              d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
          </svg> <span class="lg:pl-5 caution-message">{{ quizItem.caution }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OptionIcon from "./OptionIcon.vue";
export default {
  name: 'QuizItem',
  props: {
    quizItem: Object,
    itemNum: Number
  },
  components: {
    OptionIcon
  },
  computed: {

  },
  watch: {
    // whenever question changes, this function will run
    itemNum(newItemNum, oldItemNum) {
      this.highlighted = [false, false, false, false, false];
    }
  },
  data() {
    const option3Status = 1;
    const reviewMode = false;
    console.log("QuizItem data");
    const highlighted = [false, false, false, false, false];
    return {
      highlighted: highlighted,
      option3Status: option3Status,
      reviewMode: reviewMode
    }
  },

  methods: {
    select(option) {
      console.log("Selected: ", option);
      //option3Status = 3;
      this.highlighted = [false, false, false, false, false];
      this.highlighted[option] = true
      this.$userAnswers[this.itemNum] = option;
      console.log("In QuizItem, global.userAnswers is ", this.$userAnswers)
      this.$emit('selected')
    },
    onHover() {
      console.log("Hovered");
    }
  }
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
  margin: 3;
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
  margin-right: 20px;
  margin-left: 10px;
  width: 30;
  color: red;
}

.answer-icon {
  color: aqua;
  height: 25px;
  width: 25px;
  ;
}

.list-item-right {
  padding: 5px;
  margin-left: 20px;
  padding-top: 10px;
}

.explanation {}

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
