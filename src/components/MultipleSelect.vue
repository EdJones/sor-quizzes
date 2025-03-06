<template>
    <div class="grid quiz-item w-full border-4 place-self-center place-content-center text-center">
        <h5 class="text-stone-400 lg:pt-2">{{ quizItem.title }}</h5>
        <p class="question-text mb-2">Q: {{ quizItem.Question }}</p>
        <p class="question-text mb-2">{{ quizItem.questionP2 }}</p>

        <ul class="lg:w-2/3 place-self-center mb-4">
            <li v-for="(option, index) in options" :key="index" :class="{
                'bg-stone-400 border-amber-500': selectedOptions.includes(index + 1),
                'border-green-400': greenOutline[index]
            }" class="flex flex-row min-h-14 answer" @click="toggleOption(index + 1)">
                <div class="list-asking">
                    <OptionIcon :status="getOptionStatus(index)"></OptionIcon>
                </div>
                <div class="list-item-right">{{ option }}</div>
                <div v-if="greenOutline[index] && selectedOptions.includes(index + 1)" class="p-0 m-0">
                    <Vue3Lottie autoplay loop mode="normal" :animationData="fireworksJSON" style="width: 70px"
                        class="m-0 p-0">
                    </Vue3Lottie>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import OptionIcon from "./OptionIcon.vue";
import fireworksJSON from '../lottie/fireworks.json'
import { quizStore } from '../stores/quizStore';

export default {
    name: 'MultipleSelect',
    setup() {
        const store = quizStore();
        return { store };
    },
    props: {
        quizItem: {
            type: Object,
            required: true
        },
        userAnswer: {
            type: Array,
            default: () => []
        },
        reviewMode: {
            type: Boolean,
            default: false
        },
        itemNum: {
            type: Number,
            required: true
        },
        basicMode: {
            type: Boolean,
            required: true
        }
    },
    components: {
        OptionIcon,
    },
    computed: {
        options() {
            return [
                this.quizItem.option1,
                this.quizItem.option2,
                this.quizItem.option3,
                this.quizItem.option4,
                this.quizItem.option5,
                this.quizItem.option6
            ].filter(option => option && option !== 'Third option' && option !== 'Fourth option' && option !== 'Fifth option');
        }
    },
    watch: {
        itemNum(newItemNum, oldItemNum) {
            console.log("In MultipleSelect watcher itemNum, item changed from", oldItemNum, " to ", newItemNum);
            this.selectedOptions = [];
            this.greenOutline = Array(6).fill(false);

            if (!this.basicMode) {
                if (!this.reviewMode) {
                    this.optionsStatus = Array(6).fill(1);
                } else {
                    const userAnswer = this.store.simpleAnswers[this.itemNum];
                    if (userAnswer) {
                        this.selectedOptions = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                        this.optionsStatus = Array(6).fill(2);
                        this.selectedOptions.forEach(answer => {
                            this.optionsStatus[answer - 1] = 5;
                        });
                        this.quizItem.correctAnswers.forEach(answer => {
                            this.optionsStatus[answer - 1] = 4;
                            this.greenOutline[answer - 1] = true;
                        });
                    }
                }
            }
        },
        reviewMode(oldStatus, newStatus) {
            console.log("reviewMode changed from ", oldStatus, " to ", newStatus);
            this.selectedOptions = [];
            if (this.reviewMode) {
                const userAnswer = this.store.simpleAnswers[this.itemNum];
                if (userAnswer) {
                    this.selectedOptions = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                    this.optionsStatus = Array(6).fill(2);
                    this.selectedOptions.forEach(answer => {
                        this.optionsStatus[answer - 1] = 5;
                    });
                    this.quizItem.correctAnswers.forEach(answer => {
                        this.optionsStatus[answer - 1] = 4;
                        this.greenOutline[answer - 1] = true;
                    });
                }
            }
            else {
                this.optionsStatus = Array(6).fill(1);
            }
        },
    },
    data() {
        return {
            selectedOptions: [],
            greenOutline: Array(6).fill(false),
            optionsStatus: Array(6).fill(1),
            fireworksJSON
        }
    },
    mounted() {
        if (this.reviewMode) {
            const userAnswer = this.store.simpleAnswers[this.itemNum];
            if (userAnswer) {
                this.selectedOptions = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                this.optionsStatus = Array(6).fill(2);
                this.selectedOptions.forEach(answer => {
                    this.optionsStatus[answer - 1] = 5;
                });
                this.quizItem.correctAnswers.forEach(answer => {
                    this.optionsStatus[answer - 1] = 4;
                    this.greenOutline[answer - 1] = true;
                });
            }
        }
    },
    methods: {
        toggleOption(option) {
            const index = this.selectedOptions.indexOf(option);
            if (index === -1) {
                this.selectedOptions.push(option);
            } else {
                this.selectedOptions.splice(index, 1);
            }
            this.optionsStatus[option - 1] = this.selectedOptions.includes(option) ? 3 : 1;

            this.$emit('answer-selected', this.selectedOptions);
            this.$emit('update:selectedOption', this.selectedOptions);
            this.$emit('selected', this.selectedOptions);
        },
        getOptionStatus(index) {
            return this.optionsStatus[index];
        },
        handleAnswerSelected(selectedOptions) {
            console.log("Answer selected:", selectedOptions);
            this.$emit('selected');
        }
    }
}
</script>

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
    color: #333;
}

.question-text {
    margin: 2;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-weight: 400;
    color: #333;
}

.answer {
    margin: 5px;
    border-radius: 5pt;
    border-style: solid;
    border-width: 2pt;
    text-align: left;
    color: #333;
    cursor: pointer;
}

@media (prefers-color-scheme: dark) {
    .quiz-item {
        color: #f7fafc;
    }

    .question-text {
        color: #f7fafc;
    }

    .answer {
        color: #f7fafc;
    }
}

.list-asking {
    margin-top: auto;
    margin-bottom: auto;
    margin-right: 10px;
    margin-left: 10px;
}

.list-item-right {
    margin-top: auto;
    margin-bottom: auto;
    min-width: 100px;
    flex-grow: 1;
    padding-right: 8px;
}

@media (min-width: 768px) {
    .list-item-right {
        min-width: 200px;
    }
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
</style>